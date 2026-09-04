/* =========================================================
   LOT SHOP — FIREBASE VERSION
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyD89JlsSXpaAse-ZgUXnlUIqqlTPe-6Bys",
  authDomain: "lotapimain.firebaseapp.com",
  projectId: "lotapimain",
  storageBucket: "lotapimain.firebasestorage.app",
  messagingSenderId: "909823166989",
  appId: "1:909823166989:web:288001e0e37c2fa7282344",
  measurementId: "G-SXEEBQ459Q"
};


/* =========================================================
   FIREBASE
   ========================================================= */

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let currentUser = null;
let currentProfile = null;
let marketplaceItems = [];
let selectedItem = null;


/* =========================================================
   ELEMENTS
   ========================================================= */

const authScreen = document.getElementById("authScreen");
const app = document.getElementById("app");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const loginMessage = document.getElementById("loginMessage");
const signupMessage = document.getElementById("signupMessage");


/* =========================================================
   AUTH TABS
   ========================================================= */

function showAuth(type) {

  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");

  if (type === "login") {

    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");

    loginTab.classList.add("active");
    signupTab.classList.remove("active");

  } else {

    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");

    loginTab.classList.remove("active");
    signupTab.classList.add("active");

  }
}


/* =========================================================
   AUTH STATE
   ========================================================= */

auth.onAuthStateChanged(async user => {

  if (user) {

    currentUser = user;

    try {

      await loadUserProfile();

      authScreen.classList.add("hidden");
      app.classList.remove("hidden");

      await loadMarketplace();
      await renderDashboard();

    } catch (error) {

      console.error(error);

      showToast("Could not load your account.");

    }

  } else {

    currentUser = null;
    currentProfile = null;

    authScreen.classList.remove("hidden");
    app.classList.add("hidden");

  }

});


/* =========================================================
   LOGIN
   ========================================================= */

loginForm.addEventListener("submit", async event => {

  event.preventDefault();

  loginMessage.textContent = "Logging in...";

  const email =
    document.getElementById("loginEmail")
      .value
      .trim();

  const password =
    document.getElementById("loginPass")
      .value;

  try {

    await auth.signInWithEmailAndPassword(
      email,
      password
    );

    loginMessage.textContent = "";

  } catch (error) {

    console.error(error);

    loginMessage.textContent =
      getFirebaseError(error);

  }

});


/* =========================================================
   SIGN UP
   ========================================================= */

signupForm.addEventListener("submit", async event => {

  event.preventDefault();

  signupMessage.textContent =
    "Creating account...";

  const username =
    document.getElementById("signupUser")
      .value
      .trim();

  const email =
    document.getElementById("signupEmail")
      .value
      .trim();

  const password =
    document.getElementById("signupPass")
      .value;

  const confirm =
    document.getElementById("signupConfirm")
      .value;


  if (username.length < 3) {

    signupMessage.textContent =
      "Username must be at least 3 characters.";

    return;

  }


  if (!/^[a-zA-Z0-9_]+$/.test(username)) {

    signupMessage.textContent =
      "Username can only contain letters, numbers and underscores.";

    return;

  }


  if (password !== confirm) {

    signupMessage.textContent =
      "Passwords do not match.";

    return;

  }


  try {

    const usernameQuery =
      await db
        .collection("users")
        .where(
          "usernameLower",
          "==",
          username.toLowerCase()
        )
        .limit(1)
        .get();


    if (!usernameQuery.empty) {

      signupMessage.textContent =
        "That username is already taken.";

      return;

    }


    const credential =
      await auth.createUserWithEmailAndPassword(
        email,
        password
      );


    const uid =
      credential.user.uid;


    await db
      .collection("users")
      .doc(uid)
      .set({

        username: username,

        usernameLower:
          username.toLowerCase(),

        email: email,

        balance: 0,

        role: "user",

        createdAt:
          firebase.firestore.FieldValue
            .serverTimestamp()

      });


    signupMessage.textContent =
      "Account created successfully!";

  } catch (error) {

    console.error(error);

    signupMessage.textContent =
      getFirebaseError(error);

  }

});


/* =========================================================
   LOAD PROFILE
   ========================================================= */

async function loadUserProfile() {

  if (!currentUser) return;


  const userRef =
    db
      .collection("users")
      .doc(currentUser.uid);


  const snapshot =
    await userRef.get();


  if (!snapshot.exists) {

    const username =
      currentUser.email
        ? currentUser.email.split("@")[0]
        : "User";


    await userRef.set({

      username: username,

      usernameLower:
        username.toLowerCase(),

      email:
        currentUser.email || "",

      balance: 0,

      role: "user",

      createdAt:
        firebase.firestore.FieldValue
          .serverTimestamp()

    });


    currentProfile = {

      username: username,

      balance: 0,

      role: "user"

    };

  } else {

    currentProfile =
      snapshot.data();

  }


  updateAccountUI();

}


/* =========================================================
   UPDATE ACCOUNT UI
   ========================================================= */

function updateAccountUI() {

  if (!currentProfile) return;


  document.getElementById(
    "usernameDisplay"
  ).textContent =
    currentProfile.username || "User";


  document.getElementById(
    "balanceDisplay"
  ).textContent =
    formatNumber(
      currentProfile.balance || 0
    );

}


/* =========================================================
   LOAD MARKETPLACE
   ========================================================= */

async function loadMarketplace() {

  const container =
    document.getElementById(
      "marketplaceItems"
    );


  container.innerHTML =
    '<div class="loading">Loading marketplace...</div>';


  try {

    const snapshot =
      await db
        .collection("listings")
        .where("active", "==", true)
        .get();


    marketplaceItems = [];


    snapshot.forEach(doc => {

      marketplaceItems.push({

        id: doc.id,

        ...doc.data()

      });

    });


    marketplaceItems.sort((a, b) => {

      const aTime =
        a.createdAt?.seconds || 0;

      const bTime =
        b.createdAt?.seconds || 0;

      return bTime - aTime;

    });


    renderMarketplace();

  } catch (error) {

    console.error(error);

    container.innerHTML =
      '<div class="empty">Could not load marketplace.</div>';

  }

}


/* =========================================================
   RENDER MARKETPLACE
   ========================================================= */

function renderMarketplace() {

  const container =
    document.getElementById(
      "marketplaceItems"
    );


  const search =
    document.getElementById(
      "searchInput"
    )
      .value
      .trim()
      .toLowerCase();


  const category =
    document.getElementById(
      "categoryFilter"
    ).value;


  const filtered =
    marketplaceItems.filter(item => {

      const name =
        String(item.name || "")
          .toLowerCase();

      const description =
        String(item.description || "")
          .toLowerCase();


      const matchesSearch =
        !search ||
        name.includes(search) ||
        description.includes(search);


      const matchesCategory =
        category === "all" ||
        item.category === category;


      return matchesSearch &&
             matchesCategory;

    });


  if (filtered.length === 0) {

    container.innerHTML =
      '<div class="empty">No items found.</div>';

    return;

  }


  container.innerHTML =
    filtered
      .map(item => createItemCard(item))
      .join("");

}


/* =========================================================
   ITEM CARD
   ========================================================= */

function createItemCard(item) {

  const stock =
    Number(item.stock || 0);


  const image =
    item.image ||
    "https://placehold.co/600x400/111113/ffffff?text=LOT+Shop";


  const isOwnListing =
    item.sellerId === currentUser?.uid;


  const disabled =
    stock <= 0 ||
    isOwnListing;


  let buttonText =
    "Buy Now";


  if (stock <= 0) {

    buttonText =
      "Out of Stock";

  } else if (isOwnListing) {

    buttonText =
      "Your Listing";

  }


  return `

    <div class="item-card">

      <img
        class="item-image"
        src="${escapeAttribute(image)}"
        alt="${escapeAttribute(item.name || "Item")}"
        onerror="
          this.src='https://placehold.co/600x400/111113/ffffff?text=LOT+Shop'
        "
      >

      <div class="item-content">

        <h3>
          ${escapeHTML(item.name || "Unnamed Item")}
        </h3>

        <p class="item-description">
          ${escapeHTML(
            item.description || "No description."
          )}
        </p>

        <div class="item-meta">

          <span class="item-price">
            £${formatNumber(item.price)} LOT
          </span>

          <span class="item-stock">
            ${stock} left
          </span>

        </div>

        <div class="item-seller">

          Seller:
          ${escapeHTML(
            item.sellerUsername || "Unknown"
          )}

        </div>

        <button
          class="primary full"
          ${disabled ? "disabled" : ""}
          onclick="openPurchase('${item.id}')"
        >
          ${buttonText}
        </button>

      </div>

    </div>

  `;

}


/* =========================================================
   CREATE LISTING
   ========================================================= */

async function createListing() {

  if (!currentUser ||
      !currentProfile) {

    showToast(
      "Please login first."
    );

    return;

  }


  const name =
    document.getElementById(
      "itemName"
    ).value.trim();


  const price =
    Number(
      document.getElementById(
        "itemPrice"
      ).value
    );


  const stock =
    Number(
      document.getElementById(
        "itemStock"
      ).value
    );


  const category =
    document.getElementById(
      "itemCategory"
    ).value;


  const description =
    document.getElementById(
      "itemDescription"
    ).value.trim();


  const image =
    document.getElementById(
      "itemImage"
    ).value.trim();


  const webhook =
    document.getElementById(
      "itemWebhook"
    ).value.trim();


  const message =
    document.getElementById(
      "listingMessage"
    );


  if (!name) {

    message.textContent =
      "Enter an item name.";

    return;

  }


  if (!Number.isInteger(price) ||
      price < 1) {

    message.textContent =
      "Enter a valid price.";

    return;

  }


  if (!Number.isInteger(stock) ||
      stock < 1) {

    message.textContent =
      "Enter a valid stock amount.";

    return;

  }


  if (image &&
      !isValidURL(image)) {

    message.textContent =
      "Enter a valid image URL.";

    return;

  }


  if (webhook &&
      !isValidURL(webhook)) {

    message.textContent =
      "Enter a valid webhook URL.";

    return;

  }


  message.textContent =
    "Publishing...";


  try {

    await db
      .collection("listings")
      .add({

        name: name,

        nameLower:
          name.toLowerCase(),

        price: price,

        stock: stock,

        sold: 0,

        category: category,

        description: description,

        image: image,

        webhook: webhook,

        sellerId:
          currentUser.uid,

        sellerUsername:
          currentProfile.username,

        active: true,

        createdAt:
          firebase.firestore.FieldValue
            .serverTimestamp()

      });


    document.getElementById(
      "itemName"
    ).value = "";

    document.getElementById(
      "itemPrice"
    ).value = "";

    document.getElementById(
      "itemStock"
    ).value = "";

    document.getElementById(
      "itemDescription"
    ).value = "";

    document.getElementById(
      "itemImage"
    ).value = "";

    document.getElementById(
      "itemWebhook"
    ).value = "";


    message.textContent =
      "Item published successfully!";


    showToast(
      "Listing published!"
    );


    await loadMarketplace();

    await renderDashboard();

  } catch (error) {

    console.error(error);

    message.textContent =
      getFirebaseError(error);

  }

}


/* =========================================================
   OPEN PURCHASE
   ========================================================= */

function openPurchase(itemId) {

  const item =
    marketplaceItems.find(
      x => x.id === itemId
    );


  if (!item) {

    showToast(
      "Item not found."
    );

    return;

  }


  if (Number(item.stock || 0) <= 0) {

    showToast(
      "This item is out of stock."
    );

    return;

  }


  if (
    item.sellerId ===
    currentUser.uid
  ) {

    showToast(
      "You cannot buy your own item."
    );

    return;

  }


  selectedItem = item;


  document.getElementById(
    "purchaseName"
  ).textContent =
    item.name;


  document.getElementById(
    "purchasePrice"
  ).textContent =
    formatNumber(item.price);


  document.getElementById(
    "purchaseStock"
  ).textContent =
    item.stock;


  document.getElementById(
    "purchaseBalance"
  ).textContent =
    formatNumber(
      currentProfile.balance || 0
    );


  document.getElementById(
    "purchaseQuantity"
  ).value = 1;


  document.getElementById(
    "purchaseMessage"
  ).textContent = "";


  updatePurchaseTotal();


  document.getElementById(
    "purchaseModal"
  ).classList.add("show");

}


/* =========================================================
   PURCHASE TOTAL
   ========================================================= */

function updatePurchaseTotal() {

  if (!selectedItem) return;


  let quantity =
    Number(
      document.getElementById(
        "purchaseQuantity"
      ).value
    );


  if (
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {

    quantity = 1;

  }


  if (
    quantity >
    Number(selectedItem.stock)
  ) {

    quantity =
      Number(selectedItem.stock);


    document.getElementById(
      "purchaseQuantity"
    ).value =
      quantity;

  }


  const total =
    quantity *
    Number(selectedItem.price);


  document.getElementById(
    "purchaseTotal"
  ).textContent =
    formatNumber(total);


  const remaining =
    Math.max(
      0,
      Number(currentProfile.balance || 0)
      - total
    );


  document.getElementById(
    "purchaseRemaining"
  ).textContent =
    formatNumber(remaining);

}


/* =========================================================
   CONFIRM PURCHASE
   ========================================================= */

async function confirmPurchase() {

  if (!selectedItem ||
      !currentUser) {

    return;

  }


  const button =
    document.getElementById(
      "confirmPurchaseButton"
    );


  const message =
    document.getElementById(
      "purchaseMessage"
    );


  let quantity =
    Number(
      document.getElementById(
        "purchaseQuantity"
      ).value
    );


  if (
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {

    message.textContent =
      "Invalid quantity.";

    return;

  }


  if (
    quantity >
    Number(selectedItem.stock)
  ) {

    message.textContent =
      "Not enough stock.";

    return;

  }


  const total =
    quantity *
    Number(selectedItem.price);


  if (
    Number(currentProfile.balance || 0)
    < total
  ) {

    message.textContent =
      "You do not have enough LOT.";

    return;

  }


  button.disabled = true;

  message.textContent =
    "Processing purchase...";


  try {

    await db.runTransaction(
      async transaction => {

        const buyerRef =
          db
            .collection("users")
            .doc(currentUser.uid);


        const itemRef =
          db
            .collection("listings")
            .doc(selectedItem.id);


        const sellerRef =
          db
            .collection("users")
            .doc(selectedItem.sellerId);


        const buyerSnap =
          await transaction.get(
            buyerRef
          );


        const itemSnap =
          await transaction.get(
            itemRef
          );


        const sellerSnap =
          await transaction.get(
            sellerRef
          );


        if (!buyerSnap.exists) {

          throw new Error(
            "Buyer account not found."
          );

        }


        if (!itemSnap.exists) {

          throw new Error(
            "Listing no longer exists."
          );

        }


        if (!sellerSnap.exists) {

          throw new Error(
            "Seller account not found."
          );

        }


        const buyer =
          buyerSnap.data();


        const item =
          itemSnap.data();


        const seller =
          sellerSnap.data();


        if (!item.active) {

          throw new Error(
            "This listing is no longer active."
          );

        }


        if (
          Number(item.stock) <
          quantity
        ) {

          throw new Error(
            "Not enough stock."
          );

        }


        if (
          Number(buyer.balance || 0)
          < total
        ) {

          throw new Error(
            "Insufficient LOT balance."
          );

        }


        transaction.update(
          buyerRef,
          {

            balance:
              Number(buyer.balance || 0)
              - total

          }
        );


        transaction.update(
          sellerRef,
          {

            balance:
              Number(seller.balance || 0)
              + total

          }
        );


        const newStock =
          Number(item.stock)
          - quantity;


        transaction.update(
          itemRef,
          {

            stock:
              newStock,

            sold:
              Number(item.sold || 0)
              + quantity,

            active:
              newStock > 0

          }
        );


        const purchaseRef =
          db
            .collection("purchases")
            .doc();


        transaction.set(
          purchaseRef,
          {

            buyerId:
              currentUser.uid,

            buyerUsername:
              buyer.username,

            sellerId:
              item.sellerId,

            sellerUsername:
              item.sellerUsername,

            itemId:
              selectedItem.id,

            itemName:
              item.name,

            quantit

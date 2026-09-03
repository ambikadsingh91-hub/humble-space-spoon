// =====================================================
// LOT SHOP
// =====================================================
// NOTE:
// This version adds per-listing Discord webhooks.
// For production, webhook sending should be moved
// to a Firebase Cloud Function so webhook URLs are
// not exposed to browsers.
// =====================================================


let currentUser = null;

const DEMO_ADMIN_USERNAME = "Virat";
const DEMO_ADMIN_PASSWORD = "9825727203";


let localUsers = JSON.parse(
  localStorage.getItem("lot_users") || "[]"
);


let localListings = JSON.parse(
  localStorage.getItem("lot_listings") || "[]"
);


// =====================================================
// AUTH TAB SWITCHING
// =====================================================

function showAuth(type) {

  const loginForm =
    document.getElementById("loginForm");

  const signupForm =
    document.getElementById("signupForm");

  const loginTab =
    document.getElementById("loginTab");

  const signupTab =
    document.getElementById("signupTab");


  if (type === "login") {

    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");

    loginTab.classList.add("active");
    signupTab.classList.remove("active");

  }


  if (type === "signup") {

    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");

    loginTab.classList.remove("active");
    signupTab.classList.add("active");

  }

}



// =====================================================
// LOGIN
// =====================================================

async function login(event) {

  event.preventDefault();


  const username =
    document
      .getElementById("loginUser")
      .value
      .trim();


  const password =
    document
      .getElementById("loginPass")
      .value;


  const message =
    document.getElementById("loginMessage");


  message.textContent = "";


  if (!username || !password) {

    message.textContent =
      "Please enter your login details.";

    return;

  }


  // DEMO ADMIN

  if (
    username.toLowerCase() ===
      DEMO_ADMIN_USERNAME.toLowerCase() &&
    password === DEMO_ADMIN_PASSWORD
  ) {

    currentUser = {

      id: "admin-virat",

      username: "Virat",

      balance: 100000,

      role: "admin",

      isAdmin: true,

      purchases: 0

    };


    sessionStorage.setItem(
      "lot_current_user",
      JSON.stringify(currentUser)
    );


    enterMarketplace();

    return;

  }


  // LOCAL USER

  const user =
    localUsers.find(

      u =>

        (
          u.username.toLowerCase() ===
            username.toLowerCase() ||

          u.email.toLowerCase() ===
            username.toLowerCase()
        ) &&

        u.password === password

    );


  if (!user) {

    message.textContent =
      "Invalid username/email or password.";

    return;

  }


  currentUser = {

    id: user.id,

    username: user.username,

    balance: user.balance || 0,

    role: "user",

    isAdmin: false,

    purchases: user.purchases || 0

  };


  sessionStorage.setItem(
    "lot_current_user",
    JSON.stringify(currentUser)
  );


  enterMarketplace();

}



// =====================================================
// SIGN UP
// =====================================================

async function signup(event) {

  event.preventDefault();


  const username =
    document
      .getElementById("signupUser")
      .value
      .trim();


  const email =
    document
      .getElementById("signupEmail")
      .value
      .trim();


  const password =
    document
      .getElementById("signupPass")
      .value;


  const confirm =
    document
      .getElementById("signupConfirm")
      .value;


  const message =
    document.getElementById("signupMessage");


  message.textContent = "";


  if (username.length < 3) {

    message.textContent =
      "Username must be at least 3 characters.";

    return;

  }


  if (!email.includes("@")) {

    message.textContent =
      "Enter a valid email address.";

    return;

  }


  if (password.length < 8) {

    message.textContent =
      "Password must be at least 8 characters.";

    return;

  }


  if (password !== confirm) {

    message.textContent =
      "Passwords do not match.";

    return;

  }


  if (
    username.toLowerCase() ===
    DEMO_ADMIN_USERNAME.toLowerCase()
  ) {

    message.textContent =
      "That username is reserved.";

    return;

  }


  const alreadyExists =
    localUsers.some(

      u =>

        u.username.toLowerCase() ===
          username.toLowerCase() ||

        u.email.toLowerCase() ===
          email.toLowerCase()

    );


  if (alreadyExists) {

    message.textContent =
      "Username or email already exists.";

    return;

  }


  const user = {

    id: Date.now().toString(),

    username: username,

    email: email,

    password: password,

    balance: 0,

    purchases: 0

  };


  localUsers.push(user);


  localStorage.setItem(
    "lot_users",
    JSON.stringify(localUsers)
  );


  currentUser = {

    id: user.id,

    username: user.username,

    balance: 0,

    role: "user",

    isAdmin: false,

    purchases: 0

  };


  sessionStorage.setItem(
    "lot_current_user",
    JSON.stringify(currentUser)
  );


  enterMarketplace();

}



// =====================================================
// OPEN MARKETPLACE
// =====================================================

function enterMarketplace() {

  document
    .getElementById("authScreen")
    .classList.add("hidden");


  document
    .getElementById("app")
    .classList.remove("hidden");


  updateAccount();

  loadListings();

  renderMarketplace();

  renderDashboard();

}



// =====================================================
// LOGOUT
// =====================================================

function logout() {

  currentUser = null;


  sessionStorage.removeItem(
    "lot_current_user"
  );


  document
    .getElementById("app")
    .classList.add("hidden");


  document
    .getElementById("authScreen")
    .classList.remove("hidden");


  document.getElementById(
    "loginUser"
  ).value = "";


  document.getElementById(
    "loginPass"
  ).value = "";


  showAuth("login");

}



// =====================================================
// ACCOUNT
// =====================================================

function updateAccount() {

  if (!currentUser) return;


  document.getElementById(
    "usernameDisplay"
  ).textContent =

    currentUser.username +

    (
      currentUser.isAdmin
        ? " • Admin"
        : ""
    );


  document.getElementById(
    "balanceDisplay"
  ).textContent =

    Number(
      currentUser.balance || 0
    ).toLocaleString("en-US");

}



// =====================================================
// LISTINGS
// =====================================================

function loadListings() {

  localListings = JSON.parse(

    localStorage.getItem(
      "lot_listings"
    ) || "[]"

  );

}



// =====================================================
// MARKETPLACE
// =====================================================

function renderMarketplace() {

  const container =
    document.getElementById(
      "marketplaceItems"
    );


  if (!container) return;


  const searchInput =
    document.getElementById(
      "searchInput"
    );


  const categoryInput =
    document.getElementById(
      "categoryFilter"
    );


  const search =
    searchInput

      ? searchInput.value.toLowerCase()

      : "";


  const category =
    categoryInput

      ? categoryInput.value

      : "all";


  const listings =
    localListings.filter(

      item => {

        if (item.active === false)
          return false;


        const text = (

          item.name +

          " " +

          item.seller +

          " " +

          (
            item.description || ""
          )

        ).toLowerCase();


        const searchMatch =
          text.includes(search);


        const categoryMatch =

          category === "all" ||

          item.category === category;


        return (

          searchMatch &&

          categoryMatch

        );

      }

    );


  if (!listings.length) {

    container.innerHTML = `

      <div style="
        grid-column:1/-1;
        text-align:center;
        padding:60px;
      ">

        <h3>
          No items found
        </h3>

        <p class="muted">
          There are currently no listings.
        </p>

      </div>

    `;

    return;

  }


  container.innerHTML =

    listings.map(item => `

      <article class="item-card">

        <img
          class="item-image"
          src="${escapeHTML(item.image || "")}"
          alt="${escapeHTML(item.name)}"
        >


        <div class="item-content">

          <h3>
            ${escapeHTML(item.name)}
          </h3>


          <p class="seller">
            Seller:
            ${escapeHTML(item.seller)}
          </p>


          <p class="seller">
            ${escapeHTML(
              item.description || ""
            )}
          </p>


          <div class="item-bottom">

            <div class="price">
              ${formatNumber(item.price)}
              LOT
            </div>


            <div class="stock">
              Stock:
              ${item.stock}
            </div>

          </div>


          <button
            class="buy-btn"
            onclick="openPurchase(${item.id})"
            ${item.stock <= 0 ? "disabled" : ""}
          >

            ${
              item.stock <= 0
                ? "Out of Stock"
                : "Buy Now"
            }

          </button>

        </div>

      </article>

    `).join("");

}



// =====================================================
// CREATE LISTING
// =====================================================

function createListing() {

  if (!currentUser) {

    toast("Please login first.");

    return;

  }


  const name =
    document
      .getElementById("itemName")
      .value
      .trim();


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
    document
      .getElementById(
        "itemDescription"
      )
      .value
      .trim();


  const file =
    document
      .getElementById(
        "itemImage"
      )
      .files[0];


  // NEW WEBHOOK

  const webhook =
    document
      .getElementById(
        "itemWebhook"
      )
      .value
      .trim();


  if (!name) {

    toast("Enter an item name.");

    return;

  }


  if (price <= 0) {

    toast("Enter a valid price.");

    return;

  }


  if (stock <= 0) {

    toast("Enter a valid stock amount.");

    return;

  }


  if (!file) {

    toast("Please select an image.");

    return;

  }


  if (file.size > 5 * 1024 * 1024) {

    toast("Image must be under 5MB.");

    return;

  }


  const allowed = [

    "image/jpeg",

    "image/png",

    "image/webp"

  ];


  if (!allowed.includes(file.type)) {

    toast(
      "Only JPG, PNG and WEBP are allowed."
    );

    return;

  }


  // Validate webhook if supplied

  if (webhook) {

    if (
      !webhook.startsWith(
        "https://discord.com/api/webhooks/"
      ) &&
      !webhook.startsWith(
        "https://discordapp.com/api/webhooks/"
      )
    ) {

      toast(
        "Enter a valid Discord webhook URL."
      );

      return;

    }

  }


  const reader =
    new FileReader();


  reader.onload = function () {

    const listing = {

      id: Date.now(),

      name: name,

      description: description,

      price: price,

      stock: stock,

      category: category,

      image: reader.result,

      seller: currentUser.username,

      sellerId: currentUser.id,

      // NEW

      webhook: webhook,

      active: true,

      sold: 0,

      earned: 0

    };


    localListings.push(listing);


    localStorage.setItem(
      "lot_listings",
      JSON.stringify(localListings)
    );


    // Clear form

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


    renderMarketplace();

    renderDashboard();


    toast(
      "Item published!"
    );

  };


  reader.readAsDataURL(file);

}



// =====================================================
// PURCHASE
// =====================================================

let selectedItem = null;

let purchaseInProgress = false;



function openPurchase(id) {

  const item =
    localListings.find(
      x => x.id === id
    );


  if (!item) return;


  if (item.stock <= 0) {

    toast("Out of stock.");

    return;

  }


  if (
    item.seller ===
    currentUser.username
  ) {

    toast(
      "You cannot buy your own item."
    );

    return;

  }


  selectedItem = item;


  document.getElementById(
    "purchaseName"
  ).textContent =

    "Purchase " +
    item.name +
    "?";


  document.getElementById(
    "purchasePrice"
  ).textContent =

    formatNumber(
      item.price
    );


  document.getElementById(
    "purchaseStock"
  ).textContent =

    item.stock;


  document.getElementById(
    "purchaseBalance"
  ).textContent =

    formatNumber(
      currentUser.balance
    );


  document.getElementById(
    "purchaseRemaining"
  ).textContent =

    formatNumber(

      currentUser.balance -
      item.price

    );


  document
    .getElementById(
      "purchaseModal"
    )
    .classList.add("active");

}



// =====================================================
// CLOSE PURCHASE
// =====================================================

function closePurchase() {

  document
    .getElementById(
      "purchaseModal"
    )
    .classList.remove("active");


  selectedItem = null;

}



// =====================================================
// CONFIRM PURCHASE
// =====================================================

async function confirmPurchase() {

  if (
    purchaseInProgress ||
    !selectedItem
  ) return;


  purchaseInProgress = true;


  const button =
    document.getElementById(
      "confirmPurchaseButton"
    );


  button.disabled = true;

  button.textContent =
    "Processing...";


  const item =
    localListings.find(
      x =>
        x.id ===
        selectedItem.id
    );


  if (!item) {

    toast(
      "Item no longer exists."
    );

    finishPurchase();

    return;

  }


  if (item.stock <= 0) {

    toast(
      "Out of stock."
    );

    finishPurchase();

    return;

  }


  if (
    currentUser.balance <
    item.price
  ) {

    toast(
      "Insufficient LOT balance."
    );

    finishPurchase();

    return;

  }


  // Save purchase information
  const buyerUsername =
    currentUser.username;


  const buyerId =
    currentUser.id;


  const price =
    Number(item.price);


  // Update buyer

  currentUser.balance -= price;

  currentUser.purchases =
    (currentUser.purchases || 0) + 1;


  // Update seller listing

  item.stock--;

  item.sold =
    (item.sold || 0) + 1;

  item.earned =
    (item.earned || 0) + price;


  // Save

  localStorage.setItem(
    "lot_listings",
    JSON.stringify(localListings)
  );


  sessionStorage.setItem(
    "lot_current_user",
    JSON.stringify(currentUser)
  );


  // Update local user record

  const localUserIndex =
    localUsers.findIndex(
      u =>
        u.id ===
        currentUser.id
    );


  if (localUserIndex !== -1) {

    localUsers[
      localUserIndex
    ].balance =
      currentUser.balance;


    localUsers[
      localUserIndex
    ].purchases =
      currentUser.purchases;


    localStorage.setItem(
      "lot_users",
      JSON.stringify(localUsers)
    );

  }


  updateAccount();

  renderMarketplace();

  renderDashboard();

  closePurchase();


  toast(
    "Purchase successful!"
  );


  // SEND DISCORD NOTIFICATION

  if (item.webhook) {

    await sendPurchaseWebhook(
      item,
      buyerUsername,
      buyerId,
      price
    );

  }


  finishPurchase();

}



// =====================================================
// DISCORD WEBHOOK
// =====================================================

async function sendPurchaseWebhook(
  item,
  buyerUsername,
  buyerId,
  price
) {

  if (!item.webhook) return;


  const webhookURL =
    item.webhook;


  const payload = {

    username: "LOT Shop",

    embeds: [

      {

        title: "🛒 New LOT Shop Purchase",

        description:
          "Someone purchased your listing.",

        fields: [

          {

            name: "📦 Product",

            value:
              String(
                item.name
              ).substring(0, 1024),

            inline: true

          },


          {

            name: "👤 Buyer",

            value:
              String(
                buyerUsername
              ).substring(0, 1024),

            inline: true

          },


          {

            name: "💰 Price",

            value:
              `${formatNumber(price)} LOT`,

            inline: true

          },


          {

            name: "🏪 Seller",

            value:
              String(
                item.seller
              ).substring(0, 1024),

            inline: true

          },


          {

            name: "📦 Remaining Stock",

            value:
              String(
                item.stock
              ),

            inline: true

          },


          {

            name: "🆔 Buyer ID",

            value:
              String(
                buyerId
              ).substring(0, 1024),

            inline: true

          }

        ],


        footer: {

          text:
            "LOT Shop Purchase Notification"

        },


        timestamp:
          new Date().toISOString()

      }

    ]

  };


  try {

    const response =
      await fetch(
        webhookURL,
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify(payload)

        }
      );


    if (!response.ok) {

      console.error(
        "Discord webhook failed:",
        response.status
      );

      toast(
        "Purchase completed, but Discord notification failed."
      );

      return;

    }


    console.log(
      "Discord purchase notification sent."
    );

  } catch (error) {

    console.error(
      "Discord webhook error:",
      error
    );


    toast(
      "Purchase completed, but Discord notification failed."
    );

  }

}



// =====================================================
// FINISH PURCHASE
// =====================================================

function finishPurchase() {

  purchaseInProgress = false;


  const button =
    document.getElementById(
      "confirmPurchaseButton"
    );


  if (button) {

    button.disabled = false;

    button.textContent =
      "Confirm Purchase";

  }

}



// =====================================================
// DASHBOARD
// =====================================================

function renderDashboard() {

  if (!currentUser) return;


  const mine =
    localListings.filter(

      item =>
        item.seller ===
        currentUser.username

    );


  const stats =
    document.getElementById(
      "stats"
    );


  if (stats) {

    stats.innerHTML = `

      <div class="stat">

        <small class="muted">
          Balance
        </small>

        <b>
          ${formatNumber(
            currentUser.

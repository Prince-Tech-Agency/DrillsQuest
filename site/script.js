/*
  ONYX — store logic
  -------------------
  Plain JS, no build step, no framework.
  Orders are sent to the store owner as a pre-filled WhatsApp message —
  no payment gateway involved. Search "SETUP:" for what to edit before launch.
*/

// SETUP: replace with the owner's real WhatsApp number, digits only, country code
// first, no +, no spaces, no leading 0. Example for a Nigerian 080 number:
// 080 1234 5678  ->  2348012345678
const WHATSAPP_NUMBER = "2349157312667"; // <-- REPLACE THIS BEFORE LAUNCH

const CART_STORAGE_KEY = "onyx_cart_v1";
const money = (n) => "₦" + n.toLocaleString("en-NG");

/* ---------------------------------------------------------
   STATE
--------------------------------------------------------- */
let PRODUCTS = [];
let cart = loadCart();
let activeFilter = "all";
let quickViewProduct = null;
let quickViewSize = null;

/* ---------------------------------------------------------
   LOAD PRODUCTS FROM CMS-EDITABLE JSON
   Your client edits content/products.json through the
   /admin panel (Decap CMS) — this just reads whatever is
   published there, so the site always reflects their edits.
--------------------------------------------------------- */
async function loadProducts(){
  const res = await fetch("content/products.json", { cache: "no-store" });
  const data = await res.json();
  // Decap CMS stores each size as {size: "M"} — flatten to plain strings
  PRODUCTS = data.products.map(p => ({
    ...p,
    sizes: (p.sizes || []).map(s => (typeof s === "string" ? s : s.size))
  }));
}

function loadCart(){
  try{
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function saveCart(){
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

/* ---------------------------------------------------------
   ELEMENTS
--------------------------------------------------------- */
const el = (id) => document.getElementById(id);
const productGrid      = el("productGrid");
const filterBar         = el("filterBar");
const overlay           = el("overlay");
const cartDrawer        = el("cartDrawer");
const cartToggle        = el("cartToggle");
const cartClose         = el("cartClose");
const cartItemsEl       = el("cartItems");
const cartSubtotalEl    = el("cartSubtotal");
const cartCountEl       = el("cartCount");
const checkoutBtn       = el("checkoutBtn");
const quickViewOverlay  = el("quickViewOverlay");
const quickViewModal    = el("quickViewModal");
const checkoutOverlay   = el("checkoutOverlay");
const checkoutClose     = el("checkoutClose");
const checkoutForm      = el("checkoutForm");
const checkoutTotalEl   = el("checkoutTotal");
const toastEl           = el("toast");
const navToggle         = el("navToggle");
const mainNav            = el("mainNav");

el("year").textContent = new Date().getFullYear();

/* ---------------------------------------------------------
   RENDER: filter bar
--------------------------------------------------------- */
function renderFilters(){
  const categories = ["all", ...new Set(PRODUCTS.map(p => p.category))];
  filterBar.innerHTML = categories.map(cat => `
    <button class="filter-btn ${cat === activeFilter ? "is-active" : ""}" data-filter="${cat}">
      ${cat === "all" ? "All" : cat}
    </button>
  `).join("");

  filterBar.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      renderFilters();
      renderGrid();
    });
  });
}

/* ---------------------------------------------------------
   RENDER: product grid
--------------------------------------------------------- */
function renderGrid(){
  const list = activeFilter === "all"
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeFilter);

  productGrid.innerHTML = list.map(p => `
    <article class="product-card">
      <div class="product-media">
        <span class="product-tag">${p.id}</span>
        ${p.limited ? `<span class="product-stock">${p.limited}</span>` : ""}
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <div class="product-quickadd">
          <button data-id="${p.id}" class="quickadd-btn">Quick add</button>
        </div>
      </div>
      <h3 class="product-name">${p.name}</h3>
      <div class="product-meta">
        <span>${p.category}</span>
        <span class="price">${money(p.price)}</span>
      </div>
    </article>
  `).join("");

  productGrid.querySelectorAll(".product-card").forEach((card, i) => {
    card.querySelector(".product-media img").addEventListener("click", () => openQuickView(list[i]));
    card.querySelector(".product-name").addEventListener("click", () => openQuickView(list[i]));
  });

  productGrid.querySelectorAll(".quickadd-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const product = PRODUCTS.find(p => p.id === btn.dataset.id);
      openQuickView(product);
    });
  });
}

/* ---------------------------------------------------------
   QUICK VIEW MODAL
--------------------------------------------------------- */
function openQuickView(product){
  quickViewProduct = product;
  quickViewSize = null;

  quickViewModal.innerHTML = `
    <button class="icon-btn modal-close" id="qvClose" aria-label="Close">&times;</button>
    <div class="qv-media"><img src="${product.image}" alt="${product.name}"></div>
    <div class="qv-body">
      <p class="eyebrow">${product.category} — ${product.id}</p>
      <h3>${product.name}</h3>
      <p class="qv-price">${money(product.price)}</p>
      <p class="qv-desc">${product.desc}</p>
      <p class="size-label">Select size</p>
      <div class="size-row" id="sizeRow">
        ${product.sizes.map(s => `<button class="size-btn" data-size="${s}">${s}</button>`).join("")}
      </div>
      <button class="btn btn-primary qv-add" id="qvAddBtn">Add to bag</button>
    </div>
  `;

  quickViewModal.querySelector("#qvClose").addEventListener("click", closeQuickView);
  quickViewModal.querySelectorAll(".size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      quickViewModal.querySelectorAll(".size-btn").forEach(b => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      quickViewSize = btn.dataset.size;
    });
  });
  quickViewModal.querySelector("#qvAddBtn").addEventListener("click", () => {
    if (!quickViewSize){
      showToast("Please select a size");
      return;
    }
    addToCart(product, quickViewSize);
    closeQuickView();
  });

  quickViewOverlay.classList.add("is-visible");
}
function closeQuickView(){
  quickViewOverlay.classList.remove("is-visible");
}
quickViewOverlay.addEventListener("click", (e) => {
  if (e.target === quickViewOverlay) closeQuickView();
});

/* ---------------------------------------------------------
   CART
--------------------------------------------------------- */
function addToCart(product, size){
  const existing = cart.find(l => l.id === product.id && l.size === size);
  if (existing){
    existing.qty += 1;
  }else{
    cart.push({ id: product.id, size, qty: 1 });
  }
  saveCart();
  renderCart();
  showToast(`${product.name} (${size}) added to bag`);
}

function changeQty(id, size, delta){
  const line = cart.find(l => l.id === id && l.size === size);
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0){
    cart = cart.filter(l => !(l.id === id && l.size === size));
  }
  saveCart();
  renderCart();
}

function removeLine(id, size){
  cart = cart.filter(l => !(l.id === id && l.size === size));
  saveCart();
  renderCart();
}

function cartTotal(){
  return cart.reduce((sum, line) => {
    const product = PRODUCTS.find(p => p.id === line.id);
    return sum + (product ? product.price * line.qty : 0);
  }, 0);
}

function renderCart(){
  const count = cart.reduce((n, l) => n + l.qty, 0);
  cartCountEl.textContent = count;

  if (cart.length === 0){
    cartItemsEl.innerHTML = `<p class="cart-empty">Your bag is empty.</p>`;
    checkoutBtn.disabled = true;
  }else{
    cartItemsEl.innerHTML = cart.map(line => {
      const product = PRODUCTS.find(p => p.id === line.id);
      if (!product) return "";
      return `
        <div class="cart-line">
          <img src="${product.image}" alt="${product.name}">
          <div>
            <p class="cart-line-name">${product.name}</p>
            <p class="cart-line-meta">Size ${line.size}</p>
            <div class="qty-row">
              <button class="qty-btn" data-action="dec" data-id="${line.id}" data-size="${line.size}">−</button>
              <span>${line.qty}</span>
              <button class="qty-btn" data-action="inc" data-id="${line.id}" data-size="${line.size}">+</button>
            </div>
            <p class="cart-line-remove" data-action="remove" data-id="${line.id}" data-size="${line.size}">Remove</p>
          </div>
          <p class="cart-line-price">${money(product.price * line.qty)}</p>
        </div>
      `;
    }).join("");
    checkoutBtn.disabled = false;

    cartItemsEl.querySelectorAll('[data-action="inc"]').forEach(b =>
      b.addEventListener("click", () => changeQty(b.dataset.id, b.dataset.size, 1)));
    cartItemsEl.querySelectorAll('[data-action="dec"]').forEach(b =>
      b.addEventListener("click", () => changeQty(b.dataset.id, b.dataset.size, -1)));
    cartItemsEl.querySelectorAll('[data-action="remove"]').forEach(b =>
      b.addEventListener("click", () => removeLine(b.dataset.id, b.dataset.size)));
  }

  cartSubtotalEl.textContent = money(cartTotal());
}

/* cart drawer open/close */
function openCart(){
  cartDrawer.classList.add("is-open");
  overlay.classList.add("is-visible");
}
function closeCart(){
  cartDrawer.classList.remove("is-open");
  overlay.classList.remove("is-visible");
}
cartToggle.addEventListener("click", openCart);
cartClose.addEventListener("click", closeCart);
overlay.addEventListener("click", () => {
  closeCart();
  closeCheckout();
});

/* ---------------------------------------------------------
   MOBILE NAV
--------------------------------------------------------- */
navToggle.addEventListener("click", () => {
  mainNav.classList.toggle("is-open");
});
mainNav.querySelectorAll("a").forEach(a =>
  a.addEventListener("click", () => mainNav.classList.remove("is-open")));

/* ---------------------------------------------------------
   CHECKOUT
--------------------------------------------------------- */
function openCheckout(){
  if (cart.length === 0) return;
  checkoutTotalEl.textContent = money(cartTotal());
  checkoutOverlay.classList.add("is-visible");
}
function closeCheckout(){
  checkoutOverlay.classList.remove("is-visible");
}
checkoutBtn.addEventListener("click", () => {
  closeCart();
  openCheckout();
});
checkoutClose.addEventListener("click", closeCheckout);
checkoutOverlay.addEventListener("click", (e) => {
  if (e.target === checkoutOverlay) closeCheckout();
});

checkoutForm.addEventListener("submit", function(e){
  e.preventDefault();

  if (!WHATSAPP_NUMBER || WHATSAPP_NUMBER.includes("X")){
    showToast("Store owner: add your real WhatsApp number in script.js first.");
    return;
  }

  const formData = new FormData(checkoutForm);
  const name = formData.get("name");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const address = formData.get("address");

  const orderRef = "DR" + Date.now().toString().slice(-6);
  const message = buildOrderMessage(orderRef, name, email, phone, address);

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, "_blank");

  cart = [];
  saveCart();
  renderCart();
  closeCheckout();
  checkoutForm.reset();
  showToast("Order ready — just hit send in WhatsApp to confirm.");
});

function buildOrderMessage(orderRef, name, email, phone, address){
  const lines = [];
  lines.push(`New order — ${orderRef}`);
  lines.push("");
  cart.forEach(line => {
    const product = PRODUCTS.find(p => p.id === line.id);
    if (!product) return;
    lines.push(`• ${product.name} (Size ${line.size}) x${line.qty} — ${money(product.price * line.qty)}`);
  });
  lines.push("");
  lines.push(`Subtotal: ${money(cartTotal())}`);
  lines.push("");
  lines.push(`Name: ${name}`);
  if (email) lines.push(`Email: ${email}`);
  lines.push(`Phone: ${phone}`);
  lines.push(`Delivery address: ${address}`);
  return lines.join("\n");
}

/* ---------------------------------------------------------
   TOAST
--------------------------------------------------------- */
let toastTimer;
function showToast(message){
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add("is-visible");
  toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2600);
}

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
(async function init(){
  await loadProducts();
  renderFilters();
  renderGrid();
  renderCart();
})();

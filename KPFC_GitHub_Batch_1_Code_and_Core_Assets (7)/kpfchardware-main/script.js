(() => {
  "use strict";
  const products = Array.isArray(window.KPFC_PRODUCTS) ? window.KPFC_PRODUCTS : [];
  const phone = "254782425904";
  const grid = document.getElementById("products-grid");
  const searchInput = document.getElementById("product-search");
  const filterWrap = document.getElementById("category-filters");
  const sortSelect = document.getElementById("product-sort");
  const noResults = document.getElementById("no-results");
  const total = document.getElementById("product-total");
  const cartDrawer = document.getElementById("cart-drawer");
  const backdrop = document.getElementById("cart-backdrop");
  const cartItemsEl = document.getElementById("cart-items");
  const countEl = document.getElementById("cart-count");
  const drawerCount = document.getElementById("drawer-count");
  const toastEl = document.getElementById("toast");
  let activeCategory = "All";
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem("kpfc-enquiry-cart") || "[]"); } catch (_) { cart = []; }
  if (!Array.isArray(cart)) cart = [];

  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[ch]));
  const priceValue = (value) => {
    const nums = String(value).replace(/,/g, "").match(/\d+(?:\.\d+)?/g);
    return nums ? Number(nums[0]) : Number.MAX_SAFE_INTEGER;
  };
  const productById = (id) => products.find(p => p.id === id);
  products.forEach((p, i) => { p.id = i + 1; });

  function notify(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => toastEl.classList.remove("show"), 2300);
  }

  function productCard(p) {
    const name = escapeHTML(p.name);
    const price = escapeHTML(p.price);
    const category = escapeHTML(p.category);
    const image = escapeHTML(p.image);
    return `<article class="product-card">
      <div class="product-image">
        <img src="${image}" alt="${name} at KPFC Builders Hardware" loading="lazy" decoding="async" onerror="this.style.opacity='.12';this.alt='Product image unavailable';">
        <span class="product-category">${category}</span>
      </div>
      <div class="product-info">
        <h3>${name}</h3>
        <p>Ask us about availability and ordering options.</p>
        <div class="product-price">${price}</div>
        <div class="product-actions">
          <button class="product-buy" type="button" data-buy="${p.id}"><i class="bx bxl-whatsapp"></i> Enquire</button>
          <button class="product-add" type="button" data-add="${p.id}"><i class="bx bx-cart-add"></i> Add to cart</button>
        </div>
      </div>
    </article>`;
  }

  function renderProducts() {
    const term = searchInput.value.trim().toLowerCase();
    let visible = products.filter(p =>
      (activeCategory === "All" || p.category === activeCategory) &&
      (p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term))
    );
    const sort = sortSelect.value;
    if (sort === "name") visible.sort((a,b) => a.name.localeCompare(b.name));
    if (sort === "price-low") visible.sort((a,b) => priceValue(a.price)-priceValue(b.price));
    if (sort === "price-high") visible.sort((a,b) => priceValue(b.price)-priceValue(a.price));
    grid.innerHTML = visible.map(productCard).join("");
    total.textContent = visible.length;
    noResults.hidden = visible.length !== 0;
  }

  function openWhatsApp(message) {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function saveCart() {
    try { localStorage.setItem("kpfc-enquiry-cart", JSON.stringify(cart)); } catch (_) {}
    renderCart();
  }
  function addToCart(id) {
    const found = cart.find(item => item.id === id);
    if (found) found.qty += 1;
    else cart.push({id, qty:1});
    saveCart();
    notify("Product added to your enquiry cart");
  }
  function renderCart() {
    cart = cart.filter(item => productById(item.id) && Number.isInteger(item.qty) && item.qty > 0);
    const count = cart.reduce((sum,item) => sum + item.qty, 0);
    countEl.textContent = count;
    drawerCount.textContent = `(${count})`;
    document.getElementById("checkout-btn").disabled = count === 0;
    if (!cart.length) {
      cartItemsEl.innerHTML = `<div class="empty-cart"><i class="bx bx-shopping-bag"></i><h3>Your cart is empty</h3><p>Add products to prepare a WhatsApp enquiry.</p></div>`;
      return;
    }
    cartItemsEl.innerHTML = cart.map(item => {
      const p = productById(item.id);
      return `<div class="cart-row">
        <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}">
        <div><h3>${escapeHTML(p.name)}</h3><p>${escapeHTML(p.price)}</p>
          <div class="qty-controls"><button type="button" data-qty="${p.id}" data-change="-1" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button type="button" data-qty="${p.id}" data-change="1" aria-label="Increase quantity">+</button></div>
        </div>
        <button class="remove-item" type="button" data-remove="${p.id}" aria-label="Remove ${escapeHTML(p.name)}"><i class="bx bx-trash"></i></button>
      </div>`;
    }).join("");
  }
  function showCart() {
    cartDrawer.classList.add("active");
    backdrop.classList.add("active");
    cartDrawer.setAttribute("aria-hidden","false");
    document.body.style.overflow = "hidden";
    document.getElementById("close-cart").focus();
  }
  function hideCart() {
    cartDrawer.classList.remove("active");
    backdrop.classList.remove("active");
    cartDrawer.setAttribute("aria-hidden","true");
    document.body.style.overflow = "";
    document.getElementById("open-cart").focus();
  }

  grid.addEventListener("click", (event) => {
    const buy = event.target.closest("[data-buy]");
    const add = event.target.closest("[data-add]");
    if (buy) {
      const p = productById(Number(buy.dataset.buy));
      if (p) openWhatsApp(`Hello KPFC, I would like to enquire about:\n\nProduct: ${p.name}\nListed price: ${p.price}\n\nPlease confirm current price and availability.`);
    }
    if (add) addToCart(Number(add.dataset.add));
  });
  filterWrap.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-filter]");
    if (!btn) return;
    activeCategory = btn.dataset.filter;
    filterWrap.querySelectorAll(".filter-chip").forEach(chip => chip.classList.toggle("active", chip === btn));
    renderProducts();
  });
  document.querySelectorAll("[data-category-link]").forEach(link => {
    link.addEventListener("click", () => {
      activeCategory = link.dataset.categoryLink;
      filterWrap.querySelectorAll(".filter-chip").forEach(chip => chip.classList.toggle("active", chip.dataset.filter === activeCategory));
      renderProducts();
    });
  });
  searchInput.addEventListener("input", renderProducts);
  sortSelect.addEventListener("change", renderProducts);
  document.getElementById("open-cart").addEventListener("click", showCart);
  document.getElementById("close-cart").addEventListener("click", hideCart);
  backdrop.addEventListener("click", hideCart);
  document.addEventListener("keydown", event => { if (event.key === "Escape" && cartDrawer.classList.contains("active")) hideCart(); });
  cartItemsEl.addEventListener("click", event => {
    const qtyBtn = event.target.closest("[data-qty]");
    const removeBtn = event.target.closest("[data-remove]");
    if (qtyBtn) {
      const id = Number(qtyBtn.dataset.qty);
      const item = cart.find(entry => entry.id === id);
      if (item) {
        item.qty += Number(qtyBtn.dataset.change);
        if (item.qty <= 0) cart = cart.filter(entry => entry.id !== id);
        saveCart();
      }
    }
    if (removeBtn) {
      cart = cart.filter(entry => entry.id !== Number(removeBtn.dataset.remove));
      saveCart();
      notify("Product removed from cart");
    }
  });
  document.getElementById("clear-cart").addEventListener("click", () => {
    cart = [];
    saveCart();
    notify("Your enquiry cart has been cleared");
  });
  document.getElementById("checkout-btn").addEventListener("click", () => {
    if (!cart.length) return;
    const lines = cart.map(item => {
      const p = productById(item.id);
      return `• ${p.name} — Qty: ${item.qty} — Listed price: ${p.price}`;
    });
    openWhatsApp(`Hello KPFC, please help me with a quote for these products:\n\n${lines.join("\n")}\n\nPlease confirm current prices, availability and delivery options.`);
  });

  const menuToggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("primary-nav");
  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    menuToggle.innerHTML = `<i class="bx ${open ? "bx-x" : "bx-menu"}"></i>`;
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded","false");
    menuToggle.setAttribute("aria-label","Open navigation menu");
    menuToggle.innerHTML = '<i class="bx bx-menu"></i>';
  }));
  window.addEventListener("scroll", () => document.querySelector(".site-header").classList.toggle("scrolled", window.scrollY > 10), {passive:true});
  document.getElementById("year").textContent = new Date().getFullYear();
  renderProducts();
  renderCart();
})();
// ========================================================
// Gajbhiye Kirana & General Store - Frontend Application
// ========================================================

const API_BASE = ''; // Same host (Express backend)

// Application State
const state = {
  products: [],
  categories: [],
  sections: [],
  cart: JSON.parse(localStorage.getItem('gajbhiye_cart') || '{}'),
  activeCategory: 'all',
  activeSection: 'all',
  searchQuery: '',
  sortOrder: 'featured',
  inStockOnly: false,
  coupon: null, // { code, type: 'percent'|'flat', value: 10 }
};

// Available Coupons
const COUPONS = {
  'GAJBHIYE10': { type: 'percent', value: 10, minOrder: 199, desc: '10% OFF on all groceries' },
  'KIRANA50': { type: 'flat', value: 50, minOrder: 499, desc: 'Flat ₹50 OFF on orders above ₹499' },
  'WELCOME20': { type: 'percent', value: 20, minOrder: 299, desc: '20% OFF Welcome Bonus' }
};

// DOM Elements
const categoriesContainer = document.getElementById('categories-container');
const curatedSectionsContainer = document.getElementById('curated-sections');
const productsGrid = document.getElementById('products-grid');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const searchSuggestions = document.getElementById('search-suggestions');
const sortSelect = document.getElementById('sort-select');
const instockFilter = document.getElementById('instock-filter');
const productCountBadge = document.getElementById('product-count-badge');
const catalogTitle = document.getElementById('catalog-title');
const activeFilterBadge = document.getElementById('active-filter-badge');
const activeFilterText = document.getElementById('active-filter-text');

// Cart Elements
const cartBtn = document.getElementById('cart-btn');
const cartBadge = document.getElementById('cart-badge');
const cartHeaderTotal = document.getElementById('cart-header-total');
const cartDrawer = document.getElementById('cart-drawer');
const cartBackdrop = document.getElementById('cart-backdrop');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const drawerItemsCount = document.getElementById('drawer-items-count');
const summarySubtotal = document.getElementById('summary-subtotal');
const summaryDiscount = document.getElementById('summary-discount');
const summaryDelivery = document.getElementById('summary-delivery');
const summarySavings = document.getElementById('summary-savings');
const summaryGrandTotal = document.getElementById('summary-grand-total');
const promoRow = document.getElementById('promo-row');
const summaryPromoCode = document.getElementById('summary-promo-code');
const checkoutPriceBtn = document.getElementById('checkout-price-btn');
const freeDeliveryMsg = document.getElementById('free-delivery-msg');
const trackerFill = document.getElementById('tracker-fill');
const promoInput = document.getElementById('promo-input');
const applyPromoBtn = document.getElementById('apply-promo-btn');
const promoFeedback = document.getElementById('promo-feedback');

// Checkout & Modals
const checkoutBtn = document.getElementById('checkout-btn');
const checkoutModal = document.getElementById('checkout-modal');
const closeCheckoutModal = document.getElementById('close-checkout-modal');
const cancelCheckoutBtn = document.getElementById('cancel-checkout-btn');
const checkoutForm = document.getElementById('checkout-form');
const confirmTotalBadge = document.getElementById('confirm-total-badge');
const orderSuccessModal = document.getElementById('order-success-modal');
const orderReceiptContent = document.getElementById('order-receipt-content');
const waShareOrderBtn = document.getElementById('wa-share-order-btn');

// Admin Elements
const adminModalBtn = document.getElementById('admin-modal-btn');
const adminModal = document.getElementById('admin-modal');
const addProductForm = document.getElementById('add-product-form');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  fetchCategories();
  fetchSections();
  fetchProducts();
  updateCartUI();
});

// Event Listeners
function initEventListeners() {
  // Cart drawer open/close
  cartBtn.addEventListener('click', openCart);
  closeCartBtn.addEventListener('click', closeCart);
  cartBackdrop.addEventListener('click', closeCart);

  // Search input with debounce
  let searchTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    const val = e.target.value.trim();
    clearSearchBtn.style.display = val ? 'block' : 'none';

    searchTimer = setTimeout(() => {
      state.searchQuery = val;
      renderSearchSuggestions(val);
      fetchProducts();
    }, 250);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    searchSuggestions.style.display = 'none';
    state.searchQuery = '';
    fetchProducts();
  });

  // Close search suggestions on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
      searchSuggestions.style.display = 'none';
    }
  });

  // Sort and Stock filters
  sortSelect.addEventListener('change', (e) => {
    state.sortOrder = e.target.value;
    fetchProducts();
  });

  instockFilter.addEventListener('change', (e) => {
    state.inStockOnly = e.target.checked;
    fetchProducts();
  });

  // Section Pills
  const sectionPills = document.querySelectorAll('#section-nav-pills .nav-pill');
  sectionPills.forEach(pill => {
    pill.addEventListener('click', () => {
      sectionPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const sec = pill.dataset.section;
      state.activeSection = sec;
      state.activeCategory = 'all';
      updateActiveFilterUI();
      fetchProducts();
    });
  });

  // Promo code
  applyPromoBtn.addEventListener('click', applyPromoCode);

  // Checkout modal
  checkoutBtn.addEventListener('click', () => {
    const totalItems = Object.values(state.cart).reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems === 0) {
      showToast('Your basket is empty. Please add grocery items first.', 'info');
      return;
    }
    closeCart();
    openCheckout();
  });

  closeCheckoutModal.addEventListener('click', closeCheckout);
  cancelCheckoutBtn.addEventListener('click', closeCheckout);

  // Checkout Form Submission
  checkoutForm.addEventListener('submit', handleOrderSubmit);

  // Admin Modal
  adminModalBtn.addEventListener('click', openAdminModal);
  if (addProductForm) {
    addProductForm.addEventListener('submit', handleAddProduct);
  }
}

// ======================== API CALLS ========================

async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/api/categories`);
    const data = await res.json();
    if (data.success) {
      state.categories = data.data;
      renderCategories();
    }
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

async function fetchSections() {
  try {
    const res = await fetch(`${API_BASE}/api/sections`);
    const data = await res.json();
    if (data.success) {
      state.sections = data.data;
      renderCuratedSections();
    }
  } catch (err) {
    console.error('Failed to load sections:', err);
  }
}

async function fetchProducts() {
  try {
    productsGrid.innerHTML = `
      <div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 2rem;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i>
        <p style="margin-top: 0.5rem; color: var(--text-muted);">Fetching groceries from Gajbhiye Kirana...</p>
      </div>
    `;

    const params = new URLSearchParams();
    if (state.activeCategory && state.activeCategory !== 'all') params.append('category', state.activeCategory);
    if (state.activeSection && state.activeSection !== 'all') params.append('section', state.activeSection);
    if (state.searchQuery) params.append('search', state.searchQuery);
    if (state.sortOrder) params.append('sort', state.sortOrder);
    if (state.inStockOnly) params.append('inStockOnly', 'true');

    const res = await fetch(`${API_BASE}/api/products?${params.toString()}`);
    const data = await res.json();

    if (data.success) {
      state.products = data.data;
      renderProducts(state.products);
      productCountBadge.innerText = `${data.count} Items Available`;
    }
  } catch (err) {
    console.error('Failed to load products:', err);
    productsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #dc2626;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem;"></i>
        <p>Could not connect to Gajbhiye Kirana server. Please verify backend is running.</p>
      </div>
    `;
  }
}

// ======================== RENDERING ========================

function renderCategories() {
  if (!categoriesContainer) return;
  categoriesContainer.innerHTML = '';

  state.categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = `category-card ${state.activeCategory === cat.id ? 'active' : ''}`;
    card.onclick = () => filterByCategory(cat.id);

    card.innerHTML = `
      <div class="cat-icon-box" style="background: ${cat.bannerBg || 'var(--primary)'}">
        <i class="fa-solid ${cat.icon || 'fa-basket-shopping'}"></i>
      </div>
      <span class="cat-name">${cat.name}</span>
      <span class="cat-marathi">${cat.marathiName || ''}</span>
      <span class="cat-count">${cat.itemCount || 0} items</span>
    `;

    categoriesContainer.appendChild(card);
  });
}

function renderCuratedSections() {
  if (!curatedSectionsContainer) return;
  curatedSectionsContainer.innerHTML = '';

  state.sections.forEach(sec => {
    if (!sec.products || sec.products.length === 0) return;

    const block = document.createElement('div');
    block.className = 'curated-block container';

    const header = document.createElement('div');
    header.className = 'curated-header';
    header.innerHTML = `
      <div class="curated-title-group">
        <h3>${sec.title}</h3>
        <p>${sec.subtitle}</p>
      </div>
      <button class="pill-outline-btn" onclick="filterBySection('${sec.id}')">View All (${sec.products.length})</button>
    `;

    const slider = document.createElement('div');
    slider.className = 'curated-slider';
    sec.products.slice(0, 4).forEach(prod => {
      slider.appendChild(createProductCard(prod));
    });

    block.appendChild(header);
    block.appendChild(slider);
    curatedSectionsContainer.appendChild(block);
  });
}

function renderProducts(products) {
  productsGrid.innerHTML = '';

  if (!products || products.length === 0) {
    productsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem;">
        <i class="fa-solid fa-basket-shopping" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 0.75rem;"></i>
        <h3 style="font-size: 1.25rem; font-weight: 700;">No grocery items found</h3>
        <p style="color: var(--text-muted); margin-bottom: 1rem;">Try searching with different keywords like 'Dal', 'Ghee', 'Atta', or clear filters.</p>
        <button class="btn-primary" onclick="resetFilter()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  products.forEach(prod => {
    productsGrid.appendChild(createProductCard(prod));
  });
}

function createProductCard(prod) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.id = `prod-card-${prod.id}`;

  const discountPercent = prod.mrp && prod.mrp > prod.price 
    ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100) 
    : 0;

  const inCartQty = state.cart[prod.id] ? state.cart[prod.id].quantity : 0;

  card.innerHTML = `
    <div class="product-thumb-box" onclick="openProductQuickView('${prod.id}')">
      <img src="${prod.image}" alt="${prod.name}" class="product-thumb" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'">
      ${discountPercent > 0 ? `<span class="product-badge">${discountPercent}% OFF</span>` : ''}
      <span class="product-brand-tag">${prod.brand || 'Gajbhiye Select'}</span>
    </div>

    <div class="product-info">
      <span class="product-unit"><i class="fa-solid fa-scale-balanced"></i> ${prod.unit}</span>
      <h4 class="product-name" onclick="openProductQuickView('${prod.id}')" title="${prod.name}">${prod.name}</h4>
      <div class="product-marathi">${prod.marathiName || ''}</div>

      <div class="product-rating">
        <span class="rating-pill"><i class="fa-solid fa-star"></i> ${prod.rating || '4.8'}</span>
        <span>(${prod.ratingCount || 100}+ sold)</span>
      </div>

      <div class="product-bottom-row">
        <div class="price-group">
          <span class="current-price">₹${prod.price}</span>
          ${prod.mrp > prod.price ? `<span class="mrp-price">MRP ₹${prod.mrp}</span>` : ''}
        </div>

        <div class="cart-action-slot" id="btn-slot-${prod.id}">
          ${!prod.inStock ? `
            <span class="out-of-stock-badge">Out of Stock</span>
          ` : inCartQty > 0 ? `
            <div class="qty-counter">
              <button class="qty-btn" onclick="updateItemQty('${prod.id}', -1)">-</button>
              <span class="qty-number">${inCartQty}</span>
              <button class="qty-btn" onclick="updateItemQty('${prod.id}', 1)">+</button>
            </div>
          ` : `
            <button class="btn-add-cart" onclick="addToCart('${prod.id}')">
              <i class="fa-solid fa-plus"></i> ADD
            </button>
          `}
        </div>
      </div>
    </div>
  `;

  return card;
}

// Live Search Autocomplete Suggestions
function renderSearchSuggestions(query) {
  if (!query || query.length < 2) {
    searchSuggestions.style.display = 'none';
    return;
  }

  const q = query.toLowerCase();
  const matches = state.products.filter(p => 
    p.name.toLowerCase().includes(q) ||
    (p.marathiName && p.marathiName.toLowerCase().includes(q)) ||
    (p.brand && p.brand.toLowerCase().includes(q))
  ).slice(0, 5);

  if (matches.length === 0) {
    searchSuggestions.style.display = 'none';
    return;
  }

  searchSuggestions.innerHTML = matches.map(p => `
    <div class="suggestion-item" onclick="selectSearchSuggestion('${p.name}')">
      <div class="sugg-info">
        <img src="${p.image}" class="sugg-img" alt="${p.name}">
        <div class="sugg-text">
          <strong>${p.name}</strong>
          <small>${p.marathiName} • ${p.unit}</small>
        </div>
      </div>
      <span class="sugg-price">₹${p.price}</span>
    </div>
  `).join('');

  searchSuggestions.style.display = 'block';
}

function selectSearchSuggestion(name) {
  searchInput.value = name;
  searchSuggestions.style.display = 'none';
  state.searchQuery = name;
  fetchProducts();
}

// ======================== FILTER ACTIONS ========================

function filterByCategory(categoryId) {
  state.activeCategory = categoryId;
  state.activeSection = 'all';

  // Update pills UI
  const sectionPills = document.querySelectorAll('#section-nav-pills .nav-pill');
  sectionPills.forEach(p => p.classList.remove('active'));
  document.querySelector('#section-nav-pills .nav-pill[data-section="all"]')?.classList.add('active');

  renderCategories();
  updateActiveFilterUI();
  fetchProducts();

  // Smooth scroll down to catalog
  document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
}

function filterBySection(sectionId) {
  state.activeSection = sectionId;
  state.activeCategory = 'all';

  const sectionPills = document.querySelectorAll('#section-nav-pills .nav-pill');
  sectionPills.forEach(p => {
    if (p.dataset.section === sectionId) p.classList.add('active');
    else p.classList.remove('active');
  });

  renderCategories();
  updateActiveFilterUI();
  fetchProducts();

  document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
}

function filterByPromo(category) {
  filterByCategory(category);
}

function resetFilter() {
  state.activeCategory = 'all';
  state.activeSection = 'all';
  state.searchQuery = '';
  searchInput.value = '';
  clearSearchBtn.style.display = 'none';
  searchSuggestions.style.display = 'none';

  const sectionPills = document.querySelectorAll('#section-nav-pills .nav-pill');
  sectionPills.forEach(p => p.classList.remove('active'));
  document.querySelector('#section-nav-pills .nav-pill[data-section="all"]')?.classList.add('active');

  renderCategories();
  updateActiveFilterUI();
  fetchProducts();
}

function updateActiveFilterUI() {
  if (state.activeCategory !== 'all') {
    const cat = state.categories.find(c => c.id === state.activeCategory);
    activeFilterBadge.style.display = 'flex';
    activeFilterText.innerText = cat ? `Category: ${cat.name}` : `Category: ${state.activeCategory}`;
    catalogTitle.innerText = cat ? `${cat.name} (${cat.marathiName || ''})` : 'All Products';
  } else if (state.activeSection !== 'all') {
    const sec = state.sections.find(s => s.id === state.activeSection);
    activeFilterBadge.style.display = 'flex';
    activeFilterText.innerText = `Section: ${state.activeSection}`;
    catalogTitle.innerText = sec ? sec.title : 'Curated Section';
  } else {
    activeFilterBadge.style.display = 'none';
    catalogTitle.innerText = 'All Kirana Products';
  }
}

// ======================== CART MANAGEMENT ========================

function addToCart(productId) {
  const product = state.products.find(p => p.id === productId) || 
                  state.sections.flatMap(s => s.products).find(p => p.id === productId);

  if (!product) return;

  if (!state.cart[productId]) {
    state.cart[productId] = {
      product: {
        id: product.id,
        name: product.name,
        marathiName: product.marathiName,
        price: product.price,
        mrp: product.mrp,
        unit: product.unit,
        image: product.image
      },
      quantity: 1
    };
  } else {
    state.cart[productId].quantity += 1;
  }

  saveCart();
  updateCartUI();
  refreshCardButton(productId);
  showToast(`Added ${product.name} to basket!`, 'success');
}

function updateItemQty(productId, delta) {
  if (!state.cart[productId]) return;

  state.cart[productId].quantity += delta;
  if (state.cart[productId].quantity <= 0) {
    delete state.cart[productId];
    showToast('Item removed from basket', 'info');
  }

  saveCart();
  updateCartUI();
  refreshCardButton(productId);
}

function saveCart() {
  localStorage.setItem('gajbhiye_cart', JSON.stringify(state.cart));
}

function refreshCardButton(productId) {
  // Re-render button slot for this product in catalog
  const slots = document.querySelectorAll(`[id="btn-slot-${productId}"]`);
  slots.forEach(slot => {
    const inCartQty = state.cart[productId] ? state.cart[productId].quantity : 0;
    if (inCartQty > 0) {
      slot.innerHTML = `
        <div class="qty-counter">
          <button class="qty-btn" onclick="updateItemQty('${productId}', -1)">-</button>
          <span class="qty-number">${inCartQty}</span>
          <button class="qty-btn" onclick="updateItemQty('${productId}', 1)">+</button>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <button class="btn-add-cart" onclick="addToCart('${productId}')">
          <i class="fa-solid fa-plus"></i> ADD
        </button>
      `;
    }
  });
}

function updateCartUI() {
  const items = Object.values(state.cart);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Update Badge & Header
  cartBadge.innerText = totalCount;
  drawerItemsCount.innerText = `${totalCount} Items`;

  let subtotal = 0;
  let totalSavings = 0;

  // Render items in drawer
  if (items.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="empty-cart-state">
        <i class="fa-solid fa-basket-shopping"></i>
        <h4>Your Basket is Empty</h4>
        <p>Your favorite dals, atta, ghee and daily kirana are just a click away!</p>
      </div>
    `;
    subtotal = 0;
    totalSavings = 0;
  } else {
    cartItemsContainer.innerHTML = '';
    items.forEach(({ product, quantity }) => {
      const itemTotal = product.price * quantity;
      subtotal += itemTotal;
      totalSavings += Math.max(0, ((product.mrp || product.price) - product.price) * quantity);

      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <img src="${product.image}" class="cart-item-img" alt="${product.name}">
        <div class="cart-item-details">
          <h5 class="cart-item-name">${product.name}</h5>
          <div class="cart-item-unit">${product.unit}</div>
          <div class="cart-item-price">₹${product.price} x ${quantity} = <strong>₹${itemTotal}</strong></div>
        </div>
        <div class="cart-item-actions">
          <div class="qty-counter">
            <button class="qty-btn" onclick="updateItemQty('${product.id}', -1)">-</button>
            <span class="qty-number">${quantity}</span>
            <button class="qty-btn" onclick="updateItemQty('${product.id}', 1)">+</button>
          </div>
        </div>
      `;
      cartItemsContainer.appendChild(itemEl);
    });
  }

  // Calculate Discount
  let discount = 0;
  if (state.coupon) {
    if (state.coupon.type === 'percent') {
      discount = Math.round((subtotal * state.coupon.value) / 100);
    } else {
      discount = state.coupon.value;
    }
    promoRow.style.display = 'flex';
    summaryPromoCode.innerText = state.coupon.code;
    summaryDiscount.innerText = `-₹${discount}`;
  } else {
    promoRow.style.display = 'none';
  }

  // Delivery calculation (Free above ₹499)
  const deliveryThreshold = 499;
  const isDeliveryFree = subtotal >= deliveryThreshold || subtotal === 0;
  const deliveryCharge = isDeliveryFree ? 0 : 30;

  summarySubtotal.innerText = `₹${subtotal}`;
  summaryDelivery.innerText = isDeliveryFree ? 'FREE' : `₹${deliveryCharge}`;
  summarySavings.innerText = `₹${totalSavings + discount}`;

  const grandTotal = Math.max(0, subtotal - discount + deliveryCharge);
  summaryGrandTotal.innerText = `₹${grandTotal}`;
  cartHeaderTotal.innerText = `₹${grandTotal}`;
  checkoutPriceBtn.innerHTML = `₹${grandTotal} <i class="fa-solid fa-arrow-right"></i>`;
  confirmTotalBadge.innerText = `Pay ₹${grandTotal}`;

  // Progress Bar for Free Delivery
  if (subtotal >= deliveryThreshold) {
    freeDeliveryMsg.innerHTML = `🎉 You unlocked <strong>FREE 30-Min Delivery!</strong>`;
    trackerFill.style.width = '100%';
  } else {
    const diff = deliveryThreshold - subtotal;
    const pct = Math.min(100, Math.round((subtotal / deliveryThreshold) * 100));
    freeDeliveryMsg.innerHTML = `Add <strong>₹${diff}</strong> more for <strong>FREE Delivery</strong>`;
    trackerFill.style.width = `${pct}%`;
  }
}

// Promo Code Application
function applyPromoCode() {
  const code = promoInput.value.trim().toUpperCase();
  if (!code) {
    promoFeedback.className = 'promo-msg error';
    promoFeedback.innerText = 'Please enter a coupon code';
    return;
  }

  const subtotal = Object.values(state.cart).reduce((sum, i) => sum + (i.product.price * i.quantity), 0);

  if (COUPONS[code]) {
    const c = COUPONS[code];
    if (subtotal < c.minOrder) {
      promoFeedback.className = 'promo-msg error';
      promoFeedback.innerText = `Requires minimum order of ₹${c.minOrder}`;
      return;
    }

    state.coupon = { code, ...c };
    promoFeedback.className = 'promo-msg success';
    promoFeedback.innerText = `Coupon '${code}' applied! ${c.desc}`;
    updateCartUI();
    showToast(`Coupon '${code}' applied!`, 'success');
  } else {
    promoFeedback.className = 'promo-msg error';
    promoFeedback.innerText = `Invalid coupon. Try 'GAJBHIYE10' or 'KIRANA50'`;
  }
}

function openCart() {
  cartDrawer.classList.add('active');
  cartBackdrop.classList.add('active');
}

function closeCart() {
  cartDrawer.classList.remove('active');
  cartBackdrop.classList.remove('active');
}

// ======================== CHECKOUT & ORDER SUBMISSION ========================

function openCheckout() {
  checkoutModal.classList.add('active');
}

function closeCheckout() {
  checkoutModal.classList.remove('active');
}

async function handleOrderSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const address = document.getElementById('cust-address').value.trim();
  const landmark = document.getElementById('cust-landmark').value.trim();
  const pincode = document.getElementById('cust-pincode').value.trim();
  const deliverySlot = document.querySelector('input[name="deliverySlot"]:checked')?.value;
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
  const note = document.getElementById('order-note').value.trim();

  const items = Object.values(state.cart).map(i => ({
    id: i.product.id,
    quantity: i.quantity,
    price: i.product.price,
    mrp: i.product.mrp,
    name: i.product.name,
    unit: i.product.unit
  }));

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  let discount = 0;
  if (state.coupon) {
    discount = state.coupon.type === 'percent' 
      ? Math.round((subtotal * state.coupon.value) / 100) 
      : state.coupon.value;
  }

  const payload = {
    customer: { name, phone, address, landmark, pincode },
    items,
    paymentMethod,
    deliverySlot,
    note,
    promoCode: state.coupon ? state.coupon.code : null,
    discountAmount: discount
  };

  try {
    const submitBtn = document.getElementById('confirm-order-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Placing Order...`;

    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>Confirm Order</span><span id="confirm-total-badge">₹0</span>`;

    if (data.success) {
      closeCheckout();
      showOrderSuccess(data.data);
      // Clear Cart
      state.cart = {};
      state.coupon = null;
      saveCart();
      updateCartUI();
      renderProducts(state.products); // reset buttons
    } else {
      alert(`Order error: ${data.message}`);
    }
  } catch (err) {
    console.error('Order submission failed:', err);
    alert('Failed to place order. Please check server status.');
  }
}

function showOrderSuccess(order) {
  orderReceiptContent.innerHTML = `
    <div class="receipt-row"><strong>Order ID:</strong> <span>${order.orderId}</span></div>
    <div class="receipt-row"><strong>Customer:</strong> <span>${order.customer.name} (${order.customer.phone})</span></div>
    <div class="receipt-row"><strong>Address:</strong> <span>${order.customer.address}</span></div>
    <div class="receipt-row"><strong>Delivery Slot:</strong> <span>${order.deliverySlot}</span></div>
    <div class="receipt-row"><strong>Payment:</strong> <span>${order.paymentMethod}</span></div>
    <hr style="margin: 0.65rem 0; border: none; border-top: 1px dashed #cbd5e1;">
    <div class="receipt-row"><strong>Total Items:</strong> <span>${order.items.length} products</span></div>
    <div class="receipt-row"><strong>Grand Total:</strong> <span style="font-size: 1.1rem; font-weight: 800; color: #047857;">₹${order.pricing.grandTotal}</span></div>
  `;

  if (order.whatsappUrl) {
    waShareOrderBtn.href = order.whatsappUrl;
  }

  orderSuccessModal.classList.add('active');
}

function closeOrderSuccessModal() {
  orderSuccessModal.classList.remove('active');
}

// ======================== PRODUCT QUICK VIEW MODAL ========================

async function openProductQuickView(productId) {
  try {
    const res = await fetch(`${API_BASE}/api/products/${productId}`);
    const data = await res.json();
    if (!data.success) return;

    const p = data.data;
    const body = document.getElementById('product-modal-body');
    const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

    body.innerHTML = `
      <div>
        <img src="${p.image}" alt="${p.name}" class="modal-product-img">
      </div>
      <div class="modal-product-info">
        <span class="card-pill">${p.brand || 'Gajbhiye Select'}</span>
        <h3>${p.name}</h3>
        <div class="modal-product-marathi">${p.marathiName || ''}</div>
        
        <div class="modal-pricing">
          <span class="modal-price">₹${p.price}</span>
          ${p.mrp > p.price ? `<span class="mrp-price">MRP ₹${p.mrp}</span>` : ''}
          ${discount > 0 ? `<span class="product-badge badge-green">${discount}% OFF</span>` : ''}
        </div>

        <p class="modal-desc">${p.description}</p>
        
        <div style="margin-bottom: 1rem; font-size: 0.85rem; color: #475569;">
          <div><i class="fa-solid fa-weight-scale" style="color: var(--primary);"></i> <strong>Pack Size:</strong> ${p.unit}</div>
          <div><i class="fa-solid fa-certificate" style="color: var(--secondary);"></i> <strong>Quality:</strong> 100% Genuine & Adulteration-Free</div>
          <div><i class="fa-solid fa-truck" style="color: var(--primary);"></i> <strong>Delivery:</strong> Express in 30 mins</div>
        </div>

        <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="addToCart('${p.id}'); closeProductModal();">
          <i class="fa-solid fa-cart-plus"></i> Add to Basket (₹${p.price})
        </button>
      </div>
    `;

    document.getElementById('product-quick-view').classList.add('active');
  } catch (err) {
    console.error('Failed to open product modal:', err);
  }
}

function closeProductModal() {
  document.getElementById('product-quick-view').classList.remove('active');
}

// ======================== ADMIN / ADD PRODUCT ========================

function openAdminModal() {
  adminModal.classList.add('active');
}

function closeAdminModal() {
  adminModal.classList.remove('active');
}

async function handleAddProduct(e) {
  e.preventDefault();

  const newProduct = {
    name: document.getElementById('new-p-name').value.trim(),
    marathiName: document.getElementById('new-p-marathi').value.trim(),
    category: document.getElementById('new-p-category').value,
    section: document.getElementById('new-p-section').value,
    price: Number(document.getElementById('new-p-price').value),
    mrp: Number(document.getElementById('new-p-mrp').value),
    unit: document.getElementById('new-p-unit').value.trim(),
    brand: document.getElementById('new-p-brand').value.trim() || 'Gajbhiye Select',
    badge: document.getElementById('new-p-badge').value.trim() || 'Fresh Arrival',
    image: document.getElementById('new-p-image').value.trim(),
    description: document.getElementById('new-p-desc').value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });

    const data = await res.json();
    if (data.success) {
      showToast(`Added '${newProduct.name}' to store catalog!`, 'success');
      closeAdminModal();
      addProductForm.reset();
      fetchCategories();
      fetchSections();
      fetchProducts();
    } else {
      alert(`Error: ${data.message}`);
    }
  } catch (err) {
    console.error('Error adding product:', err);
    alert('Failed to save product to backend server.');
  }
}

// ======================== TOAST ALERTS ========================

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? 'fa-circle-check' : type === 'info' ? 'fa-circle-info' : 'fa-circle-exclamation';
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

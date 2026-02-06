// --- CONFIG & STATE ---
let cart = [];
let currentUser = JSON.parse(localStorage.getItem('dpizza_profile')) || null;
let appliedCoupon = null;
let currentMenu = [];

// --- DOM ELEMENTS ---
const menuGrid = document.getElementById('menuGrid');
const cartFab = document.getElementById('cartFab');
const fabCount = document.getElementById('fabCount');
const fabTotal = document.getElementById('fabTotal');
const cartOverlay = document.getElementById('cartOverlay');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const checkoutView = document.getElementById('checkoutView');
const successView = document.getElementById('successView');
const profileView = document.getElementById('profileView');
const trackingView = document.getElementById('trackingView');
const profileBtn = document.getElementById('profileBtn');
const orderForm = document.getElementById('orderForm');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    loadMenuFromStorage();
    checkProfile();
    setupEventListeners();
});

function loadMenuFromStorage() {
    currentMenu = JSON.parse(localStorage.getItem('dpizza_menu')) || [];
    if (currentMenu.length === 0) {
        // Fallback or wait for admin to add items
        menuGrid.innerHTML = '<p class="text-muted">No items in menu yet.</p>';
    } else {
        renderMenu('all');
    }
}

function setupEventListeners() {
    document.querySelectorAll('.cat-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelector('.cat-chip.active').classList.remove('active');
            chip.classList.add('active');
            renderMenu(chip.dataset.category);
        });
    });

    cartFab.addEventListener('click', () => cartOverlay.classList.remove('hidden'));
    document.getElementById('closeCart').addEventListener('click', () => cartOverlay.classList.add('hidden'));

    document.getElementById('checkoutBtn').addEventListener('click', () => {
        cartOverlay.classList.add('hidden');
        checkoutView.classList.remove('hidden');
        if (currentUser) {
            document.getElementById('userName').value = currentUser.name;
            document.getElementById('userPhone').value = currentUser.phone;
            document.getElementById('userAddress').value = currentUser.address;
            document.getElementById('userLandmark').value = currentUser.landmark;
        }
    });

    orderForm.addEventListener('submit', handleOrderSubmit);
    profileBtn.addEventListener('click', showProfile);

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            checkoutView.classList.add('hidden');
            profileView.classList.add('hidden');
            trackingView.classList.add('hidden');
        });
    });

    document.getElementById('homeBtn').addEventListener('click', () => {
        successView.classList.add('hidden');
        cart = [];
        appliedCoupon = null;
        updateCartUI();
    });
}

// --- MENU & DETAIL ---
function renderMenu(category) {
    menuGrid.innerHTML = '';
    const filtered = category === 'all' ? currentMenu : currentMenu.filter(i => i.category === category);

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.onclick = () => showProductDetail(item.id);
        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="menu-img">
            <div class="menu-info">
                <div class="menu-top">
                    <h3>${item.name}</h3>
                    <span class="badge ${item.category}">${item.category}</span>
                </div>
                <p class="menu-desc">${item.desc}</p>
                <div class="menu-action">
                    <span class="price">₹${item.price}</span>
                    <button class="add-btn" onclick="event.stopPropagation(); addToCart(${item.id})">Add +</button>
                </div>
            </div>
        `;
        menuGrid.appendChild(card);
    });
}

window.showProductDetail = (id) => {
    const item = currentMenu.find(i => i.id === id);
    if (!item) return;

    document.getElementById('detailImg').src = item.image;
    document.getElementById('detailName').innerText = item.name;
    document.getElementById('detailDesc').innerText = item.desc;
    document.getElementById('detailPrice').innerText = `₹${item.price}`;
    document.getElementById('detailBadge').innerText = item.category;
    document.getElementById('detailBadge').className = `badge ${item.category}`;

    const addBtn = document.getElementById('detailAddBtn');
    addBtn.onclick = () => {
        addToCart(item.id);
        hideProductDetail();
    };

    document.getElementById('productDetailModal').classList.remove('hidden');
};

window.hideProductDetail = () => {
    document.getElementById('productDetailModal').classList.add('hidden');
};

// --- CART & COUPONS ---
window.addToCart = (id) => {
    const item = currentMenu.find(i => i.id === id);
    const existing = cart.find(i => i.id === id);
    if (existing) { existing.quantity++; } else { cart.push({ ...item, quantity: 1 }); }
    updateCartUI();
};

window.updateQty = (id, change) => {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
    }
    updateCartUI();
};

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;

    if (appliedCoupon) {
        discount = Math.floor(subtotal * (appliedCoupon.discount / 100));
    }

    const total = subtotal - discount;

    if (count > 0) {
        cartFab.classList.remove('hidden');
        fabCount.innerText = count;
        fabTotal.innerText = `₹${total}`;
    } else {
        cartFab.classList.add('hidden');
    }

    cartItemsContainer.innerHTML = '';
    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>₹${item.price}</p>
            </div>
            <div class="qty-controls">
                <button onclick="updateQty(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQty(${item.id}, 1)">+</button>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    });

    cartTotalEl.innerHTML = appliedCoupon
        ? `<span style="text-decoration: line-through; color: #999; font-size: 1rem;">₹${subtotal}</span> ₹${total}`
        : `₹${total}`;
}

window.applyCoupon = () => {
    const code = document.getElementById('couponInput').value.toUpperCase();
    const coupons = JSON.parse(localStorage.getItem('dpizza_coupons')) || [];
    const found = coupons.find(c => c.code === code && c.active);
    const msg = document.getElementById('couponMsg');

    if (found) {
        appliedCoupon = found;
        msg.innerText = `Success! ${found.discount}% off applied.`;
        msg.style.color = "green";
        updateCartUI();
    } else {
        appliedCoupon = null;
        msg.innerText = "Invalid or expired coupon.";
        msg.style.color = "red";
        updateCartUI();
    }
};

// --- ORDER SUBMIT ---
async function handleOrderSubmit(e) {
    e.preventDefault();
    const formData = new FormData(orderForm);
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = appliedCoupon ? Math.floor(subtotal * (appliedCoupon.discount / 100)) : 0;

    const orderId = 'ORD' + Math.floor(Math.random() * 1000000);
    const orderData = {
        id: orderId,
        name: formData.get('name'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        landmark: formData.get('landmark'),
        payment: formData.get('payment'),
        items: cart,
        subtotal: subtotal,
        discount: discount,
        total: subtotal - discount,
        couponUsed: appliedCoupon ? appliedCoupon.code : null,
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    // Save profile
    localStorage.setItem('dpizza_profile', JSON.stringify({
        name: orderData.name, phone: orderData.phone, address: orderData.address, landmark: orderData.landmark
    }));
    currentUser = orderData;

    // Save history
    let history = JSON.parse(localStorage.getItem('dpizza_history')) || [];
    history.push(orderData);
    localStorage.setItem('dpizza_history', JSON.stringify(history));
    localStorage.setItem('last_order_id', orderId);

    document.getElementById('successOrderId').innerText = `#${orderId}`;
    checkoutView.classList.add('hidden');
    successView.classList.remove('hidden');
    checkProfile();
}

// --- TRACKING ---
window.trackOrder = (orderId) => {
    if (orderId === 'current') orderId = localStorage.getItem('last_order_id');

    const history = JSON.parse(localStorage.getItem('dpizza_history')) || [];
    const order = history.find(o => o.id === orderId);

    if (!order) {
        alert("Order details not found.");
        return;
    }

    document.getElementById('trackOrderId').innerText = `#${order.id}`;
    const badge = document.getElementById('trackStatusBadge');
    badge.innerText = order.status;
    badge.className = `status-badge status-${order.status}`;

    // Update Steps
    const statusMap = { 'pending': 1, 'preparing': 2, 'dispatched': 3, 'delivered': 4, 'cancelled': 0 };
    const currentStep = statusMap[order.status] || 1;

    document.querySelectorAll('.step').forEach((el, idx) => {
        el.classList.remove('active', 'completed');
        if (idx + 1 < currentStep) el.classList.add('completed');
        if (idx + 1 === currentStep) el.classList.add('active');
    });

    // Update Items
    const trackList = document.getElementById('trackItemsList');
    trackList.innerHTML = order.items.map(i => `
        <div class="track-item-row">
            <span>${i.name} x${i.quantity}</span>
            <span>₹${i.price * i.quantity}</span>
        </div>
    `).join('');

    successView.classList.add('hidden');
    profileView.classList.add('hidden');
    trackingView.classList.remove('hidden');
};

window.hideTracking = () => trackingView.classList.add('hidden');

// --- PROFILE ---
function checkProfile() {
    if (currentUser) profileBtn.classList.remove('hidden');
}

function showProfile() {
    if (!currentUser) return;
    document.getElementById('profName').innerText = currentUser.name;
    document.getElementById('profPhone').innerText = currentUser.phone;
    document.getElementById('profAddress').innerText = `${currentUser.address}, Near ${currentUser.landmark}`;

    const history = JSON.parse(localStorage.getItem('dpizza_history')) || [];
    const historyList = document.getElementById('orderHistory');
    historyList.innerHTML = '';

    if (history.length === 0) {
        historyList.innerHTML = '<p class="text-muted">No orders yet.</p>';
    } else {
        [...history].reverse().forEach(order => {
            const div = document.createElement('div');
            div.className = 'history-card';
            div.style = 'background: white; padding: 1rem; border-radius: 12px; margin-bottom: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05);';
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <strong>Order ${order.id}</strong>
                    <span style="color: var(--primary); font-weight: 700;">₹${order.total}</span>
                </div>
                <p style="font-size: 0.8rem; color: #666;">Status: <span class="status-badge status-${order.status}">${order.status}</span></p>
                <div style="margin-top: 10px; display: flex; gap: 5px;">
                    <button class="secondary-btn" style="padding: 5px 10px; font-size: 0.7rem;" onclick="trackOrder('${order.id}')">Track</button>
                    <button class="primary-btn" style="padding: 5px 10px; font-size: 0.7rem;" onclick="reorder(${JSON.stringify(order.items).replace(/"/g, '&quot;')})">Reorder</button>
                </div>
            `;
            historyList.appendChild(div);
        });
    }
    profileView.classList.remove('hidden');
}

window.reorder = (items) => {
    cart = [...items];
    profileView.classList.add('hidden');
    updateCartUI();
    cartOverlay.classList.remove('hidden');
};

// --- PIZZA DATA ---
const MENU_ITEMS = [
    { id: 1, name: 'Margherita', category: 'veg', price: 299, desc: 'Classic delight with 100% real mozzarella cheese', image: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?auto=format&fit=crop&w=500&q=80' },
    { id: 2, name: 'Farmhouse', category: 'veg', price: 449, desc: 'Delightful combination of onion, capsicum, tomato & mushroom', image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=500&q=80' },
    { id: 3, name: 'Pepper BBQ Chicken', category: 'non-veg', price: 599, desc: 'Pepper barbecue chicken for that extra zing', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80' },
    { id: 4, name: 'Non Veg Supreme', category: 'non-veg', price: 649, desc: 'Bite into supreme delight of Black Olives, Onions, Grilled Chicken', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80' },
    { id: 5, name: 'Garlic Breadsticks', category: 'sides', price: 149, desc: 'Baked to perfection with garlic butter and herbs', image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=500&q=80' },
    { id: 6, name: 'Choco Lava Cake', category: 'sides', price: 109, desc: 'Chocolate lovers delight! Indulgent, divine, gooey', image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=500&q=80' }
];

// --- APP STATE ---
let cart = [];
let currentUser = JSON.parse(localStorage.getItem('dpizza_profile')) || null;

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
const profileBtn = document.getElementById('profileBtn');
const orderForm = document.getElementById('orderForm');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    renderMenu('all');
    checkProfile();
    setupEventListeners();
});

function setupEventListeners() {
    // Category filtering
    document.querySelectorAll('.cat-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelector('.cat-chip.active').classList.remove('active');
            chip.classList.add('active');
            renderMenu(chip.dataset.category);
        });
    });

    // Cart FAB click
    cartFab.addEventListener('click', openCart);

    // Close Cart
    document.getElementById('closeCart').addEventListener('click', () => {
        cartOverlay.classList.add('hidden');
    });

    // Proceed to Checkout
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        cartOverlay.classList.add('hidden');
        checkoutView.classList.remove('hidden');
        // Pre-fill form if user exists
        if (currentUser) {
            document.getElementById('userName').value = currentUser.name;
            document.getElementById('userPhone').value = currentUser.phone;
            document.getElementById('userAddress').value = currentUser.address;
            document.getElementById('userLandmark').value = currentUser.landmark;
        }
    });

    // Order Form Submit
    orderForm.addEventListener('submit', handleOrderSubmit);

    // Profile Button
    profileBtn.addEventListener('click', showProfile);

    // Back Buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            checkoutView.classList.add('hidden');
            profileView.classList.add('hidden');
        });
    });

    // Home Button on Success
    document.getElementById('homeBtn').addEventListener('click', () => {
        successView.classList.add('hidden');
        cart = [];
        updateCartUI();
    });
}

// --- RENDER FUNCTIONS ---
function renderMenu(category) {
    menuGrid.innerHTML = '';
    const filtered = category === 'all' ? MENU_ITEMS : MENU_ITEMS.filter(i => i.category === category);
    
    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-card';
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
                    <button class="add-btn" onclick="addToCart(${item.id})">Add +</button>
                </div>
            </div>
        `;
        menuGrid.appendChild(card);
    });
}

function updateCartUI() {
    // Update FAB
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (count > 0) {
        cartFab.classList.remove('hidden');
        fabCount.innerText = count;
        fabTotal.innerText = `₹${total}`;
    } else {
        cartFab.classList.add('hidden');
    }

    // Update Overlay
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
    cartTotalEl.innerText = `₹${total}`;
}

// --- CORE LOGIC ---
window.addToCart = (id) => {
    const item = MENU_ITEMS.find(i => i.id === id);
    const existing = cart.find(i => i.id === id);
    
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    
    // Simple haptic-like feedback or animation would go here
    updateCartUI();
};

window.updateQty = (id, change) => {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
    }
    updateCartUI();
};

function openCart() {
    cartOverlay.classList.remove('hidden');
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    const formData = new FormData(orderForm);
    const orderData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        landmark: formData.get('landmark'),
        payment: formData.get('payment'),
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    // 1. Auto-save profile
    const profile = {
        name: orderData.name,
        phone: orderData.phone,
        address: orderData.address,
        landmark: orderData.landmark
    };
    localStorage.setItem('dpizza_profile', JSON.stringify(profile));
    currentUser = profile;

    // 2. Simulate API Call / Save to Firestore
    console.log('Placing Order:', orderData);
    
    // In a real app, you'd use: 
    // const docRef = await addDoc(collection(db, "orders"), orderData);
    const orderId = 'ORD' + Math.floor(Math.random() * 1000000);

    // Save order to history (locally for now, should be from Firestore)
    let history = JSON.parse(localStorage.getItem('dpizza_history')) || [];
    history.push({ ...orderData, id: orderId });
    localStorage.setItem('dpizza_history', JSON.stringify(history));

    // 3. Show Success
    document.getElementById('successOrderId').innerText = `#${orderId}`;
    checkoutView.classList.add('hidden');
    successView.classList.remove('hidden');
    checkProfile();
}

function checkProfile() {
    if (currentUser) {
        profileBtn.classList.remove('hidden');
    }
}

function showProfile() {
    if (!currentUser) return;
    
    document.getElementById('profName').innerText = currentUser.name;
    document.getElementById('profPhone').innerText = currentUser.phone;
    document.getElementById('profAddress').innerText = `${currentUser.address}, Near ${currentUser.landmark}`;
    
    // Load history
    const history = JSON.parse(localStorage.getItem('dpizza_history')) || [];
    const historyList = document.getElementById('orderHistory');
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="text-muted">No orders yet.</p>';
    } else {
        history.reverse().forEach(order => {
            const div = document.createElement('div');
            div.className = 'history-card';
            div.style = 'background: white; padding: 1rem; border-radius: 12px; margin-bottom: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05);';
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <strong>Order ${order.id}</strong>
                    <span style="color: var(--primary); font-weight: 700;">₹${order.total}</span>
                </div>
                <p style="font-size: 0.8rem; color: #666;">${new Date(order.timestamp).toLocaleDateString()}</p>
                <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${order.items.map(i => `<span style="background: #eee; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem;">${i.name} x${i.quantity}</span>`).join('')}
                </div>
                <button class="primary-btn mt-2" style="padding: 0.5rem 1rem; font-size: 0.8rem;" onclick="reorder(${JSON.stringify(order.items).replace(/"/g, '&quot;')})">One-Tap Reorder</button>
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
    openCart();
};

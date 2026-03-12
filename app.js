/**
 * HIDDEN OVEN - Core Application Script
 * Author: Antigravity
 */

// --- Data Seeding & State ---
const DEFAULT_PRODUCTS = [
    { id: 1, name: 'Midnight Cookie', category: 'Cookies', desc: 'Deep dark chocolate with chunks of bliss.', price: 85, stock: 20, img: 'assets/midnight-cookie.png', status: 'available', preorder_enabled: true, min_prep_hours: 2 },
    { id: 2, name: 'Lava Cookie', category: 'Cookies', desc: 'Warm cookie with flowing chocolate core.', price: 95, stock: 15, img: 'assets/lava-cookie.png', status: 'available', preorder_enabled: true, min_prep_hours: 2 },
    { id: 3, name: 'Sea Salt Dark', category: 'Cookies', desc: 'Perfect balance of sweet and savory.', price: 90, stock: 12, img: 'assets/sea-salt.png', status: 'available', preorder_enabled: true, min_prep_hours: 2 },
    { id: 4, name: 'Soft Mood Cookie', category: 'Cookies', desc: 'Extra soft, melt-in-your-mouth texture.', price: 85, stock: 10, img: 'assets/soft-mood.png', status: 'available', preorder_enabled: true, min_prep_hours: 2 },
    { id: 5, name: 'Study Break', category: 'Cookies', desc: 'Designed for high-focus snacking.', price: 85, stock: 5, img: 'assets/study-break.png', status: 'available', preorder_enabled: true, min_prep_hours: 2 },
    { id: 6, name: 'Fudgy Dark Brownie', category: 'Brownies', desc: 'Dense, rich, and intensely chocolate.', price: 120, stock: 10, img: 'assets/fudgy-brownie.png', status: 'available', preorder_enabled: true, min_prep_hours: 2 },
    { id: 7, name: 'Midnight Cube', category: 'Brownies', desc: 'Bite-sized cubes of fudgy brownie.', price: 110, stock: 18, img: 'assets/brownie-cube.png', status: 'available', preorder_enabled: true, min_prep_hours: 2 },
    { id: 8, name: 'Melted Brownie', category: 'Brownies', desc: 'Baked to perfection with a gooey center.', price: 125, stock: 0, img: 'assets/melted-brownie.png', status: 'out_of_stock', preorder_enabled: true, min_prep_hours: 2 },
    { id: 9, name: 'Cocoa Dream', category: 'Brownies', desc: 'Deep cocoa powder for ultimate richness.', price: 115, stock: 8, img: 'assets/cocoa-dream.png', status: 'available', preorder_enabled: true, min_prep_hours: 2 },
    { id: 10, name: 'Soft Chocolate', category: 'Cakes', desc: 'Fluffy sponge cake with cocoa glaze.', price: 160, stock: 6, img: 'assets/choc-cake.png', status: 'available', preorder_enabled: true, min_prep_hours: 24 },
    { id: 11, name: 'Banana Comfort', category: 'Cakes', desc: 'Banana cake with chocolate swirls.', price: 140, stock: 4, img: 'assets/banana-cake.png', status: 'available', preorder_enabled: true, min_prep_hours: 24 },
    { id: 12, name: 'Dark Cocoa Cake', category: 'Cakes', desc: 'Three-layer dark chocolate decadence.', price: 165, stock: 0, img: 'assets/cocoa-cake.png', status: 'out_of_stock', preorder_enabled: true, min_prep_hours: 24 },
    { id: 13, name: 'Midnight Box', category: 'Signature', desc: 'Curated mix of cookies & brownies.', price: 450, stock: 3, img: 'assets/midnight-box.png', status: 'available', preorder_enabled: true, min_prep_hours: 4 },
    { id: 14, name: 'Cookie Therapy', category: 'Signature', desc: 'Our top 5 cookies in one aesthetic box.', price: 380, stock: 5, img: 'assets/therapy-box.png', status: 'available', preorder_enabled: true, min_prep_hours: 4 },
    { id: 15, name: 'Study Night Set', category: 'Signature', desc: 'Dessert + drink set (mock).', price: 320, stock: 10, img: 'assets/study-set.png', status: 'available', preorder_enabled: true, min_prep_hours: 4 }
];

const DEFAULT_WEBHOOKS = [
    {
        id: 'WH-LINE-DEFAULT',
        url: 'https://script.google.com/macros/s/AKfycby26SNfF5EMI4RLfqc0BKFJAzw1_rWO82wCwSZfkxeMvtuIWwEQyyIGqT7VhCINbRIk/exec',
        secret: '',
        events: ['order_created'],
        status: 'active'
    }
];

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyDTWTV5e4MpaoYVQrX7rf09LtnVorG8sa8",
    authDomain: "hidden-oven.firebaseapp.com",
    databaseURL: "https://hidden-oven-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "hidden-oven",
    storageBucket: "hidden-oven.firebasestorage.app",
    messagingSenderId: "588100773803",
    appId: "1:588100773803:web:3650aa4464c4e3147c94ee",
    measurementId: "G-FS4FP1K6DM"
};

// Initialize Firebase (Compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();
const ROOT = 'hidden-oven';

// --- Globals & State ---
let products = [];
let orders = [];
let webhooks = [];
let cart = (JSON.parse(localStorage.getItem('ho_cart')) || []).filter(i => i && i.name); // Filter out corrupted items

// --- Firebase Realtime Database Sync & Listeners ---
function initDataSync() {
    // Sync Products
    db.ref(`${ROOT}/products`).on('value', snapshot => {
        const val = snapshot.val() || {};
        products = Object.entries(val).map(([id, data]) => ({ id, ...data }));
        if (products.length === 0) {
            console.log("Initializing products...");
            const initialProducts = JSON.parse(localStorage.getItem('ho_products')) || DEFAULT_PRODUCTS;
            initialProducts.forEach(p => {
                const { id, ...data } = p;
                db.ref(`${ROOT}/products/${id}`).set(data);
            });
        }
        const currentView = window.currentView || 'home';
        if (currentView === 'home' || currentView === 'menu' || currentView === 'admin-products') navigateTo(currentView);
    });

    // Sync Orders
    db.ref(`${ROOT}/orders`).on('value', snapshot => {
        const val = snapshot.val() || {};
        orders = Object.entries(val)
            .map(([docId, data]) => ({ docId, ...data }))
            .sort((a, b) => new Date(b.time) - new Date(a.time));
        const currentView = window.currentView || 'home';
        if (currentView === 'admin-orders' || currentView === 'admin') navigateTo(currentView);
    });

    // Sync Webhooks
    db.ref(`${ROOT}/webhooks`).on('value', snapshot => {
        const val = snapshot.val() || {};
        webhooks = Object.entries(val).map(([docId, data]) => ({ docId, ...data }));
        // Seed default webhook if none exist
        if (webhooks.length === 0) {
            DEFAULT_WEBHOOKS.forEach(w => {
                const { id, ...data } = w;
                db.ref(`${ROOT}/webhooks/${id}`).set(data);
            });
        }
        const view = window.currentView || 'home';
        if (view === 'admin-webhooks') renderAdminWebhooks();
    });
}

function saveCart() {
    localStorage.setItem('ho_cart', JSON.stringify(cart));
}

async function saveProductToFirebase(p) {
    const { id, ...data } = p;
    await db.ref(`${ROOT}/products/${id}`).set(data);
    showToast("Product saved to Cloud");
}

// --- Webhook Dispatcher ---
async function triggerWebhook(event, data) {
    const activeWebhooks = webhooks.filter(w => w.status === 'active' && w.events.includes(event));

    if (activeWebhooks.length === 0) {
        console.warn(`[Webhook] No active webhooks for event: ${event}`);
        return;
    }

    for (const hook of activeWebhooks) {
        try {
            console.log(`[Webhook] Dispatching ${event} to ${hook.url}`);

            // Format data for GAS (gas_line_bot.js expects flat fields)
            let payload = {
                event: event,
                timestamp: new Date().toISOString(),
                ...data
            };

            if (event === 'order_created' || event === 'payment_confirmed') {
                const isPreorder = data.orderType === 'preorder';
                payload = {
                    ...payload,
                    order_id: data.id || data.order_id,
                    customer_name: isPreorder ? `[Pre-order] ${data.customerName}` : data.customerName,
                    customer_phone: data.phone,
                    customer_address: data.address || '-',
                    order_items: data.items ? data.items.map(i => `${i.name} x ${i.qty}`).join('\n') : '-',
                    customer_note: data.note || '-',
                    pickup_time: isPreorder ? `📅 ${data.pickupDate} | ⏰ ${data.pickupTime}` : '🚀 สั่งตอนนี้ (ASAP)',
                    total_price: data.total,
                    order_type: data.orderType,
                    fulfillment_type: data.type,
                    slip_base64: data.slip_base64,
                    mime_type: data.mime_type
                };
            }

            const response = await fetch(hook.url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log(`[Webhook] Sent successfully`);
        } catch (err) {
            console.error(`[Webhook] Failed to dispatch:`, err);
        }
    }
}

if (!localStorage.getItem('ho_cart')) saveCart();

// Initialize Sync
initDataSync();

// --- Routing & Navigation ---
function navigateTo(view, params = {}) {
    window.currentView = view; // Current view tracking for reactive updates
    window.scrollTo(0, 0);
    const container = document.getElementById('view-container');
    container.innerHTML = `<div class="fade-in">Loading...</div>`;

    setTimeout(() => {
        switch (view) {
            case 'home': renderHome(); break;
            case 'menu': renderMenu(params.category || 'All'); break;
            case 'cart': renderCart(); break;
            case 'checkout': renderCheckout(); break;
            case 'success': renderSuccess(params.orderId); break;
            case 'admin-login': renderAdminLogin(); break;
            case 'admin': renderAdminDashboard(); break;
            case 'admin-products': renderAdminProducts(); break;
            case 'admin-orders': renderAdminOrders(); break;
            case 'admin-webhooks': renderAdminWebhooks(); break;
        }
    }, 100);
}

// --- Views: Customer ---
function renderHome() {
    document.getElementById('view-container').innerHTML = `
        <section class="hero fade-in">
            <h1>Hidden Oven</h1>
            <p>A quiet corner for your midnight chocolate cravings.</p>
            <p style="font-size: 0.8rem; margin-top: 10px; opacity: 0.8; letter-spacing: 2px;">PRESENT BY VVKK</p>
            <button class="btn btn-gold" onclick="navigateTo('menu')">View Menu</button>
        </section>
        <section class="page-container fade-in">
            <div class="section-title">
                <h2>Midnight Favorites</h2>
            </div>
            <div class="product-grid">
                ${renderProductCards(products.filter(p => p.category === 'Signature').concat(products.filter(p => p.category !== 'Signature')).slice(0, 4))}
            </div>
        </section>
    `;
}

function renderMenu(activeCat = 'All') {
    const cats = ['All', 'Signature', 'Cookies', 'Brownies', 'Cakes'];
    const filtered = activeCat === 'All' ? products : products.filter(p => p.category === activeCat);

    document.getElementById('view-container').innerHTML = `
        <div class="section-title">
            <h2>The Menu</h2>
        </div>
        <div class="menu-categories">
            ${cats.map(c => `
                <div class="cat-chip ${activeCat === c ? 'active' : ''}" onclick="navigateTo('menu', {category: '${c}'})">${c}</div>
            `).join('')}
        </div>
        <div class="product-grid fade-in">
            ${renderProductCards(filtered)}
        </div>
    `;
}

function renderProductCards(items) {
    return items.map(p => {
        const isOut = p.status === 'out_of_stock' || p.stock <= 0;
        return `
            <div class="product-card ${isOut ? 'out-of-stock' : ''}">
                ${isOut ? `<div class="sold-out-badge">SOLD OUT</div>` : ''}
                <img src="${p.img || ''}" class="p-img" onerror="this.src='https://placehold.co/400x300/1c1311/f5ebe0?text=${p.name || 'Product'}'">
                <div class="p-content">
                    <h3>${p.name || 'Loading...'}</h3>
                    <p class="p-desc">${p.desc || ''}</p>
                    <div class="p-footer">
                        <span class="p-price">฿${p.price || 0}</span>
                        <p style="font-size:0.7rem; color:var(--text-muted)">Stock: ${p.stock}</p>
                        <button class="btn-add" onclick="updateCart('${p.id}', 1)" ${isOut ? 'disabled' : ''}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderCart() {
    if (cart.length === 0) {
        document.getElementById('view-container').innerHTML = `
            <div class="page-container fade-in" style="text-align:center; padding-top:100px;">
                <h2>Your cart is empty</h2>
                <p style="margin:20px 0 40px; color:var(--text-muted)">Why not explore our midnight selection?</p>
                <button class="btn btn-gold" onclick="navigateTo('menu')">Go to Menu</button>
            </div>
        `;
        return;
    }

    const total = cart.reduce((a, b) => a + (b.price * b.qty), 0);

    document.getElementById('view-container').innerHTML = `
        <div class="page-container fade-in">
            <h2 style="margin-bottom:30px; color:var(--gold);">Your Cart</h2>
            <div class="cart-list">
                ${cart.map(item => `
                    <div class="cart-item">
                        <img src="${item.img || ''}" class="ci-img" onerror="this.src='https://placehold.co/80x80/1c1311/f5ebe0?text=${item.name || 'Item'}'">
                        <div class="ci-info">
                            <h4>${item.name || 'Item'}</h4>
                            <p>฿${item.price || 0}</p>
                        </div>
                        <div class="ci-qty">
                            <button class="qty-btn" onclick="updateCart('${item.id}', -1)">-</button>
                            <span>${item.qty}</span>
                            <button class="qty-btn" onclick="updateCart('${item.id}', 1)">+</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;">
                <span style="font-size:1.4rem; font-weight:700;">Total</span>
                <span style="font-size:1.8rem; font-weight:800; color:var(--gold);">฿${total}</span>
            </div>
            <button class="btn btn-gold" style="width:100%" onclick="navigateTo('checkout')">Proceed to Checkout</button>
        </div>
    `;
}

function renderCheckout() {
    const total = cart.reduce((a, b) => a + (b.price * b.qty), 0);
    const today = new Date().toISOString().split('T')[0];

    document.getElementById('view-container').innerHTML = `
        <div class="page-container fade-in">
            <h2 style="margin-bottom:30px; color:var(--gold);">Checkout</h2>
            <div class="cart-list" style="padding:15px; margin-bottom:40px;">
                 <h4 style="margin-bottom:15px;">Summary</h4>
                 ${cart.map(i => `<div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:5px;"><span>${i.name} x ${i.qty}</span><span>฿${i.price * i.qty}</span></div>`).join('')}
                 <div style="border-top:1px solid rgba(255,255,255,0.05); margin-top:10px; padding-top:10px; display:flex; justify-content:space-between; font-weight:bold;">
                    <span>Order Total</span>
                    <span>฿${total}</span>
                 </div>
            </div>

            <form id="order-form" onsubmit="event.preventDefault(); processOrder();" style="margin-top:20px;">
                <div style="background:var(--bg-accent); padding:20px; border-radius:15px; margin-bottom:30px;">
                    <h4 style="margin-bottom:15px; color:var(--gold);">1. Customer Information</h4>
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" class="form-input" id="name" required placeholder="Jirayu Sukum">
                    </div>
                    <div class="form-group">
                        <label>Phone Number</label>
                        <input type="tel" class="form-input" id="phone" required placeholder="08x-xxx-xxxx">
                    </div>
                    <div class="form-group">
                        <label>Order Type</label>
                        <select class="form-input" id="order-type" onchange="togglePreorderFields()">
                            <option value="normal">Instant Order (Ready ASAP)</option>
                            <option value="preorder">Pre-Order (Schedule Pickup)</option>
                        </select>
                    </div>
                    
                    <div id="preorder-fields" style="display:none;">
                        <div class="form-group">
                            <label>Pickup Date</label>
                            <input type="date" class="form-input" id="pickup-date" min="${today}">
                        </div>
                        <div class="form-group">
                            <label>Pickup Time</label>
                            <select class="form-input" id="pickup-time">
                                <option value="10:00">10:00</option>
                                <option value="12:00">12:00</option>
                                <option value="14:00">14:00</option>
                                <option value="16:00">16:00</option>
                                <option value="18:00">18:00</option>
                                <option value="20:00">20:00</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Fulfillment Option</label>
                        <select id="fulfillment-type" class="form-input" onchange="toggleFulfillment()">
                            <option value="pickup">Self-Pickup at Shop</option>
                            <option value="delivery">Delivery (+฿40)</option>
                        </select>
                    </div>

                    <div id="address-group" class="form-group" style="display:none;">
                        <label>Delivery Address</label>
                        <textarea id="customer-address" class="form-input" placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด และจุดสังเกต..." style="height:80px;"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea class="form-input" id="note" style="height:80px;" placeholder="Optional details..."></textarea>
                    </div>
                </div>

                <div style="background:var(--bg-accent); padding:20px; border-radius:15px; margin-bottom:30px; border:1px solid rgba(212, 175, 55, 0.3);">
                    <h4 style="margin-bottom:15px; color:var(--gold);">2. Payment (Scan & Upload Slip)</h4>
                    <div style="text-align:center; margin-bottom:20px;">
                        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:10px;">ยอดรวมสุทธิ: <span id="checkout-total-display" style="color:white; font-size:1.5rem; font-weight:bold;">฿${total}</span></p>
                        
                        <div id="qr-container" style="background:white; padding:15px; border-radius:15px; display:inline-block; margin-bottom:15px;">
                            <img id="checkout-qr" src="https://promptpay.io/0842541549/${total}.png" alt="QR" style="width:200px; display:block;">
                        </div>
                        <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.4;">สแกนโอนเงินเข้าบัญชี <br><b>NANNAPOP PHETPRADAP</b></p>
                    </div>

                    <div class="form-group">
                        <label style="color:var(--gold);">แนบสลิปโอนเงิน (Required)</label>
                        <input type="file" id="slip-upload" class="form-control" accept="image/*" required style="padding:10px; background:rgba(255,255,255,0.05); border:1px dashed var(--gold); font-size:0.9rem; width:100%;">
                    </div>
                </div>

                <p id="validation-msg" style="color:var(--red); font-size:0.85rem; margin-bottom:15px; display:none;"></p>
                <button type="submit" class="btn btn-gold" style="width:100%; height:60px; font-size:1.1rem;">ยืนยันคำสั่งซื้อและแจ้งโอนเงิน ✅</button>
            </form>
        </div>
    `;
}

function togglePreorderFields() {
    const type = document.getElementById('order-type').value;
    document.getElementById('preorder-fields').style.display = type === 'preorder' ? 'block' : 'none';
    const dateInput = document.getElementById('pickup-date');
    if (type === 'preorder' && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

function toggleFulfillment() {
    const type = document.getElementById('fulfillment-type').value;
    const addressGroup = document.getElementById('address-group');
    if (type === 'delivery') {
        addressGroup.style.display = 'block';
        addressGroup.classList.add('fade-in');
    } else {
        addressGroup.style.display = 'none';
    }
    updateCheckoutTotal();
}

function updateCheckoutTotal() {
    const baseTotal = cart.reduce((a, b) => a + (b.price * b.qty), 0);
    const fulfillmentType = document.getElementById('fulfillment-type').value;
    const finalTotal = fulfillmentType === 'delivery' ? baseTotal + 40 : baseTotal;

    // Update display
    document.getElementById('checkout-total-display').innerText = `฿${finalTotal}`;

    // Update QR
    const promptPayId = "0842541549";
    document.getElementById('checkout-qr').src = `https://promptpay.io/${promptPayId}/${finalTotal}.png`;
}


function renderSuccess(orderId) {
    document.getElementById('view-container').innerHTML = `
        <div class="page-container fade-in" style="text-align:center; padding-top:80px;">
            <div style="color:var(--gold); font-size:5rem; margin-bottom:30px;">✓</div>
            <h1>Order Confirmed!</h1>
            <p style="color:var(--text-muted); margin:20px 0 40px;">We've received your request. Your desserts will be ready soon.</p>
            <button class="btn btn-gold" onclick="navigateTo('home')">Back to Home</button>
        </div>
    `;
}

// --- Logic: Cart & Orders ---
function updateCart(prodId, delta) {
    const prod = products.find(p => p.id == prodId); // Use == for string/number match
    const existing = cart.find(i => i.id == prodId);

    if (!prod && delta > 0) {
        showToast("Loading product data...");
        return;
    }

    if (existing) {
        existing.qty += delta;
        if (existing.qty > prod.stock && delta > 0) {
            showToast("Product stock limit reached");
            existing.qty = prod.stock;
            return;
        }
        if (existing.qty <= 0) {
            cart = cart.filter(i => i.id !== prodId);
        }
    } else if (delta > 0) {
        cart.push({ ...prod, qty: 1 });
    }

    saveCart();
    updateCartCount();
    // Refresh cart view if active
    const container = document.getElementById('view-container');
    if (container.querySelector('.cart-list')) renderCart();
}

function updateCartCount() {
    const total = cart.reduce((a, b) => a + b.qty, 0);
    const badge = document.getElementById('cart-count');
    badge.innerText = total;
    badge.style.transform = 'scale(1.2)';
    setTimeout(() => badge.style.transform = 'scale(1)', 200);
}

async function processOrder() {
    const slipFile = document.getElementById('slip-upload').files[0];
    if (!slipFile) {
        showValidation("โปรดแนบสลิปโอนเงินเพื่อยืนยันออเดอร์");
        return;
    }

    const btn = document.querySelector('#order-form button[type="submit"]');
    if (btn) {
        btn.disabled = true;
        btn.innerText = "กำลังประมวลผล...";
    }

    try {
        const orderType = document.getElementById('order-type').value;
        const fulfillmentType = document.getElementById('fulfillment-type').value;
        const pickupDate = document.getElementById('pickup-date').value;
        const pickupTime = document.getElementById('pickup-time').value;

        if (cart.length === 0) {
            showToast("ตะกร้าสินค้าว่างเปล่า!");
            if (btn) { btn.disabled = false; btn.innerText = "ยืนยันคำสั่งซื้อและแจ้งโอนเงิน ✅"; }
            return;
        }

        const baseTotal = cart.reduce((a, b) => a + (b.price * b.qty), 0);
        const finalTotal = fulfillmentType === 'delivery' ? baseTotal + 40 : baseTotal;

        const orderData = {
            id: 'HO-' + Date.now(),
            customerName: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            address: fulfillmentType === 'delivery' ? document.getElementById('customer-address').value : '',
            type: fulfillmentType,
            orderType: orderType,
            pickupDate: orderType === 'preorder' ? pickupDate : 'ASAP',
            pickupTime: orderType === 'preorder' ? pickupTime : 'ASAP',
            note: document.getElementById('note').value,
            items: [...cart],
            total: finalTotal,
            status: 'Paid', // Single step, so it starts as Paid
            time: new Date().toISOString()
        };

        if (orderData.type === 'delivery' && !orderData.address) {
            showValidation("โปรดระบุที่อยู่สำหรับการจัดส่ง");
            if (btn) { btn.disabled = false; btn.innerText = "ยืนยันคำสั่งซื้อและแจ้งโอนเงิน ✅"; }
            return;
        }

        // Read File and Compress for Webhook
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = async function () {
                // Resize to max 800px width/height for efficiency
                const MAX_WIDTH = 800;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_WIDTH) {
                        width *= MAX_WIDTH / height;
                        height = MAX_WIDTH;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
                console.log("[Debug] Slip compressed. New size:", Math.round(base64.length / 1024), "KB");

                // 1. Update Stock (RTDB multi-path update)
                const stockUpdates = {};
                for (const item of orderData.items) {
                    const p = products.find(prod => prod.id == item.id);
                    if (p) {
                        const newStock = Math.max(0, p.stock - item.qty);
                        const newStatus = newStock === 0 ? 'out_of_stock' : 'available';
                        stockUpdates[`${ROOT}/products/${p.id}/stock`] = newStock;
                        stockUpdates[`${ROOT}/products/${p.id}/status`] = newStatus;
                    }
                }
                await db.ref().update(stockUpdates);

                // 2. Save Order
                await db.ref(`${ROOT}/orders/${orderData.id}`).set(orderData);

                // 3. Webhook (Now with compressed image)
                triggerWebhook('order_created', {
                    ...orderData,
                    slip_base64: base64,
                    mime_type: 'image/jpeg'
                }).catch(e => console.error("Webhook error:", e));

                // 4. Cleanup & Navigate
                cart = [];
                saveCart();
                updateCartCount();
                showToast("สั่งซื้อสำเร็จ!");
                navigateTo('success', { orderId: orderData.id });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(slipFile);

    } catch (err) {
        console.error("Order process error:", err);
        alert("เกิดข้อผิดพลาด: " + err.message);
        if (btn) {
            btn.disabled = false;
            btn.innerText = "ยืนยันคำสั่งซื้อและแจ้งโอนเงิน ✅";
        }
    }
}

function showValidation(msg) {
    const el = document.getElementById('validation-msg');
    el.innerText = msg;
    el.style.display = 'block';
    el.classList.add('fade-in');
}

// --- Views: Admin ---
function renderAdminLogin() {
    document.getElementById('view-container').innerHTML = `
        <div class="page-container fade-in" style="max-width:400px; padding-top:100px;">
            <div style="text-align:center; margin-bottom:40px;">
                <h2 style="color:var(--gold);">Owner Access</h2>
                <p style="color:var(--text-muted);">Secure Login</p>
            </div>
            <form onsubmit="event.preventDefault(); authAdmin();">
                <div class="form-group">
                    <label>Security Code</label>
                    <input type="password" id="pass" class="form-input" required placeholder="••••••••">
                </div>
                <button type="submit" class="btn btn-gold" style="width:100%">Enter Dashboard</button>
            </form>
        </div>
    `;
}

function authAdmin() {
    const val = document.getElementById('pass').value;
    if (val === 'Vkpromma2547') {
        sessionStorage.setItem('ho_admin', 'true');
        navigateTo('admin');
    } else {
        showToast("Incorrect Code");
    }
}

function checkAdmin() {
    if (sessionStorage.getItem('ho_admin') !== 'true') {
        navigateTo('admin-login');
        return false;
    }
    return true;
}

function renderAdminDashboard() {
    if (!checkAdmin()) return;

    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.time.includes(today));
    const revenue = todayOrders.reduce((a, b) => a + b.total, 0);
    const pending = orders.filter(o => o.status === 'Pending').length;

    // Best Sellers Logic
    const itemMap = {};
    orders.forEach(o => o.items.forEach(i => {
        itemMap[i.name] = (itemMap[i.name] || 0) + i.qty;
    }));
    const bestSellers = Object.entries(itemMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    document.getElementById('view-container').innerHTML = `
        <div class="page-container fade-in" style="max-width:1100px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;">
                <h2 style="color:var(--gold);">Owner's Dashboard</h2>
                      <button class="btn" style="background:var(--green); color:black; padding:10px 15px;" onclick="testLineNotification()">Test LINE</button>
                      <button class="btn" style="background:var(--bg-accent); padding:10px 15px;" onclick="navigateTo('admin-products')">Menu</button>
                     <button class="btn" style="background:var(--bg-accent); padding:10px 15px;" onclick="navigateTo('admin-orders')">Orders</button>
                     <button class="btn" style="background:var(--bg-accent); padding:10px 15px;" onclick="navigateTo('admin-webhooks')">Webhooks</button>
                     <button class="btn" style="background:var(--bg-accent); padding:10px 15px;" onclick="showApiReference()">API</button>
                </div>
            </div>
            
            <div class="admin-grid">
                <div class="stat-card"><div class="stat-val">${todayOrders.length}</div><div class="stat-label">Orders Today</div></div>
                <div class="stat-card"><div class="stat-val">฿${revenue}</div><div class="stat-label">Revenue Today</div></div>
                <div class="stat-card"><div class="stat-val">${pending}</div><div class="stat-label">Pending Orders</div></div>
                <div class="stat-card">
                    <div style="color:var(--gold); font-weight:700;">Best Sellers</div>
                    <div style="font-size:0.8rem; color:var(--text-muted); margin-top:5px;">
                        ${bestSellers.map(s => `<div>${s[0]} (${s[1]})</div>`).join('') || 'No sales yet'}
                    </div>
                </div>
            </div>

            <div class="section-title" style="text-align:left; margin-top:60px;"><h3>Recent Activity</h3></div>
            <div class="admin-table-container">
                <table>
                    <thead>
                        <tr><th>Time</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        ${orders.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-muted)">Waiting for first order...</td></tr>' : ''}
                        ${orders.slice(0, 5).map(o => `
                            <tr>
                                <td>${new Date(o.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                <td>${o.customerName}</td>
                                <td style="font-size:0.8rem">${o.items.map(i => `${i.name}(${i.qty})`).join(', ')}</td>
                                <td style="color:var(--gold); font-weight:700;">฿${o.total}</td>
                                <td style="color:${o.status === 'Paid' ? 'var(--green)' : 'var(--gold)'}">${o.status}</td>
                                <td>
                                    <button class="icon-btn" style="color:var(--red); padding:5px; font-size:0.7rem;" onclick="deleteOrder('${o.docId}')">ลบ</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function testLineNotification() {
    const testData = {
        id: 'TEST-' + Date.now(),
        customerName: 'คุณ (ทดสอบระบบ)',
        phone: '08x-xxx-xxxx',
        total: 999,
        items: [{ name: 'คุกกี้ทดสอบ', qty: 1, price: 999 }],
        time: new Date().toISOString()
    };
    triggerWebhook('order_created', testData);
}

function renderAdminProducts() {
    if (!checkAdmin()) return;

    document.getElementById('view-container').innerHTML = `
        <div class="page-container fade-in" style="max-width:1100px;">
             <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                <button class="icon-btn" onclick="navigateTo('admin')">← Back</button>
                <h2 style="color:var(--gold);">Products</h2>
                <button class="btn btn-gold" onclick="showProductModal()">+ Add New</button>
            </div>
            <div class="admin-table-container">
                <table>
                    <thead>
                        <tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        ${products.map(p => `
                            <tr>
                                <td><img src="${p.img}" style="width:40px; height:40px; border-radius:4px; object-fit:cover;"></td>
                                <td>${p.name}</td>
                                <td>${p.category}</td>
                                <td>฿${p.price}</td>
                                <td>
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <button onclick="changeStock('${p.id}', -1)" style="width:24px; height:24px; border-radius:4px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:white; cursor:pointer;">-</button>
                                        <span style="min-width:20px; text-align:center;">${p.stock}</span>
                                        <button onclick="changeStock('${p.id}', 1)" style="width:24px; height:24px; border-radius:4px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:white; cursor:pointer;">+</button>
                                    </div>
                                </td>
                                <td>
                                    <span onclick="toggleProductStatus('${p.id}')" style="cursor:pointer; display:inline-block; padding:4px 10px; border-radius:15px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); color:${p.status === 'available' ? 'var(--green)' : 'var(--red)'}">
                                        ${p.status === 'available' ? 'Available' : 'Sold Out'}
                                    </span>
                                </td>
                                <td>
                                    <button onclick="showProductModal('${p.id}')" style="background:none; border:none; color:var(--gold); margin-right:10px;">Edit</button>
                                    <button onclick="deleteProduct('${p.id}')" style="background:none; border:none; color:var(--red);">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function toggleProductStatus(id) {
    const p = products.find(x => x.id === id);
    if (p) {
        const newStatus = p.status === 'available' ? 'out_of_stock' : 'available';
        const updateData = { status: newStatus };
        if (newStatus === 'available' && p.stock === 0) updateData.stock = 1;
        await db.ref(`${ROOT}/products/${id}`).update(updateData);
        showToast(`Product ${p.name} is now ${newStatus === 'available' ? 'Available' : 'Sold Out'}`);
    }
}

async function changeStock(id, delta) {
    const p = products.find(x => x.id === id);
    if (p) {
        let newStock = Math.max(0, p.stock + delta);
        const newStatus = newStock > 0 ? 'available' : 'out_of_stock';
        await db.ref(`${ROOT}/products/${id}`).update({ stock: newStock, status: newStatus });
        showToast(`Stock for ${p.name} updated to ${newStock}`);
    }
}

// --- API Emulation ---
function apiGetOrders() {
    console.log("[API] GET /api/orders");
    return JSON.parse(JSON.stringify(orders));
}

function apiGetProducts() {
    console.log("[API] GET /api/products");
    return JSON.parse(JSON.stringify(products));
}

function showApiReference() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal fade-in" style="max-width:600px;">
            <h3 style="margin-bottom:20px; color:var(--gold)">API Reference</h3>
            <div style="font-size:0.85rem; line-height:1.6; max-height:400px; overflow-y:auto; padding-right:10px;">
                <p style="color:var(--text-muted); margin-bottom:15px;">Use these methods in the browser console (or future internal scripts) to interact with the system.</p>
                
                <div style="border-bottom:1px solid rgba(255,255,255,0.1); padding:10px 0;">
                    <strong style="color:var(--gold)">GET /api/products</strong><br>
                    <code>apiGetProducts()</code><br>
                    Returns all menu items and their stock status.
                </div>
                <div style="border-bottom:1px solid rgba(255,255,255,0.1); padding:10px 0;">
                    <strong style="color:var(--gold)">GET /api/orders</strong><br>
                    <code>apiGetOrders()</code><br>
                    Returns all historical orders.
                </div>
                <div style="border-bottom:1px solid rgba(255,255,255,0.1); padding:10px 0;">
                    <strong style="color:var(--gold)">POST /webhook/test</strong><br>
                    <code>testWebhook(id)</code><br>
                    Sends a test payload to the specified webhook ID.
                </div>
            </div>
            <button class="btn btn-gold" style="width:100%; margin-top:20px;" onclick="this.closest('.modal-overlay').remove()">Close Reference</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

function renderAdminWebhooks() {
    if (!checkAdmin()) return;

    document.getElementById('view-container').innerHTML = `
        <div class="page-container fade-in" style="max-width:1100px;">
             <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                <button class="icon-btn" onclick="navigateTo('admin')">← Back</button>
                <h2 style="color:var(--gold);">Webhook Settings</h2>
                <button class="btn btn-gold" onclick="showWebhookModal()">+ Add Webhook</button>
            </div>
            <div class="admin-table-container">
                <table>
                    <thead>
                        <tr><th>URL</th><th>Events</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        ${webhooks.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding:40px; color:var(--text-muted)">No webhooks configured.</td></tr>' : ''}
                        ${webhooks.map(w => `
                            <tr>
                                <td style="font-size:0.8rem">${w.url}</td>
                                <td style="font-size:0.75rem">${w.events.join(', ')}</td>
                                <td>
                                    <span style="color:${w.status === 'active' ? 'var(--green)' : 'var(--red)'}">${w.status.toUpperCase()}</span>
                                </td>
                                <td>
                                    <button onclick="testWebhook('${w.docId}')" style="background:none; border:none; color:var(--gold); margin-right:10px;">Test</button>
                                    <button onclick="deleteWebhook('${w.docId}')" style="background:none; border:none; color:var(--red);">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function showWebhookModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal fade-in">
            <h3 style="margin-bottom:20px; color:var(--gold)">Add Webhook</h3>
            <form id="webhook-form" onsubmit="event.preventDefault(); saveWebhook()">
                <div class="form-group"><input type="url" id="w-url" class="form-input" placeholder="https://api.example.com/webhook" required></div>
                <div class="form-group"><input type="text" id="w-secret" class="form-input" placeholder="Secret Token (Optional)"></div>
                <div class="form-group">
                    <label style="color:var(--text-muted); font-size:0.8rem; display:block; margin-bottom:10px;">Subscribe to Events:</label>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.85rem;">
                        <label><input type="checkbox" name="w-event" value="order_created" checked> New Order</label>
                        <label><input type="checkbox" name="w-event" value="payment_completed"> Payment Paid</label>
                        <label><input type="checkbox" name="w-event" value="order_status_updated"> Status Update</label>
                    </div>
                </div>
                <div style="display:flex; gap:10px; margin-top:20px;">
                    <button type="submit" class="btn btn-gold" style="flex:1">Save Webhook</button>
                    <button type="button" class="btn" style="background:#555" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(overlay);
}

async function saveWebhook() {
    const url = document.getElementById('w-url').value;
    const secret = document.getElementById('w-secret').value;
    const events = Array.from(document.querySelectorAll('input[name="w-event"]:checked')).map(el => el.value);

    if (events.length === 0) {
        alert("Please select at least one event.");
        return;
    }

    const newWebhook = { url, secret, events, status: 'active' };
    const newKey = db.ref(`${ROOT}/webhooks`).push().key;
    await db.ref(`${ROOT}/webhooks/${newKey}`).set(newWebhook);
    document.querySelector('.modal-overlay').remove();
    showToast("Webhook Added");
}

async function deleteWebhook(docId) {
    if (confirm("Delete this webhook?")) {
        await db.ref(`${ROOT}/webhooks/${docId}`).remove();
        showToast("Webhook Deleted");
    }
}

async function testWebhook(docId) {
    const hook = webhooks.find(w => w.docId === docId);
    if (hook) {
        showToast("Sending test payload...");
        await triggerWebhook('test_connection', { message: 'Hello from Hidden Oven API!' });
        showToast("Test request sent (check console/target)");
    }
}
function renderAdminOrders() {
    if (!checkAdmin()) return;

    document.getElementById('view-container').innerHTML = `
        <div class="page-container fade-in" style="max-width:1100px;">
             <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                <button class="icon-btn" onclick="navigateTo('admin')">← Back</button>
                <h2 style="color:var(--gold);">Order History</h2>
            </div>
            <div class="admin-table-container">
                <table>
                    <thead>
                        <tr><th>ID</th><th>Customer</th><th>Pickup/Type</th><th>Total</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        ${orders.map(o => `
                            <tr>
                                <td style="font-family:monospace; font-size:0.8rem;">#${o.id.slice(-6).toUpperCase()}</td>
                                <td>
                                    <div>${o.customerName}</div>
                                    <div style="font-size:0.75rem; color:var(--text-muted)">${o.phone}</div>
                                </td>
                                <td>
                                    <div style="color:var(--gold); font-weight:600;">${o.pickupDate} ${o.pickupTime}</div>
                                    <div style="font-size:0.7rem; text-transform:uppercase;">${o.orderType} • ${o.type}</div>
                                </td>
                                <td>฿${o.total}</td>
                                <td style="color:${o.status === 'Paid' ? 'var(--green)' : 'var(--gold)'}">${o.status}</td>
                                <td>
                                    <div style="display:flex; gap:5px;">
                                        ${o.status === 'Pending' ? `<button class="btn" style="background:var(--green); padding:5px 10px; color:white; font-size:0.75rem" onclick="updateOrderStatus('${o.docId}', '${o.id}', 'Paid')">Mark Paid</button>` : '✓'}
                                        <button class="btn" style="background:var(--red); padding:5px 10px; color:white; font-size:0.75rem" onclick="deleteOrder('${o.docId}')">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// --- Logic: Notifications & Toast ---
function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    navigateTo('home');

    // Auto-check for new orders if in admin
    setInterval(() => {
        // This interval is now less critical as Firestore listeners handle real-time updates.
        // However, it can still be used for other periodic checks or UI refreshes if needed.
        // For now, we'll keep it but note its reduced importance for order updates.
        const currentView = window.currentView || 'home';
        if (currentView === 'admin-orders' || currentView === 'admin') {
            // If on admin orders/dashboard, the onSnapshot listener will already trigger a re-render.
            // This interval could be used for a "new order sound" or notification if desired.
        }
    }, 5000);
});

// Admin Helpers
async function updateOrderStatus(docId, orderId, status) {
    const o = orders.find(x => x.docId === docId);
    if (o) {
        const oldStatus = o.status;
        await db.ref(`${ROOT}/orders/${docId}`).update({ status });
        showToast(`Order ${orderId} is now ${status}`);
        triggerWebhook('order_status_updated', { id: orderId, oldStatus, newStatus: status });
        if (status === 'Paid') triggerWebhook('payment_completed', o);
    }
}

async function deleteOrder(docId) {
    if (confirm("ต้องการลบออเดอร์นี้ใช่หรือไม่?")) {
        try {
            await db.ref(`${ROOT}/orders/${docId}`).remove();
            showToast("ลบออเดอร์เรียบร้อยแล้ว");
        } catch (err) {
            console.error("Delete error:", err);
            showToast("Error deleting order");
        }
    }
}

async function deleteProduct(id) {
    if (confirm("Delete this product?")) {
        await db.ref(`${ROOT}/products/${id}`).remove();
        showToast("Product Deleted");
    }
}

function showProductModal(id = null) {
    const p = id ? products.find(x => x.id === id) : { name: '', category: 'Cookies', desc: '', price: 0, stock: 0, img: '', status: 'available', preorder_enabled: true, min_prep_hours: 2 };

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal fade-in">
            <h3 style="margin-bottom:20px; color:var(--gold)">${id ? 'Edit' : 'Add'} Product</h3>
            <form id="product-form" onsubmit="event.preventDefault(); saveProduct('${id}')">
                <div class="form-group"><input type="text" id="p-name" class="form-input" placeholder="Name" value="${p.name}" required></div>
                <div class="form-group">
                    <select id="p-cat" class="form-input">
                        <option ${p.category === 'Cookies' ? 'selected' : ''}>Cookies</option>
                        <option ${p.category === 'Brownies' ? 'selected' : ''}>Brownies</option>
                        <option ${p.category === 'Cakes' ? 'selected' : ''}>Cakes</option>
                        <option ${p.category === 'Signature' ? 'selected' : ''}>Signature</option>
                    </select>
                </div>
                <div class="form-group"><input type="number" id="p-price" class="form-input" placeholder="Price" value="${p.price}" required></div>
                <div class="form-group"><input type="number" id="p-stock" class="form-input" placeholder="Stock" value="${p.stock}" required></div>
                <div class="form-group">
                    <label style="color:var(--text-muted); font-size:0.8rem;">Min Prep Time (Hours)</label>
                    <input type="number" id="p-prep" class="form-input" placeholder="Min Prep Time (Hours)" value="${p.min_prep_hours || 2}" required>
                </div>
                <div class="form-group">
                    <label style="display:flex; align-items:center; gap:10px; color:var(--text-muted); font-size:0.8rem;">
                        <input type="checkbox" id="p-preorder" ${p.preorder_enabled ? 'checked' : ''}> Enable Pre-order
                    </label>
                </div>
                <div class="form-group">
                    <label style="color:var(--text-muted); font-size:0.8rem; display:block; margin-bottom:5px;">Product Image</label>
                    ${p.img ? `<img src="${p.img}" style="width:100px; height:60px; object-fit:cover; margin-bottom:10px; border-radius:5px; border:1px solid var(--gold);">` : ''}
                    <input type="file" id="p-image-file" class="form-input" accept="image/*">
                    <input type="hidden" id="p-img-url" value="${p.img}">
                </div>
                <div class="form-group"><textarea id="p-desc" class="form-input" placeholder="Description" style="height:80px;">${p.desc}</textarea></div>
                <div style="display:flex; gap:10px; margin-top:20px;">
                    <button type="submit" id="save-btn" class="btn btn-gold" style="flex:1">Save Product</button>
                    <button type="button" class="btn" style="background:#555" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(overlay);
}

async function saveProduct(id) {
    const saveBtn = document.getElementById('save-btn');
    const name = document.getElementById('p-name').value;
    const price = parseInt(document.getElementById('p-price').value);
    const stock = parseInt(document.getElementById('p-stock').value);
    const category = document.getElementById('p-cat').value;
    const desc = document.getElementById('p-desc').value;
    const preorder_enabled = document.getElementById('p-preorder').checked;
    const min_prep_hours = parseInt(document.getElementById('p-prep').value) || 0;
    const imgFile = document.getElementById('p-image-file').files[0];
    let imgUrl = document.getElementById('p-img-url').value;

    try {
        saveBtn.disabled = true;
        saveBtn.innerText = "Processing...";

        // If a new file is selected, upload it to Firebase Storage
        if (imgFile) {
            console.log("[Debug] Starting image upload for:", imgFile.name);
            saveBtn.innerText = "Uploading Image...";
            const storageRef = storage.ref(`products/${Date.now()}_${imgFile.name}`);

            try {
                const snapshot = await storageRef.put(imgFile);
                console.log("[Debug] Upload successful, getting URL...");
                imgUrl = await snapshot.ref.getDownloadURL();
            } catch (uploadErr) {
                console.error("[Debug] Upload error details:", uploadErr);
                throw new Error("Upload failed: " + uploadErr.message);
            }
        }

        const pData = {
            name, price, stock, category, img: imgUrl, desc,
            preorder_enabled, min_prep_hours,
            status: stock > 0 ? 'available' : 'out_of_stock'
        };

        if (id && id !== 'null' && id !== '') {
            await db.ref(`${ROOT}/products/${id}`).update(pData);
            showToast("Product Updated");
        } else {
            const newId = Date.now().toString();
            await db.ref(`${ROOT}/products/${newId}`).set(pData);
            showToast("Product Added");
        }

        document.querySelector('.modal-overlay').remove();
    } catch (err) {
        console.error("Save product error:", err);
        alert("Error saving product: " + err.message);
        saveBtn.disabled = false;
        saveBtn.innerText = "Save Product";
    }
}

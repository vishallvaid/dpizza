document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    setupAdminNav();
});

function setupAdminNav() {
    const btnOrders = document.getElementById('btnOrders');
    const btnCustomers = document.getElementById('btnCustomers');
    const ordersSection = document.getElementById('ordersSection');
    const customersSection = document.getElementById('customersSection');

    btnOrders.addEventListener('click', () => {
        btnOrders.classList.add('active');
        btnCustomers.classList.remove('active');
        ordersSection.classList.remove('hidden');
        customersSection.classList.add('hidden');
    });

    btnCustomers.addEventListener('click', () => {
        btnCustomers.classList.add('active');
        btnOrders.classList.remove('active');
        customersSection.classList.remove('hidden');
        ordersSection.classList.add('hidden');
        loadCustomers();
    });
}

function loadDashboard() {
    // In a real app: fetch from Firestore
    const history = JSON.parse(localStorage.getItem('dpizza_history')) || [];

    // Update Stats
    document.getElementById('totalOrders').innerText = history.length;
    const sales = history.reduce((sum, o) => sum + o.total, 0);
    document.getElementById('totalSales').innerText = `₹${sales}`;

    // Unique customers
    const phones = new Set(history.map(o => o.phone));
    document.getElementById('totalCustomers').innerText = phones.size;

    // Load Orders Table
    const tableBody = document.getElementById('ordersTableBody');
    tableBody.innerHTML = '';

    history.reverse().forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${order.id}</td>
            <td>
                <strong>${order.name}</strong><br>
                <small>${order.phone}</small>
            </td>
            <td>${order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}</td>
            <td>₹${order.total}</td>
            <td><span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span></td>
            <td>
                <select onchange="updateStatus('${order.id}', this.value)" style="padding: 4px; border-radius: 4px;">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function loadCustomers() {
    const history = JSON.parse(localStorage.getItem('dpizza_history')) || [];
    const customersMap = {};

    history.forEach(order => {
        if (!customersMap[order.phone]) {
            customersMap[order.phone] = {
                name: order.name,
                phone: order.phone,
                lastAddress: order.address,
                orderCount: 0,
                ltv: 0
            };
        }
        customersMap[order.phone].orderCount++;
        customersMap[order.phone].ltv += order.total;
        customersMap[order.phone].lastAddress = order.address; // Most recent
    });

    const tableBody = document.getElementById('customersTableBody');
    tableBody.innerHTML = '';

    Object.values(customersMap).forEach(cust => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cust.name}</td>
            <td>${cust.phone}</td>
            <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cust.lastAddress}</td>
            <td>${cust.orderCount}</td>
            <td>₹${cust.ltv}</td>
        `;
        tableBody.appendChild(tr);
    });
}

window.updateStatus = (orderId, newStatus) => {
    let history = JSON.parse(localStorage.getItem('dpizza_history')) || [];
    const index = history.findIndex(o => o.id === orderId);
    if (index !== -1) {
        history[index].status = newStatus;
        localStorage.setItem('dpizza_history', JSON.stringify(history));
        loadDashboard();
        alert(`Order ${orderId} status updated to ${newStatus}`);
    }
};

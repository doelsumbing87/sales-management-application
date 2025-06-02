(() => {
    // Elements selection
    const tabs = document.querySelectorAll('nav button');
    const sections = document.querySelectorAll('main section');

    // Inventory elements
    const inventoryForm = document.getElementById('inventory-form');
    const productIdField = document.getElementById('product-id');
    const productNameField = document.getElementById('product-name');
    const productCostField = document.getElementById('product-cost');
    const productPriceField = document.getElementById('product-price');
    const productStockField = document.getElementById('product-stock');
    const inventoryTableBody = document.querySelector('#inventory-table tbody');
    const inventoryAlert = document.getElementById('inventory-alert');

    // Sales elements
    const salesForm = document.getElementById('sales-form');
    const saleProductSelect = document.getElementById('sale-product');
    const saleQuantityField = document.getElementById('sale-quantity');
    const salesTableBody = document.querySelector('#sales-table tbody');
    const salesAlert = document.getElementById('sales-alert');

    // Receipt elements
    const receiptOutput = document.getElementById('receipt-output');
    const printReceiptButton = document.getElementById('print-receipt');

    // HPP elements
    const calculateHppBtn = document.getElementById('calculate-hpp');
    const hppResultSpan = document.getElementById('hpp-result');

    // Profit & Loss elements
    const calculatePnlBtn = document.getElementById('calculate-pnl');
    const pnlSalesSpan = document.getElementById('pnl-sales');
    const pnlCostSpan = document.getElementById('pnl-cost');
    const pnlResultSpan = document.getElementById('pnl-result');

    // Sales analysis elements
    const bestSellersTableBody = document.querySelector('#best-sellers-table tbody');
    const dailyRevenueChartCtx = document.getElementById('daily-revenue-chart').getContext('2d');

    // Data keys in localStorage
    const STORAGE_KEYS = {
        INVENTORY: 'salesApp_inventory',
        SALES: 'salesApp_sales'
    };

    // Data arrays
    let inventory = [];
    let sales = [];

    // Chart instance
    let dailyRevenueChart;

    // Utility Functions
    function saveInventory() {
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    }
    function saveSales() {
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    }
    function loadInventory() {
        const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
        inventory = saved ? JSON.parse(saved) : [];
    }
    function loadSales() {
        const saved = localStorage.getItem(STORAGE_KEYS.SALES);
        sales = saved ? JSON.parse(saved) : [];
    }
    function formatCurrency(value) {
        return value.toFixed(2);
    }
    function generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
    function isPositiveNumber(value) {
        return !isNaN(value) && value >= 0; // Changed to >= 0 for cost/price
    }
    function clearInventoryAlert() {
        inventoryAlert.style.display = 'none';
        inventoryAlert.textContent = '';
    }
    function clearSalesAlert() {
        salesAlert.style.display = 'none';
        salesAlert.textContent = '';
    }

    // UI & Logic Functions
    function switchTab(tabName) {
        tabs.forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tabName);
        });
        sections.forEach(s => {
            s.classList.toggle('active', s.id === tabName);
        });
        if (tabName === 'inventory') renderInventoryTable();
        if (tabName === 'sales') {
            populateSaleProductOptions();
            renderSalesTable();
        }
        if (tabName === 'receipt') renderReceipt();
        if (tabName === 'analysis') renderSalesAnalysis();
    }

    // INVENTORY MANAGEMENT
    function renderInventoryTable() {
        inventoryTableBody.innerHTML = '';
        if (inventory.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="5" style="text-align:center;color:#777;">No products in inventory.</td>';
            inventoryTableBody.appendChild(tr);
            return;
        }
        inventory.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(p.name)}</td>
                <td>$${formatCurrency(p.cost)}</td>
                <td>$${formatCurrency(p.price)}</td>
                <td>${p.stock}</td>
                <td>
                    <button class="edit" aria-label="Edit ${escapeHtml(p.name)}">Edit</button>
                    <button class="delete" aria-label="Delete ${escapeHtml(p.name)}">Delete</button>
                </td>
            `;
            const editBtn = tr.querySelector('.edit');
            const deleteBtn = tr.querySelector('.delete');
            editBtn.addEventListener('click', () => editProduct(p.id));
            deleteBtn.addEventListener('click', () => deleteProduct(p.id));
            inventoryTableBody.appendChild(tr);
        });
    }
    function editProduct(id) {
        clearInventoryAlert();
        const product = inventory.find(p => p.id === id);
        if (!product) return;
        productIdField.value = product.id;
        productNameField.value = product.name;
        productCostField.value = product.cost;
        productPriceField.value = product.price;
        productStockField.value = product.stock;
        // Optional: Scroll to the form if it's out of view
        inventoryForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function deleteProduct(id) {
        clearInventoryAlert();
        const product = inventory.find(p => p.id === id);
        if (!product) return;

        // Check if there are any sales recorded for this product
        const hasSales = sales.some(s => s.productId === id);

        if (hasSales) {
            inventoryAlert.style.display = 'block';
            inventoryAlert.textContent = `Cannot delete product "${product.name}" because it has recorded sales.`;
            return;
        }

        if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
            inventory = inventory.filter(p => p.id !== id);
            saveInventory();
            renderInventoryTable();
            clearInventoryForm();
            populateSaleProductOptions(); // Update sales dropdown after deletion
            alert('Product deleted successfully.');
        }
    }

    function clearInventoryForm() {
        productIdField.value = '';
        productNameField.value = '';
        productCostField.value = '';
        productPriceField.value = '';
        productStockField.value = '';
    }

    inventoryForm.addEventListener('submit', e => {
        e.preventDefault();
        clearInventoryAlert();
        const id = productIdField.value || generateId();
        const name = productNameField.value.trim();
        const cost = parseFloat(productCostField.value);
        const price = parseFloat(productPriceField.value);
        const stock = parseInt(productStockField.value);

        if (!name) {
            inventoryAlert.style.display = 'block';
            inventoryAlert.textContent = 'Product name is required.';
            return;
        }
        if (!isPositiveNumber(cost)) {
            inventoryAlert.style.display = 'block';
            inventoryAlert.textContent = 'Cost per unit must be zero or a positive number.';
            return;
        }
        if (!isPositiveNumber(price)) {
            inventoryAlert.style.display = 'block';
            inventoryAlert.textContent = 'Selling price per unit must be zero or a positive number.';
            return;
        }
        if (stock < 0 || isNaN(stock)) {
            inventoryAlert.style.display = 'block';
            inventoryAlert.textContent = 'Stock quantity cannot be negative and must be a whole number.';
            return;
        }
        // Check duplicate name for new product, except itself on update
        const nameConflict = inventory.find(p => p.name.toLowerCase() === name.toLowerCase() && p.id !== id);
        if (nameConflict) {
            inventoryAlert.style.display = 'block';
            inventoryAlert.textContent = `A product named "${name}" already exists. Please use a different name.`;
            return;
        }

        // Add or update product
        const index = inventory.findIndex(p => p.id === id);
        if (index >= 0) {
            inventory[index] = { id, name, cost, price, stock };
        } else {
            inventory.push({ id, name, cost, price, stock });
        }
        saveInventory();
        renderInventoryTable();
        clearInventoryForm();
        populateSaleProductOptions(); // Update sales dropdown after inventory changes
        alert('Product added/updated successfully.');
    });

    // SALES MANAGEMENT
    function populateSaleProductOptions() {
        saleProductSelect.innerHTML = '';
        if (inventory.length === 0) {
            saleProductSelect.innerHTML = '<option value="">No products available</option>';
            saleProductSelect.disabled = true; // Disable select if no products
            saleQuantityField.disabled = true;
            return;
        }
        saleProductSelect.disabled = false;
        saleQuantityField.disabled = false;
        saleProductSelect.innerHTML = '<option value="">-- Select a product --</option>' + inventory.map(p => {
            return `<option value="${p.id}">${escapeHtml(p.name)} (Stock: ${p.stock})</option>`;
        }).join('');
    }

    function renderSalesTable() {
        salesTableBody.innerHTML = '';
        if (sales.length === 0) {
            salesTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#777;">No sales recorded.</td></tr>';
            printReceiptButton.disabled = true;
            return;
        }
        // Sort sales by date descending to show most recent first
        const sortedSales = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedSales.forEach(s => {
            const product = inventory.find(p => p.id === s.productId);
            const productName = product ? product.name : 'Product Not Found'; // Handle deleted products
            const pricePerUnit = product ? product.price : 0;
            const date = new Date(s.date);
            const dateString = date.toLocaleDateString('id-ID') + ' ' + date.toLocaleTimeString('id-ID'); // Format for Indonesia
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(productName)}</td>
                <td>${s.quantity}</td>
                <td>$${formatCurrency(pricePerUnit)}</td>
                <td>$${formatCurrency(s.quantity * pricePerUnit)}</td>
                <td>${dateString}</td>
            `;
            salesTableBody.appendChild(tr);
        });
        printReceiptButton.disabled = false;
    }

    salesForm.addEventListener('submit', e => {
        e.preventDefault();
        clearSalesAlert();
        const productId = saleProductSelect.value;
        const quantity = parseInt(saleQuantityField.value);

        if (!productId) {
            salesAlert.style.display = 'block';
            salesAlert.textContent = 'Please select a product.';
            return;
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
            salesAlert.style.display = 'block';
            salesAlert.textContent = 'Quantity must be a positive whole number.';
            return;
        }

        const product = inventory.find(p => p.id === productId);
        if (!product) {
            salesAlert.style.display = 'block';
            salesAlert.textContent = 'Selected product not found in inventory.';
            return;
        }
        if (product.stock < quantity) {
            salesAlert.style.display = 'block';
            salesAlert.textContent = `Insufficient stock for "${product.name}". Only ${product.stock} items are available.`;
            return;
        }

        // Update stock
        product.stock -= quantity;

        // Record sale
        sales.push({
            id: generateId(),
            productId: productId,
            quantity: quantity,
            date: new Date().toISOString()
        });

        saveInventory();
        saveSales();
        renderInventoryTable(); // Update inventory table to reflect stock change
        populateSaleProductOptions(); // Update stock display in sales dropdown
        renderSalesTable();
        renderReceipt();
        alert('Sale recorded successfully.');
        salesForm.reset();
    });

    // RECEIPT PRINTING
    function renderReceipt() {
        if (sales.length === 0) {
            receiptOutput.textContent = 'No sales yet.';
            printReceiptButton.disabled = true;
            return;
        }
        printReceiptButton.disabled = false;

        // Build a receipt for the last sale
        const lastSale = sales[sales.length - 1]; // Get the very last recorded sale
        const saleDate = new Date(lastSale.date);
        const product = inventory.find(p => p.id === lastSale.productId);
        const name = product ? product.name : 'Unknown Product';
        const price = product ? product.price : 0;
        const quantity = lastSale.quantity;
        const total = price * quantity;

        let receiptText = '';
        receiptText += '********** RECEIPT **********\n';
        receiptText += `Date: ${saleDate.toLocaleDateString('id-ID')} ${saleDate.toLocaleTimeString('id-ID')}\n`;
        receiptText += '-----------------------------\n';
        receiptText += `Item              Qty   Price   Total\n`;
        receiptText += '-----------------------------\n';
        receiptText += `${padRight(name, 18)} ${padLeft(quantity, 3)}  $${padLeft(formatCurrency(price), 6)}  $${padLeft(formatCurrency(total), 6)}\n`;
        receiptText += '-----------------------------\n';
        receiptText += `TOTAL:                                $${formatCurrency(total)}\n`;
        receiptText += '*****************************\n';

        receiptOutput.textContent = receiptText;
    }

    printReceiptButton.addEventListener('click', () => {
        const printWindow = window.open('', '', 'width=400,height=600');
        printWindow.document.write('<pre style="font-family: monospace; font-size: 16px;">' + receiptOutput.textContent.replace(/</g, '&lt;').replace(/>/g,'&gt;') + '</pre>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    });

    // HPP CALCULATOR
    function calculateHpp() {
        let totalCost = 0;
        sales.forEach(s => {
            const product = inventory.find(p => p.id === s.productId);
            if (product) {
                totalCost += product.cost * s.quantity;
            }
        });
        hppResultSpan.textContent = formatCurrency(totalCost);
        return totalCost;
    }

    calculateHppBtn.addEventListener('click', () => {
        calculateHpp();
        alert('Cost of Goods Sold (HPP) calculated.');
    });

    // PROFIT & LOSS CALCULATOR
    function calculateProfitLoss() {
        let totalRevenue = 0;
        sales.forEach(s => {
            const product = inventory.find(p => p.id === s.productId);
            if (product) {
                totalRevenue += product.price * s.quantity;
            }
        });
        const totalCost = calculateHpp(); // Use the HPP function to get total cost

        pnlSalesSpan.textContent = formatCurrency(totalRevenue);
        pnlCostSpan.textContent = formatCurrency(totalCost);

        const profitLoss = totalRevenue - totalCost;
        pnlResultSpan.textContent = formatCurrency(profitLoss);
        pnlResultSpan.style.color = profitLoss >= 0 ? '#2e7d32' : '#c62828'; // Green for profit, red for loss
        return profitLoss;
    }

    calculatePnlBtn.addEventListener('click', () => {
        calculateProfitLoss();
        alert('Profit or Loss calculated.');
    });

    // SALES ANALYSIS
    function renderSalesAnalysis() {
        renderBestSellersTable();
        renderDailyRevenueChart();
    }

    function renderBestSellersTable() {
        bestSellersTableBody.innerHTML = '';
        if (sales.length === 0) {
            bestSellersTableBody.innerHTML = '<tr><td colspan="2" style="text-align:center;color:#777;">No sales data available.</td></tr>';
            return;
        }

        // Aggregate quantities sold per product
        const productSalesMap = {};
        sales.forEach(s => {
            if (!productSalesMap[s.productId]) {
                productSalesMap[s.productId] = 0;
            }
            productSalesMap[s.productId] += s.quantity;
        });

        // Convert to array and sort descending by quantity
        const productSales = Object.entries(productSalesMap)
            .map(([pid, qty]) => ({productId: pid, quantity: qty}))
            .sort((a,b) => b.quantity - a.quantity);

        productSales.forEach(ps => {
            const product = inventory.find(p => p.id === ps.productId);
            const productName = product ? product.name : 'Unknown Product';
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${escapeHtml(productName)}</td><td>${ps.quantity}</td>`;
            bestSellersTableBody.appendChild(tr);
        });
    }

    function renderDailyRevenueChart() {
        if (dailyRevenueChart) {
            dailyRevenueChart.destroy();
            dailyRevenueChart = null;
        }

        if (sales.length === 0) {
            // Clear canvas if no sales data
            dailyRevenueChartCtx.clearRect(0,0,dailyRevenueChartCtx.canvas.width,dailyRevenueChartCtx.canvas.height);
            return;
        }

        const revenueByDate = {};
        sales.forEach(s => {
            const product = inventory.find(p => p.id === s.productId);
            if (!product) return; // Skip if product not found

            const saleDate = new Date(s.date);
            // Key by YYYY-MM-DD
            const ymd = saleDate.toISOString().slice(0,10);
            if (!revenueByDate[ymd]) revenueByDate[ymd] = 0;
            revenueByDate[ymd] += product.price * s.quantity;
        });

        // Get sorted dates and corresponding revenues
        const dates = Object.keys(revenueByDate).sort();
        const revenues = dates.map(d => parseFloat(revenueByDate[d].toFixed(2)));

        dailyRevenueChart = new Chart(dailyRevenueChartCtx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Daily Revenue ($)',
                    data: revenues,
                    fill: true,
                    backgroundColor: 'rgba(63,81,181,0.2)',
                    borderColor: '#3f51b5',
                    tension: 0.3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#3f51b5'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allow canvas to adjust height
                plugins: {
                    legend: {
                        labels: {color: '#3f51b5', font: {weight: 600}}
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {color: '#3f51b5'},
                        grid: {color: '#e0e0e0'}
                    },
                    x: {
                        ticks: {color: '#3f51b5'},
                        grid: {color: '#e0e0e0'}
                    }
                }
            }
        });
    }

    // Helpers
    function escapeHtml(text) {
        // Function to prevent XSS by escaping HTML characters
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    function padRight(str, length) {
        str = String(str);
        while (str.length < length) str += ' ';
        return str;
    }

    function padLeft(str, length) {
        str = String(str);
        while (str.length < length) str = ' ' + str;
        return str;
    }

    // Initialization
    function init() {
        loadInventory();
        loadSales();
        renderInventoryTable();
        populateSaleProductOptions();
        renderSalesTable();
        renderReceipt();
        // Add tab switching listeners
        tabs.forEach(t => {
            t.addEventListener('click', () => switchTab(t.dataset.tab));
        });

        // Ensure calculations are run once when respective tabs are opened for the first time
        // or add listeners to the buttons for manual recalculation.
        // For simplicity, we'll keep the button clicks for manual calculation.
    }

    // Run initialization when the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', init);
})();

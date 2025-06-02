(() => {
    // --- ELEMEN HTML ---
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
    const customerPaymentField = document.getElementById('customer-payment'); // Input pembayaran pelanggan
    const salesAlert = document.getElementById('sales-alert');
    const salesTableBody = document.querySelector('#sales-table tbody');

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
    const productRevenueChartCtx = document.getElementById('product-revenue-chart').getContext('2d');     // Context untuk diagram batang baru
    const productDistributionChartCtx = document.getElementById('product-distribution-chart').getContext('2d'); // Context untuk diagram lingkaran baru

    // --- DATA & STORAGE ---
    const STORAGE_KEYS = {
        INVENTORY: 'salesApp_inventory',
        SALES: 'salesApp_sales'
    };

    let inventory = [];
    let sales = [];
    let lastTransactionDetails = null; // Menyimpan detail transaksi terakhir untuk struk

    // --- CHART INSTANCES ---
    let dailyRevenueChart;
    let productRevenueChart;
    let productDistributionChart;

    // --- KONFIGURASI TOKO (Untuk Struk) ---
    const storeInfo = {
        name: "RM. AMPERA ABBEEY",
        address1: "Jl. Lintas Sumatera, Candimas, Kec.",
        address2: "Abung Sel., Kabupaten Lampung Utara,",
        address3: "Lampung 34511, Indonesia",
        phone: "+62 895 6096 10780",
        website: "https://rm-ampera-abbeey.vercel.app",
        logoPath: "logo-receipt.png" // Pastikan gambar ini ada di folder root proyek
    };

    // --- FUNGSI UTILITY ---

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

    // Mengubah format mata uang ke Rupiah Indonesia
    function formatCurrency(value) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0, // Hilangkan desimal jika nilai bulat
            maximumFractionDigits: 0
        }).format(value);
    }

    function generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    function isPositiveNumber(value) {
        return !isNaN(value) && value >= 0;
    }

    function clearInventoryAlert() {
        inventoryAlert.style.display = 'none';
        inventoryAlert.textContent = '';
    }

    function clearSalesAlert() {
        salesAlert.style.display = 'none';
        salesAlert.textContent = '';
    }

    // Helper untuk escape HTML (mencegah XSS)
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // Helper untuk padding teks
    function padRight(str, length) {
        str = String(str);
        while (str.length < length) str += ' ';
        return str.substring(0, length); // Pastikan tidak melebihi panjang
    }

    function padLeft(str, length) {
        str = String(str);
        while (str.length < length) str = ' ' + str;
        return str.substring(0, length); // Pastikan tidak melebihi panjang
    }

    // --- FUNGSI UI & LOGIC ---

    function switchTab(tabName) {
        tabs.forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tabName);
        });
        sections.forEach(s => {
            s.classList.toggle('active', s.id === tabName);
        });

        // Render atau update konten saat tab aktif
        if (tabName === 'inventory') renderInventoryTable();
        if (tabName === 'sales') {
            populateSaleProductOptions();
            renderSalesTable();
        }
        if (tabName === 'receipt') renderReceipt();
        if (tabName === 'analysis') renderSalesAnalysis();
    }

    // --- INVENTORY MANAGEMENT ---

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
                <td>${formatCurrency(p.cost)}</td>
                <td>${formatCurrency(p.price)}</td>
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
        inventoryForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function deleteProduct(id) {
        clearInventoryAlert();
        const product = inventory.find(p => p.id === id);
        if (!product) return;

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
            populateSaleProductOptions();
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
        const nameConflict = inventory.find(p => p.name.toLowerCase() === name.toLowerCase() && p.id !== id);
        if (nameConflict) {
            inventoryAlert.style.display = 'block';
            inventoryAlert.textContent = `A product named "${name}" already exists. Please use a different name.`;
            return;
        }

        const index = inventory.findIndex(p => p.id === id);
        if (index >= 0) {
            inventory[index] = { id, name, cost, price, stock };
        } else {
            inventory.push({ id, name, cost, price, stock });
        }
        saveInventory();
        renderInventoryTable();
        clearInventoryForm();
        populateSaleProductOptions();
        alert('Product added/updated successfully.');
    });

    // --- SALES MANAGEMENT ---

    function populateSaleProductOptions() {
        saleProductSelect.innerHTML = '';
        if (inventory.length === 0) {
            saleProductSelect.innerHTML = '<option value="">No products available</option>';
            saleProductSelect.disabled = true;
            saleQuantityField.disabled = true;
            customerPaymentField.disabled = true; // Disable payment field
            return;
        }
        saleProductSelect.disabled = false;
        saleQuantityField.disabled = false;
        customerPaymentField.disabled = false; // Enable payment field

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
        const sortedSales = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedSales.forEach(s => {
            const product = inventory.find(p => p.id === s.productId);
            const productName = product ? product.name : 'Product Not Found';
            const pricePerUnit = product ? product.price : 0;
            const date = new Date(s.date);
            const dateString = date.toLocaleDateString('id-ID') + ' ' + date.toLocaleTimeString('id-ID');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(productName)}</td>
                <td>${s.quantity}</td>
                <td>${formatCurrency(pricePerUnit)}</td>
                <td>${formatCurrency(s.quantity * pricePerUnit)}</td>
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
        let customerPayment = parseFloat(customerPaymentField.value); // Ambil dari input

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

        const saleTotal = product.price * quantity;

        if (isNaN(customerPayment) || customerPayment < 0) {
             salesAlert.style.display = 'block';
             salesAlert.textContent = 'Customer payment must be a non-negative number.';
             return;
        }

        if (customerPayment < saleTotal) {
            salesAlert.style.display = 'block';
            salesAlert.textContent = `Insufficient payment. Customer needs to pay ${formatCurrency(saleTotal)}.`;
            return;
        }

        const change = customerPayment - saleTotal;

        // Update stock
        product.stock -= quantity;

        // Record sale
        const newSale = {
            id: generateId(),
            productId: productId,
            quantity: quantity,
            date: new Date().toISOString(),
            customerPayment: customerPayment,
            change: change,
            totalSale: saleTotal
        };
        sales.push(newSale);

        saveInventory();
        saveSales();
        renderInventoryTable();
        populateSaleProductOptions();
        renderSalesTable();

        lastTransactionDetails = newSale; // Simpan detail untuk struk
        renderReceipt(); // Render struk setelah penjualan baru

        alert('Sale recorded successfully!');
        salesForm.reset();
        customerPaymentField.value = ''; // Bersihkan input pembayaran
    });

    // --- RECEIPT PRINTING ---

    function renderReceipt() {
        receiptOutput.innerHTML = ''; // Bersihkan konten sebelumnya

        // Gunakan lastTransactionDetails jika ada, jika tidak, coba ambil penjualan terakhir dari array sales
        const transaction = lastTransactionDetails || (sales.length > 0 ? sales[sales.length - 1] : null);

        if (!transaction) {
            receiptOutput.textContent = 'No sales yet.';
            printReceiptButton.disabled = true;
            return;
        }
        printReceiptButton.disabled = false;

        const saleDate = new Date(transaction.date);
        const product = inventory.find(p => p.id === transaction.productId);

        let receiptHtml = '';

        // Header Struk (Logo & Informasi Toko)
        receiptHtml += `<img src="${storeInfo.logoPath}" alt="Store Logo" class="store-logo">\n`;
        receiptHtml += `<div style="text-align: center;">\n`;
        receiptHtml += `  <strong>${storeInfo.name}</strong><br>\n`;
        receiptHtml += `  ${storeInfo.address1}<br>\n`;
        receiptHtml += `  ${storeInfo.address2}<br>\n`;
        receiptHtml += `  ${storeInfo.address3}<br>\n`;
        receiptHtml += `  ${storeInfo.phone}<br>\n`;
        receiptHtml += `  ${storeInfo.website}<br>\n`;
        receiptHtml += `</div>\n`;

        receiptHtml += `<hr style="border: 0; border-top: 1px dashed #aaa; margin: 10px 0;">\n`;

        // Baris Transaksi
        receiptHtml += `<pre style="font-family: monospace; font-size: 1rem; white-space: pre-wrap; margin: 0; padding: 0;">`;
        receiptHtml += `TRST-${transaction.id.substring(1, 6).toUpperCase()} ${saleDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${saleDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n`;
        receiptHtml += `</pre>\n`;

        receiptHtml += `<hr style="border: 0; border-top: 1px dashed #aaa; margin: 10px 0;">\n`;

        // Detail Item
        receiptHtml += `<pre style="font-family: monospace; font-size: 1rem; white-space: pre-wrap; margin: 0; padding: 0;">`;
        receiptHtml += `${padRight('Item', 20)} ${padLeft('Qty', 3)} ${padLeft('Harga', 8)} ${padLeft('Total', 10)}\n`; // Header kolom
        receiptHtml += `-------------------------------------------\n`; // Garis pemisah kolom

        const productName = product ? product.name : 'Produk Tidak Ditemukan';
        const pricePerUnit = product ? product.price : 0;
        const quantity = transaction.quantity;
        const itemTotal = transaction.totalSale;

        receiptHtml += `${padRight(productName, 20)} ${padLeft(quantity.toString(), 3)} ${padLeft(formatCurrency(pricePerUnit), 8)} ${padLeft(formatCurrency(itemTotal), 10)}\n`;
        receiptHtml += `</pre>\n`;

        receiptHtml += `<hr style="border: 0; border-top: 1px dashed #aaa; margin: 10px 0;">\n`;

        // Total, Pembayaran, Kembalian
        receiptHtml += `<pre style="font-family: monospace; font-size: 1rem; white-space: pre-wrap; margin: 0; padding: 0;">`;
        receiptHtml += `${padRight('Total', 32)} ${padLeft(formatCurrency(transaction.totalSale), 12)}\n`; // Lebar 32 untuk label, 12 untuk nilai
        receiptHtml += `${padRight('Pembayaran', 32)} ${padLeft(formatCurrency(transaction.customerPayment), 12)}\n`;
        receiptHtml += `${padRight('Kembalian', 32)} ${padLeft(formatCurrency(transaction.change), 12)}\n`;
        receiptHtml += `</pre>\n`;

        receiptHtml += `<hr style="border: 0; border-top: 1px dashed #aaa; margin: 10px 0;">\n`;
        receiptHtml += `<div style="text-align: center; font-weight: bold; margin-top: 10px;">Terimakasih Atas Kunjungannya!</div>\n`;

        receiptOutput.innerHTML = receiptHtml;
    }

    printReceiptButton.addEventListener('click', () => {
        const printWindow = window.open('', '', 'width=400,height=600');
        printWindow.document.write(`
            <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { margin: 0; font-family: 'Poppins', sans-serif; }
                    .receipt {
                        width: 100%;
                        box-sizing: border-box;
                        padding: 1rem 1.5rem;
                        font-family: monospace; /* Tetap monospace untuk detail item */
                        font-size: 14px; /* Sedikit lebih kecil untuk print */
                        line-height: 1.3;
                        text-align: center; /* Untuk header */
                    }
                    .store-logo {
                        max-width: 150px;
                        height: auto;
                        margin-bottom: 10px;
                        display: block;
                        margin-left: auto;
                        margin-right: auto;
                    }
                    hr { border: 0; border-top: 1px dashed #aaa; margin: 10px 0; }
                    pre {
                        font-family: monospace;
                        font-size: inherit; /* Inherit dari .receipt */
                        white-space: pre-wrap;
                        margin: 0;
                        padding: 0;
                        text-align: left; /* Teks item ke kiri */
                    }
                    div { text-align: center; } /* Umumnya div di tengah */
                    strong { font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    ${receiptOutput.innerHTML}
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    });

    // --- HPP CALCULATOR ---

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

    // --- PROFIT & LOSS CALCULATOR ---

    function calculateProfitLoss() {
        let totalRevenue = 0;
        sales.forEach(s => {
            const product = inventory.find(p => p.id === s.productId);
            if (product) {
                totalRevenue += product.price * s.quantity;
            }
        });
        const totalCost = calculateHpp();

        pnlSalesSpan.textContent = formatCurrency(totalRevenue);
        pnlCostSpan.textContent = formatCurrency(totalCost);

        const profitLoss = totalRevenue - totalCost;
        pnlResultSpan.textContent = formatCurrency(profitLoss);
        pnlResultSpan.style.color = profitLoss >= 0 ? '#2e7d32' : '#c62828';
        return profitLoss;
    }

    calculatePnlBtn.addEventListener('click', () => {
        calculateProfitLoss();
        alert('Profit or Loss calculated.');
    });

    // --- SALES ANALYSIS ---

    function renderSalesAnalysis() {
        renderBestSellersTable();
        renderDailyRevenueChart();
        renderProductRevenueChart();
        renderProductDistributionChart();
    }

    function renderBestSellersTable() {
        bestSellersTableBody.innerHTML = '';
        if (sales.length === 0) {
            bestSellersTableBody.innerHTML = '<tr><td colspan="2" style="text-align:center;color:#777;">No sales data available.</td></tr>';
            return;
        }

        const productSalesMap = {}; // Mengagregasi kuantitas terjual per produk
        sales.forEach(s => {
            if (!productSalesMap[s.productId]) {
                productSalesMap[s.productId] = 0;
            }
            productSalesMap[s.productId] += s.quantity;
        });

        const productSales = Object.entries(productSalesMap)
            .map(([pid, qty]) => {
                const product = inventory.find(p => p.id === pid);
                return { productId: pid, quantity: qty, name: product ? product.name : 'Unknown Product' };
            })
            .sort((a, b) => b.quantity - a.quantity); // Urutkan berdasarkan kuantitas

        productSales.forEach(ps => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${escapeHtml(ps.name)}</td><td>${ps.quantity}</td>`;
            bestSellersTableBody.appendChild(tr);
        });
    }

    function renderDailyRevenueChart() {
        if (dailyRevenueChart) {
            dailyRevenueChart.destroy();
        }

        if (sales.length === 0) {
            dailyRevenueChartCtx.clearRect(0, 0, dailyRevenueChartCtx.canvas.width, dailyRevenueChartCtx.canvas.height);
            return;
        }

        const revenueByDate = {};
        sales.forEach(s => {
            const product = inventory.find(p => p.id === s.productId);
            if (!product) return;

            const saleDate = new Date(s.date);
            const ymd = saleDate.toISOString().slice(0, 10); // Format YYYY-MM-DD
            if (!revenueByDate[ymd]) revenueByDate[ymd] = 0;
            revenueByDate[ymd] += product.price * s.quantity;
        });

        const dates = Object.keys(revenueByDate).sort();
        const revenues = dates.map(d => parseFloat(revenueByDate[d].toFixed(2)));

        dailyRevenueChart = new Chart(dailyRevenueChartCtx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Daily Revenue (Rp)',
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
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#3f51b5', font: { weight: 600 } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#3f51b5',
                            callback: function(value) { return formatCurrency(value); } // Format Y-axis ticks
                        },
                        grid: { color: '#e0e0e0' }
                    },
                    x: {
                        ticks: { color: '#3f51b5' },
                        grid: { color: '#e0e0e0' }
                    }
                }
            }
        });
    }

    function renderProductRevenueChart() {
        if (productRevenueChart) {
            productRevenueChart.destroy();
        }

        if (sales.length === 0) {
            productRevenueChartCtx.clearRect(0, 0, productRevenueChartCtx.canvas.width, productRevenueChartCtx.canvas.height);
            return;
        }

        const revenueByProduct = {};
        sales.forEach(sale => {
            const product = inventory.find(p => p.id === sale.productId);
            if (product) {
                if (!revenueByProduct[product.name]) {
                    revenueByProduct[product.name] = 0;
                }
                revenueByProduct[product.name] += product.price * sale.quantity;
            }
        });

        const sortedProducts = Object.entries(revenueByProduct)
            .sort(([, revenueA], [, revenueB]) => revenueB - revenueA); // Urutkan berdasarkan pendapatan

        const labels = sortedProducts.map(([name]) => name);
        const data = sortedProducts.map(([, revenue]) => parseFloat(revenue.toFixed(2)));

        productRevenueChart = new Chart(productRevenueChartCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue (Rp)',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#333', font: { weight: 600 } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#333',
                            callback: function(value) { return formatCurrency(value); }
                        },
                        grid: { color: '#e0e0e0' }
                    },
                    x: {
                        ticks: { color: '#333' },
                        grid: { color: '#e0e0e0'}
                    }
                }
            }
        });
    }

    function renderProductDistributionChart() {
        if (productDistributionChart) {
            productDistributionChart.destroy();
        }

        if (sales.length === 0) {
            productDistributionChartCtx.clearRect(0, 0, productDistributionChartCtx.canvas.width, productDistributionChartCtx.canvas.height);
            return;
        }

        const revenueByProduct = {};
        sales.forEach(sale => {
            const product = inventory.find(p => p.id === sale.productId);
            if (product) {
                const currentRevenue = product.price * sale.quantity;
                if (!revenueByProduct[product.name]) {
                    revenueByProduct[product.name] = 0;
                }
                revenueByProduct[product.name] += currentRevenue;
            }
        });

        const labels = Object.keys(revenueByProduct);
        const data = labels.map(name => parseFloat(revenueByProduct[name].toFixed(2)));

        const backgroundColors = [
            'rgba(255, 99, 132, 0.7)', // Merah
            'rgba(54, 162, 235, 0.7)', // Biru
            'rgba(255, 206, 86, 0.7)', // Kuning
            'rgba(75, 192, 192, 0.7)', // Hijau Teal
            'rgba(153, 102, 255, 0.7)',// Ungu
            'rgba(255, 159, 64, 0.7)', // Oranye
            'rgba(199, 199, 199, 0.7)',// Abu-abu
            'rgba(83, 102, 255, 0.7)', // Biru muda
            'rgba(231, 233, 64, 0.7)', // Olive
            'rgba(255, 0, 0, 0.7)'     // Merah terang
        ];
        const borderColors = [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)',
            'rgba(231, 233, 64, 1)',
            'rgba(255, 0, 0, 1)'
        ];

        productDistributionChart = new Chart(productDistributionChartCtx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderColor: borderColors.slice(0, labels.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#333', font: { weight: 600 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    const total = context.dataset.data.reduce((sum, current) => sum + current, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(2) + '%';
                                    label += formatCurrency(context.parsed) + ' (' + percentage + ')';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // --- INISIALISASI ---

    function init() {
        loadInventory();
        loadSales();
        renderInventoryTable();
        populateSaleProductOptions();
        renderSalesTable();
        renderReceipt(); // Tampilkan struk terakhir saat aplikasi dimuat

        tabs.forEach(t => {
            t.addEventListener('click', () => switchTab(t.dataset.tab));
        });
    }

    // Jalankan inisialisasi ketika DOM sepenuhnya dimuat
    document.addEventListener('DOMContentLoaded', init);
})();

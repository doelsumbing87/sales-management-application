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
    const customerPaymentField = document.getElementById('customer-payment');
    const salesAlert = document.getElementById('sales-alert');
    const salesTableBody = document.querySelector('#sales-table tbody');

    // Transaction History & Receipt elements
    const transactionHistorySection = document.getElementById('transaction-history');
    const filterDateFrom = document.getElementById('filter-date-from');
    const filterDateTo = document.getElementById('filter-date-to');
    const applyDateFilterBtn = document.getElementById('apply-date-filter');
    const clearDateFilterBtn = document.getElementById('clear-date-filter');
    const filteredSalesTableBody = document.querySelector('#filtered-sales-table tbody');
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
    const productRevenueChartCtx = document.getElementById('product-revenue-chart').getContext('2d');
    const productDistributionChartCtx = document.getElementById('product-distribution-chart').getContext('2d');

    // Export/Import elements
    const exportInventoryBtn = document.getElementById('export-inventory-btn');
    const importInventoryFile = document.getElementById('import-inventory-file');
    const exportSalesBtn = document.getElementById('export-sales-btn');
    const importSalesFile = document.getElementById('import-sales-file');

    // --- DATA & STORAGE ---
    const STORAGE_KEYS = {
        INVENTORY: 'salesApp_inventory',
        SALES: 'salesApp_sales'
    };

    let inventory = [];
    let sales = [];
    let lastTransactionDetails = null; // Menyimpan detail transaksi terakhir yang dilihat/terbaru

    // --- CHART INSTANCES ---
    let dailyRevenueChart;
    let productRevenueChart;
    let productDistributionChart;

    // --- FILTER STATE ---
    let currentFilterFromDate = null;
    let currentFilterToDate = null;

    // --- KONFIGURASI TOKO (Untuk Struk) ---
    const storeInfo = {
        name: "RM. AMPERA ABBEEY",
        address1: "Jl. Lintas Sumatera, Candimas, Kec.",
        address2: "Abung Sel., Kabupaten Lampung Utara,",
        address3: "Lampung 34511, Indonesia",
        phone: "+62 895 6096 10780",
        website: "https://rm-ampera-abbeey.vercel.app",
        logoPath: "logo-abbey.png" // Pastikan gambar ini ada di folder root proyek
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
            minimumFractionDigits: 0,
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
        if (str.length > length) return str.substring(0, length);
        while (str.length < length) str += ' ';
        return str;
    }

    function padLeft(str, length) {
        str = String(str);
        if (str.length > length) return str.substring(str.length - length, str.length);
        while (str.length < length) str = ' ' + str;
        return str;
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
            renderSalesTable(); // Tabel penjualan hari ini
        }
        if (tabName === 'transaction-history') {
            renderFilteredSalesTable(); // Tabel transaksi yang difilter
            renderReceipt(); // Tampilkan struk dari transaksi terakhir/yang dipilih
        }
        if (tabName === 'hpp') calculateHpp();
        if (tabName === 'profit-loss') calculateProfitLoss();
        if (tabName === 'analysis') renderSalesAnalysis();
    }

    // --- INVENTORY MANAGEMENT ---

    function renderInventoryTable() {
        inventoryTableBody.innerHTML = '';
        const activeProducts = inventory.filter(p => p.isActive);
        if (activeProducts.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="5" style="text-align:center;color:#777;">No active products in inventory.</td>';
            inventoryTableBody.appendChild(tr);
            return;
        }
        activeProducts.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Name">${escapeHtml(p.name)}</td>
                <td data-label="Cost (HPP)">${formatCurrency(p.cost)}</td>
                <td data-label="Price">${formatCurrency(p.price)}</td>
                <td data-label="Stock">${p.stock}</td>
                <td data-label="Actions">
                    <button class="edit" aria-label="Edit ${escapeHtml(p.name)}">Edit</button>
                    <button class="delete" aria-label="Deactivate ${escapeHtml(p.name)}">Deactivate</button>
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

    function deleteProduct(id) { // Ini sekarang adalah "deactivate"
        clearInventoryAlert();
        const product = inventory.find(p => p.id === id);
        if (!product) return;

        if (confirm(`Are you sure you want to deactivate "${product.name}"? It will no longer appear in sales selection, but past sales data will remain for analysis.`)) {
            const index = inventory.findIndex(p => p.id === id);
            if (index !== -1) {
                inventory[index].isActive = false; // Tandai sebagai tidak aktif
            }
            saveInventory();
            renderInventoryTable();
            clearInventoryForm();
            populateSaleProductOptions(); // Perbarui dropdown penjualan
            alert('Product deactivated successfully.');
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
        const nameConflict = inventory.find(p => p.name.toLowerCase() === name.toLowerCase() && p.id !== id && p.isActive);
        if (nameConflict) {
            inventoryAlert.style.display = 'block';
            inventoryAlert.textContent = `An active product named "${name}" already exists. Please use a different name.`;
            return;
        }

        const index = inventory.findIndex(p => p.id === id);
        if (index >= 0) {
            // Perbarui data yang ada, pastikan isActive tetap true jika di-edit
            inventory[index] = { ...inventory[index], name, cost, price, stock, isActive: true };
        } else {
            inventory.push({ id, name, cost, price, stock, isActive: true }); // Produk baru aktif secara default
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
        const activeProducts = inventory.filter(p => p.isActive);

        if (activeProducts.length === 0) {
            saleProductSelect.innerHTML = '<option value="">No active products available</option>';
            saleProductSelect.disabled = true;
            saleQuantityField.disabled = true;
            customerPaymentField.disabled = true;
            return;
        }
        saleProductSelect.disabled = false;
        saleQuantityField.disabled = false;
        customerPaymentField.disabled = false;

        saleProductSelect.innerHTML = '<option value="">-- Select a product --</option>' + activeProducts.map(p => {
            return `<option value="${p.id}">${escapeHtml(p.name)} (Stock: ${p.stock})</option>`;
        }).join('');
    }

    function renderSalesTable() {
        salesTableBody.innerHTML = '';
        // Filter sales for today only
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const todaySales = sales.filter(s => {
            const saleDate = new Date(s.date);
            return saleDate >= today && saleDate <= endOfToday;
        });

        if (todaySales.length === 0) {
            salesTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#777;">No sales recorded for today.</td></tr>';
            return;
        }
        const sortedSales = [...todaySales].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedSales.forEach(s => {
            const product = inventory.find(p => p.id === s.productId);
            const productName = product ? product.name : 'Product Not Found';
            const pricePerUnit = product ? product.price : 0;
            const date = new Date(s.date);
            const dateString = date.toLocaleDateString('id-ID') + ' ' + date.toLocaleTimeString('id-ID');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Product Name">${escapeHtml(productName)}</td>
                <td data-label="Quantity">${s.quantity}</td>
                <td data-label="Price per Unit">${formatCurrency(pricePerUnit)}</td>
                <td data-label="Total">${formatCurrency(s.totalSale)}</td>
                <td data-label="Date">${dateString}</td>
            `;
            salesTableBody.appendChild(tr);
        });
    }

    salesForm.addEventListener('submit', e => {
        e.preventDefault();
        clearSalesAlert();
        const productId = saleProductSelect.value;
        const quantity = parseInt(saleQuantityField.value);
        let customerPayment = parseFloat(customerPaymentField.value);

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
        renderSalesTable(); // Update today's sales table
        renderFilteredSalesTable(); // Update historical sales table
        lastTransactionDetails = newSale; // Simpan detail untuk struk
        renderReceipt(); // Render struk setelah penjualan baru

        alert('Sale recorded successfully!');
        salesForm.reset();
        customerPaymentField.value = '';
    });

    // --- TRANSACTION HISTORY & RECEIPT ---

    function renderFilteredSalesTable() {
        filteredSalesTableBody.innerHTML = '';
        let displayedSales = sales;

        // Apply filters if dates are set
        if (currentFilterFromDate && currentFilterToDate) {
            const fromTimestamp = currentFilterFromDate.getTime();
            const toTimestamp = currentFilterToDate.getTime();

            displayedSales = sales.filter(s => {
                const saleTimestamp = new Date(s.date).getTime();
                // Pastikan transaksi berada dalam rentang tanggal yang dipilih (inklusif)
                return saleTimestamp >= fromTimestamp && saleTimestamp <= toTimestamp;
            });
        }

        if (displayedSales.length === 0) {
            filteredSalesTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#777;">No transactions found for the selected period.</td></tr>';
            receiptOutput.textContent = 'Please select a transaction to view its receipt.';
            printReceiptButton.disabled = true;
            return;
        }

        displayedSales.sort((a, b) => new Date(b.date) - new Date(a.date)); // Urutkan terbaru ke terlama

        displayedSales.forEach(s => {
            const product = inventory.find(p => p.id === s.productId);
            const productName = product ? product.name : 'Product Not Found';
            const pricePerUnit = product ? product.price : 0;
            const date = new Date(s.date);
            const dateString = date.toLocaleDateString('id-ID') + ' ' + date.toLocaleTimeString('id-ID');
            const tr = document.createElement('tr');
            tr.dataset.saleId = s.id; // Untuk identifikasi saat klik "View Receipt"

            tr.innerHTML = `
                <td data-label="Product Name">${escapeHtml(productName)}</td>
                <td data-label="Quantity">${s.quantity}</td>
                <td data-label="Price per Unit">${formatCurrency(pricePerUnit)}</td>
                <td data-label="Total">${formatCurrency(s.totalSale)}</td>
                <td data-label="Date">${dateString}</td>
                <td data-label="Actions">
                    <button class="view-receipt primary" aria-label="View Receipt for ${escapeHtml(productName)}">View Receipt</button>
                </td>
            `;
            // Menambahkan event listener ke tombol "View Receipt"
            tr.querySelector('.view-receipt').addEventListener('click', () => {
                lastTransactionDetails = s; // Set detail transaksi yang dipilih
                renderReceipt();
                receiptOutput.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            filteredSalesTableBody.appendChild(tr);
        });
    }

    applyDateFilterBtn.addEventListener('click', () => {
        const fromDateStr = filterDateFrom.value;
        const toDateStr = filterDateTo.value;

        if (fromDateStr) {
            currentFilterFromDate = new Date(fromDateStr);
            currentFilterFromDate.setHours(0, 0, 0, 0); // Atur ke awal hari
        } else {
            currentFilterFromDate = null;
        }

        if (toDateStr) {
            currentFilterToDate = new Date(toDateStr);
            currentFilterToDate.setHours(23, 59, 59, 999); // Atur ke akhir hari
        } else {
            currentFilterToDate = null;
        }

        if (currentFilterFromDate && currentFilterToDate && currentFilterFromDate > currentFilterToDate) {
            alert('Start date cannot be after end date.');
            return;
        }

        renderFilteredSalesTable();
    });

    clearDateFilterBtn.addEventListener('click', () => {
        filterDateFrom.value = '';
        filterDateTo.value = '';
        currentFilterFromDate = null;
        currentFilterToDate = null;
        renderFilteredSalesTable();
        receiptOutput.textContent = 'Please select a transaction to view its receipt.';
        printReceiptButton.disabled = true;
    });

    function renderReceipt() {
        receiptOutput.innerHTML = '';

        const transaction = lastTransactionDetails || (sales.length > 0 ? sales[sales.length - 1] : null);

        if (!transaction) {
            receiptOutput.textContent = 'No sales selected or no sales yet.';
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
        // Gunakan id transaksi yang unik (contoh TRST-ID_PENDEK)
        const transactionIdShort = transaction.id.substring(1, 6).toUpperCase(); // Ambil 5 karakter dari ID
        receiptHtml += `TRST-${transactionIdShort} ${saleDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${saleDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n`;
        receiptHtml += `</pre>\n`;

        receiptHtml += `<hr style="border: 0; border-top: 1px dashed #aaa; margin: 10px 0;">\n`;

        // Detail Item
        receiptHtml += `<pre style="font-family: monospace; font-size: 1rem; white-space: pre-wrap; margin: 0; padding: 0;">`;
        receiptHtml += `${padRight('Item', 20)} ${padLeft('Qty', 3)} ${padLeft('Harga', 8)} ${padLeft('Total', 10)}\n`;
        receiptHtml += `-------------------------------------------\n`;

        const productName = product ? product.name : 'Produk Tidak Ditemukan';
        const pricePerUnit = product ? product.price : 0;
        const quantity = transaction.quantity;
        const itemTotal = transaction.totalSale;

        receiptHtml += `${padRight(productName, 20)} ${padLeft(quantity.toString(), 3)} ${padLeft(formatCurrency(pricePerUnit), 8)} ${padLeft(formatCurrency(itemTotal), 10)}\n`;
        receiptHtml += `</pre>\n`;

        receiptHtml += `<hr style="border: 0; border-top: 1px dashed #aaa; margin: 10px 0;">\n`;

        // Total, Pembayaran, Kembalian
        receiptHtml += `<pre style="font-family: monospace; font-size: 1rem; white-space: pre-wrap; margin: 0; padding: 0;">`;
        receiptHtml += `${padRight('Total', 32)} ${padLeft(formatCurrency(transaction.totalSale), 12)}\n`;
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
                        font-family: monospace;
                        font-size: 14px;
                        line-height: 1.3;
                        text-align: center;
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
                        font-size: inherit;
                        white-space: pre-wrap;
                        margin: 0;
                        padding: 0;
                        text-align: left;
                    }
                    div { text-align: center; }
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
        pnlResultSpan.style.color = profitLoss >= 0 ? '#28a745' : '#dc3545'; // Green for profit, red for loss
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

        const productSalesMap = {};
        sales.forEach(s => {
            if (!productSalesMap[s.productId]) {
                productSalesMap[s.productId] = 0;
            }
            productSalesMap[s.productId] += s.quantity;
        });

        const productSales = Object.entries(productSalesMap)
            .map(([pid, qty]) => {
                const product = inventory.find(p => p.id === pid);
                return { productId: pid, quantity: qty, name: product ? product.name : 'Unknown Product (Deactivated)' };
            })
            .sort((a, b) => b.quantity - a.quantity);

        productSales.forEach(ps => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Product Name">${escapeHtml(ps.name)}</td>
                <td data-label="Total Quantity Sold">${ps.quantity}</td>
            `;
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
            const ymd = saleDate.toISOString().slice(0, 10);
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
                    backgroundColor: 'rgba(74, 84, 225, 0.2)', // primary-color dengan opacity
                    borderColor: '#4a54e1', // primary-color
                    tension: 0.3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#4a54e1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#333d47', font: { weight: 600 } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#333d47',
                            callback: function(value) { return formatCurrency(value); }
                        },
                        grid: { color: '#e0e5eb' }
                    },
                    x: {
                        ticks: { color: '#333d47' },
                        grid: { color: '#e0e5eb' }
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
            .sort(([, revenueA], [, revenueB]) => revenueB - revenueA);

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
                        labels: { color: '#333d47', font: { weight: 600 } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#333d47',
                            callback: function(value) { return formatCurrency(value); }
                        },
                        grid: { color: '#e0e5eb' }
                    },
                    x: {
                        ticks: { color: '#333d47' },
                        grid: { color: '#e0e5eb' }
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
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(199, 199, 199, 0.7)',
            'rgba(83, 102, 255, 0.7)',
            'rgba(231, 233, 64, 0.7)',
            'rgba(255, 0, 0, 0.7)'
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
                        labels: { color: '#333d47', font: { weight: 600 } }
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

    // --- EXPORT/IMPORT FUNCTIONS ---

    function createWorksheet(data, headers) {
        const ws = XLSX.utils.json_to_sheet(data);
        if (headers) {
            XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' });
        }
        return ws;
    }

    function exportToExcel(data, sheetName, fileName, headers = null) {
        if (data.length === 0) {
            alert(`No data to export for ${sheetName}.`);
            return;
        }
        const wb = XLSX.utils.book_new();
        const ws = createWorksheet(data, headers);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `${fileName}.xlsx`);
        alert(`Data successfully exported to ${fileName}.xlsx!`);
    }

    function importFromExcel(file, type) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Read as array of arrays

                if (jsonData.length === 0) {
                    alert('Excel file is empty or has no recognizable data.');
                    return;
                }

                const headers = jsonData[0];
                const rows = jsonData.slice(1); // Data rows

                if (type === 'inventory') {
                    if (!confirm('Importing inventory will OVERWRITE your current active inventory data. Deactivated products will remain. Are you sure?')) {
                        return;
                    }
                    const newInventory = rows.map(row => {
                        const item = {};
                        headers.forEach((header, i) => {
                            item[header] = row[i];
                        });
                        return {
                            id: item.id || generateId(),
                            name: String(item.name || '').trim(),
                            cost: parseFloat(item.cost || 0),
                            price: parseFloat(item.price || 0),
                            stock: parseInt(item.stock || 0),
                            isActive: item.isActive !== undefined ? Boolean(item.isActive) : true
                        };
                    }).filter(item => item.name && !isNaN(item.cost) && !isNaN(item.price) && !isNaN(item.stock));

                    // Gabungkan produk baru dengan yang sudah ada (jika ada yang tidak aktif)
                    // Atau, lebih simpel: timpa semua inventaris dengan data aktif baru.
                    // Untuk skenario "overwrite active inventory":
                    inventory = inventory.filter(p => !p.isActive); // Pertahankan yang tidak aktif
                    inventory.push(...newInventory); // Tambahkan yang baru diimpor
                    
                    // Filter out duplicates based on name for new active products
                    const uniqueActiveInventory = [];
                    const seenNames = new Set(inventory.filter(p => !p.isActive).map(p => p.name.toLowerCase()));

                    inventory.forEach(p => {
                        if (p.isActive && seenNames.has(p.name.toLowerCase())) {
                            // Skip if active duplicate found, or handle as update
                            // For simplicity, we just keep the first occurrence or skip duplicates
                            // For true merging/updating, a more complex loop is needed.
                        } else {
                            uniqueActiveInventory.push(p);
                            if (p.isActive) {
                                seenNames.add(p.name.toLowerCase());
                            }
                        }
                    });
                    inventory = uniqueActiveInventory;


                    saveInventory();
                    renderInventoryTable();
                    populateSaleProductOptions();
                    alert('Inventory imported successfully! Duplicates by name might be skipped/updated.');

                } else if (type === 'sales') {
                    if (!confirm('Importing sales will ADD to your current sales data. Are you sure?')) {
                        return;
                    }
                    const newSales = rows.map(row => {
                        const item = {};
                        headers.forEach((header, i) => {
                            item[header] = row[i];
                        });
                        return {
                            id: item.id || generateId(),
                            productId: String(item.productId || ''),
                            quantity: parseInt(item.quantity || 0),
                            date: item.date || new Date().toISOString(),
                            customerPayment: parseFloat(item.customerPayment || 0),
                            change: parseFloat(item.change || 0),
                            totalSale: parseFloat(item.totalSale || 0)
                        };
                    }).filter(item => item.productId && !isNaN(item.quantity) && item.quantity > 0);

                    sales.push(...newSales);
                    saveSales();
                    renderSalesTable();
                    renderFilteredSalesTable();
                    alert('Sales imported successfully!');
                }
            } catch (error) {
                console.error("Error importing Excel file:", error);
                alert('Failed to import Excel file. Please check the file format and ensure headers match (e.g., "id", "name", "cost", "price", "stock", "isActive" for inventory).');
            } finally {
                // Clear the file input after import to allow re-importing the same file
                if (type === 'inventory') importInventoryFile.value = '';
                if (type === 'sales') importSalesFile.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // --- EVENT LISTENERS FOR EXPORT/IMPORT ---

    exportInventoryBtn.addEventListener('click', () => {
        const headers = ["id", "name", "cost", "price", "stock", "isActive"];
        const dataToExport = inventory.map(p => ({
            id: p.id,
            name: p.name,
            cost: p.cost,
            price: p.price,
            stock: p.stock,
            isActive: p.isActive
        }));
        exportToExcel(dataToExport, "InventoryData", "Inventory_Export", headers);
    });

    importInventoryFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importFromExcel(file, 'inventory');
        }
    });

    exportSalesBtn.addEventListener('click', () => {
        const headers = ["id", "productId", "productName", "quantity", "pricePerUnit", "totalSale", "customerPayment", "change", "date"];
        const dataToExport = sales.map(s => {
            const product = inventory.find(p => p.id === s.productId);
            return {
                id: s.id,
                productId: s.productId,
                productName: product ? product.name : 'Product Not Found', // Ambil nama produk dari inventaris
                quantity: s.quantity,
                pricePerUnit: product ? product.price : 0,
                totalSale: s.totalSale,
                customerPayment: s.customerPayment,
                change: s.change,
                date: s.date
            };
        });
        exportToExcel(dataToExport, "SalesData", "Sales_Export", headers);
    });

    importSalesFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importFromExcel(file, 'sales');
        }
    });

    // --- INISIALISASI ---

    function init() {
        loadInventory();
        loadSales();
        renderInventoryTable();
        populateSaleProductOptions();
        renderSalesTable();

        // Set initial date filters for Transaction History to today
        const today = new Date();
        const formattedToday = today.toISOString().slice(0, 10); // YYYY-MM-DD
        filterDateFrom.value = formattedToday;
        filterDateTo.value = formattedToday;
        currentFilterFromDate = new Date(formattedToday);
        currentFilterFromDate.setHours(0, 0, 0, 0); // Set to start of day
        currentFilterToDate = new Date(formattedToday);
        currentFilterToDate.setHours(23, 59, 59, 999); // Set to end of day

        renderFilteredSalesTable(); // Initial render for transaction history

        // Set lastTransactionDetails to the very last sale if any, for initial receipt display
        if (sales.length > 0) {
            lastTransactionDetails = sales[sales.length - 1];
        }
        renderReceipt(); // Render initial receipt

        tabs.forEach(t => {
            t.addEventListener('click', () => switchTab(t.dataset.tab));
        });

        // Run calculations/analysis charts on load
        calculateHpp();
        calculateProfitLoss();
        renderSalesAnalysis();
    }

    // Jalankan inisialisasi ketika DOM sepenuhnya dimuat
    document.addEventListener('DOMContentLoaded', init);
})();

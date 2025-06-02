(() => {
    // --- ELEMEN HTML ---
    const tabs = document.querySelectorAll('nav button');
    const sections = document.querySelectorAll('main section');

    // Inventory elements
    const inventoryForm = document.getElementById('inventory-form');
    const productIdField = document.getElementById('product-id');
    const productNameField = document.getElementById('product-name');
    const productCategoryField = document.getElementById('product-category');
    const productCostField = document.getElementById('product-cost');
    const productPriceField = document.getElementById('product-price');
    const productStockField = document.getElementById('product-stock');
    const inventoryTableBody = document.querySelector('#inventory-table tbody');
    const inventoryAlert = document.getElementById('inventory-alert');

    // Sales elements
    const salesForm = document.getElementById('sales-form');
    const filterSaleCategorySelect = document.getElementById('filter-sale-category');
    const applySalesCategoryFilterBtn = document.getElementById('apply-sales-category-filter');
    const clearSalesCategoryFilterBtn = document.getElementById('clear-sales-category-filter');
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

    // HPP & Pricing Tools elements
    const calculateHppBtn = document.getElementById('calculate-hpp');
    const hppResultSpan = document.getElementById('hpp-result');
    const hppUnitForCalcSelect = document.getElementById('hpp-unit-for-calc');
    const targetProfitPercentField = document.getElementById('target-profit-percent');
    const calculateRecommendedPriceBtn = document.getElementById('calculate-recommended-price');
    const recommendedPriceSpan = document.getElementById('recommended-price');
    const hppUnitForMarginCalcSelect = document.getElementById('hpp-unit-for-margin-calc');
    const displayCurrentSellingPriceField = document.getElementById('display-current-selling-price');
    const calculateActualMarginBtn = document.getElementById('calculate-actual-margin');
    const actualProfitMarginSpan = document.getElementById('actual-profit-margin');
    const absoluteProfitPerUnitSpan = document.getElementById('absolute-profit-per-unit');
    const targetAbsoluteProfitField = document.getElementById('target-absolute-profit');
    const calculateSalesNeededBtn = document.getElementById('calculate-sales-needed');
    const salesNeededProductsSpan = document.getElementById('sales-needed-products');
    const salesNeededRevenueSpan = document.getElementById('sales-needed-revenue');

    // Profit & Loss elements
    const calculatePnlBtn = document.getElementById('calculate-pnl');
    const pnlSalesSpan = document.getElementById('pnl-sales');
    const pnlCostSpan = document.getElementById('pnl-cost');
    const pnlResultSpan = document.getElementById('pnl-result');

    // Sales analysis elements
    const bestSellersTableBody = document.querySelector('#best-sellers-table tbody');
    // Pastikan elemen canvas ada sebelum mendapatkan konteks
    const dailyRevenueChartCanvas = document.getElementById('daily-revenue-chart');
    const productRevenueChartCanvas = document.getElementById('product-revenue-chart');
    const productDistributionChartCanvas = document.getElementById('product-distribution-chart');

    const dailyRevenueChartCtx = dailyRevenueChartCanvas ? dailyRevenueChartCanvas.getContext('2d') : null;
    const productRevenueChartCtx = productRevenueChartCanvas ? productRevenueChartCanvas.getContext('2d') : null;
    const productDistributionChartCtx = productDistributionChartCanvas ? productDistributionChartCanvas.getContext('2d') : null;

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
    let lastTransactionDetails = null;

    // --- CHART INSTANCES ---
    let dailyRevenueChart;
    let productRevenueChart;
    let productDistributionChart;

    // --- FILTER STATE ---
    let currentFilterFromDate = null;
    let currentFilterToDate = null;
    let currentSalesCategoryFilter = '';

    // --- KONFIGURASI TOKO (Untuk Struk) ---
    const storeInfo = {
        name: "RM. AMPERA ABBEEY",
        address1: "Jl. Lintas Sumatera, Candimas, Kec.",
        address2: "Abung Sel., Kabupaten Lampung Utara,",
        address3: "Lampung 34511, Indonesia",
        phone: "+62 895 6096 10780",
        website: "https://rm-ampera-abbeey.vercel.app",
        logoPath: "logo-receipt.png"
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

    function clearAlert(element) { // Unified function to clear alerts
        if (element) {
            element.style.display = 'none';
            element.textContent = '';
            element.classList.remove('alert-success', 'alert-danger', 'alert-warning');
        }
    }

    function showAlert(element, message, type = 'danger') {
        if (!element) {
            console.error("Attempted to show alert on a null element:", message);
            return;
        }
        clearAlert(element); // Clear any existing alert classes
        element.style.display = 'block';
        element.textContent = message;
        element.classList.add(`alert-${type}`);
        // Auto-hide after 5 seconds
        setTimeout(() => { clearAlert(element); }, 5000);
    }

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

        // Use try-catch for each tab rendering to prevent single error from breaking all tabs
        try {
            if (tabName === 'inventory') {
                renderInventoryTable();
                clearAlert(inventoryAlert); // Clear alert on tab switch
            } else if (tabName === 'sales') {
                populateCategoryFilters();
                populateSaleProductOptions();
                renderSalesTable();
                clearAlert(salesAlert); // Clear alert on tab switch
            } else if (tabName === 'transaction-history') {
                renderFilteredSalesTable();
                // If no specific transaction selected, default to last sale for receipt view
                if (sales.length > 0 && !lastTransactionDetails) {
                     lastTransactionDetails = sales[sales.length - 1];
                }
                renderReceipt();
                // Note: No specific alert for transaction history, general sales alert is used if needed.
            } else if (tabName === 'hpp') {
                populateHppProductOptions();
                calculateHpp();
                // Ensure the select has options before dispatching event
                if (hppUnitForMarginCalcSelect.options.length > 0) {
                    hppUnitForMarginCalcSelect.dispatchEvent(new Event('change'));
                }
            } else if (tabName === 'profit-loss') {
                calculateProfitLoss();
            } else if (tabName === 'analysis') {
                renderSalesAnalysis();
            }
        } catch (error) {
            console.error(`Error rendering tab "${tabName}":`, error);
            alert(`An error occurred while loading this section (${tabName}). Please check the browser console for details.`);
        }
    }

    // --- INVENTORY MANAGEMENT ---

    function renderInventoryTable() {
        inventoryTableBody.innerHTML = '';
        const activeProducts = inventory.filter(p => p.isActive);
        if (activeProducts.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="6" style="text-align:center;color:#777;">No active products in inventory.</td>';
            inventoryTableBody.appendChild(tr);
            return;
        }
        activeProducts.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Name">${escapeHtml(p.name)}</td>
                <td data-label="Category">${escapeHtml(p.category || 'N/A')}</td>
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
        clearAlert(inventoryAlert);
        const product = inventory.find(p => p.id === id);
        if (!product) return;
        productIdField.value = product.id;
        productNameField.value = product.name;
        productCategoryField.value = product.category;
        productCostField.value = product.cost;
        productPriceField.value = product.price;
        productStockField.value = product.stock;
        inventoryForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function deleteProduct(id) {
        clearAlert(inventoryAlert);
        const product = inventory.find(p => p.id === id);
        if (!product) return;

        if (confirm(`Are you sure you want to deactivate "${product.name}"? It will no longer appear in sales selection, but past sales data will remain for analysis.`)) {
            const index = inventory.findIndex(p => p.id === id);
            if (index !== -1) {
                inventory[index].isActive = false;
            }
            saveInventory();
            renderInventoryTable();
            clearInventoryForm();
            populateSaleProductOptions();
            populateCategoryFilters();
            populateHppProductOptions();
            showAlert(inventoryAlert, `Product "${product.name}" deactivated successfully.`, 'success');
        }
    }

    function clearInventoryForm() {
        productIdField.value = '';
        productNameField.value = '';
        productCategoryField.value = '';
        productCostField.value = '';
        productPriceField.value = '';
        productStockField.value = '';
    }

    inventoryForm.addEventListener('submit', e => {
        e.preventDefault();
        clearAlert(inventoryAlert); // Use clearAlert

        const id = productIdField.value || generateId();
        const name = productNameField.value.trim();
        const category = productCategoryField.value.trim();
        const cost = parseFloat(productCostField.value);
        const price = parseFloat(productPriceField.value);
        const stock = parseInt(productStockField.value);

        if (!name) {
            showAlert(inventoryAlert, 'Product name is required.', 'danger');
            return;
        }
        if (!category) {
            showAlert(inventoryAlert, 'Product category is required.', 'danger');
            return;
        }
        if (!isPositiveNumber(cost)) {
            showAlert(inventoryAlert, 'Cost per unit must be zero or a positive number.', 'danger');
            return;
        }
        if (!isPositiveNumber(price)) {
            showAlert(inventoryAlert, 'Selling price per unit must be zero or a positive number.', 'danger');
            return;
        }
        if (stock < 0 || isNaN(stock)) {
            showAlert(inventoryAlert, 'Stock quantity cannot be negative and must be a whole number.', 'danger');
            return;
        }
        const nameConflict = inventory.find(p => p.name.toLowerCase() === name.toLowerCase() && p.id !== id && p.isActive);
        if (nameConflict) {
            showAlert(inventoryAlert, `An active product named "${name}" already exists. Please use a different name.`, 'danger');
            return;
        }

        const index = inventory.findIndex(p => p.id === id);
        let message = '';
        if (index >= 0) {
            inventory[index] = { ...inventory[index], name, category, cost, price, stock, isActive: true };
            message = 'Product updated successfully.';
        } else {
            inventory.push({ id, name, category, cost, price, stock, isActive: true });
            message = 'Product added successfully.';
        }
        saveInventory();
        renderInventoryTable();
        clearInventoryForm();
        populateSaleProductOptions();
        populateCategoryFilters();
        populateHppProductOptions();
        showAlert(inventoryAlert, message, 'success');
    });

    // --- SALES MANAGEMENT ---

    function populateCategoryFilters() {
        filterSaleCategorySelect.innerHTML = '<option value="">All Categories</option>';
        const categories = new Set();
        inventory.forEach(p => {
            if (p.category) {
                categories.add(p.category.trim());
            }
        });
        const sortedCategories = Array.from(categories).sort((a, b) => a.localeCompare(b));
        sortedCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            filterSaleCategorySelect.appendChild(option);
        });
        filterSaleCategorySelect.value = currentSalesCategoryFilter;
    }

    function populateSaleProductOptions() {
        saleProductSelect.innerHTML = '';
        let productsToDisplay = inventory.filter(p => p.isActive);

        if (currentSalesCategoryFilter) {
            productsToDisplay = productsToDisplay.filter(p => p.category && p.category.toLowerCase() === currentSalesCategoryFilter.toLowerCase());
        }

        if (productsToDisplay.length === 0) {
            saleProductSelect.innerHTML = '<option value="">No active products available</option>';
            saleProductSelect.disabled = true;
            saleQuantityField.disabled = true;
            customerPaymentField.disabled = true;
            return;
        }
        saleProductSelect.disabled = false;
        saleQuantityField.disabled = false;
        customerPaymentField.disabled = false;

        saleProductSelect.innerHTML = '<option value="">-- Select a product --</option>' + productsToDisplay.map(p => {
            return `<option value="${p.id}">${escapeHtml(p.name)} (Stock: ${p.stock})</option>`;
        }).join('');
    }

    function renderSalesTable() {
        salesTableBody.innerHTML = '';
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
        clearAlert(salesAlert);

        const productId = saleProductSelect.value;
        const quantity = parseInt(saleQuantityField.value);
        let customerPayment = parseFloat(customerPaymentField.value);

        if (!productId) {
            showAlert(salesAlert, 'Please select a product.', 'danger');
            return;
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
            showAlert(salesAlert, 'Quantity must be a positive whole number.', 'danger');
            return;
        }

        const product = inventory.find(p => p.id === productId);
        if (!product) {
            showAlert(salesAlert, 'Selected product not found in inventory.', 'danger');
            return;
        }
        if (product.stock < quantity) {
            showAlert(salesAlert, `Insufficient stock for "${product.name}". Only ${product.stock} items are available.`, 'danger');
            return;
        }

        const saleTotal = product.price * quantity;

        if (isNaN(customerPayment) || customerPayment < 0) {
            showAlert(salesAlert, 'Customer payment must be a non-negative number.', 'danger');
            return;
        }

        if (customerPayment < saleTotal) {
            showAlert(salesAlert, `Insufficient payment. Customer needs to pay ${formatCurrency(saleTotal)}.`, 'danger');
            return;
        }

        const change = customerPayment - saleTotal;

        product.stock -= quantity;

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
        renderFilteredSalesTable();
        lastTransactionDetails = newSale;
        renderReceipt();

        showAlert(salesAlert, 'Sale recorded successfully!', 'success');
        salesForm.reset();
        customerPaymentField.value = '';
    });

    applySalesCategoryFilterBtn.addEventListener('click', () => {
        currentSalesCategoryFilter = filterSaleCategorySelect.value;
        populateSaleProductOptions();
    });

    clearSalesCategoryFilterBtn.addEventListener('click', () => {
        currentSalesCategoryFilter = '';
        filterSaleCategorySelect.value = '';
        populateSaleProductOptions();
    });

    // --- TRANSACTION HISTORY & RECEIPT ---

    function renderFilteredSalesTable() {
        filteredSalesTableBody.innerHTML = '';
        let displayedSales = sales;

        if (currentFilterFromDate && currentFilterToDate) {
            const fromTimestamp = currentFilterFromDate.getTime();
            const toTimestamp = currentFilterToDate.getTime();

            displayedSales = sales.filter(s => {
                const saleDate = new Date(s.date);
                return saleDate.getTime() >= fromTimestamp && saleDate.getTime() <= toTimestamp;
            });
        }

        if (displayedSales.length === 0) {
            filteredSalesTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#777;">No transactions found for the selected period.</td></tr>';
            receiptOutput.textContent = 'Please select a transaction to view its receipt.';
            printReceiptButton.disabled = true;
            return;
        }

        displayedSales.sort((a, b) => new Date(b.date) - new Date(a.date));

        displayedSales.forEach(s => {
            const product = inventory.find(p => p.id === s.productId);
            const productName = product ? product.name : 'Product Not Found';
            const pricePerUnit = product ? product.price : 0;
            const date = new Date(s.date);
            const dateString = date.toLocaleDateString('id-ID') + ' ' + date.toLocaleTimeString('id-ID');
            const tr = document.createElement('tr');
            tr.dataset.saleId = s.id;

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
            tr.querySelector('.view-receipt').addEventListener('click', () => {
                lastTransactionDetails = s;
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
            currentFilterFromDate.setHours(0, 0, 0, 0);
        } else {
            currentFilterFromDate = null;
        }

        if (toDateStr) {
            currentFilterToDate = new Date(toDateStr);
            currentFilterToDate.setHours(23, 59, 59, 999);
        } else {
            currentFilterToDate = null;
        }

        if (currentFilterFromDate && currentFilterToDate && currentFilterFromDate > currentFilterToDate) {
            showAlert(transactionHistorySection.querySelector('.alert') || transactionHistorySection, 'Start date cannot be after end date.', 'danger');
            return;
        }
        // No need to clear sales alert specifically here, as this is for transaction history
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

        const transactionIdShort = transaction.id.substring(1, 6).toUpperCase();
        receiptHtml += `<pre style="font-family: monospace; font-size: 1rem; white-space: pre-wrap; margin: 0; padding: 0;">`;
        receiptHtml += `TRST-${transactionIdShort} ${saleDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${saleDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n`;
        receiptHtml += `</pre>\n`;

        receiptHtml += `<hr style="border: 0; border-top: 1px dashed #aaa; margin: 10px 0;">\n`;

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
        const printWindow = window.open('', '_blank', 'width=400,height=600,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes');

        if (!printWindow) {
            alert('Could not open print window. Please allow pop-ups for this site.');
            return;
        }

        const receiptContent = receiptOutput.innerHTML;

        printWindow.document.write(`
            <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { margin: 0; padding: 0.5rem; font-family: 'Poppins', sans-serif; -webkit-print-color-adjust: exact; color-adjust: exact; }
                    .receipt {
                        width: 100%;
                        box-sizing: border-box;
                        padding: 0;
                        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
                        font-size: 13px;
                        line-height: 1.2;
                        text-align: center;
                        color: black;
                    }
                    .store-logo {
                        max-width: 100px;
                        height: auto;
                        margin-bottom: 0.5rem;
                        display: block;
                        margin-left: auto;
                        margin-right: auto;
                    }
                    hr { border: 0; border-top: 1px dashed #777; margin: 0.5rem 0; }
                    pre {
                        font-family: inherit;
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
                    ${receiptContent}
                </div>
                <script>
                    window.onload = function() {
                        const images = document.images;
                        let loadedCount = 0;
                        if (images.length === 0) {
                            window.print();
                            window.close();
                            return;
                        }
                        for (let i = 0; i < images.length; i++) {
                            if (images[i].complete) {
                                loadedCount++;
                            } else {
                                images[i].onload = function() {
                                    loadedCount++;
                                    if (loadedCount === images.length) {
                                        setTimeout(() => {
                                            window.print();
                                            window.close();
                                        }, 100);
                                    }
                                };
                            }
                        }
                        if (loadedCount === images.length) {
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 100);
                        }
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
    });

    // --- HPP CALCULATOR & PRICING TOOLS ---

    function populateHppProductOptions() {
        hppUnitForCalcSelect.innerHTML = '<option value="">-- Select Product --</option>';
        hppUnitForMarginCalcSelect.innerHTML = '<option value="">-- Select Product --</option>';
        inventory.filter(p => p.isActive).forEach(p => {
            const optionHtml = `<option value="${p.id}">${escapeHtml(p.name)} (HPP: ${formatCurrency(p.cost)})</option>`;
            hppUnitForCalcSelect.innerHTML += optionHtml;
            hppUnitForMarginCalcSelect.innerHTML += optionHtml;
        });
    }

    calculateRecommendedPriceBtn.addEventListener('click', () => {
        const productId = hppUnitForCalcSelect.value;
        const targetPercent = parseFloat(targetProfitPercentField.value);

        if (!productId || isNaN(targetPercent) || targetPercent <= 0 || targetPercent >= 100) {
            recommendedPriceSpan.textContent = "Invalid input.";
            return;
        }

        const product = inventory.find(p => p.id === productId);
        if (!product) {
            recommendedPriceSpan.textContent = "Product not found.";
            return;
        }

        const hppPerUnit = product.cost;
        const targetProfitDecimal = targetPercent / 100;

        if (targetProfitDecimal >= 1) {
            recommendedPriceSpan.textContent = "Target profit must be less than 100%.";
            return;
        }

        const recommendedPrice = hppPerUnit / (1 - targetProfitDecimal);
        recommendedPriceSpan.textContent = formatCurrency(recommendedPrice);
    });

    hppUnitForMarginCalcSelect.addEventListener('change', () => {
        const productId = hppUnitForMarginCalcSelect.value;
        const product = inventory.find(p => p.id === productId);
        if (product) {
            displayCurrentSellingPriceField.value = formatCurrency(product.price);
        } else {
            displayCurrentSellingPriceField.value = "N/A";
        }
    });

    calculateActualMarginBtn.addEventListener('click', () => {
        const productId = hppUnitForMarginCalcSelect.value;
        if (!productId) {
            actualProfitMarginSpan.textContent = "N/A";
            absoluteProfitPerUnitSpan.textContent = formatCurrency(0);
            return;
        }

        const product = inventory.find(p => p.id === productId);
        if (!product) {
            actualProfitMarginSpan.textContent = "Product not found.";
            absoluteProfitPerUnitSpan.textContent = formatCurrency(0);
            return;
        }

        const hppPerUnit = product.cost;
        const sellingPrice = product.price;

        if (sellingPrice === 0) {
            actualProfitMarginSpan.textContent = "N/A (Price is 0)";
            absoluteProfitPerUnitSpan.textContent = formatCurrency(0);
            return;
        }

        const absoluteProfit = sellingPrice - hppPerUnit;
        const profitMargin = (absoluteProfit / sellingPrice) * 100;

        actualProfitMarginSpan.textContent = `${profitMargin.toFixed(2)}%`;
        absoluteProfitPerUnitSpan.textContent = formatCurrency(absoluteProfit);
    });

    calculateSalesNeededBtn.addEventListener('click', () => {
        const targetProfit = parseFloat(targetAbsoluteProfitField.value);

        if (isNaN(targetProfit) || targetProfit <= 0) {
            salesNeededProductsSpan.textContent = "Invalid target profit.";
            salesNeededRevenueSpan.textContent = "Invalid target profit.";
            return;
        }

        let totalSalesRevenue = 0;
        let totalHPP = 0;
        let totalUnitsSold = 0;

        sales.forEach(s => {
            const product = inventory.find(p => p.id === s.productId);
            if (product) {
                totalSalesRevenue += product.price * s.quantity;
                totalHPP += product.cost * s.quantity;
                totalUnitsSold += s.quantity;
            }
        });

        const overallAbsoluteProfit = totalSalesRevenue - totalHPP;

        if (overallAbsoluteProfit <= 0 || totalUnitsSold === 0) {
            salesNeededProductsSpan.textContent = "Cannot calculate (no profit data or no sales).";
            salesNeededRevenueSpan.textContent = "Cannot calculate (no profit data or no sales).";
            return;
        }

        const averageProfitPerUnit = overallAbsoluteProfit / totalUnitsSold;

        if (averageProfitPerUnit <= 0) {
            salesNeededProductsSpan.textContent = "Cannot calculate (average profit per unit is zero or negative).";
            salesNeededRevenueSpan.textContent = "Cannot calculate (average profit per unit is zero or negative).";
            return;
        }

        const estimatedUnitsNeeded = Math.ceil(targetProfit / averageProfitPerUnit);
        const averageSellingPrice = totalSalesRevenue / totalUnitsSold;
        const estimatedRevenueNeeded = estimatedUnitsNeeded * averageSellingPrice;

        salesNeededProductsSpan.textContent = `${estimatedUnitsNeeded} units (estimated average)`;
        salesNeededRevenueSpan.textContent = formatCurrency(estimatedRevenueNeeded) + " (estimated average)";
    });

    // --- PROFIT & LOSS CALCULATOR ---

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
        showAlert(hppResultSpan.parentElement, 'Total Cost of Goods Sold (HPP) calculated.', 'success');
    });

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
        pnlResultSpan.style.color = profitLoss >= 0 ? '#28a745' : '#dc3545';
        return profitLoss;
    }

    calculatePnlBtn.addEventListener('click', () => {
        calculateProfitLoss();
        showAlert(pnlResultSpan.parentElement, 'Profit or Loss calculated.', 'success');
    });

    // --- SALES ANALYSIS ---

    function renderSalesAnalysis() {
        renderBestSellersTable();
        if (dailyRevenueChartCtx) renderDailyRevenueChart();
        if (productRevenueChartCtx) renderProductRevenueChart();
        if (productDistributionChartCtx) renderProductDistributionChart();
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
        if (!dailyRevenueChartCtx) return; // Ensure context exists

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
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    borderColor: '#007bff',
                    tension: 0.3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#007bff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#343a40', font: { weight: 600 } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#343a40',
                            callback: function(value) { return formatCurrency(value); }
                        },
                        grid: { color: '#dee2e6' }
                    },
                    x: {
                        ticks: { color: '#343a40' },
                        grid: { color: '#dee2e6' }
                    }
                }
            }
        });
    }

    function renderProductRevenueChart() {
        if (!productRevenueChartCtx) return; // Ensure context exists

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
                        labels: { color: '#343a40', font: { weight: 600 } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#343a40',
                            callback: function(value) { return formatCurrency(value); }
                        },
                        grid: { color: '#dee2e6' }
                    },
                    x: {
                        ticks: { color: '#343a40' },
                        grid: { color: '#dee2e6' }
                    }
                }
            }
        });
    }

    function renderProductDistributionChart() {
        if (!productDistributionChartCtx) return; // Ensure context exists

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
                        labels: { color: '#343a40', font: { weight: 600 } }
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
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    alert('Excel file is empty or has no data rows after headers.');
                    return;
                }

                const headers = jsonData[0];
                const rows = jsonData.slice(1);

                if (type === 'inventory') {
                    if (!confirm('Importing inventory will OVERWRITE your current active inventory data. Deactivated products will remain. Are you sure?')) {
                        return;
                    }
                    const newInventoryItems = rows.map(row => {
                        const item = {};
                        headers.forEach((header, i) => { item[header] = row[i]; });
                        return {
                            id: String(item.id || generateId()),
                            name: String(item.name || '').trim(),
                            category: String(item.category || '').trim(),
                            cost: parseFloat(item.cost || 0),
                            price: parseFloat(item.price || 0),
                            stock: parseInt(item.stock || 0),
                            isActive: item.isActive !== undefined ? Boolean(item.isActive) : true
                        };
                    }).filter(item => item.name && item.category && !isNaN(item.cost) && !isNaN(item.price) && !isNaN(item.stock));

                    const existingInactive = inventory.filter(p => !p.isActive);
                    let combinedInventory = [...existingInactive];
                    const seenActiveNames = new Set(existingInactive.map(p => p.name.toLowerCase()));

                    newInventoryItems.forEach(newItem => {
                        if (!seenActiveNames.has(newItem.name.toLowerCase())) {
                            combinedInventory.push(newItem);
                            seenActiveNames.add(newItem.name.toLowerCase());
                        } else {
                            const existingActiveIndex = combinedInventory.findIndex(p => p.name.toLowerCase() === newItem.name.toLowerCase() && p.isActive);
                            if (existingActiveIndex !== -1) {
                                combinedInventory[existingActiveIndex] = newItem;
                            } else {
                                const inactiveIndex = combinedInventory.findIndex(p => p.name.toLowerCase() === newItem.name.toLowerCase() && !p.isActive);
                                if (inactiveIndex !== -1) {
                                    combinedInventory[inactiveIndex] = newItem;
                                } else {
                                    console.warn(`Skipping import of duplicate active product: ${newItem.name}`);
                                }
                            }
                        }
                    });

                    inventory = combinedInventory;
                    saveInventory();
                    renderInventoryTable();
                    populateSaleProductOptions();
                    populateCategoryFilters();
                    populateHppProductOptions();
                    showAlert(inventoryAlert, 'Inventory imported successfully! Duplicates by name might be updated or skipped.', 'success');

                } else if (type === 'sales') {
                    if (!confirm('Importing sales will ADD to your current sales data. Are you sure?')) {
                        return;
                    }
                    const newSalesItems = rows.map(row => {
                        const item = {};
                        headers.forEach((header, i) => { item[header] = row[i]; });
                        return {
                            id: String(item.id || generateId()),
                            productId: String(item.productId || ''),
                            quantity: parseInt(item.quantity || 0),
                            date: item.date || new Date().toISOString(),
                            customerPayment: parseFloat(item.customerPayment || 0),
                            change: parseFloat(item.change || 0),
                            totalSale: parseFloat(item.totalSale || 0)
                        };
                    }).filter(item => item.productId && !isNaN(item.quantity) && item.quantity > 0);

                    sales.push(...newSalesItems);
                    saveSales();
                    renderSalesTable();
                    renderFilteredSalesTable();
                    showAlert(salesAlert, 'Sales imported successfully!', 'success');
                }
            } catch (error) {
                console.error("Error importing Excel file:", error);
                showAlert(type === 'inventory' ? inventoryAlert : salesAlert, 'Failed to import Excel file. Please check the file format and ensure headers match.', 'danger');
            } finally {
                if (type === 'inventory') importInventoryFile.value = '';
                if (type === 'sales') importSalesFile.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // --- EVENT LISTENERS FOR EXPORT/IMPORT ---

    exportInventoryBtn.addEventListener('click', () => {
        const headers = ["id", "name", "category", "cost", "price", "stock", "isActive"];
        const dataToExport = inventory.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
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
                productName: product ? product.name : 'Product Not Found',
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

        // Set initial date filters for Transaction History to today
        const today = new Date();
        const formattedToday = today.toISOString().slice(0, 10);
        filterDateFrom.value = formattedToday;
        filterDateTo.value = formattedToday;
        currentFilterFromDate = new Date(formattedToday);
        currentFilterFromDate.setHours(0, 0, 0, 0);
        currentFilterToDate = new Date(formattedToday);
        currentFilterToDate.setHours(23, 59, 59, 999);

        // Get the initially active tab from HTML, or default to 'inventory'
        const initialActiveTabButton = document.querySelector('nav button.active');
        const initialTabName = initialActiveTabButton ? initialActiveTabButton.dataset.tab : 'inventory';

        // Render initial content for the determined active tab
        switchTab(initialTabName);

        // Set lastTransactionDetails to the very last sale if any, for initial receipt display
        if (sales.length > 0) {
            lastTransactionDetails = sales[sales.length - 1];
        }
        renderReceipt(); // Render initial receipt based on lastTransactionDetails or 'No sales'

        // Add event listeners for tab switching
        tabs.forEach(t => {
            t.addEventListener('click', () => switchTab(t.dataset.tab));
        });

        // Initial calculations and chart renders (these are also called by switchTab, but good to have a baseline on load)
        calculateHpp();
        calculateProfitLoss();
        renderSalesAnalysis();
    }

    // Jalankan inisialisasi ketika DOM sepenuhnya dimuat
    document.addEventListener('DOMContentLoaded', init);
})();

# Sales Management Application


![ss](https://github.com/user-attachments/assets/29722d83-4ee1-4dd1-9398-2bd0f5ce21e6)

## Overview

This is a comprehensive, modern, and user-friendly web-based Sales Management Application designed to help small businesses and individuals efficiently manage their product inventory, record sales transactions, generate receipts, calculate profit & loss, and gain insights through sales analysis. Built with vanilla HTML, CSS, and JavaScript, it offers a smooth user experience across various devices.

## Features

* **Inventory Management:**
    * Add, update, and manage product details (Name, Category, Cost, Selling Price, Stock).
    * "Soft delete" functionality to deactivate products while retaining historical sales data for analysis.
    * Export/Import inventory data to/from Excel (.xlsx) files.
* **Sales Transaction:**
    * Record new sales quickly, with automatic stock deduction.
    * Dynamic product selection filtered by category.
    * Input customer payment and calculate change.
    * Export/Import sales transaction data to/from Excel (.xlsx) files.
* **Transaction History & Receipts:**
    * View detailed history of all sales transactions.
    * Filter transactions by date range for easy lookup.
    * Generate and print professional-looking receipts for individual transactions, complete with store logo and details.
* **HPP (Cost of Goods Sold) Calculator:**
    * Calculate the total Cost of Goods Sold based on all recorded sales.
    * Integrated **Product Pricing Tools** to recommend selling prices based on target profit margins.
    * **Profit Margin Analysis** to calculate actual profit margin and absolute profit per unit for existing products.
    * **Target Profit Goal** calculator to estimate units needed or revenue required to achieve a specific profit target.
* **Profit & Loss Calculator:**
    * Quickly calculate overall sales revenue and net profit/loss.
* **Sales Analysis:**
    * Identify best-selling products by quantity.
    * Visualize daily revenue trends with an interactive line chart.
    * Analyze product sales by total revenue using a bar chart.
    * Understand revenue distribution across products with a pie chart.
* **Modern UI/UX:**
    * Clean, professional, and intuitive user interface.
    * Smooth animations and transitions for an enhanced user experience.
    * Fully responsive design, optimized for seamless usage on desktops, tablets, and mobile phones.
* **Local Storage:**
    * All data (inventory, sales) is stored locally in the browser's `localStorage`, meaning your data persists even if you close the browser.

## Technologies Used

* **HTML5:** For structuring the web content.
* **CSS3:** For styling, including modern design principles, responsiveness, and animations.
    * Utilizes CSS variables for easy theming and consistency.
    * Implements flexbox and media queries for robust responsiveness.
* **JavaScript (ES6+):** For all interactive functionalities and data management.
    * **Chart.js:** A powerful charting library for data visualization (graphs).
    * **SheetJS (xlsx):** A comprehensive library for reading and writing Excel spreadsheets.

## Getting Started

Follow these steps to set up and run the application on your local machine or via Replit.

### Local Setup

1.  **Clone the repository (or download the files):**
    If using Git:
    ```bash
    git clone [https://github.com/your-username/sales-app.git](https://github.com/your-username/sales-app.git) # Replace with your repo URL
    cd sales-app
    ```
    If downloading: Unzip the downloaded file into a folder (e.g., `sales-app`).

2.  **Navigate to the project directory:**
    Open your file explorer or terminal and go to the `sales-app` folder.

3.  **Open in browser:**
    Simply open the `index.html` file in your preferred web browser (e.g., Chrome, Firefox, Edge) by double-clicking it, or by dragging and dropping it into the browser window.

    *Note: Since this is a client-side application, no server setup is required for basic functionality.*

### Running on Replit

1.  **Go to Replit:** Visit [replit.com](https://replit.com/) and log in or sign up.
2.  **Create a New Repl:** Click on "Create Repl".
3.  **Select Template:** Choose "HTML, CSS, JS" as your template.
4.  **Name your Repl:** Give it a name (e.g., `sales-management-app`).
5.  **Copy Files:**
    * Open `index.html`, `style.css`, and `script.js` files within the Replit editor.
    * Delete their default content.
    * Copy and paste the respective code from this project into the Replit editor for each file.
6.  **Configure Run Command (if prompted):** If Replit asks for a run command, enter:
    ```bash
    python3 -m http.server 8000
    ```
7.  **Run:** Click the "Run" button. Your application should appear in the preview pane.

## Usage

1.  **Inventory:** Add your products, set costs, prices, and manage stock. Remember to provide a `Category` for each product.
2.  **Sales:** Record daily sales transactions. Select products, enter quantities, and input customer payments.
3.  **Transaction History:** Browse past sales, filter by date, and view/print individual receipts.
4.  **HPP Calculator:** Use the tools to calculate total HPP, get recommended selling prices, analyze profit margins, and set sales targets.
5.  **Profit & Loss:** See your overall financial performance.
6.  **Sales Analysis:** Gain insights into your best-selling products and revenue trends through interactive charts.
7.  **Export/Import:** Backup your data or populate it from external Excel files using the dedicated buttons in Inventory and Sales sections.

## Contribution

This project is open-source and welcomes contributions! If you have ideas for improvements, new features, or bug fixes, please follow these steps:

1.  **Fork the repository** (if it's hosted on GitHub).
2.  **Create a new branch:** `git checkout -b feature/your-feature-name` or `bugfix/issue-description`
3.  **Make your changes:** Implement your feature or fix the bug.
4.  **Test your changes thoroughly.**
5.  **Commit your changes:** `git commit -m "feat: Add new feature X" ` or `fix: Resolve bug Y`
6.  **Push to your branch:** `git push origin feature/your-feature-name`
7.  **Open a Pull Request:** Describe your changes in detail and why they are beneficial.

We appreciate your support in making this application even better!

## License

This project is open-source and available under the [MIT License](LICENSE).
*(Note: You might need to create a LICENSE file in your repository if you want to explicitly state the MIT License.)*

---

/* =====================================================
   EXPENSE TRACKER - JAVASCRIPT FILE
   Handles all application logic and interactions
   ===================================================== */

// --------- DOM Elements ---------
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const typeRadios = document.querySelectorAll('input[name="type"]');
const dateInput = document.getElementById('date');
const addBtn = document.getElementById('addBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const transactionsList = document.getElementById('transactionsList');
const filterBtns = document.querySelectorAll('.filter-btn');

const totalBalanceEl = document.getElementById('totalBalance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');

// --------- Local Storage Key ---------
const STORAGE_KEY = 'expenseTrackerData';
let currentFilter = 'all'; // Track current filter state

// --------- Initialize Application ---------
document.addEventListener('DOMContentLoaded', function () {
    // Set today's date as default in date input
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Load data from LocalStorage on page load
    loadTransactions();

    // Update display
    updateDisplay();

    // Add event listeners
    addBtn.addEventListener('click', addTransaction);
    clearAllBtn.addEventListener('click', clearAllTransactions);

    // Add event listeners for filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            // Update filter and render
            currentFilter = this.getAttribute('data-filter');
            renderTransactions();
        });
    });

    // Allow adding transaction with Enter key
    descriptionInput.addEventListener('keypress', handleEnterKey);
    amountInput.addEventListener('keypress', handleEnterKey);
});

// --------- Data Structure ---------
let transactions = [];

// --------- Add Transaction Function ---------
/**
 * Adds a new transaction to the list
 * Validates input before adding
 */
function addTransaction() {
    // Get input values
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    const type = document.querySelector('input[name="type"]:checked').value;
    const date = dateInput.value;

    // Validation checks
    if (!description) {
        showAlert('Please enter a description', 'error');
        descriptionInput.focus();
        return;
    }

    if (!amount || amount <= 0) {
        showAlert('Please enter a valid amount', 'error');
        amountInput.focus();
        return;
    }

    if (!category) {
        showAlert('Please select a category', 'error');
        categorySelect.focus();
        return;
    }

    if (!date) {
        showAlert('Please select a date', 'error');
        dateInput.focus();
        return;
    }

    // Create transaction object
    const transaction = {
        id: Date.now(), // Unique ID using timestamp
        description: description,
        amount: amount,
        category: category,
        type: type,
        date: date,
        createdAt: new Date().toISOString()
    };

    // Add to transactions array
    transactions.unshift(transaction); // Add to beginning of array

    // Save to LocalStorage
    saveTransactions();

    // Clear form inputs
    resetForm();

    // Update display
    updateDisplay();

    // Show success message
    showAlert('Transaction added successfully!', 'success');
}

// --------- Delete Transaction Function ---------
/**
 * Deletes a transaction by its ID
 * @param {number} id - The transaction ID to delete
 */
function deleteTransaction(id) {
    // Confirm deletion
    if (confirm('Are you sure you want to delete this transaction?')) {
        // Filter out the transaction with the matching ID
        transactions = transactions.filter(t => t.id !== id);

        // Save to LocalStorage
        saveTransactions();

        // Update display
        updateDisplay();

        // Show success message
        showAlert('Transaction deleted successfully!', 'success');
    }
}

// --------- Clear All Transactions Function ---------
/**
 * Clears all transactions after confirmation
 */
function clearAllTransactions() {
    if (confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
        if (confirm('This will remove all your transaction history. Continue?')) {
            transactions = [];
            saveTransactions();
            updateDisplay();
            showAlert('All transactions cleared!', 'success');
        }
    }
}

// --------- Update Display Function ---------
/**
 * Updates all display elements with current data
 */
function updateDisplay() {
    // Calculate totals
    const totals = calculateTotals();

    // Update balance card
    totalBalanceEl.textContent = formatCurrency(totals.balance);

    // Update income display
    totalIncomeEl.textContent = formatCurrency(totals.income);

    // Update expense display
    totalExpenseEl.textContent = formatCurrency(totals.expense);

    // Change balance color based on positive or negative
    if (totals.balance < 0) {
        totalBalanceEl.style.color = '#ef4444'; // Red for negative
    } else if (totals.balance > 0) {
        totalBalanceEl.style.color = '#10b981'; // Green for positive
    } else {
        totalBalanceEl.style.color = '#ffffff'; // White for zero
    }

    // Render transactions list
    renderTransactions();
}

// --------- Calculate Totals Function ---------
/**
 * Calculates income, expense, and balance
 * @returns {Object} Object with income, expense, and balance
 */
function calculateTotals() {
    const totals = {
        income: 0,
        expense: 0,
        balance: 0
    };

    // Sum all transactions
    transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totals.income += transaction.amount;
        } else if (transaction.type === 'expense') {
            totals.expense += transaction.amount;
        }
    });

    // Calculate balance
    totals.balance = totals.income - totals.expense;

    return totals;
}

// --------- Render Transactions Function ---------
/**
 * Renders transactions to the DOM based on current filter
 */
function renderTransactions() {
    // Filter transactions based on current filter
    let filteredTransactions = transactions;

    if (currentFilter !== 'all') {
        filteredTransactions = transactions.filter(t => t.type === currentFilter);
    }

    // Clear the list
    transactionsList.innerHTML = '';

    // Check if there are no transactions
    if (filteredTransactions.length === 0) {
        transactionsList.innerHTML = '<p class="empty-message">No transactions yet. Add one to get started!</p>';
        return;
    }

    // Create and append transaction items
    filteredTransactions.forEach(transaction => {
        const transactionEl = createTransactionElement(transaction);
        transactionsList.appendChild(transactionEl);
    });
}

// --------- Create Transaction Element Function ---------
/**
 * Creates a DOM element for a transaction
 * @param {Object} transaction - The transaction object
 * @returns {HTMLElement} The transaction element
 */
function createTransactionElement(transaction) {
    // Create main container
    const div = document.createElement('div');
    div.className = `transaction-item ${transaction.type}`;
    div.setAttribute('data-id', transaction.id);

    // Format date
    const formattedDate = formatDate(transaction.date);

    // Create HTML content
    div.innerHTML = `
        <div class="transaction-content">
            <div class="transaction-info">
                <div class="transaction-description">${escapeHtml(transaction.description)}</div>
                <div class="transaction-meta">
                    <span class="transaction-category">${escapeHtml(transaction.category)}</span>
                    <span class="transaction-date">${formattedDate}</span>
                </div>
            </div>
            <div class="transaction-amount">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </div>
        </div>
        <button class="btn btn-delete" onclick="deleteTransaction(${transaction.id})">Delete</button>
    `;

    return div;
}

// --------- Save Transactions to LocalStorage ---------
/**
 * Saves all transactions to browser LocalStorage
 */
function saveTransactions() {
    try {
        const jsonData = JSON.stringify(transactions);
        localStorage.setItem(STORAGE_KEY, jsonData);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        showAlert('Failed to save transactions', 'error');
    }
}

// --------- Load Transactions from LocalStorage ---------
/**
 * Loads transactions from browser LocalStorage
 */
function loadTransactions() {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            transactions = JSON.parse(storedData);
            // Sort by date (newest first)
            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else {
            transactions = [];
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        transactions = [];
    }
}

// --------- Reset Form Function ---------
/**
 * Clears all form inputs to default values
 */
function resetForm() {
    descriptionInput.value = '';
    amountInput.value = '';
    categorySelect.value = '';
    document.querySelector('input[name="type"][value="income"]').checked = true;

    // Set date input to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Focus on description input
    descriptionInput.focus();
}

// --------- Utility Functions ---------

/**
 * Formats a number as currency (USD)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Formats a date string (YYYY-MM-DD to readable format)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', options);
}

/**
 * Shows an alert message (simple notification)
 * @param {string} message - The message to display
 * @param {string} type - Type: 'success', 'error', or 'info'
 */
function showAlert(message, type = 'info') {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    // Set background color based on type
    switch (type) {
        case 'success':
            alertDiv.style.background = '#10b981';
            break;
        case 'error':
            alertDiv.style.background = '#ef4444';
            break;
        default:
            alertDiv.style.background = '#6366f1';
    }

    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);

    // Remove alert after 3 seconds
    setTimeout(() => {
        alertDiv.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Handles pressing Enter key in input fields
 * @param {Event} event - The keyboard event
 */
function handleEnterKey(event) {
    if (event.key === 'Enter') {
        addTransaction();
    }
}

// --------- Add fadeOut animation ---------
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        to {
            opacity: 0;
            transform: translateX(20px);
        }
    }
`;
document.head.appendChild(style);

// --------- Export for potential module use ---------
// This allows the code to be used as a module if needed
window.expenseTracker = {
    addTransaction,
    deleteTransaction,
    clearAllTransactions,
    loadTransactions,
    saveTransactions,
    calculateTotals,
    getTransactions: () => transactions
};

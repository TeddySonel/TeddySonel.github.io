const { useState, useEffect } = React;
const { PlusCircle, DollarSign, TrendingUp, TrendingDown, Calendar, Trash2, Edit3, FileText, Target, Download } = lucideReact;

const BakeryTracker = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [editingId, setEditingId] = useState(null);

  // Income categories based on your data
  const incomeCategories = [
    'Cake Orders',
    'Classes',
    'Cooking',
    'Pastries',
    'Equipment Rental',
    'Mobile Money',
    'Other Income'
  ];

  // Expense categories organized by type
  const expenseCategories = {
    'Work Expenses': [
      'Electricity',
      'Gas',
      'Ingredients',
      'Transport',
      'Mobile Money Charges'
    ],
    'Operating Expenses': [
      'Rent 1',
      'Rent 2',
      'Oscar Salary',
      'Other Salaries',
      'Airtime',
      'Internet',
      'DSTV',
      'Food',
      'Fuel',
      'Car Maintenance',
      'Bank Charges',
      'Oven Maintenance',
      'Cleaning'
    ],
    'Non-Operating': [
      'Tithe',
      'Loan Payment',
      'Other'
    ]
  };

  const [formData, setFormData] = useState({
    type: 'income',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const savedTransactions = JSON.parse(localStorage.getItem('bakery-transactions') || '[]');
    const savedBudgets = JSON.parse(localStorage.getItem('bakery-budgets') || '{}');
    setTransactions(savedTransactions);
    setBudgets(savedBudgets);
  }, []);

  useEffect(() => {
    localStorage.setItem('bakery-transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('bakery-budgets', JSON.stringify(budgets));
  }, [budgets]);

  const handleSubmit = () => {
    if (!formData.category || !formData.amount) return;
    
    if (editingId) {
      setTransactions(transactions.map(t => 
        t.id === editingId 
          ? { ...formData, id: editingId, amount: parseFloat(formData.amount) }
          : t
      ));
      setEditingId(null);
    } else {
      const newTransaction = {
        ...formData,
        id: Date.now(),
        amount: parseFloat(formData.amount)
      };
      setTransactions([newTransaction, ...transactions]);
    }
    setFormData({
      type: 'income',
      category: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleEdit = (transaction) => {
    setFormData({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: transaction.date
    });
    setEditingId(transaction.id);
    setActiveTab('add');
  };

  const handleDelete = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const exportToExcel = () => {
    const csvContent = [
      ['Date', 'Type', 'Category', 'Amount', 'Description'],
      ...transactions.map(t => [
        t.date,
        t.type,
        t.category,
        t.amount,
        t.description || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bakery-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getMonthlyReport = (month) => {
    const monthData = transactions.filter(t => t.date.startsWith(month));
    const totals = calculateTotals(monthData);
    
    const incomeByCategory = {};
    const expensesByCategory = {};
    
    monthData.forEach(t => {
      if (t.type === 'income') {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      } else {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      }
    });

    return { ...totals, incomeByCategory, expensesByCategory, transactionCount: monthData.length };
  };

  const getBudgetStatus = (category, currentMonth) => {
    const budget = budgets[`${currentMonth}-${category}`];
    if (!budget) return null;
    
    const spent = transactions
      .filter(t => t.date.startsWith(currentMonth) && t.category === category && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const percentage = (spent / budget) * 100;
    return { budget, spent, percentage, remaining: budget - spent };
  };

  const getCurrentMonthData = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return transactions.filter(t => t.date.startsWith(currentMonth));
  };

  const calculateTotals = (data = transactions) => {
    const income = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, profit: income - expenses };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const currentMonthData = getCurrentMonthData();
  const monthlyTotals = calculateTotals(currentMonthData);

  const ReportsTab = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const report = getMonthlyReport(selectedMonth);

    return React.createElement('div', { className: 'space-y-6' },
      React.createElement('div', { className: 'flex justify-between items-center' },
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Select Month'),
          React.createElement('input', {
            type: 'month',
            value: selectedMonth,
            onChange: (e) => setSelectedMonth(e.target.value),
            className: 'p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
          })
        ),
        React.createElement('button', {
          onClick: exportToExcel,
          className: 'flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700'
        },
          React.createElement(Download, { className: 'h-4 w-4' }),
          React.createElement('span', null, 'Export to CSV')
        )
      ),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
        React.createElement('div', { className: 'bg-green-50 border border-green-200 p-4 rounded-lg' },
          React.createElement('h3', { className: 'font-semibold text-green-800' }, 'Total Income'),
          React.createElement('p', { className: 'text-2xl font-bold text-green-900' }, formatCurrency(report.income))
        ),
        React.createElement('div', { className: 'bg-red-50 border border-red-200 p-4 rounded-lg' },
          React.createElement('h3', { className: 'font-semibold text-red-800' }, 'Total Expenses'),
          React.createElement('p', { className: 'text-2xl font-bold text-red-900' }, formatCurrency(report.expenses))
        ),
        React.createElement('div', { className: 'bg-blue-50 border border-blue-200 p-4 rounded-lg' },
          React.createElement('h3', { className: 'font-semibold text-blue-800' }, 'Net Profit'),
          React.createElement('p', {
            className: `text-2xl font-bold ${report.profit >= 0 ? 'text-blue-900' : 'text-red-900'}`
          }, formatCurrency(report.profit))
        ),
        React.createElement('div', { className: 'bg-gray-50 border border-gray-200 p-4 rounded-lg' },
          React.createElement('h3', { className: 'font-semibold text-gray-800' }, 'Transactions'),
          React.createElement('p', { className: 'text-2xl font-bold text-gray-900' }, report.transactionCount)
        )
      ),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
        React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
          React.createElement('h3', { className: 'text-lg font-semibold mb-4 text-green-700' }, 'Income Breakdown'),
          React.createElement('div', { className: 'space-y-2' },
            Object.entries(report.incomeByCategory).map(([category, amount]) =>
              React.createElement('div', {
                key: category,
                className: 'flex justify-between items-center py-2 border-b'
              },
                React.createElement('span', { className: 'font-medium' }, category),
                React.createElement('span', { className: 'text-green-600 font-bold' }, formatCurrency(amount))
              )
            )
          )
        ),
        React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
          React.createElement('h3', { className: 'text-lg font-semibold mb-4 text-red-700' }, 'Expense Breakdown'),
          React.createElement('div', { className: 'space-y-2' },
            Object.entries(report.expensesByCategory).map(([category, amount]) =>
              React.createElement('div', {
                key: category,
                className: 'flex justify-between items-center py-2 border-b'
              },
                React.createElement('span', { className: 'font-medium' }, category),
                React.createElement('span', { className: 'text-red-600 font-bold' }, formatCurrency(amount))
              )
            )
          )
        )
      )
    );
  };

  const BudgetTab = () => {
    const [budgetMonth, setBudgetMonth] = useState(new Date().toISOString().slice(0, 7));
    const [budgetCategory, setBudgetCategory] = useState('');
    const [budgetAmount, setBudgetAmount] = useState('');

    const addBudget = () => {
      if (!budgetCategory || !budgetAmount) return;
      
      const key = `${budgetMonth}-${budgetCategory}`;
      setBudgets(prev => ({
        ...prev,
        [key]: parseFloat(budgetAmount)
      }));
      
      setBudgetCategory('');
      setBudgetAmount('');
    };

    const getAllExpenseCategories = () => {
      return Object.values(expenseCategories).flat();
    };

    return React.createElement('div', { className: 'space-y-6' },
      React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
        React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Set Budget'),
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Month'),
            React.createElement('input', {
              type: 'month',
              value: budgetMonth,
              onChange: (e) => setBudgetMonth(e.target.value),
              className: 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Category'),
            React.createElement('select', {
              value: budgetCategory,
              onChange: (e) => setBudgetCategory(e.target.value),
              className: 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
            },
              React.createElement('option', { value: '' }, 'Select category...'),
              getAllExpenseCategories().map(cat =>
                React.createElement('option', { key: cat, value: cat }, cat)
              )
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Budget Amount'),
            React.createElement('input', {
              type: 'number',
              value: budgetAmount,
              onChange: (e) => setBudgetAmount(e.target.value),
              className: 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
              placeholder: '0'
            })
          ),
          React.createElement('div', { className: 'flex items-end' },
            React.createElement('button', {
              onClick: addBudget,
              className: 'w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700'
            }, 'Set Budget')
          )
        )
      ),
      React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
        React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, `Budget Tracking - ${budgetMonth}`),
        React.createElement('div', { className: 'space-y-4' },
          getAllExpenseCategories().map(category => {
            const status = getBudgetStatus(category, budgetMonth);
            if (!status) return null;

            return React.createElement('div', { key: category, className: 'border rounded-lg p-4' },
              React.createElement('div', { className: 'flex justify-between items-center mb-2' },
                React.createElement('span', { className: 'font-medium' }, category),
                React.createElement('span', { className: 'text-sm text-gray-600' },
                  `${formatCurrency(status.spent)} / ${formatCurrency(status.budget)}`
                )
              ),
              React.createElement('div', { className: 'w-full bg-gray-200 rounded-full h-2' },
                React.createElement('div', {
                  className: `h-2 rounded-full transition-all ${
                    status.percentage > 100 ? 'bg-red-600' : 
                    status.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`,
                  style: { width: `${Math.min(status.percentage, 100)}%` }
                })
              ),
              React.createElement('div', { className: 'flex justify-between text-sm mt-1' },
                React.createElement('span', {
                  className: status.percentage > 100 ? 'text-red-600' : 'text-gray-600'
                }, `${status.percentage.toFixed(1)}% used`),
                React.createElement('span', {
                  className: status.remaining < 0 ? 'text-red-600' : 'text-green-600'
                },
                  `${status.remaining < 0 ? 'Over by ' : 'Remaining: '}${formatCurrency(Math.abs(status.remaining))}`
                )
              )
            );
          })
        )
      )
    );
  };

  const DashboardTab = () => React.createElement('div', { className: 'space-y-6' },
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
      React.createElement('div', { className: 'bg-green-50 border-l-4 border-green-400 p-4 rounded' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement(TrendingUp, { className: 'h-8 w-8 text-green-600' }),
          React.createElement('div', { className: 'ml-3' },
            React.createElement('p', { className: 'text-sm font-medium text-green-800' }, 'Monthly Income'),
            React.createElement('p', { className: 'text-2xl font-bold text-green-900' }, formatCurrency(monthlyTotals.income))
          )
        )
      ),
      React.createElement('div', { className: 'bg-red-50 border-l-4 border-red-400 p-4 rounded' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement(TrendingDown, { className: 'h-8 w-8 text-red-600' }),
          React.createElement('div', { className: 'ml-3' },
            React.createElement('p', { className: 'text-sm font-medium text-red-800' }, 'Monthly Expenses'),
            React.createElement('p', { className: 'text-2xl font-bold text-red-900' }, formatCurrency(monthlyTotals.expenses))
          )
        )
      ),
      React.createElement('div', {
        className: `${monthlyTotals.profit >= 0 ? 'bg-blue-50 border-blue-400' : 'bg-yellow-50 border-yellow-400'} border-l-4 p-4 rounded`
      },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement(DollarSign, {
            className: `h-8 w-8 ${monthlyTotals.profit >= 0 ? 'text-blue-600' : 'text-yellow-600'}`
          }),
          React.createElement('div', { className: 'ml-3' },
            React.createElement('p', {
              className: `text-sm font-medium ${monthlyTotals.profit >= 0 ? 'text-blue-800' : 'text-yellow-800'}`
            }, 'Monthly Profit'),
            React.createElement('p', {
              className: `text-2xl font-bold ${monthlyTotals.profit >= 0 ? 'text-blue-900' : 'text-yellow-900'}`
            }, formatCurrency(monthlyTotals.profit))
          )
        )
      )
    ),
    React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
      React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Recent Transactions'),
      React.createElement('div', { className: 'space-y-3' },
        transactions.slice(0, 10).map(transaction =>
          React.createElement('div', {
            key: transaction.id,
            className: 'flex justify-between items-center py-2 border-b'
          },
            React.createElement('div', null,
              React.createElement('span', { className: 'font-medium' }, transaction.category),
              React.createElement('p', { className: 'text-sm text-gray-600' }, transaction.description)
            ),
            React.createElement('div', { className: 'text-right' },
              React.createElement('span', {
                className: `font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`
              }, `${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}`),
              React.createElement('p', { className: 'text-sm text-gray-500' }, transaction.date)
            )
          )
        )
      )
    )
  );

  const AddTransactionTab = () => React.createElement('div', { className: 'max-w-md mx-auto' },
    React.createElement('div', { className: 'bg-white rounded-lg shadow p-6 space-y-4' },
      React.createElement('h3', { className: 'text-lg font-semibold' }, editingId ? 'Edit Transaction' : 'Add New Transaction'),
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Type'),
        React.createElement('select', {
          value: formData.type,
          onChange: (e) => setFormData({...formData, type: e.target.value, category: ''}),
          className: 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        },
          React.createElement('option', { value: 'income' }, 'Income'),
          React.createElement('option', { value: 'expense' }, 'Expense')
        )
      ),
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Category'),
        React.createElement('select', {
          value: formData.category,
          onChange: (e) => setFormData({...formData, category: e.target.value}),
          className: 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        },
          React.createElement('option', { value: '' }, 'Select category...'),
          formData.type === 'income' ? (
            incomeCategories.map(cat =>
              React.createElement('option', { key: cat, value: cat }, cat)
            )
          ) : (
            Object.entries(expenseCategories).map(([group, cats]) =>
              React.createElement('optgroup', { key: group, label: group },
                cats.map(cat =>
                  React.createElement('option', { key: cat, value: cat }, cat)
                )
              )
            )
          )
        )
      ),
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Amount (UGX)'),
        React.createElement('input', {
          type: 'number',
          value: formData.amount,
          onChange: (e) => setFormData({...formData, amount: e.target.value}),
          className: 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          placeholder: '0'
        })
      ),
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Description'),
        React.createElement('input', {
          type: 'text',
          value: formData.description,
          onChange: (e) => setFormData({...formData, description: e.target.value}),
          className: 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          placeholder: 'Optional details...'
        })
      ),
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Date'),
        React.createElement('input', {
          type: 'date',
          value: formData.date,
          onChange: (e) => setFormData({...formData, date: e.target.value}),
          className: 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        })
      ),
      React.createElement('button', {
        onClick: handleSubmit,
        className: 'w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium'
      }, editingId ? 'Update Transaction' : 'Add Transaction'),
      editingId && React.createElement('button', {
        onClick: () => {
          setEditingId(null);
          setFormData({
            type: 'income',
            category: '',
            amount: '',
            description: '',
            date: new Date().toISOString().split('T')[0]
          });
        },
        className: 'w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors'
      }, 'Cancel Edit')
    )
  );

  const HistoryTab = () => React.createElement('div', { className: 'space-y-4' },
    React.createElement('div', { className: 'bg-white rounded-lg shadow overflow-hidden' },
      React.createElement('div', { className: 'px-6 py-4 border-b' },
        React.createElement('h3', { className: 'text-lg font-semibold' }, 'All Transactions')
      ),
      React.createElement('div', { className: 'divide-y' },
        transactions.map(transaction =>
          React.createElement('div', {
            key: transaction.id,
            className: 'px-6 py-4 flex justify-between items-center hover:bg-gray-50'
          },
            React.createElement('div', { className: 'flex-1' },
              React.createElement('div', { className: 'flex items-center space-x-3' },
                React.createElement('span', {
                  className: `px-2 py-1 text-xs font-medium rounded-full ${
                    transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`
                }, transaction.type),
                React.createElement('span', { className: 'font-medium' }, transaction.category)
              ),
              React.createElement('p', { className: 'text-sm text-gray-600 mt-1' }, transaction.description),
              React.createElement('p', { className: 'text-xs text-gray-500' }, transaction.date)
            ),
            React.createElement('div', { className: 'flex items-center space-x-3' },
              React.createElement('span', {
                className: `font-bold text-lg ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`
              }, `${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}`),
              React.createElement('button', {
                onClick: () => handleEdit(transaction),
                className: 'text-blue-600 hover:text-blue-800 p-1'
              }, React.createElement(Edit3, { className: 'h-4 w-4' })),
              React.createElement('button', {
                onClick: () => handleDelete(transaction.id),
                className: 'text-red-600 hover:text-red-800 p-1'
              }, React.createElement(Trash2, { className: 'h-4 w-4' }))
            )
          )
        )
      )
    )
  );

  return React.createElement('div', { className: 'min-h-screen bg-gray-50' },
    React.createElement('div', { className: 'max-w-6xl mx-auto p-4' },
      React.createElement('div', { className: 'mb-8' },
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900' }, 'Bakery Business Tracker'),
        React.createElement('p', { className: 'text-gray-600' }, 'Manage your bakery income and expenses with ease')
      ),
      React.createElement('div', { className: 'mb-6' },
        React.createElement('nav', { className: 'flex space-x-4' },
          [
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'add', label: 'Add Transaction', icon: PlusCircle },
            { id: 'history', label: 'History', icon: Calendar },
            { id: 'reports', label: 'Reports', icon: FileText },
            { id: 'budget', label: 'Budget', icon: Target }
          ].map(tab =>
            React.createElement('button', {
              key: tab.id,
              onClick: () => setActiveTab(tab.id),
              className: `flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`
            },
              React.createElement(tab.icon, { className: 'h-5 w-5' }),
              React.createElement('span', null, tab.label)
            )
          )
        )
      ),
      activeTab === 'dashboard' && DashboardTab(),
      activeTab === 'add' && AddTransactionTab(),
      activeTab === 'history' && HistoryTab(),
      activeTab === 'reports' && ReportsTab(),
      activeTab === 'budget' && BudgetTab()
    )
  );
};

ReactDOM.render(React.createElement(BakeryTracker), document.getElementById('root'));

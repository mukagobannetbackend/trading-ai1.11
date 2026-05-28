// ==================== GLOBAL STATE ====================
let appState = {
    currentUser: null,
    currentPage: 'dashboard',
    trades: [],
    selectedTrade: null
};

// ==================== API HELPER ====================
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    const response = await fetch(endpoint, {
        ...defaultOptions,
        ...options
    });
    
    if (response.status === 401) {
        // Unauthorized, redirect to login
        window.location.href = '/';
        return null;
    }
    
    return response.json();
}

// ==================== LOAD CURRENT USER ====================
async function loadCurrentUser() {
    try {
        const data = await apiCall('/api/auth/me');
        if (data && data.user) {
            appState.currentUser = data.user;
            return true;
        } else {
            window.location.href = '/';
            return false;
        }
    } catch (error) {
        console.error('Error loading user:', error);
        return false;
    }
}

// ==================== LOAD TRADES ====================
async function loadTrades() {
    try {
        const data = await apiCall('/api/trades');
        if (data && data.trades) {
            appState.trades = data.trades;
            renderTradesList();
        }
    } catch (error) {
        console.error('Error loading trades:', error);
    }
}

// ==================== RENDER TRADES LIST ====================
function renderTradesList() {
    const container = document.getElementById('trades-list');
    if (!container) return;
    
    if (appState.trades.length === 0) {
        container.innerHTML = '<p class="empty-state">No trades logged yet. Start by completing a checklist!</p>';
        return;
    }
    
    container.innerHTML = appState.trades.map(trade => `
        <div class="trade-item" onclick="selectTrade(${trade.id})">
            <div class="trade-info">
                <div class="trade-pair">${trade.currency_pair}</div>
                <div class="trade-model">${trade.model_used}</div>
            </div>
            <div class="trade-result ${trade.result}">
                ${trade.result.toUpperCase()}
            </div>
            <div class="trade-date">${new Date(trade.created_at).toLocaleDateString()}</div>
        </div>
    `).join('');
}

// ==================== SELECT TRADE ====================
function selectTrade(tradeId) {
    const trade = appState.trades.find(t => t.id === tradeId);
    if (trade) {
        appState.selectedTrade = trade;
        renderTradeDetail();
    }
}

// ==================== RENDER TRADE DETAIL ====================
function renderTradeDetail() {
    const container = document.getElementById('trade-detail');
    if (!container || !appState.selectedTrade) return;
    
    const trade = appState.selectedTrade;
    container.innerHTML = `
        <div class="detail-header">
            <h3>${trade.currency_pair}</h3>
            <button class="btn-close" onclick="closeTradeDetail()">×</button>
        </div>
        <div class="detail-body">
            <div class="detail-row">
                <span>Model:</span>
                <span>${trade.model_used}</span>
            </div>
            <div class="detail-row">
                <span>Entry Price:</span>
                <span>${trade.entry_price || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span>Exit Price:</span>
                <span>${trade.exit_price || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span>Result:</span>
                <span class="result-badge ${trade.result}">${trade.result.toUpperCase()}</span>
            </div>
            <div class="detail-row">
                <span>Efficiency Score:</span>
                <span>${trade.efficiency_score || 0}%</span>
            </div>
            ${trade.notes ? `
                <div class="detail-section">
                    <h4>Notes</h4>
                    <p>${trade.notes}</p>
                </div>
            ` : ''}
            ${trade.ai_journal ? `
                <div class="detail-section">
                    <h4>AI Insights</h4>
                    <p>${trade.ai_journal}</p>
                </div>
            ` : ''}
        </div>
    `;
}

// ==================== CLOSE TRADE DETAIL ====================
function closeTradeDetail() {
    appState.selectedTrade = null;
    const container = document.getElementById('trade-detail');
    if (container) {
        container.innerHTML = '';
    }
}

// ==================== LOAD ANALYTICS ====================
async function loadAnalytics() {
    try {
        const [winRateData, modelData] = await Promise.all([
            apiCall('/api/analytics/win-rate'),
            apiCall('/api/analytics/model-comparison')
        ]);
        
        if (winRateData) {
            document.getElementById('win-rate-value').textContent = winRateData.win_rate.toFixed(1) + '%';
        }
        
        if (modelData) {
            document.getElementById('pullback-wr').textContent = modelData.pullback.win_rate.toFixed(1) + '%';
            document.getElementById('pullback-trades').textContent = modelData.pullback.trades;
            document.getElementById('protrend-wr').textContent = modelData.protrend.win_rate.toFixed(1) + '%';
            document.getElementById('protrend-trades').textContent = modelData.protrend.trades;
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// ==================== LOGOUT ====================
async function logout() {
    try {
        await apiCall('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

// ==================== NAVIGATE ====================
function navigateTo(page) {
    appState.currentPage = page;
    document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
    document.getElementById(`${page}-page`).style.display = 'block';
    
    // Update active nav
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    // Load page-specific data
    if (page === 'journal') {
        loadTrades();
    } else if (page === 'analytics') {
        loadAnalytics();
    }
}

// ==================== PAGE INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    const isLoggedIn = await loadCurrentUser();
    
    if (isLoggedIn && document.getElementById('dashboard-page')) {
        // Update user name in header
        const userNameEl = document.getElementById('user-name-display');
        if (userNameEl) {
            userNameEl.textContent = appState.currentUser.name || appState.currentUser.email;
        }
        
        // Load initial data
        loadTrades();
        loadAnalytics();
        
        // Setup navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const page = e.currentTarget.getAttribute('data-page');
                if (page) {
                    navigateTo(page);
                }
            });
        });
        
        // Set default page
        navigateTo('dashboard');
    }
});

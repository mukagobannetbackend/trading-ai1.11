// ==================== PULLBACK CHECKLIST ====================
async function submitPullbackChecklist(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        currency_pair: formData.get('currency_pair'),
        htf_direction_confirmed: formData.has('htf_direction_confirmed'),
        swing_range_marked: formData.has('swing_range_marked'),
        bos_mss_identified: formData.has('bos_mss_identified'),
        candle_marked: formData.has('candle_marked'),
        liquidity_sweep_detected: formData.has('liquidity_sweep_detected'),
        entry_zone_identified: formData.has('entry_zone_identified'),
        htf_direction: formData.get('htf_direction'),
        swing_high: parseFloat(formData.get('swing_high')) || null,
        swing_low: parseFloat(formData.get('swing_low')) || null,
        liquidity_type: formData.get('liquidity_type'),
        target_zone: formData.get('target_zone')
    };
    
    // Calculate efficiency score
    const checkedItems = Object.values(data).filter(v => v === true).length;
    const efficiency_score = (checkedItems / 6) * 100;
    data.efficiency_score = efficiency_score;
    
    try {
        const response = await apiCall('/api/pullback-checklist', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (response && response.success) {
            alert(`Checklist submitted! Efficiency Score: ${efficiency_score.toFixed(1)}%`);
            form.reset();
            navigateTo('dashboard');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to submit checklist');
    }
}

// ==================== PROTREND CHECKLIST ====================
async function submitProtrendChecklist(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        currency_pair: formData.get('currency_pair'),
        trend_direction_confirmed: formData.has('trend_direction_confirmed'),
        swing_range_marked: formData.has('swing_range_marked'),
        protected_low_marked: formData.has('protected_low_marked'),
        poi_reaction_detected: formData.has('poi_reaction_detected'),
        initial_mitigation_swept: formData.has('initial_mitigation_swept'),
        entry_zone_identified: formData.has('entry_zone_identified'),
        trend_direction: formData.get('trend_direction'),
        swing_high: parseFloat(formData.get('swing_high')) || null,
        swing_low: parseFloat(formData.get('swing_low')) || null,
        protected_low: parseFloat(formData.get('protected_low')) || null,
        target_zone: formData.get('target_zone')
    };
    
    // Calculate efficiency score
    const checkedItems = Object.values(data).filter(v => v === true).length;
    const efficiency_score = (checkedItems / 6) * 100;
    data.efficiency_score = efficiency_score;
    
    try {
        const response = await apiCall('/api/protrend-checklist', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (response && response.success) {
            alert(`Checklist submitted! Efficiency Score: ${efficiency_score.toFixed(1)}%`);
            form.reset();
            navigateTo('dashboard');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to submit checklist');
    }
}

// ==================== SCREENSHOT UPLOAD ====================
document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const screenshotInput = document.getElementById('screenshot-input');
    
    if (uploadArea && screenshotInput) {
        uploadArea.addEventListener('click', () => screenshotInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleScreenshotUpload(files[0]);
            }
        });
        
        screenshotInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleScreenshotUpload(e.target.files[0]);
            }
        });
    }
});

async function handleScreenshotUpload(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/screenshot', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            displayScreenshotAnalysis(data);
        } else {
            alert('Failed to upload screenshot');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error');
    }
}

function displayScreenshotAnalysis(analysis) {
    const container = document.getElementById('screenshot-analysis');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">AI Analysis Results</h2>
            </div>
            <div class="analysis-results">
                <div class="analysis-item">
                    <span>MSS Detected:</span>
                    <span class="badge ${analysis.mss_detected ? 'success' : 'neutral'}">
                        ${analysis.mss_detected ? 'Yes' : 'No'}
                    </span>
                </div>
                <div class="analysis-item">
                    <span>FVG Detected:</span>
                    <span class="badge ${analysis.fvg_detected ? 'success' : 'neutral'}">
                        ${analysis.fvg_detected ? 'Yes' : 'No'}
                    </span>
                </div>
                <div class="analysis-item">
                    <span>Liquidity Sweep:</span>
                    <span class="badge ${analysis.liquidity_sweep_detected ? 'success' : 'neutral'}">
                        ${analysis.liquidity_sweep_detected ? 'Yes' : 'No'}
                    </span>
                </div>
                <div class="analysis-item">
                    <span>HTF Bias:</span>
                    <span class="badge">${analysis.htf_bias || 'Neutral'}</span>
                </div>
                ${analysis.analysis_notes ? `
                    <div class="analysis-notes">
                        <h4>Analysis Notes</h4>
                        <p>${analysis.analysis_notes}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    container.style.display = 'block';
}

// ==================== UPDATE DASHBOARD STATS ====================
function updateDashboardStats() {
    if (!appState.trades) return;
    
    const totalTrades = appState.trades.length;
    const pullbackTrades = appState.trades.filter(t => t.model_used === 'Pullback Entry Model').length;
    const protrendTrades = appState.trades.filter(t => t.model_used === 'ProTrend Entry Model').length;
    const wins = appState.trades.filter(t => t.result === 'win').length;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;
    
    document.getElementById('total-trades').textContent = totalTrades;
    document.getElementById('win-rate-display').textContent = winRate + '%';
    document.getElementById('pullback-count').textContent = pullbackTrades;
    document.getElementById('protrend-count').textContent = protrendTrades;
    
    // Render recent trades
    const recentTradesList = document.getElementById('recent-trades-list');
    if (recentTradesList) {
        if (appState.trades.length === 0) {
            recentTradesList.innerHTML = '<p class="empty-state">No trades logged yet. Start by completing a checklist!</p>';
        } else {
            recentTradesList.innerHTML = appState.trades.slice(0, 5).map(trade => `
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
    }
}

// Override loadTrades to update dashboard
const originalLoadTrades = loadTrades;
loadTrades = async function() {
    await originalLoadTrades.call(this);
    updateDashboardStats();
};

// Update stats when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        updateDashboardStats();
    }, 500);
});

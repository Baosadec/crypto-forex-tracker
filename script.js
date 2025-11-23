const cryptoList = document.getElementById('crypto-list');
const forexList = document.getElementById('forex-list');
const lastUpdateEl = document.querySelector('.last-update');
const modal = document.getElementById('chart-modal');
const modalTitle = document.getElementById('modal-title');
const closeBtn = document.querySelector('.close');
let priceChart = null;

const coins = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', icon: 'fab fa-bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', icon: 'fab fa-ethereum' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', icon: 'fas fa-coins' },
    { id: 'solana', symbol: 'SOL', name: 'Solana', icon: 'fas fa-sun' },
    { id: 'ripple', symbol: 'XRP', name: 'XRP', icon: 'fas fa-water' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', icon: 'fas fa-cube' }
];

const forexPairs = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'VND'];

// Đóng modal
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };

// Mở biểu đồ
function openChart(coin) {
    modalTitle.innerHTML = `${coin.icon ? `<i class="${coin.icon}"></i>` : ''} ${coin.name} (${coin.symbol}) - Biểu đồ 7 ngày`;
    modal.style.display = 'block';
    loadChartData(coin.id, coin.name);
}

// Vẽ biểu đồ 7 ngày
async function loadChartData(coinId, coinName) {
    try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7&interval=daily`);
        const data = await res.json();
        const prices = data.prices;

        const labels = prices.map(p => new Date(p[0]).toLocaleDateString('vi-VN'));
        const values = prices.map(p => p[1]);

        const isUp = values[values.length - 1] > values[0];
        const color = isUp ? 'rgba(0, 255, 150, 0.8)' : 'rgba(255, 80, 100, 0.8)';

        if (priceChart) priceChart.destroy();

        priceChart = new Chart(document.getElementById('priceChart'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${coinName} Price (USD)`,
                    data: values,
                    borderColor: color,
                    backgroundColor: color.replace('0.8', '0.1'),
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => `$${ctx.parsed.y.toLocaleString('en-US', {minimumFractionDigits: 2})}`
                        }
                    }
                },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.1)' } },
                    y: { grid: { color: 'rgba(255,255,255,0.1)' } }
                }
            }
        });
    } catch (err) {
        console.error(err);
    }
}

// Cập nhật Crypto + click mở chart
async function updateCrypto() {
    try {
        const ids = coins.map(c => c.id).join(',');
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
        const data = await res.json();

        cryptoList.innerHTML = coins.map(coin => {
            const p = data[coin.id];
            const price = p.usd;
            const change = p.usd_24h_change;
            const isPositive = change >= 0;
            return `
                <div class="price-item" onclick='openChart(${JSON.stringify(coin)})'>
                    <div class="coin">
                        <i class="${coin.icon}"></i>
                        <div>
                            <div style="font-weight:700;">${coin.name}</div>
                            <small style="opacity:0.8;">${coin.symbol}</small>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div class="price">$${price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 6})}</div>
                        <div class="change ${isPositive ? 'positive' : 'negative'}">
                            ${isPositive ? 'Tăng' : 'Giảm'} ${Math.abs(change).toFixed(2)}%
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        cryptoList.innerHTML = `<p style="color:#ff4444;text-align:center;">Lỗi tải dữ liệu Crypto</p>`;
    }
}

// Cập nhật Forex
async function updateForex() {
    try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await res.json();
        const rates = data.rates;

        forexList.innerHTML = forexPairs.map(pair => {
            const rate = rates[pair];
            const formatted = (pair === 'JPY' || pair === 'VND') ? rate.toFixed(0) : rate.toFixed(4);
            return `
                <div class="price-item">
                    <div class="coin">
                        <i class="fas fa-exchange-alt"></i>
                        <div><strong>${pair}/USD</strong></div>
                    </div>
                    <div class="price">${formatted}</div>
                </div>
            `;
        }).join('');
    } catch (err) {
        forexList.innerHTML = `<p style="color:#ff4444;text-align:center;">Lỗi tải dữ liệu Forex</p>`;
    }
}

function updateTime() {
    const now = new Date().toLocaleString('vi-VN');
    lastUpdateEl.textContent = `Cập nhật lần cuối: ${now}`;
}

// Khởi chạy
updateCrypto();
updateForex();
updateTime();
setInterval(() => {
    updateCrypto();
    updateForex();
    updateTime();
}, 20000); // Cập nhật mỗi 20 giây

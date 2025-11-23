const cryptoList = document.getElementById('crypto-list');
const forexList = document.getElementById('forex-list');
const lastUpdateEl = document.querySelector('.last-update');
const modal = document.getElementById('chart-modal');
const modalTitle = document.getElementById('modal-title');
const closeBtn = document.querySelector('.close');
const chartSource = document.getElementById('chart-source');
const detailInfo = document.getElementById('detail-info');
let priceChart = null;

// Danh sách coin
const coins = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', icon: 'fab fa-bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', icon: 'fab fa-ethereum' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', icon: 'fas fa-coins' },
    { id: 'solana', symbol: 'SOL', name: 'Solana', icon: 'fas fa-sun' },
    { id: 'ripple', symbol: 'XRP', name: 'XRP', icon: 'fas fa-water' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', icon: 'fas fa-cube' }
];

const forexPairs = [
    { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
    { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
    { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
    { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' },
    { code: 'VND', name: 'Vietnamese Dong', flag: '🇻🇳' }
];

// Đóng modal
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };

// Tab trong modal
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    };
});

// Mở modal cho Crypto
function openCryptoChart(coin) {
    modalTitle.innerHTML = `${coin.icon ? `<i class="${coin.icon}"></i>` : ''} ${coin.name} (${coin.symbol})`;
    chartSource.textContent = "Nguồn: CoinGecko";
    loadCryptoChart(coin.id, coin.name);
    loadCryptoInfo(coin.id);
    modal.style.display = 'block';
}

// Mở modal cho Forex
function openForexChart(pair) {
    modalTitle.innerHTML = `${pair.flag} ${pair.name} (${pair.code}/USD)`;
    chartSource.textContent = "Nguồn: TradingView + Forex historical data";
    loadForexChart(pair.code);
    loadForexInfo(pair);
    modal.style.display = 'block';
}

// Biểu đồ Crypto
async function loadCryptoChart(coinId, coinName) {
    try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7&interval=daily`);
        const data = await res.json();
        renderChart(data.prices, `${coinName} Price (USD)`);
    } catch (err) { console.error(err); }
}

// Biểu đồ Forex (dùng TradingView public data)
async function loadForexChart(currency) {
    const symbol = currency === 'JPY' ? 'USDJPY' : `EURUSD`; // ví dụ đơn giản, có thể mở rộng
    const realSymbol = currency === 'VND' ? 'USDVND' : (currency === 'JPY' ? 'USDJPY' : currency + 'USD');
    const url = `https://api.allorigins.ml/get?url=${encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/' + realSymbol + '?range=7d&interval=1d')}`;
    
    try {
        const res = await fetch(url);
        const proxy = await res.json();
        const data = JSON.parse(proxy.contents);
        const timestamps = data.chart.result[0].timestamp;
        const prices = data.chart.result[0].indicators.quote[0].close;

        const chartData = timestamps.map((t, i) => [t * 1000, prices[i]]); // convert to ms
        renderChart(chartData, `${realSymbol.replace('USD', '')}/USD Rate`, currency === 'JPY' || currency === 'VND');
    } catch (err) {
        document.getElementById('priceChart').getContext('2d').fillText('Không tải được biểu đồ Forex', 20, 50);
    }
}

function renderChart(priceData, label, isInverted = false) {
    const labels = priceData.map(p => new Date(p[0]).toLocaleDateString('vi-VN'));
    const values = priceData.map(p => p[1]);

    const isUp = values[values.length - 1] > values[0];
    const color = isUp ? 'rgba(0, 255, 150, 0.8)' : 'rgba(255, 80, 100, 0.8)';

    if (priceChart) priceChart.destroy();
    priceChart = new Chart(document.getElementById('priceChart'), {
        type: 'line',
        data: { labels, datasets: [{ label, data: values, borderColor: color, backgroundColor: color.replace('0.8', '0.1'), fill: true, tension: 0.4 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { grid: { color: 'rgba(255,255,255,0.1)' } }, y: { grid: { color: 'rgba(255,255,255,0.1)' } } }
        }
    });
}

// Thông tin chi tiết Crypto
async function loadCryptoInfo(coinId) {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`);
    const d = await res.json();
    detailInfo.innerHTML = `
        <div class="info-item"><div class="info-label">Market Cap Rank</div><div class="info-value">#${d.market_cap_rank}</div></div>
        <div class="info-item"><div class="info-label">24h Volume</div><div class="info-value">$${d.market_data.total_volume.usd.toLocaleString()}</div></div>
        <div class="info-item"><div class="info-label">Circulating Supply</div><div class="info-value">${d.market_data.circulating_supply.toLocaleString()}</div></div>
        <div class="info-item"><div class="info-label">All-Time High</div><div class="info-value">$${d.market_data.ath.usd.toLocaleString()}</div></div>
    `;
}

// Thông tin chi tiết Forex
function loadForexInfo(pair) {
    detailInfo.innerHTML = `
        <div class="info-item"><div class="info-label">Cặp tiền</div><div class="info-value">${pair.code}/USD</div></div>
        <div class="info-item"><div class="info-label">Quốc gia</div><div class="info-value">${pair.name}</div></div>
        <div class="info-item"><div class="info-label">Tỷ giá hiện tại</div><div class="info-value">~ Đang cập nhật</div></div>
        <div class="info-item"><div class="info-label">Giao dịch 24/5</div><div class="info-value">Có</div></div>
    `;
}

// Cập nhật Crypto
async function updateCrypto() {
    const ids = coins.map(c => c.id).join(',');
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
    const data = await res.json();

    cryptoList.innerHTML = coins.map(coin => {
        const p = data[coin.id];
        const change = p.usd_24h_change.toFixed(2);
        return `
            <div class="price-item" onclick='openCryptoChart(${JSON.stringify(coin)})'>
                <div class="coin"><i class="${coin.icon}"></i>
                    <div><div style="font-weight:700;">${coin.name}</div><small>${coin.symbol}</small></div>
                </div>
                <div style="text-align:right;">
                    <div class="price">$${p.usd.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:6})}</div>
                    <div class="change ${change>=0?'positive':'negative'}">${change>=0?'Tăng':'Giảm'} ${Math.abs(change)}%</div>
                </div>
            </div>`;
    }).join('');
}

// Cập nhật Forex
async function updateForex() {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await res.json();
    const rates = data.rates;

    forexList.innerHTML = forexPairs.map(pair => {
        const rate = rates[pair.code];
        const formatted = (pair.code === 'JPY' || pair.code === 'VND') ? rate.toFixed(0) : rate.toFixed(5);
        return `
            <div class="price-item" onclick='openForexChart(${JSON.stringify(pair)})'>
                <div class="coin"><span style="font-size:1.8rem">${pair.flag}</span>
                    <div><strong>${pair.code}/USD</strong></div>
                </div>
                <div class="price">${formatted}</div>
            </div>`;
    }).join('');
}

function updateTime() {
    lastUpdateEl.textContent = `Cập nhật lần cuối: ${new Date().toLocaleString('vi-VN')}`;
}

// Khởi chạy
updateCrypto();
updateForex();
updateTime();
setInterval(() => { updateCrypto(); updateForex(); updateTime(); }, 20000);

const cryptoList = document.getElementById('crypto-list');
const forexList = document.getElementById('forex-list');
const lastUpdateEl = document.querySelector('.last-update');

const coins = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', icon: 'fab fa-bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', icon: 'fab fa-ethereum' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', icon: 'fas fa-coins' },
    { id: 'solana', symbol: 'SOL', name: 'Solana', icon: 'fas fa-sun' },
    { id: 'ripple', symbol: 'XRP', name: 'XRP', icon: 'fas fa-water' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', icon: 'fas fa-cube' }
];

const forexPairs = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'VND'];

async function updateCrypto() {
    try {
        const ids = coins.map(c => c.id).join(',');
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
        const data = await res.json();

        cryptoList.innerHTML = coins.map(coin => {
            const price = data[coin.id].usd;
            const change = data[coin.id].usd_24h_change;
            const isPositive = change >= 0;
            return `
                <div class="price-item">
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
                            ${isPositive ? '↑' : '↓'} ${Math.abs(change).toFixed(2)}%
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        cryptoList.innerHTML = `<p style="color:#ff4444;text-align:center;">Lỗi tải dữ liệu Crypto</p>`;
    }
}

async function updateForex() {
    try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await res.json();
        const rates = data.rates;

        forexList.innerHTML = forexPairs.map(pair => {
            const rate = rates[pair];
            const formatted = pair === 'JPY' || pair === 'VND' ? rate.toFixed(0) : rate.toFixed(4);
            return `
                <div class="price-item">
                    <div class="coin">
                        <i class="fas fa-exchange-alt"></i>
                        <div>
                            <strong>${pair}/USD</strong>
                        </div>
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

// Cập nhật ngay khi load
updateCrypto();
updateForex();
updateTime();

// Tự động cập nhật mỗi 20 giây (rất mượt)
setInterval(() => {
    updateCrypto();
    updateForex();
    updateTime();
}, 20000);
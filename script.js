const tableBody = document.getElementById("tableBody");
const tableHead = document.getElementById("tableHead");
const loading = document.getElementById("loading");
const tableContainer = document.getElementById("tableContainer");
const liveDot = document.getElementById("liveDot");
let priceChart = null;
let currentCoin = null;

// Proxy miễn phí để tránh CORS
const PROXY = "https://api.allorigins.win/get?url=";

// Load Crypto (CoinGecko + Binance Futures)
async function loadCrypto() {
    try {
        loading.style.display = "block";
        tableContainer.style.display = "none";

        const cgUrl = encodeURIComponent("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&price_change_percentage=24h");
        const binUrl = encodeURIComponent("https://fapi.binance.com/fapi/v1/premiumIndex");

        const [cgData, binData] = await Promise.all([
            fetch(PROXY + cgUrl).then(r => r.json()).then(d => JSON.parse(d.contents)),
            fetch(PROXY + binUrl).then(r => r.json())
        ]);

        const oiMap = {};
        binData.forEach(i => {
            const key = i.symbol.replace("USDT","").toLowerCase();
            oiMap[key] = {
                oi: parseFloat(i.openInterest) * parseFloat(i.markPrice),
                funding: parseFloat(i.lastFundingRate) * 100
            };
        });

        const coins = cgData.map((c, i) => {
            const key = c.symbol.toLowerCase();
            const oi = oiMap[key] || { oi: 0, funding: 0 };
            return {
                rank: i+1, id: c.id, name: c.name, symbol: c.symbol.toUpperCase(), image: c.image,
                price: c.current_price, change24h: c.price_change_percentage_24h || 0,
                volume24h: c.total_volume || 0, marketCap: c.market_cap || 0,
                oi: oi.oi, fundingRate: oi.funding
            };
        });

        renderTable(coins, "crypto");
        liveDot.style.color = "#00ff96";
    } catch (err) {
        loading.innerHTML = "Lỗi kết nối. Đang thử lại trong 10s...";
        setTimeout(loadCrypto, 10000);
    }
}

// Load Forex (ExchangeRate-API)
async function loadForex() {
    try {
        const url = encodeURIComponent("https://api.exchangerate-api.com/v4/latest/USD");
        const data = await fetch(PROXY + url).then(r => r.json()).then(d => JSON.parse(d.contents));
        const rates = data.rates;

        const pairs = [
            { symbol: "EUR/USD", rate: (1/rates.EUR).toFixed(5), change: ((Math.random()-0.5)*0.002).toFixed(5), changePercent: ((Math.random()-0.5)*0.5).toFixed(2) },
            { symbol: "GBP/USD", rate: (1/rates.GBP).toFixed(5), change: ((Math.random()-0.5)*0.002).toFixed(5), changePercent: ((Math.random()-0.5)*0.5).toFixed(2) },
            { symbol: "USD/JPY", rate: rates.JPY.toFixed(2), change: ((Math.random()-0.5)*2).toFixed(2), changePercent: ((Math.random()-0.5)*0.5).toFixed(2) },
            { symbol: "AUD/USD", rate: (1/rates.AUD).toFixed(5), change: ((Math.random()-0.5)*0.002).toFixed(5), changePercent: ((Math.random()-0.5)*0.5).toFixed(2) },
            { symbol: "USD/CAD", rate: rates.CAD.toFixed(5), change: ((Math.random()-0.5)*0.002).toFixed(5), changePercent: ((Math.random()-0.5)*0.5).toFixed(2) },
            { symbol: "USD/CHF", rate: rates.CHF.toFixed(5), change: ((Math.random()-0.5)*0.002).toFixed(5), changePercent: ((Math.random()-0.5)*0.5).toFixed(2) }
        ];

        renderTable(pairs, "forex");
    } catch (err) { setTimeout(loadForex, 10000); }
}

// Load Chứng khoán Mỹ (Yahoo Finance qua proxy)
async function loadStocks() {
    try {
        const symbols = ["%5ESPX", "%5EDJI", "%5EIXIC"];
        const data = await Promise.all(symbols.map(s =>
            fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${s}`).then(r => r.json())
        ));

        const stocks = data.map((d, i) => {
            const q = d.chart.result[0].meta;
            const name = i===0 ? "S&P 500" : i===1 ? "Dow Jones" : "Nasdaq";
            return {
                symbol: name,
                price: q.regularMarketPrice.toFixed(2),
                change: (q.regularMarketChange || 0).toFixed(2),
                changePercent: (q.regularMarketChangePercent || 0).toFixed(2)
            };
        });

        renderTable(stocks, "stocks");
    } catch (err) { setTimeout(loadStocks, 10000); }
}

// Render bảng chung
function renderTable(data, type) {
    if (type === "crypto") {
        tableHead.innerHTML = `<tr><th>#</th><th>Coin</th><th>Giá</th><th>24h%</th><th>Funding</th><th>Volume</th><th>Market Cap</th><th>OI</th></tr>`;
        tableBody.innerHTML = data.map((c, i) => `<tr onclick='openDetail(${JSON.stringify(c).replace(/'/g, "\\'")})'>
            <td>${i+1}</td>
            <td><img src="${c.image}" alt=""> <strong>${c.symbol}</strong></td>
            <td>$${c.price.toLocaleString()}</td>
            <td><span class="change ${c.change24h>=0?'positive':'negative'}">${c.change24h>=0?'+' : ''}${c.change24h.toFixed(2)}%</span></td>
            <td>${c.fundingRate.toFixed(4)}%</td>
            <td>$${formatNumber(c.volume24h)}</td>
            <td>$${formatNumber(c.marketCap)}</td>
            <td>$${formatNumber(c.oi)}</td>
        </tr>`).join('');
    }
    // Forex & Stocks render tương tự (bạn có thể mở rộng)

    loading.style.display = "none";
    tableContainer.style.display = "block";
}

// Tab
document.querySelectorAll(".tab").forEach(tab => {
    tab.onclick = () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        if (tab.dataset.type === "crypto") loadCrypto();
        if (tab.dataset.type === "forex") loadForex();
        if (tab.dataset.type === "stocks") loadStocks();
    };
});

// Khởi chạy + cập nhật mỗi 30s
loadCrypto();
setInterval(() => {
    const activeTab = document.querySelector(".tab.active").dataset.type;
    if (activeTab === "crypto") loadCrypto();
    if (activeTab === "forex") loadForex();
    if (activeTab === "stocks") loadStocks();
}, 30000);

const tableBody = document.getElementById("tableBody");
const tableHead = document.getElementById("tableHead");
const loading = document.getElementById("loading");
const tableContainer = document.getElementById("tableContainer");
const modal = document.getElementById("detailModal");
const closeBtn = document.querySelector(".close");
let priceChart = null;
let currentItem = null;

// Đóng modal
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

// Chuyển khung thời gian
document.querySelectorAll(".tf-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".tf-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        loadChart(currentItem, btn.dataset.days);
    };
});

// Mở modal chi tiết
function openDetail(item) {
    currentItem = item;
    document.getElementById("modalIcon").src = item.image || "https://via.placeholder.com/80";
    document.getElementById("modalName").textContent = item.name || item.symbol;
    document.getElementById("modalSymbol").textContent = item.symbol;

    document.getElementById("statPrice").textContent = "$" + (item.price || item.rate || 0).toLocaleString('en-US', {minimumFractionDigits: 2});
    document.getElementById("statChange").textContent = (item.change24h || item.changePercent || 0 >= 0 ? "+" : "") + (item.change24h || item.changePercent || 0).toFixed(2) + "%";
    document.getElementById("statChange").className = (item.change24h || item.changePercent || 0) >= 0 ? "positive" : "negative";
    document.getElementById("statHigh").textContent = "$" + (item.high || 0).toLocaleString();
    document.getElementById("statLow").textContent = "$" + (item.low || 0).toLocaleString();
    document.getElementById("statVolume").textContent = formatNumber(item.volume || 0);
    document.getElementById("statWeek").textContent = (item.change7d || 0 >= 0 ? "+" : "") + (item.change7d || 0).toFixed(2) + "%";

    modal.style.display = "block";
    loadChart(item, 7);
}

// Load biểu đồ (CoinGecko hoặc giả lập)
async function loadChart(item, days) {
    try {
        let url = item.id ? `https://api.coingecko.com/api/v3/coins/${item.id}/market_chart?vs_currency=usd&days=${days}` 
                          : `https://query1.finance.yahoo.com/v8/finance/chart/${item.symbol}=X?range=${days}d&interval=1h`;
        const res = await fetch(url);
        const data = await res.json();
        const prices = item.id ? data.prices : data.chart.result[0].indicators.quote[0].close;
        const timestamps = item.id ? data.prices.map(p => p[0]) : data.chart.result[0].timestamp;
        const labels = timestamps.map(t => new Date(t*1000).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}));
        const values = prices;
        const isUp = values[values.length-1] > values[0];

        if (priceChart) priceChart.destroy();
        priceChart = new Chart(document.getElementById("priceChart"), {
            type: 'line',
            data: { labels, datasets: [{ data: values, borderColor: isUp ? '#00ff96' : '#ff3366', backgroundColor: isUp ? 'rgba(0,255,150,0.15)' : 'rgba(255,51,102,0.15)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.1)' } } } }
        });
    } catch (err) { console.log("Chart error"); }
}

// Format số
function formatNumber(n) {
    if (n >= 1e12) return (n/1e12).toFixed(2)+"T";
    if (n >= 1e9) return (n/1e9).toFixed(2)+"B";
    if (n >= 1e6) return (n/1e6).toFixed(2)+"M";
    if (n >= 1e3) return (n/1e3).toFixed(2)+"K";
    return n.toFixed(2);
}

// Render bảng chung
function renderTable(data, type) {
    if (type === "crypto") {
        tableHead.innerHTML = `<tr><th>#</th><th>Coin</th><th>Giá</th><th>24h%</th><th>Volume</th><th>Market Cap</th></tr>`;
        tableBody.innerHTML = data.map((c, i) => `<tr onclick='openDetail(${JSON.stringify(c).replace(/'/g, "\\'")})'>
            <td>${i+1}</td>
            <td><img src="${c.image}" alt=""> <strong>${c.symbol}</strong></td>
            <td>$${c.price.toLocaleString()}</td>
            <td><span class="change ${c.change24h>=0?'positive':'negative'}">${c.change24h>=0?'+' : ''}${c.change24h.toFixed(2)}%</span></td>
            <td>$${formatNumber(c.volume24h)}</td>
            <td>$${formatNumber(c.marketCap)}</td>
        </tr>`).join('');
    } else if (type === "forex") {
        tableHead.innerHTML = `<tr><th>Cặp</th><th>Giá</th><th>24h%</th><th>High</th><th>Low</th><th>Volume</th></tr>`;
        tableBody.innerHTML = data.map(p => `<tr onclick='openDetail(${JSON.stringify(p).replace(/'/g, "\\'")})'>
            <td><strong>${p.symbol}</strong></td>
            <td>${p.rate}</td>
            <td><span class="change ${p.change>=0?'positive':'negative'}">${p.change>=0?'+' : ''}${p.change}%</span></td>
            <td>${p.high}</td>
            <td>${p.low}</td>
            <td>${p.volume}</td>
        </tr>`).join('');
    } else if (type === "stocks") {
        tableHead.innerHTML = `<tr><th>Chỉ số</th><th>Giá</th><th>Thay đổi</th><th>%</th><th>Volume</th></tr>`;
        tableBody.innerHTML = data.map(s => `<tr onclick='openDetail(${JSON.stringify(s).replace(/'/g, "\\'")})'>
            <td><strong>${s.symbol}</strong></td>
            <td>$${s.price.toLocaleString()}</td>
            <td><span class="change ${s.changePercent>=0?'positive':'negative'}">${s.change.toLocaleString()}</span></td>
            <td><span class="change ${s.changePercent>=0?'positive':'negative'}">${s.changePercent.toFixed(2)}%</span></td>
            <td>${formatNumber(s.volume)}</td>
        </tr>`).join('');
    }
    loading.style.display = "none";
    tableContainer.style.display = "block";
}

// Load Crypto
async function loadCrypto() {
    try {
        const [cg, bin] = await Promise.all([
            fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=30&page=1&price_change_percentage=24h").then(r=>r.json()),
            fetch("https://fapi.binance.com/fapi/v1/premiumIndex").then(r=>r.json())
        ]);
        const oiMap = {};
        bin.forEach(i => oiMap[i.symbol.replace("USDT","").toLowerCase()] = parseFloat(i.lastFundingRate)*100);
        const data = cg.map((c,i) => ({
            id: c.id, name: c.name, symbol: c.symbol.toUpperCase(), image: c.image,
            price: c.current_price, change24h: c.price_change_percentage_24h || 0,
            volume24h: c.total_volume || 0, marketCap: c.market_cap || 0,
            fundingRate: oiMap[c.symbol.toLowerCase()] || 0
        }));
        renderTable(data, "crypto");
    } catch (err) { setTimeout(loadCrypto, 10000); }
}

// Load Forex + Vàng
async function loadForexAndGold() {
    try {
        const [forex, gold] = await Promise.all([
            fetch("https://api.exchangerate-api.com/v4/latest/USD").then(r=>r.json()),
            fetch("https://query1.finance.yahoo.com/v8/finance/chart/XAUUSD=X").then(r=>r.json())
        ]);
        const rates = forex.rates;
        const goldData = gold.chart.result[0].meta;
        const goldPrice = goldData.regularMarketPrice.toFixed(2);
        const goldChange = ((goldPrice - goldData.previousClose) / goldData.previousClose * 100).toFixed(2);

        const data = [
            { symbol: "XAU/USD", name: "Vàng", rate: goldPrice, change: goldChange, high: goldData.chartHigh?.toFixed(2), low: goldData.chartLow?.toFixed(2), volume: "N/A" },
            { symbol: "EUR/USD", rate: (1/rates.EUR).toFixed(5), change: ((Math.random()-0.5)*0.3).toFixed(2), high: (1/rates.EUR*1.001).toFixed(5), low: (1/rates.EUR*0.999).toFixed(5), volume: "123M" },
            { symbol: "GBP/USD", rate: (1/rates.GBP).toFixed(5), change: ((Math.random()-0.5)*0.3).toFixed(2), high: (1/rates.GBP*1.001).toFixed(5), low: (1/rates.GBP*0.999).toFixed(5), volume: "89M" },
            { symbol: "USD/JPY", rate: rates.JPY.toFixed(2), change: ((Math.random()-0.5)*1).toFixed(2), high: (rates.JPY*1.001).toFixed(2), low: (rates.JPY*0.999).toFixed(2), volume: "210M" }
        ];
        renderTable(data, "forex");
    } catch (err) { setTimeout(loadForexAndGold, 10000); }
}

// Load Chứng khoán Mỹ
async function loadStocks() {
    try {
        const symbols = ["%5ESPX", "%5EDJI", "%5EIXIC"];
        const data = await Promise.all(symbols.map(s => fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${s}`).then(r=>r.json())));
        const stocks = data.map((d,i) => {
            const q = d.chart.result[0].meta;
            const name = i===0?"S&P 500":i===1?"Dow Jones":"Nasdaq";
            return { symbol: name, price: q.regularMarketPrice.toFixed(2), change: (q.regularMarketChange||0).toFixed(2), changePercent: (q.regularMarketChangePercent||0).toFixed(2), volume: q.regularMarketVolume||0 };
        });
        renderTable(stocks, "stocks");
    } catch (err) { setTimeout(loadStocks, 10000); }
}

// Tab
document.querySelectorAll(".tab").forEach(tab => {
    tab.onclick = () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        loading.style.display = "block";
        tableContainer.style.display = "none";
        if (tab.dataset.type === "crypto") loadCrypto();
        if (tab.dataset.type === "forex") loadForexAndGold();
        if (tab.dataset.type === "stocks") loadStocks();
    };
});

// Khởi chạy
loadCrypto();
setInterval(() => {
    const active = document.querySelector(".tab.active").dataset.type;
    if (active === "crypto") loadCrypto();
    if (active === "forex") loadForexAndGold();
    if (active === "stocks") loadStocks();
}, 30000);

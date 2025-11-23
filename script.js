const tableBody = document.getElementById("tableBody");
const tableHead = document.getElementById("tableHead");
const loading = document.getElementById("loading");
const tableContainer = document.getElementById("tableContainer");
const modal = document.getElementById("detailModal");
const closeBtn = document.querySelector(".close");
let priceChart = null;
let currentCoin = null;

// Đóng modal
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

// Chuyển khung thời gian
document.querySelectorAll(".tf-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".tf-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        loadChart(currentCoin, btn.dataset.days);
    };
});

// Mở modal
function openDetail(coin) {
    currentCoin = coin;
    document.getElementById("modalIcon").src = coin.image;
    document.getElementById("modalName").textContent = coin.name;
    document.getElementById("modalSymbol").textContent = coin.symbol.toUpperCase();
    document.getElementById("statPrice").textContent = "$" + coin.price.toLocaleString('en-US', {minimumFractionDigits: 2});
    document.getElementById("statChange").textContent = (coin.change24h >= 0 ? "+" : "") + coin.change24h.toFixed(2) + "%";
    document.getElementById("statChange").className = coin.change24h >= 0 ? "positive" : "negative";
    document.getElementById("statMarketCap").textContent = "$" + formatNumber(coin.marketCap);
    document.getElementById("statVolume").textContent = "$" + formatNumber(coin.volume24h);
    document.getElementById("statOI").textContent = "$" + formatNumber(coin.oi || 0);
    document.getElementById("statFunding").textContent = (coin.fundingRate || 0).toFixed(4) + "%";

    modal.style.display = "block";
    loadChart(coin, 7);
}

// Load biểu đồ
async function loadChart(coin, days) {
    try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=${days}`);
        const data = await res.json();
        const prices = data.prices;
        const labels = prices.map(p => new Date(p[0]).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}));
        const values = prices.map(p => p[1]);
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

// Render bảng Crypto
function renderCrypto(coins) {
    tableHead.innerHTML = `<tr>
        <th>#</th><th>Coin</th><th>Giá</th><th>24h%</th><th>Funding</th><th>Volume</th><th>Market Cap</th><th>OI</th>
    </tr>`;
    tableBody.innerHTML = "";
    coins.forEach((c, i) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${i+1}</td>
            <td><img src="${c.image}" alt=""> <strong>${c.symbol.toUpperCase()}</strong></td>
            <td>$${c.price.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:6})}</td>
            <td><span class="change ${c.change24h>=0?'positive':'negative'}">${c.change24h>=0?'+' : ''}${c.change24h.toFixed(2)}%</span></td>
            <td>${c.fundingRate?.toFixed(4)||'0.0000'}%</td>
            <td>$${formatNumber(c.volume24h)}</td>
            <td>$${formatNumber(c.marketCap)}</td>
            <td>$${formatNumber(c.oi||0)}</td>
        `;
        row.onclick = () => openDetail(c);
        tableBody.appendChild(row);
    });
    loading.style.display = "none";
    tableContainer.style.display = "block";
}

// Lấy dữ liệu Crypto
async function loadCrypto() {
    try {
        loading.style.display = "block";
        tableContainer.style.display = "none";

        const [cg, bin] = await Promise.all([
            fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&price_change_percentage=24h").then(r=>r.json()),
            fetch("https://fapi.binance.com/fapi/v1/premiumIndex").then(r=>r.json())
        ]);

        const oiMap = {};
        bin.forEach(i => {
            const key = i.symbol.replace("USDT","").toLowerCase();
            oiMap[key] = { oi: parseFloat(i.openInterest)*parseFloat(i.markPrice), funding: parseFloat(i.lastFundingRate)*100 };
        });

        const data = cg.map(c => {
            const key = c.symbol.toLowerCase();
            const oi = oiMap[key] || { oi: 0, funding: 0 };
            return {
                id: c.id, name: c.name, symbol: c.symbol.toUpperCase(), image: c.image,
                price: c.current_price, change24h: c.price_change_percentage_24h || 0,
                volume24h: c.total_volume || 0, marketCap: c.market_cap || 0,
                oi: oi.oi, fundingRate: oi.funding
            };
        });

        renderCrypto(data);
    } catch (err) {
        loading.innerHTML = "Lỗi kết nối. Đang thử lại...";
        setTimeout(loadCrypto, 5000);
    }
}

// Tab
document.querySelectorAll(".tab").forEach(tab => {
    tab.onclick = () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        if (tab.dataset.type === "crypto") loadCrypto();
        // Forex & Stocks sẽ thêm sau
    };
});

// Khởi chạy
loadCrypto();
setInterval(loadCrypto, 30000);

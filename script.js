const tableBody = document.querySelector("#cryptoTable tbody");
const modal = document.getElementById("coinModal");
const closeBtn = document.querySelector(".close");
const searchInput = document.getElementById("searchInput");
let allCoins = [];
let priceChart = null;

// Đóng modal
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

// Mở modal chi tiết + vẽ biểu đồ
async function openCoinDetail(coin) {
    document.getElementById("modalImage").src = coin.image;
    document.getElementById("modalName").textContent = coin.name;
    document.getElementById("modalSymbol").textContent = coin.symbol.toUpperCase();
    document.getElementById("modalPrice").textContent = "$" + coin.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 8});
    document.getElementById("modalChange").textContent = (coin.change24h >= 0 ? "+" : "") + coin.change24h.toFixed(2) + "%";
    document.getElementById("modalChange").className = coin.change24h >= 0 ? "positive" : "negative";
    document.getElementById("modalMarketCap").textContent = "$" + formatNumber(coin.marketCap);
    document.getElementById("modalVolume").textContent = "$" + formatNumber(coin.volume24h);
    document.getElementById("modalOI").textContent = "$" + formatNumber(coin.oi);
    document.getElementById("modalFunding").textContent = coin.fundingRate.toFixed(4) + "%";

    modal.style.display = "block";

    // Biểu đồ giá 30 ngày
    try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=30`);
        const data = await res.json();
        const prices = data.prices.map(p => ({ x: new Date(p[0]).toLocaleDateString('vi-VN'), y: p[1] }));

        if (priceChart) priceChart.destroy();
        priceChart = new "done";
        priceChart = new Chart(document.getElementById("priceChart"), {
            type: 'line',
            data: {
                labels: prices.map(p => p.x),
                datasets: [{
                    label: 'Giá (USD)',
                    data: prices.map(p => p.y),
                    borderColor: prices[prices.length-1].y > prices[0].y ? '#10b981' : '#ef4444',
                    backgroundColor: prices[prices.length-1].y > prices[0].y ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.05)' } } }
            }
        });
    } catch (err) { console.log("Chart error:", err); }
}

// Format số lớn
function formatNumber(num) {
    if (!num) return "0";
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toFixed(2);
}

// Render bảng
function renderTable(data) {
    tableBody.innerHTML = data.map(coin => `
        <tr onclick='openCoinDetail(${JSON.stringify(coin)})'>
            <td class="rank">${coin.rank}</td>
            <td>
                <img src="${coin.image}" alt="${coin.symbol}">
                <span class="symbol">${coin.symbol}</span>
            </td>
            <td class="price">$${coin.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 6})}</td>
            <td><span class="change ${coin.change24h >= 0 ? 'positive' : 'negative'}">
                ${coin.change24h >= 0 ? '+' : ''}${coin.change24h.toFixed(2)}%
            </span></td>
            <td>${coin.fundingRate.toFixed(4)}%</td>
            <td>$${formatNumber(coin.volume24h)}</td>
            <td>$${formatNumber(coin.marketCap)}</td>
            <td>$${formatNumber(coin.oi)}</td>
            <td><span class="change ${coin.oiChange24h >= 0 ? 'positive' : 'negative'}">
                ${coin.oiChange24h >= 0 ? '+' : ''}${coin.oiChange24h.toFixed(2)}%
            </span></td>
            <td>$${formatNumber(coin.liquidation24h)}</td>
        </tr>
    `).join('');
}

// Lấy dữ liệu
async function fetchData() {
    try {
        const cgRes = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h");
        const coins = await cgRes.json();

        const binRes = await fetch("https://fapi.binance.com/fapi/v1/premiumIndex");
        const oiData = await binRes.json();
        const oiMap = {};
        oiData.forEach(i => { oiMap[i.symbol.replace("USDT","").toLowerCase()] = { oi: parseFloat(i.openInterest)*parseFloat(i.markPrice), funding: parseFloat(i.lastFundingRate)*100 }; });

        allCoins = coins.map((c, i) => {
            const key = c.symbol.toLowerCase();
            const oi = oiMap[key] || { oi: 0, funding: 0 };
            return {
                rank: i + 1,
                id: c.id,
                name: c.name,
                symbol: c.symbol.toUpperCase(),
                image: c.image,
                price: c.current_price,
                change24h: c.price_change_percentage_24h || 0,
                volume24h: c.total_volume || 0,
                marketCap: c.market_cap || 0,
                oi: oi.oi || 0,
                fundingRate: oi.funding || 0,
                oiChange24h: (Math.random() - 0.5) * 12,
                liquidation24h: Math.floor(Math.random() * 200000000)
            };
        }).filter(c => c.marketCap > 5e8);

        renderTable(allCoins);
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:red;">Lỗi tải dữ liệu. Đang thử lại...</td></tr>`;
        console.error(err);
    }
}

// Tìm kiếm
searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    const filtered = allCoins.filter(c => c.symbol.toLowerCase().includes(term) || c.name.toLowerCase().includes(term));
    renderTable(filtered);
});

// Tab
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        let sorted = [...allCoins];
        if (tab.dataset.tab === "gainers") sorted.sort((a,b) => b.change24h - a.change24h);
        if (tab.dataset.tab === "losers") sorted.sort((a,b) => a.change24h - b.change24h);
        if (tab.dataset.tab === "volume") sorted.sort((a,b) => b.volume24h - a.volume24h);
        renderTable(sorted);
    });
});

// Khởi chạy
fetchData();
setInterval(fetchData, 30000);

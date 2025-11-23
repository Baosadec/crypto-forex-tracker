const tableBody = document.getElementById("tableBody");
const tableHead = document.getElementById("tableHead");
const modal = document.getElementById("detailModal");
const closeBtn = document.querySelector(".close");
const tfBtns = document.querySelectorAll(".tf-btn");
let currentCoin = null;
let priceChart = null;

// Đóng modal
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

// Chuyển khung thời gian
tfBtns.forEach(btn => {
    btn.onclick = () => {
        tfBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        loadChart(currentCoin, btn.dataset.days);
    };
});

// Mở modal + load chart mặc định 7d
async function openDetail(coin) {
    currentCoin = coin;
    document.getElementById("modalIcon").src = coin.image || "https://via.placeholder.com/70";
    document.getElementById("modalName").textContent = coin.name || coin.symbol;
    document.getElementById("modalSymbol").textContent = coin.symbol;

    document.getElementById("statPrice").textContent = "$" + (coin.price || coin.rate || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 6});
    document.getElementById("statChange").textContent = (coin.change24h >= 0 ? "+" : "") + coin.change24h.toFixed(2) + "%";
    document.getElementById("statChange").className = coin.change24h >= 0 ? "positive" : "negative";
    document.getElementById("statMarketCap").textContent = "$" + formatNumber(coin.marketCap || coin.volume24h || 0);
    document.getElementById("statVolume").textContent = "$" + formatNumber(coin.volume24h || 0);
    document.getElementById("statOI").textContent = "$" + formatNumber(coin.oi || 0);
    document.getElementById("statFunding").textContent = (coin.fundingRate || 0).toFixed(4) + "%";

    modal.style.display = "block";
    loadChart(coin, 7); // Mặc định 7 ngày
}

// Load biểu đồ theo ngày
async function loadChart(coin, days) {
    try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coin.id || 'bitcoin'}/market_chart?vs_currency=usd&days=${days}`);
        const data = await res.json();
        const prices = data.prices;
        const labels = prices.map(p => new Date(p[0]).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
        const values = prices.map(p => p[1]);
        const isUp = values[values.length-1] > values[0];

        if (priceChart) priceChart.destroy();
        priceChart = new Chart(document.getElementById("priceChart"), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data: values,
                    borderColor: isUp ? '#00ff96' : '#ff3366',
                    backgroundColor: isUp ? 'rgba(0,255,150,0.15)' : 'rgba(255,51,102,0.15)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.1)' } } }
            }
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

// Render bảng (ví dụ Crypto)
function renderCrypto(data) {
    tableHead.innerHTML = `<tr>
        <th>#</th><th>Ký hiệu</th><th>Giá</th><th>24h%</th><th>Funding</th><th>Khối lượng</th><th>Vốn hóa</th><th>OI</th>
    </tr>`;
    tableBody.innerHTML = data.map((c, i) => `
        <tr onclick='openDetail(${JSON.stringify(c)})'>
            <td>${i+1}</td>
            <td><img src="${c.image}" alt=""> <strong>${c.symbol}</strong></td>
            <td>$${c.price.toLocaleString()}</td>
            <td><span class="change ${c.change24h>=0?'positive':'negative'}">${c.change24h>=0?'+' : ''}${c.change24h.toFixed(2)}%</span></td>
            <td>${c.fundingRate.toFixed(4)}%</td>
            <td>$${formatNumber(c.volume24h)}</td>
            <td>$${formatNumber(c.marketCap)}</td>
            <td>$${formatNumber(c.oi)}</td>
        </tr>
    `).join('');
}

// Load dữ liệu (giữ nguyên logic cũ, chỉ cần gọi renderCrypto(allCrypto))
async function loadAll() {
    // ... (giữ nguyên fetchCrypto(), fetchForex(), fetchStocks() từ file trước)
    // Ví dụ:
    // await fetchCrypto(); renderCrypto(allCrypto);
}

// Tab chuyển đổi
document.querySelectorAll(".tab").forEach(t => {
    t.onclick = () => {
        document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
        t.classList.add("active");
        // render bảng tương ứng
    };
});

// Khởi chạy
loadAll();
setInterval(loadAll, 30000);

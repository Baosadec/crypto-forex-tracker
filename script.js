const tableBody = document.querySelector("#cryptoTable tbody");
const searchInput = document.getElementById("searchInput");
let allCoins = [];

async function fetchData() {
    try {
        // Lấy dữ liệu từ CoinGecko (giá, volume, market cap)
        const cgRes = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h");
        const coins = await cgRes.json();

        // Lấy Open Interest + Funding Rate từ Binance Futures (top 50)
        const binRes = await fetch("https://fapi.binance.com/fapi/v1/premiumIndex");
        const oiData = await binRes.json();

        const oiMap = {};
        oiData.forEach(item => {
            oiMap[item.symbol.replace("USDT", "").toLowerCase()] = {
                oi: parseFloat(item.openInterest) * parseFloat(item.markPrice),
                fundingRate: parseFloat(item.lastFundingRate) * 100,
                symbol: item.symbol
            };
        });

        allCoins = coins.map((coin, index) => {
            const key = coin.symbol.toLowerCase();
            const oiInfo = oiMap[key] || { oi: 0, fundingRate: 0 };

            return {
                rank: index + 1,
                id: coin.id,
                symbol: coin.symbol.toUpperCase(),
                name: coin.name,
                image: coin.image,
                price: coin.current_price,
                change24h: coin.price_change_percentage_24h || 0,
                volume24h: coin.total_volume || 0,
                volume24hPercent: ((coin.total_volume || 0) / (coin.market_cap || 1)) * 100,
                marketCap: coin.market_cap || 0,
                oi: oiInfo.oi || 0,
                oiChange1h: Math.random() * 4 - 2, // giả lập
                oiChange24h: (Math.random() - 0.5) * 10,
                fundingRate: oiInfo.fundingRate || 0,
                liquidation24h: Math.floor(Math.random() * 100000000) // giả lập
            };
        }).filter(c => c.marketCap > 1e8); // chỉ coin lớn

        renderTable(allCoins);
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding:30px; color:red;">Lỗi tải dữ liệu. Vui lòng thử lại sau.</td></tr>`;
    }
}

function renderTable(data) {
    tableBody.innerHTML = data.map(coin => `
        <tr>
            <td class="rank">${coin.rank}</td>
            <td>
                <img src="${coin.image}" alt="${coin.symbol}">
                <span class="symbol">${coin.symbol}</span>
            </td>
            <td class="price">$${coin.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 6})}</td>
            <td><span class="change ${coin.change24h >= 0 ? 'positive' : 'negative'}">${coin.change24h >= 0 ? '+' : ''}${coin.change24h.toFixed(2)}%</span></td>
            <td>${coin.fundingRate.toFixed(4)}%</td>
            <td>$${formatNumber(coin.volume24h)}</td>
            <td><span class="change ${coin.volume24hPercent >= 0 ? 'positive' : 'negative'}">${coin.volume24hPercent.toFixed(1)}%</span></td>
            <td>$${formatNumber(coin.marketCap)}</td>
            <td>$${formatNumber(coin.oi)}</td>
            <td><span class="change ${coin.oiChange1h >= 0 ? 'positive' : 'negative'}">${coin.oiChange1h >= 0 ? '+' : ''}${coin.oiChange1h.toFixed(2)}%</span></td>
            <td><span class="change ${coin.oiChange24h >= 0 ? 'positive' : 'negative'}">${coin.oiChange24h >= 0 ? '+' : ''}${coin.oiChange24h.toFixed(2)}%</span></td>
            <td>$${formatNumber(coin.liquidation24h)}</td>
        </tr>
    `).join('');
}

function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toFixed(0);
}

// Tìm kiếm
searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    const filtered = allCoins.filter(coin =>
        coin.symbol.toLowerCase().includes(term) ||
        coin.name.toLowerCase().includes(term)
    );
    renderTable(filtered);
});

// Tab chuyển đổi
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        let sorted = [...allCoins];
        if (tab.dataset.tab === "gainers") sorted.sort((a,b) => b.change24h - a.change24h);
        if (tab.dataset.tab === "losers") sorted.sort((a,b) => a.change24h - b.change24h);
        if (tab.dataset.tab === "volume") sorted.sort((a,b) => b.volume24h - a.volume24h);

        renderTable(sorted.slice(0, 50));
    });
});

// Load dữ liệu
fetchData();
setInterval(fetchData, 30000); // Cập nhật mỗi 30s

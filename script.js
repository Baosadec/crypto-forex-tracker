const API_URL = "https://fapi.coinglass.com/api/hyperliquid/whale-tracker";

async function loadData() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        if (!data.data) throw new Error("No data");

        const { longPosition, shortPosition, longPnl, shortPnl, longFundingFee, shortFundingFee, whaleActivityList, longShortRatioList } = data.data;

        // Cập nhật vị thế & PnL
        document.getElementById("longPos").textContent = (longPosition / 1e9).toFixed(2);
        document.getElementById("shortPos").textContent = (shortPosition / 1e9).toFixed(2);
        document.getElementById("longPnl").textContent = Math.abs(longPnl / 1e6).toFixed(1);
        document.getElementById("shortPnl").textContent = Math.abs(shortPnl / 1e6).toFixed(1);
        document.getElementById("longFunding").textContent = Math.abs(longFundingFee / 1e6).toFixed(1);
        document.getElementById("shortFunding").textContent = (shortFundingFee / 1e6).toFixed(1);

        // Cập nhật bảng hoạt động cá voi
        const tbody = document.querySelector("#whaleTable tbody");
        tbody.innerHTML = whaleActivityList.slice(0, 10).map(item => `
            <tr>
                <td><small>${item.txHash.slice(0,8)}...</small></td>
                <td><strong>${item.symbol}</strong></td>
                <td class="${item.side === 'LONG' ? 'green' : 'red'}">${item.side === 'LONG' ? 'Open Long' : 'Open Short'}</td>
                <td>$${Number(item.position).toLocaleString()}</td>
                <td>$${Number(item.price).toFixed(2)}</td>
                <td>${new Date(item.createTime).toLocaleTimeString('vi-VN')}</td>
            </tr>
        `).join('');

        // Cập nhật Long/Short Ratio
        const ratioContainer = document.getElementById("ratioList");
        ratioContainer.innerHTML = longShortRatioList.slice(0, 8).map(item => `
            <div class="ratio-item">
                <span>${item.symbol}</span>
                <div class="bar">
                    <div class="long" style="width:${item.longRate}%">${item.longRate.toFixed(1)}%</div>
                    <div class="short" style="width:${item.shortRate}%">${item.shortRate.toFixed(1)}%</div>
                </div>
            </div>
        `).join('');

        // Cập nhật thời gian
        document.querySelector(".last-update").innerHTML = 
            `Cập nhật lúc: ${new Date().toLocaleString('vi-VN')} <i class="fas fa-check-circle" style="color:#00ff9d"></i>`;

    } catch (err) {
        console.error("Lỗi:", err);
        document.querySelector(".last-update").innerHTML = "Lỗi tải dữ liệu - thử lại sau";
    }
}

// Load ngay và tự động cập nhật mỗi 20 giây
loadData();
setInterval(loadData, 20000);

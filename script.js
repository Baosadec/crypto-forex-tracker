const lastUpdateEl = document.querySelector('.last-update');
let ratioChart = null;

async function fetchHyperliquidData() {
    try {
        // Sử dụng proxy để fetch HTML từ CoinGlass (vì CORS)
        const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.coinglass.com/vi/hyperliquid');
        const response = await fetch(proxyUrl);
        const proxyData = await response.json();
        const html = proxyData.contents;

        // Parse dữ liệu (dùng regex/DOM parser đơn giản - giả sử cấu trúc HTML ổn định)
        // Lưu ý: Đây là ví dụ parse; bạn có thể điều chỉnh selector nếu HTML thay đổi
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Parse Positions/PnL (tìm elements với class như 'long-position', 'short-pnl'...)
        const longPos = doc.querySelector('[data-testid="long-position"]')?.textContent || 'N/A';
        const shortPos = doc.querySelector('[data-testid="short-position"]')?.textContent || 'N/A';
        const longPnl = doc.querySelector('[data-testid="long-pnl"]')?.textContent || 'N/A';
        const shortPnl = doc.querySelector('[data-testid="short-pnl"]')?.textContent || 'N/A';
        const longFunding = doc.querySelector('[data-testid="long-funding"]')?.textContent || 'N/A';
        const shortFunding = doc.querySelector('[data-testid="short-funding"]')?.textContent || 'N/A';

        // Parse Whale Activity (top 5 rows)
        const activityRows = doc.querySelectorAll('table tbody tr');
        const activity = Array.from(activityRows).slice(0, 5).map(row => {
            const cells = row.querySelectorAll('td');
            return {
                size: cells[0]?.textContent || '',
                pair: cells[1]?.textContent || '',
                action: cells[2]?.textContent || '',
                price: cells[3]?.textContent || '',
                time: cells[4]?.textContent || ''
            };
        });

        // Parse Ratios (ví dụ cho BTC, ETH...)
        const ratios = {
            btc: { long: parseFloat(doc.querySelector('#btc-long')?.textContent || 50), short: 100 - (parseFloat(doc.querySelector('#btc-long')?.textContent || 50)) },
            eth: { long: parseFloat(doc.querySelector('#eth-long')?.textContent || 50), short: 100 - (parseFloat(doc.querySelector('#eth-long')?.textContent || 50)) }
            // Thêm SOL, XRP... tương tự
        };

        // Cập nhật UI
        updateUI({ longPos, shortPos, longPnl, shortPnl, longFunding, shortFunding, activity, ratios });
    } catch (error) {
        console.error('Lỗi fetch dữ liệu:', error);
        document.querySelector('#activity-table tbody').innerHTML = '<tr><td colspan="5">Lỗi tải dữ liệu - Kiểm tra console</td></tr>';
    }
}

function updateUI(data) {
    // Cập nhật Positions
    document.getElementById('long-pos').textContent = (parseFloat(data.longPos) / 1000000000 || 0).toFixed(1);
    document.getElementById('short-pos').textContent = (parseFloat(data.shortPos) / 1000000000 || 0).toFixed(1);
    document.getElementById('long-pnl').textContent = (parseFloat(data.longPnl) / 1000000 || 0).toFixed(0);
    document.getElementById('short-pnl').textContent = (parseFloat(data.shortPnl) / 1000000 || 0).toFixed(0);
    document.getElementById('long-funding').textContent = (parseFloat(data.longFunding.replace('-', '')) / 1000000 || 0).toFixed(0);
    document.getElementById('short-funding').textContent = (parseFloat(data.shortFunding) / 1000000 || 0).toFixed(0);

    // Cập nhật Activity Table
    const tbody = document.querySelector('#activity-table tbody');
    tbody.innerHTML = data.activity.map(row => `
        <tr>
            <td>$${row.size}</td>
            <td>${row.pair}</td>
            <td class="${row.action.includes('Long') ? 'green' : 'red'}">${row.action}</td>
            <td>$${row.price}</td>
            <td>${row.time}</td>
        </tr>
    `).join('');

    // Cập nhật Ratio Bars
    document.getElementById('btc-long').style.width = data.ratios.btc.long + '%';
    document.getElementById('btc-short').style.width = data.ratios.btc.short + '%';
    document.getElementById('eth-long').style.width = data.ratios.eth.long + '%';
    document.getElementById('eth-short').style.width = data.ratios.eth.short + '%';

    // Vẽ Mini Chart cho Trader Ratio (dùng Chart.js)
    if (ratioChart) ratioChart.destroy();
    ratioChart = new Chart(document.getElementById('ratioChart'), {
        type: 'line',
        data: {
            labels: ['BTC', 'ETH', 'SOL'], // Mở rộng nếu có data
            datasets: [{
                label: 'Long Ratio',
                data: [data.ratios.btc.long, data.ratios.eth.long, 60], // Giả sử SOL
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    // Cập nhật thời gian
    document.querySelector('.last-update').innerHTML = `Cập nhật lúc: ${new Date().toLocaleString('vi-VN')} <i class="fas fa-check"></i>`;
}

// Khởi chạy & tự động
fetchHyperliquidData();
setInterval(fetchHyperliquidData, 30000); // Mỗi 30s

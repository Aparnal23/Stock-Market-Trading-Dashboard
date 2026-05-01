let chart, candleSeries;
let currentPrice = 0;
let previousPrice = 0;
let trades = [];

window.onload = async function () {
    try {
        createChart();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (chart) {
                const chartContainer = document.querySelector('.chart-container');
                chart.applyOptions({
                    width: chartContainer.clientWidth,
                    height: chartContainer.clientHeight
                });
            }
        });

        const data = await fetchData();
        if (data && data.length > 0) {
            startReplay(data);
        } else {
            document.getElementById('current-price').innerText = 'ERROR';
        }
    } catch (err) {
        console.error("Initialization error:", err);
        document.getElementById('current-price').innerText = 'CRASH';
        const logPanel = document.getElementById('log');
        if(logPanel) logPanel.innerHTML = `<div style="color:red">Error: ${err.message}</div>`;
    }
};

async function fetchData() {
    try {
        const res = await fetch("http://127.0.0.1:3000/data");
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch data:", e);
        return [];
    }
}

function createChart() {
    const chartContainer = document.querySelector('.chart-container');
    
    chart = LightweightCharts.createChart(document.getElementById("chart"), {
        autoSize: true,
        layout: {
            background: { type: 'solid', color: '#0b0e14' },
            textColor: '#8a919e',
        },
        grid: {
            vertLines: { color: '#2b313f' },
            horzLines: { color: '#2b313f' },
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
        },
        rightPriceScale: {
            borderColor: '#2b313f',
        },
        timeScale: {
            borderColor: '#2b313f',
            timeVisible: true,
            secondsVisible: false,
        },
    });

    candleSeries = chart.addCandlestickSeries({
        upColor: '#00ff88',
        downColor: '#ff3366',
        borderDownColor: '#ff3366',
        borderUpColor: '#00ff88',
        wickDownColor: '#ff3366',
        wickUpColor: '#00ff88',
    });
}

function startReplay(data) {
    // Set initial historical data except the last few for replay
    const historicalData = data.slice(0, data.length - 20);
    candleSeries.setData(historicalData);
    
    if (historicalData.length > 0) {
        updatePriceDisplay(historicalData[historicalData.length - 1].close);
    }
    
    let i = data.length - 20;
    
    // Replay remaining data slowly
    const interval = setInterval(() => {
        if (i >= data.length) {
            clearInterval(interval);
            // Once we reach the end, simulate live ticks on the last candle
            simulateLiveTicks(data[data.length - 1]);
            return;
        }

        const bar = data[i];
        candleSeries.update(bar);
        updatePriceDisplay(bar.close);
        i++;
    }, 1000);
}

function simulateLiveTicks(lastBar) {
    // Simulate real-time price updates based on the last bar
    let currentBar = { ...lastBar };
    
    setInterval(() => {
        const tick = (Math.random() - 0.5) * 1.5;
        currentBar.close = currentBar.close + tick;
        
        if (currentBar.close > currentBar.high) currentBar.high = currentBar.close;
        if (currentBar.close < currentBar.low) currentBar.low = currentBar.close;
        
        candleSeries.update(currentBar);
        updatePriceDisplay(currentBar.close);
    }, 500);
}

function updatePriceDisplay(price) {
    previousPrice = currentPrice;
    currentPrice = price;
    
    const priceElement = document.getElementById("current-price");
    priceElement.innerText = price.toFixed(2);
    
    if (currentPrice > previousPrice) {
        priceElement.className = "price-value price-up";
    } else if (currentPrice < previousPrice) {
        priceElement.className = "price-value price-down";
    }
}

function buy() {
    if (currentPrice === 0) return;
    trades.unshift({ 
        type: "BUY", 
        price: currentPrice,
        time: new Date()
    });
    updateLog();
}

function sell() {
    if (currentPrice === 0) return;
    trades.unshift({ 
        type: "SELL", 
        price: currentPrice,
        time: new Date()
    });
    updateLog();
}

function updateLog() {
    const logElement = document.getElementById("log");
    
    // Create new HTML string for all trades
    const html = trades.map(t => {
        const timeStr = t.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        return `
            <div class="trade-item ${t.type.toLowerCase()}">
                <div>
                    <span class="trade-type">${t.type}</span>
                    <span class="trade-time">${timeStr}</span>
                </div>
                <span class="trade-price">${t.price.toFixed(2)}</span>
            </div>
        `;
    }).join("");
    
    logElement.innerHTML = html;
}

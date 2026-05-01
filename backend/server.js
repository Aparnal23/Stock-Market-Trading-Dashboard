const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const API_KEY = "VZX621K2MV24K47G";

function generateMockData() {
    const data = [];
    let baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 100);
    let open = 150.00;
    
    for (let i = 0; i < 100; i++) {
        const volatility = Math.random() * 5;
        const close = open + (Math.random() - 0.5) * 10;
        const high = Math.max(open, close) + Math.random() * volatility;
        const low = Math.min(open, close) - Math.random() * volatility;
        
        data.push({
            time: baseDate.toISOString().split('T')[0],
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
        });
        
        open = close;
        baseDate.setDate(baseDate.getDate() + 1);
    }
    return data;
}

// Route to get market data
app.get("/data", async (req, res) => {
    try {
        const response = await axios.get(
            `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=INFY.BSE&apikey=${API_KEY}`
        );

        const raw = response.data["Time Series (Daily)"];
        
        if (!raw) {
            console.log("Alpha Vantage limit reached or invalid symbol. Using mock data fallback.");
            return res.json(generateMockData());
        }

        const formatted = Object.entries(raw)
            .slice(0, 100)
            .map(([date, val]) => ({
                time: date,
                open: parseFloat(val["1. open"]),
                high: parseFloat(val["2. high"]),
                low: parseFloat(val["3. low"]),
                close: parseFloat(val["4. close"]),
            }))
            .reverse(); // Reverse to chronological order

        res.json(formatted);
    } catch (err) {
        console.error("Error fetching data, using mock data fallback", err.message);
        res.json(generateMockData());
    }
});

app.listen(3000, '0.0.0.0', () => console.log("Server running on port 3000"));

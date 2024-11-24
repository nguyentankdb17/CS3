const axios = require('axios');
const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const app = express();

const port = 4002;

app.use(cors());

// Giới hạn số lượng yêu cầu đồng thời cho mỗi dịch vụ (rate limiting)
const logsRateLimiter = rateLimit({
    windowMs: 10000, // 10 giây
    max: 20, // Tối đa 20 yêu cầu mỗi 10 giây
    message: 'Quá nhiều yêu cầu, hãy thử lại sau.'
});

async function checkEndpointStatus(url) {
    try {
        const response = await axios.get(url);
        return response.status === 200 ? "up" : "down";
    } catch (error) {
        return "down";
    }
}

app.get('/status/endpointStatus', logsRateLimiter, async (req, res) => {
    const statuses = {
        goldPriceEndpoint: await checkEndpointStatus('http://localhost:3001/gold-price'),
        exchangeRateEndpoint: await checkEndpointStatus('http://localhost:3002/exchange-rate'),
    };
    res.json(statuses);
});

app.listen(port, () => {
    console.log(`Endpoint status monitoring service running on http://localhost:${port}`);
});
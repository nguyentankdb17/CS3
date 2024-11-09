// gateway.js (API Gateway)
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3006;

app.get('/traffic-gateway-aggregation', async (req, res) => {
    try {
        // Gọi cả hai service
        const [goldPriceResponse, exchangeRateResponse] = await Promise.all([
            axios.get('http://localhost:3005/traffic-data/gold-price-service'),
            axios.get('http://localhost:3005/traffic-data/exchange-rate-service')
        ]);

        // Tổng hợp dữ liệu
        const aggregatedData = {
            goldPriceTraffic: goldPriceResponse.data.gp_traffic_data,
            exchangeRateTraffic: exchangeRateResponse.data.ex_traffic_data
        };

        // Trả về dữ liệu đã tổng hợp
        res.json(aggregatedData);
    } catch (error) {
        console.error('Error fetching traffic data:', error);
        res.status(500).json({ error: 'Error fetching traffic data' });
    }
});

app.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
});

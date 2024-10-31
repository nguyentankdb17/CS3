const axios = require('axios');
const express = require('express');
const app = express();

const port = 3005;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

let exchangeRateLogs = null;
let goldPriceLogs = null;

async function retrieveLogs(service, url) {
    try {
        const response = await axios.get(`${url}/traffic-data`);
        if (response.status === 200) {
            const data = response.data;
            console.log(`Dữ liệu từ ${url} đã được lấy thành công`);

            if (service === 'exchange-rate-service') {
                exchangeRateLogs = data;
            } else if (service === 'gold-price-service') {
                goldPriceLogs = data;
            }

            return "Dữ liệu đã được lưu thành công";
        } else {
            return `Không thể lấy dữ liệu từ ${url}/traffic-data, trạng thái: ${response.status}`;
        }
    } catch (error) {
        console.error(`Lỗi khi truy cập endpoint ${url}/traffic-data`, error.message);
        return "Lỗi khi kiểm tra endpoint";
    }
}

app.get('/traffic-data/gold-price-service', async (req, res) => {
    try {
        await retrieveLogs('gold-price-service', 'http://localhost:3001');

        res.json({
            gp_traffic_data: goldPriceLogs
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu!' });
    }
});

app.get('/traffic-data/exchange-rate-service', async (req, res) => {
    try {
        await retrieveLogs('exchange-rate-service', 'http://localhost:3002');
        res.json({
            ex_traffic_data: exchangeRateLogs
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu!' });
    }
});

app.listen(port, () => {
    console.log(`Traffic logs service running on http://localhost:${port}`);
});
const axios = require('axios');
const express = require('express');
const rateLimit = require('express-rate-limit');
const timeout = require('express-timeout-handler');
const app = express();

const port = 4004;

// Giới hạn số lượng yêu cầu đồng thời cho mỗi dịch vụ (rate limiting)
const logsRateLimiter = rateLimit({
    windowMs: 10000, // 10 giây
    max: 3, // Tối đa 3 yêu cầu mỗi 10 giây
    message: 'Quá nhiều yêu cầu, hãy thử lại sau.'
});

// Timeout config cho mỗi yêu cầu (5 giây)
const timeoutConfig = {
    timeout: 5000, // 5 giây timeout
    onTimeout: (req, res) => res.status(503).send('Yêu cầu hết thời gian chờ. Vui lòng thử lại sau.')
};

// Middleware cấu hình CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

let exchangeRateLogs = null;
let goldPriceLogs = null;

// Hàm lấy logs từ các dịch vụ
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

// API endpoint giám sát logs từ dịch vụ gold-price-service với Bulkhead
app.get('/traffic-data/gold-price-service', logsRateLimiter, timeout.handler(timeoutConfig), async (req, res) => {
    try {
        await retrieveLogs('gold-price-service', 'http://localhost:3001');
        res.json({
            gp_traffic_data: goldPriceLogs
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu!' });
    }
});

// API endpoint giám sát logs từ dịch vụ exchange-rate-service với Bulkhead
app.get('/traffic-data/exchange-rate-service', logsRateLimiter, timeout.handler(timeoutConfig), async (req, res) => {
    try {
        await retrieveLogs('exchange-rate-service', 'http://localhost:3002');
        res.json({
            ex_traffic_data: exchangeRateLogs
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu!' });
    }
});

// Lắng nghe kết nối trên port
app.listen(port, () => {
    console.log(`Traffic logs service running on http://localhost:${port}`);
});

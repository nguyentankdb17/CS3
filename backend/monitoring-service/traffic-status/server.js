const axios = require('axios');
const express = require('express');
const rateLimit = require('express-rate-limit');
const timeout = require('express-timeout-handler');
const Docker = require('dockerode');
const cors = require('cors');

const port = 4004;

const app = express();
app.use(cors());

const docker = new Docker();

// Giới hạn số lượng yêu cầu đồng thời cho mỗi dịch vụ (rate limiting)
const logsRateLimiter = rateLimit({
    windowMs: 10000, // 10 giây
    max: 20, // Tối đa 20 yêu cầu mỗi 10 giây
    message: 'Quá nhiều yêu cầu, hãy thử lại sau.'
});

// Timeout config cho mỗi yêu cầu (5 giây)
const timeoutConfig = {
    timeout: 5000, // 5 giây timeout
    onTimeout: (req, res) => res.status(503).send('Yêu cầu hết thời gian chờ. Vui lòng thử lại sau.')
};

// Hàm lấy logs từ các dịch vụ
async function retrieveLogs(containerName, sinceTimestamp) {
    try {
        const container = docker.getContainer(containerName);

        const logs = await container.logs({
            stdout: true,
            stderr: true,
            follow: false,
            since: sinceTimestamp
        });

        return logs.toString('utf-8')
            .split('\n')
            .filter(line => line.includes('Time API is called:'))
            .map(line => line.trim());
    } catch (error) {
        console.error(`Lỗi khi lấy log của container ${containerName}:`, error);
    }
}

// API endpoint giám sát logs từ dịch vụ gold-price-service với Bulkhead
app.get('/traffic-data/gold-price-service', logsRateLimiter, timeout.handler(timeoutConfig), async (req, res) => {
    try {
        const logData = await retrieveLogs('gold-price-container', Math.floor(Date.now() / 1000) - 59);
        if (logData.length === 0) {
            res.json({
                traffic_data: 0,
            })
        } else {
            res.json({
                traffic_data: logData.length,
            });
        }
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu!' });
    }
});

// API endpoint giám sát logs từ dịch vụ exchange-rate-service với Bulkhead
app.get('/traffic-data/exchange-rate-service', logsRateLimiter, timeout.handler(timeoutConfig), async (req, res) => {
    try {
        const logData = await retrieveLogs('exchange-rate-container', Math.floor(Date.now() / 1000) - 59);
        if (logData.length === 0) {
            res.json({
                traffic_data: 0,
            })
        } else {
            res.json({
                traffic_data: logData.length,
            });
        }
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu!' });
    }
});

// Lắng nghe kết nối trên port
app.listen(port, () => {
    console.log(`Traffic logs service running on http://localhost:${port}`);
});

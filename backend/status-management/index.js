const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const timeout = require('express-timeout-handler');
const Docker = require('dockerode');
const docker = new Docker();

const app = express();
const port = 3003;

// Giới hạn yêu cầu (Rate Limiting) cho từng loại giám sát
const containerRateLimiter = rateLimit({
    windowMs: 10000, // 10 giây
    max: 3, // Tối đa 3 yêu cầu mỗi 10 giây cho /status/containerStatus
    message: 'Quá nhiều yêu cầu kiểm tra container, hãy thử lại sau.'
});

const endpointRateLimiter = rateLimit({
    windowMs: 10000, // 10 giây
    max: 3, // Tối đa 3 yêu cầu mỗi 10 giây cho /status/endpointStatus
    message: 'Quá nhiều yêu cầu kiểm tra endpoint, hãy thử lại sau.'
});

// Cấu hình timeout cho mỗi yêu cầu (5 giây)
const timeoutConfig = {
    timeout: 5000, // 5 giây
    onTimeout: (req, res) => res.status(503).send('Yêu cầu hết thời gian chờ. Vui lòng thử lại sau.')
};

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Kiểm tra trạng thái container
async function checkContainerStatus(containerName) {
    try {
        const container = docker.getContainer(containerName);
        const containerInfo = await container.inspect();
        return containerInfo.State.Running ? "up" : "down";
    } catch (error) {
        return "error to check";
    }
}

// Kiểm tra trạng thái endpoint
async function checkEndpointStatus(url) {
    try {
        const response = await axios.get(url);
        return response.status === 200 ? "up" : "down";
    } catch (error) {
        return "error to check";
    }
}

// Route giám sát container với Bulkhead
app.get('/status/containerStatus', containerRateLimiter, timeout.handler(timeoutConfig), async (req, res) => {
    const statuses = {
        goldPriceContainer: await checkContainerStatus('gold-price-container'),
        exchangeRateContainer: await checkContainerStatus('exchange-rate-container'),
    };
    res.json(statuses);
});

// Route giám sát endpoint với Bulkhead
app.get('/status/endpointStatus', endpointRateLimiter, timeout.handler(timeoutConfig), async (req, res) => {
    const statuses = {
        goldPriceEndpoint: await checkEndpointStatus('http://localhost:3001/gold-price'),
        exchangeRateEndpoint: await checkEndpointStatus('http://localhost:3002/exchange-rate'),
    };
    res.json(statuses);
});

app.listen(port, () => {
    console.log(`Status monitoring service running on http://localhost:${port}`);
});

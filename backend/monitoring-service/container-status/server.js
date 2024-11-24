const Docker = require('dockerode');
const docker = new Docker();
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const express = require('express');
const app = express();

const port = 4001;

app.use(cors());

// Giới hạn số lượng yêu cầu đồng thời cho mỗi dịch vụ (rate limiting)
const logsRateLimiter = rateLimit({
    windowMs: 10000, // 10 giây
    max: 20, // Tối đa 20 yêu cầu mỗi 10 giây
    message: 'Quá nhiều yêu cầu, hãy thử lại sau.'
});

async function checkContainerStatus(containerName) {
    try {
        const container = docker.getContainer(containerName);
        const containerInfo = await container.inspect();
        const isRunning = containerInfo.State.Running;

        return isRunning ? "up" : "down";
    } catch (error) {
        return "down";
    }
}

app.get('/status/containerStatus', logsRateLimiter, async (req, res) => {
    const statuses = {
        goldPriceContainer: await checkContainerStatus('gold-price-container'),
        exchangeRateContainer: await checkContainerStatus('exchange-rate-container'),
    };
    res.json(statuses);
});


app.listen(port, () => {
    console.log(`Container status monitoring service running on http://localhost:${port}`);
});
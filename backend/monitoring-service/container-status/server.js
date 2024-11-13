const Docker = require('dockerode');
const docker = new Docker();
const cors = require('cors');

const express = require('express');
const app = express();

const port = 4001;

app.use(cors());

async function checkContainerStatus(containerName) {
    try {
        const container = docker.getContainer(containerName);
        const containerInfo = await container.inspect();
        const isRunning = containerInfo.State.Running;

        return isRunning ? "up" : "down";
    } catch (error) {
        return "error to check";
    }
}

app.get('/status/containerStatus', async (req, res) => {
    const statuses = {
        goldPriceContainer: await checkContainerStatus('gold-price-container'),
        exchangeRateContainer: await checkContainerStatus('exchange-rate-container'),
    };
    res.json(statuses);
});


app.listen(port, () => {
    console.log(`Container status monitoring service running on http://localhost:${port}`);
});
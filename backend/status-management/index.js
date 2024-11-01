const Docker = require('dockerode');
const docker = new Docker();
const axios = require('axios');

const express = require('express');
const app = express();

const port = 3003;

let init = true;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Hoặc chỉ định cụ thể tên miền thay vì '*'
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

async function checkContainerStatus(containerName) {
    try {
        const container = docker.getContainer(containerName);
        const containerInfo = await container.inspect();
        const isRunning = containerInfo.State.Running;

        // console.log(`Container ${containerName} is ${isRunning ? 'up' : 'down'}.`);
        return isRunning ? "up" : "down";
    } catch (error) {
        // console.error(`Error checking container ${containerName}`, error.message);
        return "error to check";
    }
}

async function checkEndpointStatus(url) {
    try {
        const response = await axios.get(url);
        // console.log(`Endpoint ${url} is ${response.status === 200 ? 'up' : 'down'}.`);
        return response.status === 200 ? "up" : "down";
    } catch (error) {
        // console.log(`Error checking endpoint ${url}`, error.message);
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

app.get('/status/endpointStatus', async (req, res) => {
    const statuses = {
        goldPriceEndpoint: await checkEndpointStatus('http://localhost:3001/gold-price'),
        exchangeRateEndpoint: await checkEndpointStatus('http://localhost:3002/exchange-rate'),
    };
    res.json(statuses);
});

app.listen(port, () => {
    console.log(`Status monitoring service running on http://localhost:${port}`);
});
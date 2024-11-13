const axios = require('axios');
const cors = require('cors');
const express = require('express');
const app = express();

const port = 4002;

app.use(cors());

async function checkEndpointStatus(url) {
    try {
        const response = await axios.get(url);
        return response.status === 200 ? "up" : "down";
    } catch (error) {
        return "error to check";
    }
}

app.get('/status/endpointStatus', async (req, res) => {
    const statuses = {
        goldPriceEndpoint: await checkEndpointStatus('http://localhost:3001/gold-price'),
        exchangeRateEndpoint: await checkEndpointStatus('http://localhost:3002/exchange-rate'),
    };
    res.json(statuses);
});

app.listen(port, () => {
    console.log(`Endpoint status monitoring service running on http://localhost:${port}`);
});
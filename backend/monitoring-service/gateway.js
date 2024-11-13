const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 5000;

app.get('/traffic-status', async (req, res) => {
    try {
        const [goldPriceResponse, exchangeRateResponse] = await Promise.all([
            axios.get('http://localhost:3005/traffic-data/gold-price-service'),
            axios.get('http://localhost:3005/traffic-data/exchange-rate-service')
        ]);

        const aggregatedData = {
            goldPriceTraffic: goldPriceResponse.data.gp_traffic_data,
            exchangeRateTraffic: exchangeRateResponse.data.ex_traffic_data
        };

        res.json(aggregatedData);
    } catch (error) {
        console.error('Error fetching traffic data:', error);
        res.status(500).json({ error: 'Error fetching traffic data' });
    }
});

app.get('/container-status', async (req, res) => {
    try {
        const statusRes = await axios.get('http://localhost:3003/status/containerStatus');
        res.json(statusRes.data);
    } catch (error) {
        console.error('Error fetching container status data:', error);
        res.status(500).json({ error: 'Error fetching container status data' });
    }
});

app.get('/endpoint-status', async (req, res) => {
    try {
        const statusRes = await axios.get('http://localhost:3003/status/endpointStatus');
        res.json(statusRes.data);
    } catch (error) {
        console.error('Error fetching endpoint status data:', error);
        res.status(500).json({ error: 'Error fetching endpoint status data' });
    }
});

app.get('/system-status', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendData = (event, data) => {
        if (data !== undefined && data !== null) {
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        } else {
            console.error(`Invalid data: ${data}`);
        }
    };

    const interval = setInterval(async () => {
        try {
            const ramResponse = await axios.get('http://localhost:3004/resource-data/ram-usage');
            sendData('ramData', ramResponse.data);
        } catch (error) {
            console.error('Error fetching RAM data:', error);
        }
    }, 5000);

    try {
        const diskResponse = await axios.get('http://localhost:3004/resource-data/disk-usage');
        sendData('diskData', diskResponse.data);

        const bandwidthResponse = await axios.get('http://localhost:3004/resource-data/internet-bandwidth');
        sendData('bandwidthData', bandwidthResponse.data);
    } catch (error) {
        console.error('Error fetching resource data:', error);
        sendData('error', { message: 'Error fetching resource data' });
    }

    req.on('close', () => {
        clearInterval(interval);
        res.end();
    });
});

app.listen(PORT, () => {
    console.log(`Common Gateway running on http://localhost:${PORT}`);
});
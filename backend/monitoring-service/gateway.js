const express = require('express');
const axios = require('axios');
const cors = require('cors');
const CircuitBreaker = require('opossum');

const app = express();
app.use(cors());

const PORT = 4000;


const options = {
    timeout: 10000, // If our function takes longer than 10 seconds, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
    resetTimeout: 30000 // After 30 seconds, try again.
};

const containerStatusBreaker = new CircuitBreaker(async () => await axios.get('http://localhost:4001/status/containerStatus'), options);

app.get('/container-status', (req, res) => {
    // Gọi hàm thông qua circuit breaker
    containerStatusBreaker.fire()
        .then((statusData) => {
            const responseData = statusData.data;
            res.json(responseData);
        })
        .catch((error) => {
            console.error('Error fetching container status data:', error);
        });
});

const endpointStatusBreaker = new CircuitBreaker(async() => await axios.get('http://localhost:4002/status/endpointStatus'), options);

app.get('/endpoint-status', async (req, res) => {
    // Gọi hàm thông qua circuit breaker
    endpointStatusBreaker.fire()
        .then((statusData) => {
            const responseData = statusData.data;
            res.json(responseData);
        })
        .catch((error) => {
            console.error('Error fetching endpoint status data', error);
        });
});

const cpuBreaker = new CircuitBreaker(async () => await axios.get('http://localhost:4003/resource-data/cpu-usage'), options);
const memoryBreaker = new CircuitBreaker(async () => await axios.get('http://localhost:4003/resource-data/memory-usage'), options);
const diskBreaker = new CircuitBreaker(async () => await axios.get('http://localhost:4003/resource-data/disk-usage'), options);
const bandwidthBreaker = new CircuitBreaker(async () => await axios.get('http://localhost:4003/resource-data/internet-bandwidth'), options);

app.get('/system-status', (req, res) => {
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

    const fetchData = () => {
        cpuBreaker.fire()
            .then(response => sendData('cpuData', response.data))
            .catch(error => {
                console.error('Error fetching CPU data:', error);
                sendData('error', { message: 'Error fetching CPU data' });
            });

        memoryBreaker.fire()
            .then(response => sendData('memoryData', response.data))
            .catch(error => {
                console.error('Error fetching memory data:', error);
                sendData('error', { message: 'Error fetching memory data' });
            });

        diskBreaker.fire()
            .then(response => sendData('diskData', response.data))
            .catch(error => {
                console.error('Error fetching disk data:', error);
                sendData('error', { message: 'Error fetching disk data' });
            });

        bandwidthBreaker.fire()
            .then(response => sendData('bandwidthData', response.data))
            .catch(error => {
                console.error('Error fetching bandwidth data:', error);
                sendData('error', { message: 'Error fetching bandwidth data' });
            });
    }

    fetchData();

    // Fetch every 5 seconds
    const interval = setInterval(fetchData, 5000);

    req.on('close', () => {
        clearInterval(interval);
        res.end();
    });
});

const gpTrafficBreaker = new CircuitBreaker(async () => await axios.get('http://localhost:4004/traffic-data/gold-price-service'), options);
const erTrafficBreaker = new CircuitBreaker(async () => await axios.get('http://localhost:4004/traffic-data/exchange-rate-service'), options);

app.get('/traffic-status', async (req, res) => {
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

    const fetchData = () => {
        gpTrafficBreaker.fire()
            .then(response => {
                sendData('gpTrafficData', response.data);
            })
            .catch(error => {
                console.error('Error fetching Gold Price Service traffic data:', error);
                sendData('gpTrafficData', { message: 'Error fetching Gold Price Service traffic data' });
            });

        erTrafficBreaker.fire()
            .then(response => {
                sendData('erTrafficData', response.data);
            })
            .catch(error => {
                console.error('Error fetching Exchange Rate Service traffic data:', error);
                sendData('erTrafficData', { message: 'Error fetching Exchange Rate Service traffic data' });
            });
    };

    fetchData();

    //Fetch every 60 seconds
    const interval = setInterval(fetchData, 60000);

    req.on('close', () => {
        clearInterval(interval);
        res.end();
    });
});


app.listen(PORT, () => {
    console.log(`Common Gateway running on http://localhost:${PORT}`);
});
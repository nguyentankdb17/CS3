const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 4000;
const CircuitBreaker = require('opossum');

const options = {
    timeout: 30000, // If our function takes longer than 3 seconds, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
    resetTimeout: 300000 // After 30 seconds, try again.
};

function fetchContainerStatus() {
    return new Promise(async (resolve, reject) => {
        await axios.get('http://localhost:4001/status/containerStatus')
            .then((response) => {
                resolve(response.data);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

const containerStatusBreaker = new CircuitBreaker(fetchContainerStatus, options);

app.get('/container-status', (req, res) => {
    // Gọi hàm thông qua circuit breaker
    containerStatusBreaker.fire()
        .then((statusData) => {
            res.json(statusData);
        })
        .catch((error) => {
            console.error('Error fetching container status data:', error);
            res.status(500).json({ error: 'Error fetching container status data' });
        });
});


function fetchEndpointStatus() {
    return new Promise(async (resolve, reject) => {
        await axios.get('http://localhost:4002/status/endpointStatus')
            .then((response) => {
                resolve(response.data);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

const endpointStatusBreaker = new CircuitBreaker(fetchEndpointStatus(), options);

app.get('/endpoint-status', async (req, res) => {
    // Gọi hàm thông qua circuit breaker
    endpointStatusBreaker.fire()
        .then((statusData) => {
            res.json(statusData);
        })
        .catch((error) => {
            console.error('Error fetching container status data:', error);
            res.status(500).json({ error: 'Error fetching endpoint status data' });
        });
});


const cpuBreaker = new CircuitBreaker(() => axios.get('http://localhost:4003/resource-data/cpu-usage'), options);
const memoryBreaker = new CircuitBreaker(() => axios.get('http://localhost:4003/resource-data/memory-usage'), options);
const diskBreaker = new CircuitBreaker(() => axios.get('http://localhost:4003/resource-data/disk-usage'), options);
const bandwidthBreaker = new CircuitBreaker(() => axios.get('http://localhost:4003/resource-data/internet-bandwidth'), options);

app.get('/system-status', (req, res) => {
    const sendData = (event, data) => {
        if (data !== undefined && data !== null) {
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        } else {
            console.error(`Invalid data: ${data}`);
        }
    };

    // Sử dụng các circuit breaker để lấy dữ liệu từ các API
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

    req.on('close', () => {
        res.end();
    });
});

// app.get('/traffic-status', async (req, res) => {
//     try {
//         const [goldPriceResponse, exchangeRateResponse] = await Promise.all([
//             axios.get('http://localhost:3005/traffic-data/gold-price-service'),
//             axios.get('http://localhost:3005/traffic-data/exchange-rate-service')
//         ]);
//
//         const aggregatedData = {
//             goldPriceTraffic: goldPriceResponse.data.gp_traffic_data,
//             exchangeRateTraffic: exchangeRateResponse.data.ex_traffic_data
//         };
//
//         res.json(aggregatedData);
//     } catch (error) {
//         console.error('Error fetching traffic data:', error);
//         res.status(500).json({ error: 'Error fetching traffic data' });
//     }
// });

app.listen(PORT, () => {
    console.log(`Common Gateway running on http://localhost:${PORT}`);
});
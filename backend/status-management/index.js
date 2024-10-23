const Docker = require('dockerode');
const axios = require('axios');
const docker = new Docker();

// async function checkContainerStatus(containerName) {
//     try {
//         const container = docker.getContainer(containerName);
//         const containerInfo = await container.inspect();
//         const isRunning = containerInfo.State.Running;
//
//         console.log(`Container ${containerName} is ${isRunning ? 'up' : 'down'}.`);
//     } catch (error) {
//         console.error(`Error checking container ${containerName}`, error.message);
//     }
// }

async function checkEndpointStatus(url) {
    try {
        const response = await axios.get(url);
        console.log(`Endpoint ${url} is ${response.status === 200 ? 'up' : 'down'}.`);
    } catch (error) {
        console.log(`Error checking endpoint ${url}`, error.message);
    }
}

function monitorServices() {
    // checkContainerStatus('gold-price-service');
    // checkContainerStatus('exchange-rate-service');

    checkEndpointStatus('http://localhost:3001/gold-price');
    checkEndpointStatus('http://localhost:3002/exchange-rate');
}

// Kiểm tra mỗi 30 giây
setInterval(monitorServices, 30000);
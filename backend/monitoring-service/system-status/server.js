const express = require('express');
const rateLimit = require('express-rate-limit');
const timeout = require('express-timeout-handler');
const Docker = require('dockerode');
const docker = new Docker();

const app = express();
const PORT = 4003;

// Rate Limiting cho tài nguyên
const resourceRateLimiter = rateLimit({
    windowMs: 10000, // 10 giây
    max: 20, // Tối đa 3 yêu cầu mỗi 10 giây cho tài nguyên
    message: 'Quá nhiều yêu cầu giám sát tài nguyên, hãy thử lại sau.'
});

// Timeout config cho tài nguyên
const timeoutConfig = {
    timeout: 5000, // 5 giây timeout
    onTimeout: (req, res) => res.status(503).send('Yêu cầu hết thời gian chờ. Vui lòng thử lại sau.')
};

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

let systemStats = {
    cpuTotal: 0,
    cpuPercent: 0,
    memoryUsage: 0,
    memoryLimit: 0,
    netInput: 0,
    netOutput: 0,
    blockInput: 0,
    blockOutput: 0
};

// Giám sát cpu usage
app.get('/resource-data/cpu-usage', resourceRateLimiter, timeout.handler(timeoutConfig), async (req, res) => {
    try {
        const containers = await docker.listContainers();

        for (const containerInfo of containers) {
            const container = docker.getContainer(containerInfo.Id);
            const stream = await container.stats({ stream: false });

            //Tính tổng số CPU cores được cấp phát
            const numCpus = stream.cpu_stats.online_cpus || 1;
            systemStats.cpuTotal = numCpus;

            // Tính toán CPU %
            const cpuDelta = stream.cpu_stats.cpu_usage.total_usage - stream.precpu_stats.cpu_usage.total_usage;
            const systemDelta = stream.cpu_stats.system_cpu_usage - stream.precpu_stats.system_cpu_usage;
            const cpuPercent = (cpuDelta / systemDelta) * numCpus * 100;
            systemStats.cpuPercent += cpuPercent;
        }

    } catch (error) {
        console.error("Error accessing container:", error);
    }

    res.json({
        cpuTotal: systemStats.cpuTotal,
        cpuPercent: systemStats.cpuPercent,
    })

});

// Giám sát memory usage
app.get('/resource-data/memory-usage', resourceRateLimiter, timeout.handler(timeoutConfig), async (req, res) => {
    try {
        const containers = await docker.listContainers();

        for (const containerInfo of containers) {
            const container = docker.getContainer(containerInfo.Id);
            const stream = await container.stats({ stream: false });

            // Tính toán memory
            systemStats.memoryUsage += stream.memory_stats.usage;
            systemStats.memoryLimit = stream.memory_stats.limit;
        }
    } catch (error) {
        console.error("Error accessing container:", error);
    }

    res.json({
        memoryUsage: systemStats.memoryUsage,
        memoryLimit: systemStats.memoryLimit,
    })
});

// Giám sát disk usage
app.get('/resource-data/disk-usage', resourceRateLimiter, timeout.handler(timeoutConfig), async (req, res) => {
    try {
        const containers = await docker.listContainers();

        for (const containerInfo of containers) {
            const container = docker.getContainer(containerInfo.Id);
            const stream = await container.stats({ stream: false });

            // Tính disk (Block I/O)
            systemStats.blockInput += stream.blkio_stats.io_service_bytes_recursive?.find(i => i.op === 'Read')?.value || 0;
            systemStats.blockOutput += stream.blkio_stats.io_service_bytes_recursive?.find(i => i.op === 'Write')?.value || 0;
        }
    } catch (error) {
        console.error("Error accessing container:", error);
    }

    res.json({
        dataRead: systemStats.blockInput,
        dataWritten: systemStats.blockOutput,
    })
});

// Giám sát băng thông Internet
app.get('/resource-data/internet-bandwidth', resourceRateLimiter, timeout.handler(timeoutConfig), async (req, res) => {
    try {
        const containers = await docker.listContainers();

        for (const containerInfo of containers) {
            const container = docker.getContainer(containerInfo.Id);
            const stream = await container.stats({ stream: false });

            // Tính băng thông mạng (Net I/O)
            if (stream.networks) {
                for (const network of Object.values(stream.networks)) {
                    systemStats.netInput += network.rx_bytes;
                    systemStats.netOutput += network.tx_bytes;
                }
            }
        }
    } catch (error) {
        console.error("Error accessing container:", error);
    }

    res.json({
        dataIn: systemStats.netInput,
        dataOut: systemStats.netOutput,
    })
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

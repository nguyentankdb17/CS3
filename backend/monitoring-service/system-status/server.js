const express = require('express');
const os = require('os');
const { getDiskInfo } = require('node-disk-info');
const { exec } = require("child_process");
const rateLimit = require('express-rate-limit');
const timeout = require('express-timeout-handler');

const app = express();
const PORT = 3004;

// Rate Limiting cho tài nguyên
const resourceRateLimiter = rateLimit({
    windowMs: 10000, // 10 giây
    max: 3, // Tối đa 3 yêu cầu mỗi 10 giây cho tài nguyên
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

// Giám sát tài nguyên RAM
app.get('/resource-data/ram-usage', resourceRateLimiter, timeout.handler(timeoutConfig), (req, res) => {
    const totalMemory = os.totalmem() / (1024 ** 3);
    const freeMemory = os.freemem() / (1024 ** 3);
    const usedMemory = totalMemory - freeMemory;
    const usagePercent = (usedMemory / totalMemory) * 100;

    res.json({
        totalMemory: totalMemory.toFixed(1),
        usedMemory: usedMemory.toFixed(1),
        freeMemory: freeMemory.toFixed(1),
        usagePercent: usagePercent.toFixed(2)
    });
});

// Giám sát disk usage
app.get('/resource-data/disk-usage', resourceRateLimiter, timeout.handler(timeoutConfig), async (req, res) => {
    try {
        const disks = await getDiskInfo();
        const diskInfo = disks.map(disk => ({
            mounted: disk.mounted,
            total: (disk.blocks / (1024 ** 3)).toFixed(2),
            used: (disk.used / (1024 ** 3)).toFixed(2),
            available: (disk.available / (1024 ** 3)).toFixed(2),
            capacity: disk.capacity
        }));

        res.json(diskInfo);
    } catch (error) {
        console.error('Error fetching disk usage:', error);
        res.status(500).json({ error: 'Error fetching disk usage' });
    }
});

// Giám sát băng thông Internet
app.get('/resource-data/internet-bandwidth', resourceRateLimiter, timeout.handler(timeoutConfig), (req, res) => {
    exec('fast --upload --json', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: 'Error fetching internet speed' });
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return res.status(500).json({ error: 'Error in fast-cli output' });
        }
        try {
            const speedData = JSON.parse(stdout);
            res.json({
                download: speedData.downloadSpeed,
                upload: speedData.uploadSpeed,
                ping: speedData.latency
            });
        } catch (parseError) {
            console.error(`Parse Error: ${parseError.message}`);
            res.status(500).json({ error: 'Error parsing fast-cli output' });
        }
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

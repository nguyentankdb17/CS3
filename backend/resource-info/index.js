// Cài đặt ExpressJS
const express = require('express');
const os = require('os');
const { getDiskInfo } = require('node-disk-info');
const {exec} = require("child_process");
const app = express();
const PORT = 3004;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.get('/resource-data/ram-usage', (req, res) => {
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

app.get('/resource-data/disk-usage', async (req, res) => {
    try {
        const disks = await getDiskInfo();
        const diskInfo = disks.map(disk => ({
            mounted: disk.mounted,
            total: (disk.blocks / (1024 ** 3)).toFixed(2),   // Chuyển sang GB
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

app.get('/resource-data/internet-bandwidth', (req, res) => {
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
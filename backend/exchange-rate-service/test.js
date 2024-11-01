const axios = require('axios');
const schedule = require('node-schedule');
const fs = require('fs');

// Hàm ghi dữ liệu vào file CSV
function logTrafficData(status, time) {
    const logLine = `${time},${status}\n`;
    fs.appendFile('google_traffic_log_26_10_2024.csv', logLine, (err) => {
        if (err) {
            console.error('Error writing to file', err);
        }
    });
}

// Hàm để kiểm tra trạng thái trang Google
async function checkGoogleStatus() {
    try {
        const response = await axios.get('https://www.google.com');
        const currentTime = new Date().toISOString();
        logTrafficData(response.status, currentTime);
        console.log(`Status: ${response.status} at ${currentTime}`);
    } catch (error) {
        const currentTime = new Date().toISOString();
        logTrafficData('Error', currentTime);
        console.error(`Error accessing Google at ${currentTime}`);
    }
}

// Lập lịch để chạy script mỗi giờ trong ngày 26/10/2024
const startDate = new Date('2024-10-26T00:00:00');
const endDate = new Date('2024-10-27T00:00:00');

const job = schedule.scheduleJob({ start: startDate, end: endDate, rule: '0 * * * *' }, function () {
    checkGoogleStatus();
});

console.log('Scheduled job to check Google status every hour on 26/10/2024');

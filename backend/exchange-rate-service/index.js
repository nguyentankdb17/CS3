const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');

const app = express();
const port = 3002;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Hoặc chỉ định cụ thể tên miền thay vì '*'
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Hàm để ghi dữ liệu truy cập vào file JSON
function logTraffic() {
    const timestamp = new Date().toISOString();
    const data = { timestamp };

    // Đọc dữ liệu từ file JSON hiện có
    fs.readFile('trafficLog.json', 'utf8', (err, fileData) => {
        let logs = [];

        if (!err && fileData.length > 0) { // Kiểm tra nếu không có lỗi và file không rỗng
            try {
                logs = JSON.parse(fileData);
            } catch (parseErr) {
                console.error('Lỗi khi phân tích JSON:', parseErr);
            }
        } else if (err) {
            console.error('Lỗi khi đọc file:', err);
        }

        // Thêm timestamp mới vào logs
        logs.push(data);

        // Ghi dữ liệu vào file JSON
        fs.writeFile('trafficLog.json', JSON.stringify(logs, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Lỗi khi ghi file:', writeErr);
            } else {
                console.log('Ghi log lưu lượng truy cập thành công:', data);
            }
        });
    });
}

app.get('/exchange-rate', async (req, res) => {
    try {
        logTraffic();
        const response = await axios.get('https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx?b=8');
        const parser = new xml2js.Parser({ explicitArray: false });
        parser.parseString(response.data, (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Lỗi khi chuyển đổi dữ liệu XML.' });
            }

            console.log('JSON Data:', result);
            res.json(result);
        });
    } catch (error) {
        res.status(500).json({ message: 'Error to get API exchange rate.' });
    }
});

// Endpoint trả về dữ liệu lưu lượng truy cập
app.get('/traffic-data', (req, res) => {
    fs.readFile('trafficLog.json', 'utf8', (err, fileData) => {
        if (err) {
            return res.status(500).json({ message: 'Lỗi khi đọc file lưu lượng.' });
        }

        try {
            const logs = JSON.parse(fileData);
            res.json(logs);
        } catch (parseError) {
            return res.status(500).json({ message: 'Dữ liệu JSON không hợp lệ.' });
        }
    });
});

app.listen(port, () => {
    console.log(`Exchange Rate Service is running on http://localhost:${port}`);
});

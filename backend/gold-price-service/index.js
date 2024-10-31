const express = require('express');
const axios = require('axios');
const app = express();
const port = 3001;
const fs = require('fs');

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

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Hoặc chỉ định cụ thể tên miền thay vì '*'
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/gold-price', async (req, res) => {
  try {
    logTraffic();
    const response = await axios.get('http://api.btmc.vn/api/BTMCAPI/getpricebtmc?key=3kd8ub1llcg9t45hnoh8hmn7t5kc2v');
    const goldPrice = response.data;
    res.json({ goldPrice });    
  } catch (error) {
    res.status(500).json({ message: 'Error to get API gold price.' });
  }
});

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
  console.log(`Gold Price Service is running on http://localhost:${port}`);
});

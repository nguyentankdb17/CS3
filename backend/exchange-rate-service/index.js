const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');

const app = express();
const port = 3002;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/exchange-rate', async (req, res) => {
  try {
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

app.listen(port, () => {
  console.log(`Gold Price Service is running on http://localhost:${port}`);
});

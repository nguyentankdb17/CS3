import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [exchangeRates, setExchangeRates] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/gold-price")
    .then(response => response.json())
    .then((data) => {
      const formattedData = Object.values(data.goldPrice.DataList.Data).map((item, index) => ({
        id: index + 1,
        name: item[`@n_${index + 1}`],
        purity: item[`@k_${index + 1}`],
        fineness: item[`@h_${index + 1}`],
        buyPrice: item[`@pb_${index + 1}`],
        sellPrice: item[`@ps_${index + 1}`],
        change: item[`@pt_${index + 1}`],
        date: item[`@d_${index + 1}`],
      }));

      setData(formattedData);
    })
      .catch(error => console.error('Error fetching gold price:', error));
  }, []);

  useEffect(() => {
    fetch("http://localhost:3002/exchange-rate")
      .then(response => response.json())
      .then(data => {
        const exchangeRates = Object.values(data.ExrateList.Exrate).map((item, index) => ({
            id : index + 1,
            currencyCode: item.$.CurrencyCode,
            currencyName: item.$.CurrencyName,
            buy: item.$.Buy,
            transfer: item.$.Transfer,
            sell: item.$.Sell,
          }));

        setExchangeRates(exchangeRates);
      })
      .catch(error => console.error('Error fetching exchange rate:', error));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Health Monitoring Dashboard</h1>
        <div>
          <h2>Gold Price</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Purity</th>
                <th>Fineness</th>
                <th>Buy Price</th>
                <th>Sell Price</th>
                <th>Change</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.purity}</td>
                  <td>{item.fineness}</td>
                  <td>{item.buyPrice}</td>
                  <td>{item.sellPrice}</td>
                  <td>{item.change}</td>
                  <td>{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h2>Exchange Rate (VND)</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Currency Code</th>
                <th>Currency Name</th>
                <th>Buy</th>
                <th>Transfer</th>
                <th>Sell</th>
              </tr>
            </thead>
            <tbody>
              {exchangeRates.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.currencyCode}</td>
                  <td>{item.currencyName}</td>
                  <td>{item.buy}</td>
                  <td>{item.transfer}</td>
                  <td>{item.sell}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </header>
    </div>
  );
}

export default App;
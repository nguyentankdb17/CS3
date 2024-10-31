import React, { useState, useEffect } from 'react';
import './App.css';
import { Line } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-adapter-moment';
import axios from 'axios';

function App() {
    const [data, setData] = useState([]);
    const [exchangeRates, setExchangeRates] = useState([]);

    const [exchangeRateTraffic, setExchangeRateTraffic] = useState({
        labels: [],
        datasets: [
            {
                label: 'Exchange Rate Service',
                data: [],
                borderColor: 'rgb(0,239,239)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.1,
            },
        ],
    });

    const [goldPriceTraffic, setGoldPriceTraffic] = useState({
        labels: [],
        datasets: [
            {
                label: 'Gold Price Service',
                data: [],
                borderColor: 'rgb(28,135,135)',
                backgroundColor: 'rgba(11,250,221,0.2)',
                fill: true,
                tension: 0.1,
            },
        ],
    });

    const chartDisplayOptions = {
        scales: {
            x: {
                type: 'time',
                title: { display: true, text: 'Date' },
                time: {
                    unit: 'day',
                    tooltipFormat: 'DD/MM/YYYY',
                    displayFormats: {
                        day: 'DD/MM/YYYY',
                    },
                },
            },
            y: {
                type: 'linear',
                title: { display: true, text: 'Number of API Calls' },
                ticks: {
                    stepSize: 1,
                },
            },
        },
    };

    const [ramData, setRamData] = useState({
        totalMem: 'unknown',
        freeMem: 'unknown',
        usedMem: 'unknown',
        usagePercentage: 'unknown',
        labels: [],
        datasets: [
            {
                label: 'RAM Usage (%)',
                data: [],
                fill: false,
                borderColor: 'rgba(75,192,192,1)',
                tension: 0.1
            }
        ]
    });

    const [diskData, setDiskData] = useState([]);

    const [status, setStatus] = useState({
        goldPriceContainer: 'unknown',
        exchangeRateContainer: 'unknown',
        goldPriceEndpoint: 'unknown',
        exchangeRateEndpoint: 'unknown',
    });

    const [bandwidthData, setBandwidthData] = useState({
        download: null,
        upload: null,
        ping: null
    });
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        fetch("http://localhost:3003/status")
            .then(response => response.json())
            .then(data => setStatus(data))
            .catch(error => console.error('Error fetching status:', error));
    }, []);

    useEffect(() => {
        fetch('http://localhost:3005/traffic-data/gold-price-service')
            .then((response) => response.json())
            .then((data) => {
                const TrafficData = data.gp_traffic_data;
                const dailyData = {};
                TrafficData.forEach(entry => {
                    const timestamp = new Date(entry.timestamp);
                    const day = `${timestamp.getFullYear()}-${timestamp.getMonth() + 1}-${timestamp.getDate()}`;
                    dailyData[day] = (dailyData[day] || 0) + 1;
                });
                const labels = Object.keys(dailyData);
                const values = Object.values(dailyData);
                setGoldPriceTraffic({
                    labels: labels,
                    datasets: [{ label: 'Gold Price Service', data: values }],
                });
            })
            .catch(error => console.error('Error fetching traffic data:', error));
    }, []);

    useEffect(() => {
        fetch('http://localhost:3005/traffic-data/exchange-rate-service')
            .then((response) => response.json())
            .then((data) => {
                const TrafficData = data.ex_traffic_data;
                const dailyData = {};
                TrafficData.forEach(entry => {
                    const timestamp = new Date(entry.timestamp);
                    const day = `${timestamp.getFullYear()}-${timestamp.getMonth() + 1}-${timestamp.getDate()}`;
                    dailyData[day] = (dailyData[day] || 0) + 1;
                });
                const labels = Object.keys(dailyData);
                const values = Object.values(dailyData);
                setExchangeRateTraffic({
                    labels: labels,
                    datasets: [{ label: 'Exchange Rate Service', data: values }],
                });
            })
            .catch(error => console.error('Error fetching traffic data:', error));
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            fetch('http://localhost:3004/resource-data/ram-usage')
                .then(response => response.json())
                .then(data => {
                    setRamData(prevData => {
                        const currentTime = new Date().toLocaleTimeString();
                        return {
                            totalMem: data.totalMemory,
                            freeMem: data.freeMemory,
                            usedMem: data.usedMemory,
                            usagePercentage: data.usagePercent,
                            labels: [...prevData.labels, currentTime].slice(-20),
                            datasets: [
                                {
                                    ...prevData.datasets[0],
                                    data: [...prevData.datasets[0].data, data.usagePercent].slice(-20)
                                }
                            ]
                        };
                    });
                })
                .catch(error => console.error('Error fetching RAM usage:', error));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchDiskUsage = () => {
            fetch('http://localhost:3004/resource-data/disk-usage')
                .then(response => response.json())
                .then(data => setDiskData(data))
                .catch(error => console.error('Error fetching disk usage:', error));
        };

        fetchDiskUsage();
        const interval = setInterval(fetchDiskUsage, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchBandwidthData = async () => {
            try {
                const response = await axios.get('http://localhost:3004/resource-data/internet-bandwidth');
                setBandwidthData(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching internet speed data:', error);
            }
        };

        // Fetch speed data every 10 seconds
        fetchBandwidthData();
        const intervalId = setInterval(fetchBandwidthData, 30000);

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, []);

    return (
        <div className="App">
            <h1>Health Monitoring Dashboard</h1>

            <div className="goldPrice container">
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

            <div className="exchangeRate container">
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

            <div className="status container">
                <h2>Service Status</h2>
                <p>Gold Price Container: {status.goldPriceContainer}</p>
                <p>Exchange Rate Container: {status.exchangeRateContainer}</p>
                <p>Gold Price Endpoint: {status.goldPriceEndpoint}</p>
                <p>Exchange Rate Endpoint: {status.exchangeRateEndpoint}</p>
            </div>

            <div className="resource container">
                <h2>System Status</h2>
                <div>
                    <h3>Real-time RAM Usage</h3>
                    <p>Total RAM Memory: {ramData.totalMem} GB</p>
                    <p>Used RAM Memory: {ramData.usedMem} GB</p>
                    <p>Free RAM Memory: {ramData.freeMem} GB</p>
                    <p>RAM Memory Usage (%): {ramData.usagePercentage}%</p>
                    <Line data={ramData} options={{
                        scales: {
                            x: {title: {display: true, text: 'Time'}},
                            y: {
                                title: {display: true, text: 'RAM Usage (%)'},
                                beginAtZero: true,
                                max: 100
                            }
                        },
                        animation: false
                    }}/>
                </div>
                <div>
                    <h3>Real-time Disk Usage</h3>
                    <div className="disk">
                        {diskData.map((disk, index) => (
                            <div key={index}>
                                <em>Drive name: <strong>{disk.mounted}</strong></em>
                                <p>Total: {disk.total} GB</p>
                                <p>Used: {disk.used} GB</p>
                                <p>Available: {disk.available} GB</p>
                                <p>Capacity: {disk.capacity}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h3>Real-time Internet Bandwidth</h3>
                    {loading ? (
                        <p style={{ textAlign: "center" }}>Measuring internet bandwidth ... </p>
                    ) : (
                        <div style={{ textAlign: "center" }}>
                            <p><strong>Download Speed:</strong> {bandwidthData.download} Mbps</p>
                            <p><strong>Upload Speed:</strong> {bandwidthData.upload} Mbps</p>
                            <p><strong>Ping:</strong> {bandwidthData.ping} ms</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="traffic container">
                <h2>Traffic Logs Monitoring</h2>
                <h3>Exchange Rate Service</h3>
                {exchangeRateTraffic.labels ? (
                    <Bar data={exchangeRateTraffic} options={chartDisplayOptions}/>
                ) : (
                    <p>Data loading...</p>
                )}
                <br/>

                <h3>Gold Price Service</h3>
                {goldPriceTraffic.labels ? (
                    <Bar data={goldPriceTraffic} options={chartDisplayOptions}/>
                ) : (
                    <p>Data loading...</p>
                )}
            </div>
        </div>
    );
}

export default App;
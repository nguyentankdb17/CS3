import React, { useState, useEffect } from 'react';
import './App.css';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-adapter-moment';

function TrafficStatus() {
    const [trafficData, setTrafficData] = useState({
        exchangeRateTraffic: {
            labels: [],
            datasets: [{ label: 'Exchange Rate Service', data: [], backgroundColor: 'rgba(75, 192, 192, 0.2)', fill: true, tension: 0.1 }],
        },
        goldPriceTraffic: {
            labels: [],
            datasets: [{ label: 'Gold Price Service', data: [], borderColor: 'rgb(28,135,135)', backgroundColor: 'rgba(11,250,221,0.2)', fill: true, tension: 0.1 }],
        }
    });

    const chartDisplayOptions = {
        scales: {
            x: {
                type: 'time',
                title: { display: true, text: 'Date' },
                time: {
                    unit: 'day',
                    tooltipFormat: 'DD/MM/YYYY',
                    displayFormats: { day: 'DD/MM/YYYY' },
                },
            },
            y: {
                type: 'linear',
                title: { display: true, text: 'Number of API Calls' },
                ticks: { stepSize: 1 },
            },
        },
    };

    useEffect(() => {
        fetch('http://localhost:5000/traffic-data')
            .then((response) => response.json())
            .then((data) => {
                const processTrafficData = (trafficData) => {
                    const dailyData = {};
                    trafficData.forEach(entry => {
                        const timestamp = new Date(entry.timestamp);
                        const day = `${timestamp.getFullYear()}-${timestamp.getMonth() + 1}-${timestamp.getDate()}`;
                        dailyData[day] = (dailyData[day] || 0) + 1;
                    });
                    const labels = Object.keys(dailyData);
                    const values = Object.values(dailyData);
                    return { labels, values };
                };

                const goldData = processTrafficData(data.goldPriceTraffic);
                const exchangeData = processTrafficData(data.exchangeRateTraffic);

                setTrafficData({
                    goldPriceTraffic: { labels: goldData.labels, datasets: [{ label: 'Gold Price Service', data: goldData.values }] },
                    exchangeRateTraffic: { labels: exchangeData.labels, datasets: [{ label: 'Exchange Rate Service', data: exchangeData.values }] },
                });
            })
            .catch(error => console.error('Error fetching traffic data:', error));
    }, []);

    return (
        <div className="traffic container">
            <h2>Traffic Logs Monitoring</h2>
            <h3>Exchange Rate Service</h3>
            {trafficData.exchangeRateTraffic.labels ? (
                <Bar data={trafficData.exchangeRateTraffic} options={chartDisplayOptions} />
            ) : (
                <p>Data loading...</p>
            )}
            <br />

            <h3>Gold Price Service</h3>
            {trafficData.goldPriceTraffic.labels ? (
                <Bar data={trafficData.goldPriceTraffic} options={chartDisplayOptions} />
            ) : (
                <p>Data loading...</p>
            )}
        </div>
    );
}

export default TrafficStatus;

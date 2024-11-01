import React, { useState, useEffect } from 'react';
import './App.css';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-adapter-moment';

function Traffic() {
    const [exchangeRateTraffic, setExchangeRateTraffic] = useState({
        labels: [],
        datasets: [
            {
                label: 'Exchange Rate Service',
                data: [],
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

    return (
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
    );
}

export default Traffic;
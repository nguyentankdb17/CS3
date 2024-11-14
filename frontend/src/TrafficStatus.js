import React, { useState, useEffect } from 'react';
import './App.css';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-adapter-moment';

function TrafficStatus() {
    const [goldPriceData, setGoldPriceData] = useState({
        labels: [],
        datasets: [
            {
                label: 'API requests',
                data: [],
                fill: true,
                backgroundColor: 'rgba(128, 0, 128, 0.2)',
                borderColor: 'rgba(128, 0, 128, 1)',
            },
        ],
    });

    const [exchangeRateData, setExchangeRateData] = useState( {
        labels: [],
        datasets: [
            {
                label: 'API requests',
                data: [],
                fill: true,
                backgroundColor: 'rgba(66, 135, 245, 0.2)',
                borderColor: 'rgba(66, 135, 245, 1)',
            },
        ],
    });

    const options = {
        scales: {
            y: {
                ticks: {
                    beginAtZero: true,
                    min: 0,
                    stepSize: 1,
                },
                title: {
                    display: true,
                    text: 'Number of API requests'
                }
            }
        }
    };

    useEffect(() => {
        const eventSource = new EventSource('http://localhost:4000/traffic-status');

        eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
        };

        eventSource.addEventListener('gpTrafficData', (event) => {
            const gpTrafficLatestData = JSON.parse(event.data);
            const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            setGoldPriceData(prevData => ({
                ...prevData,
                labels: [...prevData.labels, currentTime].slice(-15),
                datasets: [
                    {
                        ...prevData.datasets[0],
                        data: [...prevData.datasets[0].data, gpTrafficLatestData.traffic_data].slice(-15)
                    }
                ]
            }));
        });

        eventSource.addEventListener('erTrafficData', (event) => {
            const erTrafficLatestData = JSON.parse(event.data);
            console.log(erTrafficLatestData.traffic_data);
            const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            setExchangeRateData(prevData => ({
                ...prevData,
                labels: [...prevData.labels, currentTime].slice(-15),
                datasets: [
                    {
                        ...prevData.datasets[0],
                        data: [...prevData.datasets[0].data, erTrafficLatestData.traffic_data].slice(-15)
                    }
                ]
            }));
        });

        return () => {
            eventSource.close();
        };
    }, [])

    return (
        <div className="traffic container">
            <h2>Traffic Logs Monitoring</h2>
            <h3>Exchange Rate Service</h3>
            <Line data={exchangeRateData} options={options}/>
            <p>The value of the chart at a given time represents the number of times the API was called in the interval between the previous time point and that time.</p>
            <br />

            <h3>Gold Price Service</h3>
            <Line data={goldPriceData} options={options}/>
            <p>The value of the chart at a given time represents the number of times the API was called in the interval between the previous time point and that time.</p>
        </div>
    );
}

export default TrafficStatus;

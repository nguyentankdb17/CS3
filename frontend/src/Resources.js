import React, { useState, useEffect } from 'react';
import './App.css';
import { Line } from 'react-chartjs-2';
import axios from 'axios';

function Resources() {
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

    const [bandwidthData, setBandwidthData] = useState({
        download: null,
        upload: null,
        ping: null
    });
    const [loading, setLoading] = useState(true);

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
                            <em>Drive: <strong>{disk.mounted}</strong></em>
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
                    <p style={{textAlign: "center"}}>Measuring internet bandwidth ... </p>
                ) : (
                    <div style={{textAlign: "center"}}>
                        <p><strong>Download Speed:</strong> {bandwidthData.download} Mbps</p>
                        <p><strong>Upload Speed:</strong> {bandwidthData.upload} Mbps</p>
                        <p><strong>Ping:</strong> {bandwidthData.ping} ms</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Resources;
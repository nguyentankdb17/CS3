import React, { useState, useEffect } from 'react';
import './App.css';
import { Line } from 'react-chartjs-2';

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
    const [bandwidthData, setBandwidthData] = useState({ download: null, upload: null, ping: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Khởi tạo EventSource
        const eventSource = new EventSource('http://localhost:5000/resource-data');

        // Nhận dữ liệu RAM
        eventSource.addEventListener('ramData', (event) => {
            const data = JSON.parse(event.data);
            const currentTime = new Date().toLocaleTimeString();

            setRamData(prevData => ({
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
            }));
        });

        // Nhận dữ liệu Disk
        eventSource.addEventListener('diskData', (event) => {
            const data = JSON.parse(event.data);
            setDiskData(data);
        });

        // Nhận dữ liệu Bandwidth
        eventSource.addEventListener('bandwidthData', (event) => {
            const data = JSON.parse(event.data);
            setBandwidthData(data);
            setLoading(false);
        });

        // Đóng EventSource khi component unmount
        return () => eventSource.close();
    }, []);

    return (
        <div className="resource container">
            <h2>System Status</h2>

            {/* Biểu đồ và thông tin RAM */}
            <div>
                <h3>Real-time RAM Usage</h3>
                <p>Total RAM Memory: {ramData.totalMem} GB</p>
                <p>Used RAM Memory: {ramData.usedMem} GB</p>
                <p>Free RAM Memory: {ramData.freeMem} GB</p>
                <p>RAM Memory Usage (%): {ramData.usagePercentage}%</p>
                <Line 
                    data={ramData} 
                    options={{
                        scales: {
                            x: { title: { display: true, text: 'Time' } },
                            y: {
                                title: { display: true, text: 'RAM Usage (%)' },
                                beginAtZero: true,
                                max: 100
                            }
                        },
                        animation: false
                    }} 
                />
            </div>

            {/* Thông tin ổ đĩa */}
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

            {/* Thông tin băng thông mạng */}
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
    );
}

export default Resources;

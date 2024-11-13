import React, { useState, useEffect } from 'react';
import './App.css';
import { Line } from 'react-chartjs-2';

function SystemStatus() {
    const [cpuData, setCpuData] = useState({
        labels: [],
        datasets: [
            {
                label: 'CPU Usage',
                data: [],
                fill: true,
                backgroundColor: 'rgba(66, 135, 245, 0.2)',
                borderColor: 'rgba(66, 135, 245, 1)',
            },
        ],
    });

    const [memoryData, setMemoryData] = useState( {
        labels: [],
        datasets: [
            {
                label: 'Memory Usage',
                data: [],
                fill: true,
                backgroundColor: 'rgba(66, 135, 245, 0.2)',
                borderColor: 'rgba(66, 135, 245, 1)',
            },
        ],
    });

    const [diskData, setDiskData] =  useState({
        labels: [],
        datasets: [
            {
                label: 'Data read',
                data: [],
                fill: false,
                borderColor: 'rgba(139, 69, 19, 1)',
            },
            {
                label: 'Data written',
                data: [],
                fill: false,
                borderColor: 'rgba(128, 0, 128, 1)',
            },
        ],
    });

    const [bandwidthData, setBandwidthData] = useState({
        labels: [],
        datasets: [
            {
                label: 'Data received',
                data: [],
                fill: true,
                backgroundColor: 'rgba(139, 69, 19, 0.2)',
                borderColor: 'rgba(139, 69, 19, 1)',
            },
            {
                label: 'Data sent',
                data: [],
                fill: true,
                backgroundColor: 'rgba(128, 0, 128, 0.2)',
                borderColor: 'rgba(128, 0, 128, 1)',
            },
        ],
    });

    useEffect(() => {
        // Khởi tạo EventSource
        const eventSource = new EventSource('http://localhost:4000/system-status');

        eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
        };

        // Interval để cập nhật dữ liệu mỗi 5 giây
        const interval = setInterval(() => {
            // Nhận dữ liệu CPU
            eventSource.addEventListener('cpuData', (event) => {
                const data = JSON.parse(event.data);
                const currentTime = new Date().toLocaleTimeString();

                setCpuData(prevData => ({
                    cpuTotal: data.cpuTotal,
                    cpuPercent: data.cpuPercent,
                    labels: [...prevData.labels, currentTime].slice(-10),
                    datasets: [
                        {
                            ...prevData.datasets[0],
                            data: [...prevData.datasets[0].data, data.cpuPercent].slice(-10)
                        }
                    ]
                }));
            });

            // Nhận dữ liệu Disk
            eventSource.addEventListener('memoryData', (event) => {
                const data = JSON.parse(event.data);
                const currentTime = new Date().toLocaleTimeString();

                setMemoryData(prevData => ({
                    memoryUsage: (data.memoryUsage / (1024 ** 2)).toFixed(2),
                    memoryLimit: (data.memoryLimit / (1024 ** 3)).toFixed(2),
                    labels: [...prevData.labels, currentTime].slice(-10),
                    datasets: [
                        {
                            ...prevData.datasets[0],
                            data: [...prevData.datasets[0].data, (data.memoryUsage / (1024 ** 2)).toFixed(2)].slice(-10)
                        }
                    ]
                }));
            });

            // Nhận dữ liệu Disk
            eventSource.addEventListener('diskData', (event) => {
                const data = JSON.parse(event.data);
                const currentTime = new Date().toLocaleTimeString();

                setDiskData(prevData => ({
                    dataRead: data.dataRead,
                    dataWritten: data.dataWritten,
                    labels: [...prevData.labels, currentTime].slice(-10),
                    datasets: [
                        {
                            ...prevData.datasets[0],
                            data: [...prevData.datasets[0].data, data.dataRead].slice(-10)
                        },
                        {
                            ...prevData.datasets[1],
                            data: [...prevData.datasets[1].data, data.dataWritten].slice(-10)
                        }
                    ]
                }));
            });

            // Nhận dữ liệu Bandwidth
            eventSource.addEventListener('bandwidthData', (event) => {
                const data = JSON.parse(event.data);
                const currentTime = new Date().toLocaleTimeString();

                setBandwidthData(prevData => ({
                    dataIn: (data.dataIn / 1024).toFixed(2),
                    dataOut: (data.dataOut / 1024).toFixed(2),
                    labels: [...prevData.labels, currentTime].slice(-10),
                    datasets: [
                        {
                            ...prevData.datasets[0],
                            data: [...prevData.datasets[0].data, (data.dataIn / 1024).toFixed(2)].slice(-10)
                        },
                        {
                            ...prevData.datasets[1],
                            data: [...prevData.datasets[1].data, (data.dataOut / 1024).toFixed(2)].slice(-10)
                        }
                    ]
                }));
            });
        }, 5000);

        // Xóa interval và đóng EventSource khi component unmount
        return () => {
            clearInterval(interval);
            eventSource.close();
        };
    }, []);

    return (
        <div className="SystemStatus">
            <h2>System Stats Monitoring</h2>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                <div>
                    <h3>CPU usage</h3>
                    <Line data={cpuData}/>
                </div>
                <div>
                    <h3>Memory usage</h3>
                    <Line data={memoryData}/>
                </div>
                <div>
                    <h3>Disk read/write</h3>
                    <Line data={diskData}/>
                </div>
                <div>
                    <h3>Internet Bandwidth I/O</h3>
                    <Line data={bandwidthData}/>
                </div>
            </div>
        </div>

    );
}

export default SystemStatus;
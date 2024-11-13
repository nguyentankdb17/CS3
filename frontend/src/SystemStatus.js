import React, { useState, useEffect } from 'react';
import './App.css';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

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

    const cpuOptions = {
        scales: {
            y: {
                ticks: {
                    callback: function(value) {
                        return `${value} %`; // Thêm đơn vị KB vào cột y
                    }
                },
                title: {
                    display: true,
                    text: 'CPU Usage'
                }
            }
        }
    };

    const memoryOptions = {
        scales: {
            y: {
                ticks: {
                    callback: function(value) {
                        return `${value} MB`; // Thêm đơn vị KB vào cột y
                    }
                },
                title: {
                    display: true,
                    text: 'Memory Usage'
                }
            }
        }
    };

    const diskOptions = {
        scales: {
            y: {
                ticks: {
                    callback: function(value) {
                        return `${value} B`; // Thêm đơn vị KB vào cột y
                    }
                },
                title: {
                    display: true,
                    text: 'Disk Usage'
                }
            }
        }
    };

    const bandwidthOptions = {
        scales: {
            y: {
                ticks: {
                    callback: function(value) {
                        return `${value} KB`; // Thêm đơn vị KB vào cột y
                    }
                },
                title: {
                    display: true,
                    text: 'Bandwidth'
                }
            }
        }
    };

    useEffect(() => {
        const eventSource = new EventSource('http://localhost:4000/system-status');

        eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
        };

        // Lắng nghe sự kiện cpuData và cập nhật state cpuData
        eventSource.addEventListener('cpuData', (event) => {
            const latestCpuData = JSON.parse(event.data);
            const currentTime = new Date().toLocaleTimeString();

            setCpuData(prevData => ({
                ...prevData,
                cpuTotal: latestCpuData.cpuTotal,
                cpuPercent: latestCpuData.cpuPercent,
                labels: [...prevData.labels, currentTime].slice(-15),
                datasets: [
                    {
                        ...prevData.datasets[0],
                        data: [...prevData.datasets[0].data, latestCpuData.cpuPercent].slice(-15)
                    }
                ]
            }));
        });

        // Lắng nghe sự kiện memoryData và cập nhật state memoryData
        eventSource.addEventListener('memoryData', (event) => {
            const latestMemoryData = JSON.parse(event.data);
            const currentTime = new Date().toLocaleTimeString();

            setMemoryData(prevData => ({
                ...prevData,
                memoryUsage: (latestMemoryData.memoryUsage / (1024 ** 2)).toFixed(2),
                memoryLimit: (latestMemoryData.memoryLimit / (1024 ** 3)).toFixed(2),
                labels: [...prevData.labels, currentTime].slice(-15),
                datasets: [
                    {
                        ...prevData.datasets[0],
                        data: [...prevData.datasets[0].data, (latestMemoryData.memoryUsage / (1024 ** 2)).toFixed(2)].slice(-15)
                    }
                ]
            }));
        });

        // Lắng nghe sự kiện diskData và cập nhật state diskData
        eventSource.addEventListener('diskData', (event) => {
            const latestDiskData = JSON.parse(event.data);
            const currentTime = new Date().toLocaleTimeString();

            setDiskData(prevData => ({
                ...prevData,
                dataRead: latestDiskData.dataRead,
                dataWritten: latestDiskData.dataWritten,
                labels: [...prevData.labels, currentTime].slice(-15),
                datasets: [
                    {
                        ...prevData.datasets[0],
                        data: [...prevData.datasets[0].data, latestDiskData.dataRead].slice(-15)
                    },
                    {
                        ...prevData.datasets[1],
                        data: [...prevData.datasets[1].data, latestDiskData.dataWritten].slice(-15)
                    }
                ]
            }));
        });

        // Lắng nghe sự kiện bandwidthData và cập nhật state bandwidthData
        eventSource.addEventListener('bandwidthData', (event) => {
            const latestBandwidthData = JSON.parse(event.data);
            const currentTime = new Date().toLocaleTimeString();

            setBandwidthData(prevData => ({
                ...prevData,
                dataIn: (latestBandwidthData.dataIn / 1024).toFixed(2),
                dataOut: (latestBandwidthData.dataOut / 1024).toFixed(2),
                labels: [...prevData.labels, currentTime].slice(-15),
                datasets: [
                    {
                        ...prevData.datasets[0],
                        data: [...prevData.datasets[0].data, (latestBandwidthData.dataIn / 1024).toFixed(2)].slice(-15)
                    },
                    {
                        ...prevData.datasets[1],
                        data: [...prevData.datasets[1].data, (latestBandwidthData.dataOut / 1024).toFixed(2)].slice(-15)
                    }
                ]
            }));
        });

        // Dọn dẹp kết nối EventSource khi component unmount
        return () => {
            eventSource.close();
        };
    }, []);



    return (
        <div className="resource container">
            <h2>System Status Monitoring</h2>
            <div className="resource-item">
                <div>
                    <h3>CPU usage</h3>
                    <br/>
                    <p><i>CPU Cores Allocated: </i>{cpuData.cpuTotal} core(s)</p>
                    <Line data={cpuData} options={cpuOptions}/>
                </div>
                <div>
                    <h3>Memory usage</h3>
                    <br/>
                    <p><i>RAM Memory Allocated: </i>{memoryData.memoryLimit} GB</p>
                    <Line data={memoryData} options={memoryOptions}/>
                </div>
                <div>
                    <h3>Disk read/write</h3>
                    <Line data={diskData} options={diskOptions}/>
                </div>
                <div>
                    <h3>Internet Bandwidth I/O</h3>
                    <Line data={bandwidthData} options={bandwidthOptions}/>
                </div>
            </div>
        </div>

    );
}

export default SystemStatus;
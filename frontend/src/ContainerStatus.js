import React, { useState, useEffect } from 'react';
import './App.css';


function ContainerStatus() {
    const [status, setStatus] = useState({
        goldPriceContainer: 'unknown',
        exchangeRateContainer: 'unknown',
    });

    useEffect(() => {
        const interval = setInterval(() => {
            fetch("http://localhost:4000/container-status")
                .then(response => response.json())
                .then(data => setStatus(data))
                .catch(error => console.error('Error fetching status:', error));
        }, 1000);

        return () => clearInterval(interval);
    }, [])

    return (
        <div className="container">
            <table>
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td><p>gold-price-container</p></td>
                    <td>Docker Container</td>
                    <td>{status.goldPriceContainer}</td>
                </tr>
                <tr>
                    <td><p>exchange-rate-container</p></td>
                    <td>Docker Container</td>
                    <td>{status.exchangeRateContainer}</td>
                </tr>
                </tbody>
            </table>
        </div>
    );
}

export default ContainerStatus;
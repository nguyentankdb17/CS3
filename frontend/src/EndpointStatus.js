import React, { useState, useEffect } from 'react';
import './App.css';


function EndpointStatus() {
    const [status, setStatus] = useState({
        goldPriceEndpoint: 'unknown',
        exchangeRateEndpoint: 'unknown',
    });

    useEffect(() => {
        const interval = setInterval(() => {
            fetch("http://localhost:5000/endpoint-status")
                .then(response => response.json())
                .then(data => setStatus(data))
                .catch(error => console.error('Error fetching status:', error));
        }, 1000);

        return () => clearInterval(interval);
    })

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
                    <td>Endpoint</td>
                    <td>{status.goldPriceEndpoint}</td>
                </tr>
                <tr>
                    <td><p>exchange-rate-container</p></td>
                    <td>Endpoint</td>
                    <td>{status.exchangeRateEndpoint}</td>
                </tr>
                </tbody>
            </table>
        </div>
    );
}

export default EndpointStatus;
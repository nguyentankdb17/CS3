import React, { useState, useEffect } from 'react';
import './App.css';

function Status() {
    const [status, setStatus] = useState({
        goldPriceContainer: 'unknown',
        exchangeRateContainer: 'unknown',
        goldPriceEndpoint: 'unknown',
        exchangeRateEndpoint: 'unknown',
    });

    useEffect(() => {
        fetch("http://localhost:3003/status")
            .then(response => response.json())
            .then(data => setStatus(data))
            .catch(error => console.error('Error fetching status:', error));
    }, []);

    return (
        <div className="status container">
            <h2>Service Status</h2>
            <p>Gold Price Container: {status.goldPriceContainer}</p>
            <p>Exchange Rate Container: {status.exchangeRateContainer}</p>
            <p>Gold Price Endpoint: {status.goldPriceEndpoint}</p>
            <p>Exchange Rate Endpoint: {status.exchangeRateEndpoint}</p>
        </div>
    );
}

export default Status;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GarbageReport.css';

const GarbageReport = ({ token }) => {
    const [location, setLocation] = useState({ latitude: null, longitude: null });
    const [image, setImage] = useState(null);
    const [message, setMessage] = useState('');
    const [userAddress, setUserAddress] = useState('');

    const link = "https://trashtracker-backend-0vqq.onrender.com"
    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setMessage('Location obtained successfully.');
            }, (error) => {
                console.error('Error accessing location:', error);
                setMessage('Error accessing location.');
            });
        } else {
            console.error('Geolocation is not supported by this browser.');
            setMessage('Geolocation is not supported by this browser.');
        }
    };

    useEffect(() => {
        getLocation();
    }, []);

    useEffect(() => {
        if (location.latitude !== null && location.longitude !== null) {
            getUserAddress();
        }
    }, [location]);

    const getUserAddress = async () => {
        const { latitude, longitude } = location;
        if (latitude && longitude) {
            const url = `https://api.opencagedata.com/geocode/v1/json?key=b818b42b81e44a72b191f9d483cbff82&q=${latitude},${longitude}&pretty=1&no_annotations=1`;
            try {
                const response = await axios.get(url);
                if (response.data.results && response.data.results[0]) {
                    setUserAddress(response.data.results[0].formatted);
                } else {
                    setMessage('Unable to retrieve address.');
                }
            } catch (error) {
                console.error('Error fetching address:', error);
                setMessage('Error fetching address.');
            }
        }
    };

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location.latitude || !location.longitude) {
            setMessage('Please provide your location.');
            return;
        }
        if (!image) {
            setMessage('Please upload an image.');
            return;
        }
        const formData = new FormData();
        formData.append('latitude', location.latitude);
        formData.append('longitude', location.longitude);
        formData.append('address', userAddress);
        formData.append('image', image);

        try {
            await axios.post('link/api/garbage-report', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessage('Mail sent and Report submitted successfully!');
        } catch (error) {
            console.error('Error reporting garbage:', error);
            setMessage('Error reporting garbage.');
        }
    };

    return (
        <div className="garbage-report-container">
            <h2>Report Garbage</h2>
            <button onClick={getLocation}>Get Location</button>
            {location.latitude && location.longitude && (
                <div>
                    <p>Latitude: {location.latitude}</p>
                    <p>Longitude: {location.longitude}</p>
                    {userAddress && <p>Address: {userAddress}</p>}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="image">Upload Image:</label>
                    <input type="file" id="image" accept="image/*" onChange={handleImageChange} />
                </div>
                <div className="form-group">
                    <button type="submit">Submit Report</button>
                </div>
            </form>
            {message && <p className="message">{message}</p>}
        </div>
    );
};

export default GarbageReport;

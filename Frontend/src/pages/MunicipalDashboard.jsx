import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ChoroplethMap from './ChloroplethMap';
import './MunicipalDashboard.css';
import 'leaflet/dist/leaflet.css';

const MunicipalDashboard = ({ token, onLogout }) => {
    const [reports, setReports] = useState([]);
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [sectorData, setSectorData] = useState({});
    const [message, setMessage] = useState('');
    const [timers, setTimers] = useState({});
    const [error, setError] = useState(null);
    const [showMap, setShowMap] = useState(false);

    const toggleMapVisibility = () => {
        setShowMap(prevShowMap => !prevShowMap);
    };

    const fetchReports = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:2000/api/municipal/reports', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setReports(response.data);

            // Initialize timers for in-progress reports
            const newTimers = {};
            response.data.forEach(report => {
                if (report.status === 'in-progress' && report.estimatedCompletionTime) {
                    newTimers[report._id] = new Date(report.estimatedCompletionTime).getTime();
                }
            });
            setTimers(newTimers);

            const geoJsonData = {
                type: "FeatureCollection",
                features: response.data.map(report => {
                    const address = report.address || '';
                    console.log("Address:", address);
                    const match = /(?:[Ss]ector\s*[\-]*\s*(\d+))/i.exec(address); 
                    const sectorNumber = match ? match[1] : 'Unknown'; 

                    return {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [report.location.longitude, report.location.latitude]
                        },
                        properties: {
                            name: report.sectorName,
                            sectorNumber: sectorNumber, 
                            frequency: report.frequency || 0 
                        }
                    };
                })
            };
            console.log("GeoJSON Data:", geoJsonData);
            setGeoJsonData(geoJsonData);
            const sectorFrequency = preprocessData(response.data);
            console.log("Sector Frequency Data:", sectorFrequency); // Log sector data
            setSectorData(sectorFrequency);
        
        } catch (error) {
            console.error('Error fetching reports:', error);
            setError('Error fetching reports.');
        }
    }, [token]);

    const preprocessData = (reports) => {
        const sectorFrequency = {};
        reports.forEach(report => {
            const address = report.address || '';
            const match = /[Ss]ector\s+(\d+)/.exec(address);
            if (match) {
                const sector = match[1];
                sectorFrequency[sector] = (sectorFrequency[sector] || 0) + 1;
            }
        });
        return sectorFrequency;
    };

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleUpdate = async (reportId, newStatus, estimatedCompletionTime) => {
        if (newStatus === 'in-progress' && !estimatedCompletionTime) {
            setMessage('Please set an estimated completion time.');
            return;
        }
        try {
            await axios.put(`http://localhost:2000/api/garbage-report/${reportId}/status`, {
                status: newStatus,
                estimatedCompletionTime: newStatus === 'in-progress' ? estimatedCompletionTime : null
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage('REPORT STATUS UPDATED SUCCESSFULLY !!');
            if (newStatus === 'in-progress') {
                setTimers(prevTimers => ({
                    ...prevTimers,
                    [reportId]: new Date(estimatedCompletionTime).getTime()
                }));
            } else if (newStatus === 'completed') {
                setTimers(prevTimers => {
                    const newTimers = { ...prevTimers };
                    delete newTimers[reportId];
                    return newTimers;
                });
            }
            fetchReports();
        } catch (error) {
            console.error('Error updating report status:', error);
            setMessage('Error updating report status.');
        }
    };

    const handleDelete = async (reportId) => {
        try {
            await axios.delete(`http://localhost:2000/api/garbage-report/${reportId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage('REPORT DELETED SUCCESSFULLY !!');
            setTimers(prevTimers => {
                const newTimers = { ...prevTimers };
                delete newTimers[reportId];
                return newTimers;
            });
            fetchReports();
        } catch (error) {
            console.error('Error deleting report:', error);
            setMessage('Error deleting report.');
        }
    };

    const calculateRemainingTime = (reportId) => {
        const currentTime = new Date().getTime();
        const completionTime = timers[reportId];
        if (!completionTime) return '00:00:00';
        const diff = completionTime - currentTime;
        if (diff <= 0) return '00:00:00';
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const getRowClassName = (report) => {
        if (report.status === 'completed') return 'completed-row';
        if (report.status === 'failed') return 'status-failed';
        if (report.status === 'pending') return 'status-pending';
        if (report.status === 'in-progress') {
            const remainingTime = calculateRemainingTime(report._id);
            return remainingTime === '00:00:00' ? 'status-failed' : 'status-in-progress';
        }
        return '';
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setReports(prevReports => 
                prevReports.map(report => {
                    if (report.status !== 'in-progress') return report;
                    const remainingTime = calculateRemainingTime(report._id);
                    if (remainingTime === '00:00:00') {
                        return { ...report, status: 'failed' };
                    }
                    return report;
                })
            );
        }, 1000);
        return () => clearInterval(interval);
    }, [timers]);

    return (
        <div className="municipal-dashboard-container">
            <div className="dashboard-header">
                <h2>MUNICIPAL DASHBOARD</h2>
                <button className="logout-button" onClick={onLogout}>Logout</button>
            </div>

            {error && <p className="error-message">{error}</p>}
            {message && <p className="message">{message}</p>}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Estimated Completion Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map(report => (
                            <tr key={report._id} className={getRowClassName(report)}>
                                <td>{report._id}</td>
                                <td>{report.address}</td>
                                <td>{report.status}</td>
                                <td>
                                    {report.status === 'completed' || report.status === 'failed' ? '-' : 
                                     report.status === 'in-progress' ? calculateRemainingTime(report._id) : 
                                     <input 
                                         type="datetime-local" 
                                         onChange={(e) => handleUpdate(report._id, 'in-progress', e.target.value)}
                                     />
                                    }
                                </td>
                                <td>
                                    {report.status !== 'completed' && report.status !== 'failed' && (
                                        <button 
                                            className="completed" 
                                            onClick={() => handleUpdate(report._id, 'completed')}
                                        >
                                            Mark Completed
                                        </button>
                                    )}
                                    <button className="delete" onClick={() => handleDelete(report._id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button onClick={toggleMapVisibility}>
                {showMap ? "Hide Map" : "Display Map"}
            </button>
            {showMap && geoJsonData && (
                <div className="map-container">
                    <ChoroplethMap geoJsonData={geoJsonData} sectorData={sectorData} />
                </div>
            )}
        </div>
    );
};

export default MunicipalDashboard;

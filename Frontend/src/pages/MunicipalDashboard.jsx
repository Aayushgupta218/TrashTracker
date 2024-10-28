import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ChoroplethMap from './ChloroplethMap';
import './MunicipalDashboard.css';
import 'leaflet/dist/leaflet.css';

const MunicipalDashboard = ({ token, onLogout }) => {
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [status, setStatus] = useState('');
    const [estimatedCompletionTime, setEstimatedCompletionTime] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await axios.get('http://localhost:2000/api/municipal/reports', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setReports(response.data);
            } catch (error) {
                console.error('Error fetching reports:', error);
            }
        };
        fetchReports();
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
        const interval = setInterval(() => {
            setReports((prevReports) => 
                prevReports.map(report => {
                    if (report.status === 'completed' || report.status === 'failed') return report;
                    const completionTime = new Date(report.estimatedCompletionTime).getTime();
                    const currentTime = new Date().getTime();
                    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
                    if (currentTime > completionTime + oneDay) {
                        return { ...report, status: 'failed' };
                    }
                    return report;
                })
            );
        }, 1000); 
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedReport) {
            setStatus(selectedReport.status || '');
            setEstimatedCompletionTime(selectedReport.estimatedCompletionTime || '');
        } else {
            setStatus('');
            setEstimatedCompletionTime('');
        }
    }, [selectedReport]);

    const handleUpdate = async () => {
        if (!selectedReport) return;
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
            <h2>Municipal Dashboard</h2>
            {message && <p className="message">{message}</p>}
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Estimated Completion Time (in days)</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {reports.map(report => (
                        <tr
                            key={report._id}
                            onClick={() => report.status !== 'completed' && setSelectedReport(report)}
                            className={`${report.status === 'completed' ? 'completed-row' : ''} ${report.status === 'failed' ? 'status-failed' : ''}`}
                        >
                            <td>{report._id}</td>
                            <td>{report.address}</td>
                            <td>
                                {report.status}
                                {report.status === 'failed' && <span className="warning-sign">⚠️</span>}
                            </td>
                            <td>{report.estimatedCompletionTime}</td>
                            <td>
                                <button
                                    className="in-progress"
                                    disabled={report.status === 'completed'}
                                    onClick={() => setSelectedReport(report)}
                                >
                                    In Progress
                                </button>
                                <button
                                    className="completed"
                                    onClick={() => setStatus('completed')}
                                    disabled={report.status === 'completed'}
                                >
                                    Completed
                                </button>
                                <button
                                    className="delete"
                                    onClick={() => handleDelete(report._id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {selectedReport && (
                <div className="update-form">
                    <h3>Update Report Status</h3>
                    <div>
                        <label>Status:</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                        >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    <div>
                        <label>Estimated Completion Time:</label>
                        <input
                            type="text"
                            value={estimatedCompletionTime}
                            onChange={e => setEstimatedCompletionTime(e.target.value)}
                        />
                    </div>
                    <button onClick={handleUpdate}>Update Status</button>
                </div>
            )}
        </div>
    );
};

export default MunicipalDashboard;

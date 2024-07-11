import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MunicipalDashboard.css';

const MunicipalDashboard = ({ token }) => {
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
            await axios.put(`http://localhost:2000/api/garbage-report/${selectedReport._id}/status`, {
                status,
                estimatedCompletionTime
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage('Report status updated successfully!');
            setReports(reports.map(report => report._id === selectedReport._id ? { ...report, status, estimatedCompletionTime } : report));
            setSelectedReport(null);
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
            setMessage('Report deleted successfully!');
            setReports(reports.filter(report => report._id !== reportId));
            setSelectedReport(null);
        } catch (error) {
            console.error('Error deleting report:', error);
            setMessage('Error deleting report.');
        }
    };

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

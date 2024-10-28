import React, { useState } from 'react'; 
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import GarbageReport from './pages/GarbageReport';
import MunicipalDashboard from './pages/MunicipalDashboard';
import ChoroplethMap from './pages/ChloroplethMap';

const Main = ({ token, setToken }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        setToken(null);
        navigate('/');
    };

    return (
        <div>
            {token && (
                <button className="logout-button" onClick={handleLogout}>
                    Logout
                </button>
            )}
            <Routes>
                <Route path="/" element={<AuthPage setToken={setToken} />} />
                <Route path="/garbage-report" element={<GarbageReport token={token} />} />
                <Route path="/municipal-dashboard" element={<MunicipalDashboard token={token} />} />
            </Routes>
        </div>
    );
};

const App = () => {
    const [token, setToken] = useState(null);

    return (
        <Router>
            <Main token={token} setToken={setToken} />
        </Router>
    );
};

export default App;

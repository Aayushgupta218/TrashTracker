import React, { useState } from 'react'; 
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import GarbageReport from './pages/GarbageReport';
import MunicipalDashboard from './pages/MunicipalDashboard';

const App = () => {
    const [token, setToken] = useState(null);

    return (
        <Router>
            <Routes>
                <Route path="/" element={<AuthPage setToken={setToken} />} />
                <Route path="/garbage-report" element={<GarbageReport token = {token}/>} />
                <Route path="/municipal-dashboard" element={<MunicipalDashboard token = {token}/>} />
            </Routes>
        </Router>
    );
};

export default App;

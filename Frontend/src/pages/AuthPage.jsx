import React, { useState } from 'react';
import axios from 'axios';
import './AuthPage.css';
import { useNavigate } from 'react-router-dom'; 

const AuthPage = ({ setToken }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user'); 
    const [errors, setErrors] = useState({});
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate(); 

    const link = "https://trashtracker-backend-0vqq.onrender.com";
    
    const validate = () => {
        let emailError = '';
        let passwordError = '';

        if (!email) {
            emailError = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            emailError = 'Email address is invalid';
        }

        if (!password) {
            passwordError = 'Password is required';
        } else if (password.length < 6) {
            passwordError = 'Password must be at least 6 characters';
        }

        if (emailError || passwordError) {
            setErrors({ email: emailError, password: passwordError });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isValid = validate();
        if (isValid) {
            try {
                const url = isLogin ? 'link/api/login' : 'link/api/register';
                const response = await axios.post(url, { email, password, role });
                if (isLogin) {
                    const token = response.data.token;
                    localStorage.setItem('token', token);
                    setToken(token);
                    setIsLoggedIn(true);
                    console.log('Logged in with:', { email, password });
                    
                    const decodedToken = JSON.parse(atob(token.split('.')[1]));
                    const userRole = decodedToken.role;

                    if (userRole === 'committee') {
                        navigate('/municipal-dashboard');
                    } else {
                        navigate('/garbage-report');
                    }
                } else {
                    console.log('Registered with:', { email, password, role });
                    alert('Registration successful. Please log in.');
                    setIsLogin(true);
                }
            } catch (error) {
                console.error(`${isLogin ? 'Login' : 'Registration'} failed:`, error);
                setErrors({ api: `${isLogin ? 'Login' : 'Registration'} failed. Please try again.` });
            }
        }
    };

    return (
        <div className="auth-container">
            {!isLoggedIn ? (
                <>
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <h2>{isLogin ? 'Login' : 'Register'}</h2>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {errors.email && <span className="error">{errors.email}</span>}
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {errors.password && <span className="error">{errors.password}</span>}
                        </div>
                        {!isLogin && (
                            <div className="form-group">
                                <label>Role</label>
                                <select value={role} onChange={(e) => setRole(e.target.value)}>
                                    <option value="user">User</option>
                                    <option value="committee">Committee</option>
                                </select>
                            </div>
                        )}
                        {errors.api && <span className="error">{errors.api}</span>}
                        <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
                    </form>
                    <button className="toggle-btn" onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                    </button>
                </>
            ) : <div>Logged In</div>}
        </div>
    );
};


export default AuthPage;

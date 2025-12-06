import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.password_confirmation) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw data;
            }

            // Show success message
            setSuccess(data.message);
            
            // Clear form
            setFormData({
                name: '',
                email: '',
                password: '',
                password_confirmation: '',
            });

        } catch (err) {
            const errors = err.errors;
            if (errors) {
                const errorMessages = Object.values(errors).flat().join(', ');
                setError(errorMessages);
            } else {
                setError(err.message || 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setLoading(true);
            setError('');
            await loginWithGoogle(credentialResponse);
            navigate('/dashboard');
        } catch (err) {
            setError(
                err.response?.data?.message || 
                'Google registration failed. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google registration failed. Please try again.');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Register</h2>
                {error && <div className="error-message">{error}</div>}
                {success && (
                    <div className="success-message">
                        {success}
                        <p style={{ marginTop: '10px', fontSize: '14px' }}>
                            Please check your email inbox and click the verification link.
                        </p>
                        <Link to="/login" style={{ display: 'block', marginTop: '10px', color: '#667eea', fontWeight: '600' }}>
                            Go to Login
                        </Link>
                    </div>
                )}
                
                <div className="google-login-wrapper">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        useOneTap
                        width="100%"
                    />
                </div>

                <div className="divider">
                    <span>OR</span>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Enter your name"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your email"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter your password (min. 8 characters)"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password_confirmation">Confirm Password</label>
                        <input
                            type="password"
                            id="password_confirmation"
                            name="password_confirmation"
                            value={formData.password_confirmation}
                            onChange={handleChange}
                            required
                            placeholder="Confirm your password"
                        />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Loading...' : 'Register'}
                    </button>
                </form>
                <p className="auth-link">
                    Already have an account? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;


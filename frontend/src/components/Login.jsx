import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Check for verification success
        if (searchParams.get('verified') === 'true') {
            setSuccess(searchParams.get('message') || 'Email verified successfully! You can now login.');
        } else if (searchParams.get('message')) {
            setSuccess(searchParams.get('message'));
        } else if (searchParams.get('error')) {
            setError(searchParams.get('error'));
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await login(email, password);
            // Redirect based on admin status
            if (data.is_admin) {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(
                err.response?.data?.message || 
                'Login failed. Please check your credentials.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setLoading(true);
            setError('');
            const data = await loginWithGoogle(credentialResponse);
            // Redirect based on admin status
            if (data.is_admin) {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(
                err.response?.data?.message || 
                'Google login failed. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google login failed. Please try again.');
    };

    return (
        <div className="auth-container">
            <div className="auth-wrapper">
                <div className="auth-form-section">
                    <div className="auth-card">
                        <h2>Login</h2>
                        <p className="auth-subtitle">Selamat datang kembali!</p>
                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}
                        
                                <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Masukkan email Anda"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Masukkan password Anda"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary">
                                {loading ? 'Loading...' : 'Login'}
                            </button>
                                </form>

                        <div className="divider">
                            <span>OR</span>
                        </div>

                        <div className="google-login-wrapper">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                useOneTap
                                width="100%"
                            />
                        </div>
                        
                        <p className="auth-link">
                            Belum punya akun? <Link to="/register">Daftar di sini</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

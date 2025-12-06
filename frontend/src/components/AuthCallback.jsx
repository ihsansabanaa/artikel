import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUser } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        const error = searchParams.get('error');

        if (error) {
            navigate('/login?error=' + error);
            return;
        }

        if (token && userParam) {
            try {
                const user = JSON.parse(decodeURIComponent(userParam));
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                
                // Redirect based on admin status
                if (user.is_admin) {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            } catch (err) {
                console.error('Error parsing user data:', err);
                navigate('/login?error=Authentication failed');
            }
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate, setUser]);

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
        }}>
            <p>Authenticating...</p>
        </div>
    );
};

export default AuthCallback;

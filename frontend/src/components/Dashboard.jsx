import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UploadContent from './UploadContent';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // If admin, redirect to admin dashboard
    if (user?.is_admin) {
        navigate('/admin');
        return null;
    }

    return <UploadContent />;
};

export default Dashboard;

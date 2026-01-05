import { createContext, useContext, useState } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = async (email, password) => {
        const data = await authService.login(email, password);
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    };

    const register = async (name, email, password, password_confirmation) => {
        const data = await authService.register(name, email, password, password_confirmation);
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        localStorage.removeItem('user');
    };

    const loginWithGoogle = async (credentialResponse) => {
        const data = await authService.loginWithGoogle(credentialResponse);
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const value = {
        user,
        login,
        register,
        logout,
        loginWithGoogle,
        updateUser,
        isAuthenticated: !!user,
        loading: false,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

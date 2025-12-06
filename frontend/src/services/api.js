import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add token to requests if it exists
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authService = {
    register: async (name, email, password, password_confirmation) => {
        const response = await api.post('/register', {
            name,
            email,
            password,
            password_confirmation,
        });
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    login: async (email, password) => {
        const response = await api.post('/login', { email, password });
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    logout: async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },

    getCurrentUser: async () => {
        const response = await api.get('/me');
        return response.data.user;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    loginWithGoogle: async (credentialResponse) => {
        const response = await api.post('/auth/google/login', {
            token: credentialResponse.credential,
        });
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    getGoogleAuthUrl: () => {
        return `${API_URL}/auth/google`;
    },
};

export default api;

import { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser({
                    id: decoded.user_id,
                    username: decoded.username,
                    nombre_completo: decoded.nombre_completo,
                    rol: decoded.nombre_rol?.toLowerCase() || 'estudiante',
                    avatar: decoded.avatar || 'avatar1'
                });
            } catch (error) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const response = await api.post('/login/', { username, password });
        const { access, refresh } = response.data;

        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);

        const decoded = jwtDecode(access);
        const userData = {
            id: decoded.user_id,
            username: decoded.username,
            nombre_completo: decoded.nombre_completo,
            rol: decoded.nombre_rol?.toLowerCase() || 'estudiante',
            avatar: decoded.avatar || 'avatar1'
        };
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    const updateUser = (data) => {
        setUser(prev => ({ ...prev, ...data }));
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const NotificationDropdown = ({ userRole }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/reportes-fallos/');
            // Filtrar pendientes y ordenar por fecha (más reciente primero)
            const pendientes = response.data.filter(r => r.estado === 'PENDIENTE');
            pendientes.sort((a, b) => new Date(b.fecha_reporte) - new Date(a.fecha_reporte));
            setNotifications(pendientes.slice(0, 5)); // Mostrar solo los últimos 5
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Opcional: Polling cada 60 segundos
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleNotificationClick = () => {
        setIsOpen(false);
        if (userRole === 'ADMIN') {
            navigate('/admin');
        } else if (userRole === 'TECNICO') {
            navigate('/tecnico/reportes');
        } else {
            navigate('/docente/reportes');
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all border border-slate-100 relative group"
            >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-slideUp">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800">Notificaciones</h3>
                        <button
                            onClick={fetchNotifications}
                            disabled={loading}
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-slate-500 text-sm">
                                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                <p>No hay notificaciones nuevas</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id_reporte}
                                        onClick={handleNotificationClick}
                                        className="p-4 hover:bg-indigo-50/50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-start">
                                            <AlertCircle className="w-5 h-5 text-indigo-500 mt-0.5 mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-800 line-clamp-2">
                                                    Nuevo reporte: {notif.detalle_problema}
                                                </p>
                                                <span className="text-xs text-slate-400 mt-1 block">
                                                    {new Date(notif.fecha_reporte).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <div
                            onClick={handleNotificationClick}
                            className="p-3 text-center border-t border-slate-100 text-sm font-bold text-indigo-600 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                            Ver todos los reportes
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;

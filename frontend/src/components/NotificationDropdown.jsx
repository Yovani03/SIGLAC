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
            const response = await api.get('/notificaciones/');
            // Filtrar no leídas y ordenar por fecha (más reciente primero)
            const activas = response.data.filter(n => !n.leida);
            setNotifications(activas.slice(0, 5)); // Mostrar solo los últimos 5
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Polling cada 60 segundos
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

    const handleNotificationClick = async (notif) => {
        try {
            await api.post(`/notificaciones/${notif.id_notificacion}/marcar-leida/`);
            setIsOpen(false);
            fetchNotifications();
            if (notif.link) {
                navigate(notif.link);
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.post('/notificaciones/marcar-todas-leidas/');
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all read:', error);
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
                        <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-slate-800">Notificaciones</h3>
                            <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-black">{notifications.length}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-wider"
                                title="Marcar todas como leídas"
                            >
                                Leer Todas
                            </button>
                            <button
                                onClick={fetchNotifications}
                                disabled={loading}
                                className="text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
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
                                        key={notif.id_notificacion}
                                        onClick={() => handleNotificationClick(notif)}
                                        className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-start">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 ${
                                                notif.tipo === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' : 
                                                notif.tipo === 'WARNING' ? 'bg-amber-100 text-amber-600' :
                                                'bg-indigo-100 text-indigo-600'
                                            }`}>
                                                <AlertCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 leading-tight">
                                                    {notif.mensaje}
                                                </p>
                                                <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                                                    {new Date(notif.fecha).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;

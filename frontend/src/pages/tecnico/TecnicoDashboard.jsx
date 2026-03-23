import LoadingSpinner from '../../components/LoadingSpinner';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
    Laptop, Layout, AlertCircle,
    ChevronRight, ArrowUpRight, Activity,
    Monitor, Clock
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, onClick, description }) => (
    <div
        onClick={onClick}
        className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500`}></div>

        <div className="relative z-10">
            <div className={`w-14 h-14 bg-${color}-50 rounded-2xl flex items-center justify-center text-${color}-600 mb-6 group-hover:scale-110 transition-transform`}>
                <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">{title}</h3>
            <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-slate-800 tracking-tighter">{value}</span>
            </div>
            <p className="text-slate-500 text-[10px] font-bold mt-4 uppercase tracking-tighter flex items-center">
                {description}
                <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-all font-black" />
            </p>
        </div>
    </div>
);

const TecnicoDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        equipos: 0,
        laboratorios: 0,
        reportes: 0,
        reportes_pendientes: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [equiposRes, labsRes, reportesRes, pcsRes] = await Promise.all([
                    api.get('/mobiliario/'),
                    api.get('/laboratorios/'),
                    api.get('/reportes-fallos/'),
                    api.get('/equipos-computo/')
                ]);

                setStats({
                    equipos: equiposRes.data.length + pcsRes.data.length,
                    laboratorios: labsRes.data.length,
                    reportes: reportesRes.data.length,
                    reportes_pendientes: reportesRes.data.filter(r => r.estado === 'PENDIENTE').length
                });
                setLoading(false);
            } catch (error) {
                console.error("Error fetching stats:", error);
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-10 animate-fadeIn">
            {/* Header / Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
                        ¡Hola, <span className="text-blue-600">Técnico {user?.nombre || user?.username}</span>!
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">
                        Panel de supervisión y consulta técnica • {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard
                    title="Inventario Total"
                    value={stats.equipos}
                    icon={Laptop}
                    color="blue"
                    description="Consultar equipos registrados"
                    onClick={() => navigate('/tecnico/equipos')}
                />
                <StatCard
                    title="Laboratorios"
                    value={stats.laboratorios}
                    icon={Layout}
                    color="indigo"
                    description="Consultar espacios académicos"
                    onClick={() => navigate('/tecnico/laboratorios')}
                />
                <StatCard
                    title="Reportes Pendientes"
                    value={stats.reportes_pendientes}
                    icon={AlertCircle}
                    color="rose"
                    description={`De un total de ${stats.reportes} reportes`}
                    onClick={() => navigate('/tecnico/reportes')}
                />
            </div>

            {/* Quick Actions / Recent status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
                    <div className="relative z-10">
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Estado del Sistema</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center space-x-4">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-200"></div>
                                    <span className="text-sm font-bold text-slate-600">Base de Datos SIGLAC</span>
                                </div>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">En Línea</span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center space-x-4">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-200"></div>
                                    <span className="text-sm font-bold text-slate-600">Servicio de Autenticación</span>
                                </div>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Activo</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Manual de Usuario Técnico - Oculto temporalmente
                <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group text-white">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Monitor className="w-40 h-40" />
                    </div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <h3 className="text-2xl font-black tracking-tight mb-4">Manual de Usuario Técnico</h3>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
                                Como técnico, puedes supervisar el estado de todos los equipos y laboratorios.
                                Revisa periódicamente los reportes de fallo para mantener el equipo en óptimas condiciones.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/tecnico/equipos')}
                            className="mt-8 flex items-center space-x-3 text-blue-400 font-black uppercase text-xs tracking-[0.2em] group/btn"
                        >
                            <span>Comenzar Revisión</span>
                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
                */}
            </div>
        </div>
    );
};

export default TecnicoDashboard;

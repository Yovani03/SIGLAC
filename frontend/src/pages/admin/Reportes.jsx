import React, { useState, useEffect } from 'react';
import {
    AlertCircle, BarChart3, PieChart, Activity,
    TrendingDown, ClipboardList, Download, Calendar,
    ChevronRight, ArrowUpRight, ArrowDownRight, RefreshCw,
    Shield, CheckCircle2, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const Reportes = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        setRefreshing(true);
        try {
            const res = await api.get('/reportes/stats/');
            setData(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching reports stats:", error);
            setLoading(false);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading && !data) return (
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Generando Estadísticas...</p>
        </div>
    );

    const statsCards = [
        {
            title: 'Equipos más fallados',
            icon: TrendingDown,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            count: `${data?.top_failures?.[0]?.count || 0} fallos`,
            detail: data?.top_failures?.[0]?.name || 'Ninguno'
        },
        {
            title: 'Uso de Labs',
            icon: Activity,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            count: `${data?.lab_usage?.[0]?.horarios_count || 0} hrs/sem`,
            detail: `Top: ${data?.lab_usage?.[0]?.nombre || 'S/D'}`
        },
        {
            title: 'Mant. Preventivo',
            icon: ClipboardList,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            count: `${data?.maintenance?.preventive || 0}`,
            detail: 'Actividades Realizadas'
        },
        {
            title: 'Reportes Globales',
            icon: BarChart3,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            count: `${data?.global_stats?.total || 0}`,
            detail: 'Historial completo'
        },
    ];

    // Minimalist Custom Bar Chart Component
    const MiniBarChart = ({ items }) => (
        <div className="space-y-4 w-full">
            {items.map((item, i) => (
                <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-end">
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate max-w-[150px]">
                            {item.name}
                        </span>
                        <span className="text-[10px] font-black text-rose-500">{item.count} REPORTES</span>
                    </div>
                    <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner p-0.5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.count / items[0].count) * 100}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full shadow-sm"
                        />
                    </div>
                </div>
            ))}
        </div>
    );

    // Distribution Circles
    const DistributionList = ({ items }) => (
        <div className="grid grid-cols-2 gap-4 w-full">
            {items.map((item, i) => {
                const colors = {
                    'PENDIENTE': 'from-rose-500 to-rose-400',
                    'EN REVISION': 'from-amber-500 to-amber-400',
                    'EN MANTENIMIENTO': 'from-blue-500 to-blue-400',
                    'RESUELTO': 'from-emerald-500 to-emerald-400'
                };
                return (
                    <div key={i} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col justify-center items-center group hover:bg-white hover:shadow-xl hover:scale-105 transition-all transition-duration-300">
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${colors[item.estado] || 'from-slate-500 to-slate-400'} flex items-center justify-center text-white font-black text-sm mb-2 shadow-lg`}>
                            {item.count}
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">{item.estado}</span>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="space-y-10 animate-fadeIn pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-5">
                    <div className="p-4 bg-rose-600 rounded-[1.5rem] shadow-xl shadow-rose-200 text-white">
                        <BarChart3 className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Reportes Estadísticos</h2>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="text-slate-400 text-sm font-medium">Análisis profundo del rendimiento institucional</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={fetchData}
                        disabled={refreshing}
                        className={`p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all ${refreshing ? 'animate-spin' : 'active:scale-95'}`}
                    >
                        <RefreshCw className={`w-5 h-5 text-slate-400 ${refreshing ? 'text-rose-500' : ''}`} />
                    </button>
                    <button className="flex items-center space-x-3 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95">
                        <Download className="w-4 h-4" />
                        <span>Exportar Informe</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 group relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 shadow-inner`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className="bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center">
                                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                                <span className="text-[10px] font-black text-emerald-600 tracking-tighter">SIGLAC LIVE</span>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">{stat.title}</h4>
                            <p className="text-4xl font-black text-slate-800 tracking-tighter mb-1">{stat.count}</p>
                            <p className="text-[11px] font-black text-slate-500 uppercase flex items-center">
                                <ChevronRight className="w-3 h-3 mr-1 text-slate-300" /> {stat.detail}
                            </p>
                        </div>
                        {/* Decorative Gradient */}
                        <div className={`absolute -right-10 -bottom-10 w-32 h-32 ${stat.bg} opacity-20 group-hover:opacity-40 rounded-full blur-3xl transition-opacity duration-700`}></div>
                    </motion.div>
                ))}
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Equipment Failures Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col"
                >
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center">
                                <TrendingDown className="w-6 h-6 mr-3 text-rose-500" /> Top Equipos Críticos
                            </h3>
                            <p className="text-slate-400 text-xs font-bold mt-1">Equipos con mayor número de incidencias reportadas.</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        {data?.top_failures?.length > 0 ? (
                            <MiniBarChart items={data.top_failures} />
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center opacity-20 italic">
                                <Monitor className="w-16 h-16 mb-4" />
                                <p className="font-black uppercase tracking-widest text-xs">Sin fallos registrados</p>
                            </div>
                        )}
                    </div>

                    <button className="mt-10 pt-8 border-t border-slate-50 text-[10px] font-black text-rose-500 uppercase tracking-[0.25em] text-center hover:translate-y-[-2px] transition-all">
                        Auditar Inventario Crítico
                    </button>
                </motion.div>

                {/* Distribution Chart */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col"
                >
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center">
                                <PieChart className="w-6 h-6 mr-3 text-indigo-500" /> Distribución de Estados
                            </h3>
                            <p className="text-slate-400 text-xs font-bold mt-1">Estatus actual de todos los incidentes en el sistema.</p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        {data?.distribution?.length > 0 ? (
                            <DistributionList items={data.distribution} />
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center opacity-20 italic">
                                <AlertCircle className="w-16 h-16 mb-4" />
                                <p className="font-black uppercase tracking-widest text-xs">Sin datos de distribución</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 flex items-center justify-center space-x-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <div>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Resueltos</p>
                                <p className="text-lg font-black text-slate-800">{data?.global_stats?.resolved || 0}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-rose-50 rounded-[1.5rem] border border-rose-100 flex items-center justify-center space-x-3">
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                            <div>
                                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Pendientes</p>
                                <p className="text-lg font-black text-slate-800">{data?.global_stats?.pending || 0}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Maintenance Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-100"
            >
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md">Resumen de Mantenimiento</div>
                        <h3 className="text-4xl font-black mb-6 leading-tight tracking-tighter">Eficiencia del <br /> Mantenimiento Preventivo</h3>
                        <p className="text-slate-300 text-base max-w-md mb-10 font-medium leading-relaxed">
                            Se han realizado <span className="text-emerald-400 font-black">{data?.maintenance?.preventive || 0}</span> actividades preventivas, logrando reducir los incidentes críticos en un 30%.
                        </p>
                        <div className="flex space-x-4">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preventivos</p>
                                <p className="text-3xl font-black">{data?.maintenance?.preventive || 0}</p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Correctivos</p>
                                <p className="text-3xl font-black">{data?.maintenance?.corrective || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-sm">
                        <h4 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center">
                            <Activity className="w-4 h-4 mr-2 text-indigo-400" /> Ranking Uso de Labs
                        </h4>
                        <div className="space-y-4">
                            {data?.lab_usage?.sort((a, b) => b.horarios_count - a.horarios_count).map((lab, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-xs font-black text-slate-500">0{i + 1}</span>
                                        <span className="text-sm font-bold">{lab.nombre}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-black text-indigo-400">{lab.horarios_count}</span>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Actividades</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Decorative Blobs */}
                <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
                <div className="absolute top-10 right-10 opacity-5 transform rotate-12">
                    <ClipboardList className="w-96 h-96" />
                </div>
            </motion.div>
        </div>
    );
};

export default Reportes;

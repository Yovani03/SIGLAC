import LoadingSpinner from '../../components/LoadingSpinner';
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    AlertCircle, Search, Clock, CheckCircle2,
    AlertTriangle, Filter, ChevronRight, User, Laptop,
    Wrench, MessageSquare, Save, X, ArrowRight, Play
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Toast from '../../components/Toast';

const ReportesTecnico = () => {
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('PENDIENTE'); // Default to Pendiente for workflow
    const [notification, setNotification] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    // Resolution Modal State
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [resolutionComment, setResolutionComment] = useState('');

    const fetchReportes = async () => {
        try {
            const res = await api.get('/reportes-fallos/');
            setReportes(res.data.sort((a, b) => new Date(b.fecha_reporte) - new Date(a.fecha_reporte)));
            setLoading(false);
        } catch (error) {
            console.error("Error fetching reportes:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportes();
    }, []);

    const showToast = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const updateStatus = async (id, newStatus, comments = '') => {
        setUpdatingId(id);
        try {
            const payload = { estado: newStatus };
            if (comments) payload.comentarios_resolucion = comments;

            await api.patch(`/reportes-fallos/${id}/`, payload);
            showToast(`Estado actualizado a ${newStatus}`);
            fetchReportes();
            setShowResolveModal(false);
            setResolutionComment('');

            // Auto-switch filter when item disappears from current list
            if (newStatus !== filterStatus && filterStatus !== 'ALL') {
                setTimeout(() => setFilterStatus(newStatus), 500);
            }
        } catch (error) {
            console.error("Error updating status:", error);
            showToast("Error al actualizar el estado", "error");
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredReportes = reportes.filter(r => {
        const matchesSearch =
            r.detalle_problema?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.usuario_reporta_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.equipo_serie?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'ALL' || r.estado === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const getStatusStyle = (estado) => {
        switch (estado) {
            case 'PENDIENTE': return { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500', icon: AlertCircle, label: 'Pendiente' };
            case 'EN REVISION': return { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', icon: Clock, label: 'En Revisión' };
            case 'RESUELTO': return { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', icon: CheckCircle2, label: 'Resuelto' };
            case 'EN MANTENIMIENTO': return { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', icon: Wrench, label: 'En Mantenimiento' };
            default: return { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-500', icon: AlertCircle, label: estado };
        }
    };

    // Helper to get next action based on current status
    const getNextActions = (reporte) => {
        if (reporte.estado === 'PENDIENTE') {
            return (
                <button
                    onClick={() => updateStatus(reporte.id_reporte, 'EN REVISION')}
                    className="flex items-center space-x-3 px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 group/btn"
                >
                    <Play className="w-4 h-4 fill-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Atender Reporte</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
            );
        }
        if (reporte.estado === 'EN REVISION') {
            return (
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => updateStatus(reporte.id_reporte, 'EN MANTENIMIENTO')}
                        className="flex items-center space-x-2 px-5 py-3.5 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
                    >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Mantenimiento</span>
                    </button>
                    <button
                        onClick={() => {
                            setSelectedReport(reporte);
                            setShowResolveModal(true);
                        }}
                        className="flex items-center space-x-2 px-5 py-3.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolver</span>
                    </button>
                </div>
            );
        }
        if (reporte.estado === 'EN MANTENIMIENTO') {
            return (
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => updateStatus(reporte.id_reporte, 'EN REVISION')}
                        className="flex items-center space-x-2 px-5 py-3.5 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
                    >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Regresar a Revisión</span>
                    </button>
                    <button
                        onClick={() => {
                            setSelectedReport(reporte);
                            setShowResolveModal(true);
                        }}
                        className="flex items-center space-x-2 px-5 py-3.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolver</span>
                    </button>
                </div>
            );
        }
        return null;
    };

    if (loading) return <LoadingSpinner />;

    const stats = {
        PENDIENTE: reportes.filter(r => r.estado === 'PENDIENTE').length,
        'EN REVISION': reportes.filter(r => r.estado === 'EN REVISION').length,
        'EN MANTENIMIENTO': reportes.filter(r => r.estado === 'EN MANTENIMIENTO').length,
        RESUELTO: reportes.filter(r => r.estado === 'RESUELTO').length,
    };

    return (
        <div className="space-y-10 animate-fadeIn pb-20">
            {/* Resolution Modal */}
            <AnimatePresence>
                {showResolveModal && selectedReport && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-emerald-600">
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tight">Resolver Reporte</h3>
                                    <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mt-1">S/N: {selectedReport.equipo_serie || '#' + selectedReport.id_reporte}</p>
                                </div>
                                <button onClick={() => setShowResolveModal(false)} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Comentarios de Resolución</label>
                                    <textarea
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-emerald-500 transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300 min-h-[120px]"
                                        placeholder="Describe qué se hizo para solucionar el problema..."
                                        value={resolutionComment}
                                        onChange={(e) => setResolutionComment(e.target.value)}
                                    />
                                </div>

                                <div className="pt-4 flex space-x-4">
                                    <button
                                        onClick={() => setShowResolveModal(false)}
                                        className="flex-1 py-4 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => updateStatus(selectedReport.id_reporte, 'RESUELTO', resolutionComment)}
                                        disabled={!resolutionComment}
                                        className="flex-1 py-4 bg-emerald-600 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save className="w-4 h-4 mr-2" /> Finalizar Reporte
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-3 text-rose-600 mb-4">
                        <AlertCircle className="w-8 h-8" />
                        <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Atención de Reportes</h2>
                    </div>
                    <p className="text-slate-500 font-bold max-w-lg">Gestiona y resuelve los reportes de fallas técnicas del sistema.</p>
                </div>

                {/* Search in header area */}
                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Filtrar en esta etapa..."
                        className="w-full pl-12 pr-5 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-bold text-slate-600 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Workflow Navigation (The "Apartados") */}
            <div className="flex bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-x-auto whitespace-nowrap gap-2 relative">
                {['ALL', 'PENDIENTE', 'EN REVISION', 'EN MANTENIMIENTO', 'RESUELTO'].map(status => {
                    const isActive = filterStatus === status;
                    const count = status === 'ALL' ? reportes.length : stats[status];
                    const label = status === 'ALL' ? 'Todos' : status;

                    return (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-8 py-5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all relative flex items-center space-x-3 ${isActive ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                        >
                            <span>{label}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {count}
                            </span>
                            {isActive && (
                                <motion.div layoutId="activeTab" className="absolute inset-0 border-2 border-slate-900 rounded-[1.8rem] -m-1" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Reports List area */}
            <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredReportes.length > 0 ? (
                        filteredReportes.map(reporte => {
                            const style = getStatusStyle(reporte.estado);
                            const isUpdating = updatingId === reporte.id_reporte;

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={reporte.id_reporte}
                                    className={`bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm transition-all duration-300 flex flex-col lg:flex-row items-stretch lg:items-center gap-10 group ${isUpdating ? 'opacity-50 pointer-events-none' : 'hover:shadow-2xl hover:-translate-y-1'}`}
                                >
                                    <div className={`w-20 h-20 ${style.bg} ${style.text} rounded-[2rem] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-inner`}>
                                        <style.icon className="w-10 h-10" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-4 mb-4">
                                            <div className="flex items-center px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                                                <div className={`w-2 h-2 rounded-full ${style.dot} mr-2`}></div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{style.label}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-rose-500 px-3 py-1 rounded-full bg-rose-50 uppercase tracking-widest border border-rose-100/50">
                                                Prioridad {reporte.urgencia}
                                            </span>
                                            <span className="text-slate-300 text-[10px] font-black font-mono">
                                                #{reporte.id_reporte}
                                            </span>
                                        </div>

                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-4 leading-tight">
                                            {reporte.detalle_problema}
                                        </h3>

                                        <div className="flex flex-wrap gap-6 items-center">
                                            <div className="flex items-center space-x-3 text-slate-500">
                                                <div className="p-1.5 bg-slate-50 rounded-lg"><User className="w-4 h-4" /></div>
                                                <span className="text-sm font-bold">{reporte.usuario_reporta_nombre}</span>
                                            </div>
                                            <div className="flex items-center space-x-3 text-blue-600">
                                                <div className="p-1.5 bg-blue-50 rounded-lg"><Laptop className="w-4 h-4" /></div>
                                                <span className="text-sm font-black uppercase tracking-tighter">
                                                    {reporte.equipo_serie || 'Inventario: ' + (reporte.equipo_computo || reporte.mobiliario)}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-3 text-slate-400">
                                                <div className="p-1.5 bg-slate-50 rounded-lg"><Clock className="w-4 h-4" /></div>
                                                <span className="text-sm font-bold">
                                                    {new Date(reporte.fecha_reporte).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                        </div>

                                        {reporte.comentarios_resolucion && (
                                            <div className="mt-8 p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100/50 relative overflow-hidden group/m">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/m:scale-110 transition-transform"><MessageSquare className="w-12 h-12" /></div>
                                                <div className="flex items-center space-x-2 text-emerald-600 mb-2 relative z-10">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Nota Técnica de Cierre</span>
                                                </div>
                                                <p className="text-base font-bold text-slate-700 relative z-10">{reporte.comentarios_resolucion}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sequential Actions Section */}
                                    <div className="flex-shrink-0 lg:pl-10 lg:border-l border-slate-50 flex flex-col justify-center items-center lg:items-end">
                                        <div className="w-full flex justify-center">
                                            {getNextActions(reporte)}
                                        </div>
                                        {reporte.estado === 'RESUELTO' && (
                                            <div className="flex flex-col items-center lg:items-end space-y-2">
                                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-50">
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Finalizado</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white rounded-[4rem] p-32 border border-dashed border-slate-200 text-center"
                        >
                            <div className="flex flex-col items-center opacity-20">
                                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-8">
                                    <Filter className="w-10 h-10" />
                                </div>
                                <p className="text-3xl font-black uppercase tracking-[0.3em] text-slate-400">Bandeja Vacía</p>
                                <p className="text-slate-400 font-bold mt-2">No hay reportes esperando en esta etapa del proceso.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Notifications */}
            <div className="fixed bottom-8 right-8 z-[200]">
                <AnimatePresence>
                    {notification && (
                        <Toast
                            message={notification.message}
                            type={notification.type}
                            onClose={() => setNotification(null)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ReportesTecnico;

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    AlertCircle, Clock, Wrench, CheckCircle, MoreHorizontal,
    MessageSquare, HardDrive, User, Calendar, RefreshCcw
} from 'lucide-react';

const Soporte = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/reportes-fallos/');
            setTickets(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching tickets:", error);
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await api.patch(`/reportes-fallos/${id}/`, { estado: newStatus });
            setShowModal(false);
            fetchTickets();
        } catch (error) {
            console.error("Error updating ticket status:", error);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDIENTE': return 'bg-rose-100 text-rose-600 border-rose-200';
            case 'EN REVISION': return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'EN MANTENIMIENTO': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
            case 'RESUELTO': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-rose-500/10 rounded-xl">
                        <AlertCircle className="w-8 h-8 text-rose-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Soporte Técnico</h2>
                        <p className="text-slate-500 text-sm">Reportes de fallas en equipos y laboratorios.</p>
                    </div>
                </div>
                <button
                    onClick={fetchTickets}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                    <RefreshCcw className="w-5 h-5" />
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(n => <div key={n} className="h-48 bg-slate-100 rounded-3xl animate-pulse"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tickets.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 font-medium">No hay reportes activos.</div>}
                    {tickets.map(ticket => (
                        <div
                            key={ticket.id_reporte}
                            onClick={() => { setSelectedTicket(ticket); setShowModal(true); }}
                            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${getStatusStyle(ticket.estado)}`}>
                                    {ticket.estado}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center">
                                    <Clock className="w-3.5 h-3.5 mr-1" />
                                    {new Date(ticket.fecha_reporte).toLocaleDateString()}
                                </span>
                            </div>

                            <p className="text-slate-800 font-bold mb-4 line-clamp-2 min-h-[3rem] leading-snug">
                                {ticket.detalle_problema}
                            </p>

                            <div className="space-y-2 pt-4 border-t border-slate-50">
                                <div className="flex items-center text-xs text-slate-500 font-medium">
                                    <HardDrive className="w-3.5 h-3.5 mr-2 opacity-60" />
                                    Equipo: <span className="text-slate-700 ml-1 font-bold">{ticket.mobiliario}</span>
                                </div>
                                <div className="flex items-center text-xs text-slate-500 font-medium">
                                    <User className="w-3.5 h-3.5 mr-2 opacity-60" />
                                    Reportado por: <span className="text-slate-700 ml-1 font-bold">{ticket.usuario_reporta_nombre || 'Usuario'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && selectedTicket && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-slideUp">
                        <div className="p-8 border-b border-slate-100 bg-slate-50 relative">
                            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors">
                                <RefreshCcw className="w-6 h-6" />
                            </button>
                            <div className="flex items-start space-x-4 mb-4">
                                <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-800">Detalle del Reporte</h3>
                                    <p className="text-slate-500 text-sm">Ticket ID: #{selectedTicket.id_reporte}</p>
                                </div>
                            </div>
                            <p className="bg-white p-4 rounded-2xl border border-slate-200 text-slate-700 leading-relaxed italic shadow-sm">
                                "{selectedTicket.detalle_problema}"
                            </p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Estado Actual</p>
                                    <div className={`text-sm font-bold flex items-center ${getStatusStyle(selectedTicket.estado).split(' ')[1]}`}>
                                        <Clock className="w-4 h-4 mr-2" /> {selectedTicket.estado}
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Equipo Afectado</p>
                                    <div className="text-sm font-bold text-slate-700 flex items-center">
                                        <HardDrive className="w-4 h-4 mr-2" /> {selectedTicket.mobiliario}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm font-bold text-slate-800">Acciones de Mantenimiento</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => updateStatus(selectedTicket.id_reporte, 'EN REVISION')}
                                        className="py-3 px-4 border border-amber-200 bg-amber-50 text-amber-700 rounded-2xl font-bold text-sm hover:bg-amber-100 transition-all flex items-center justify-center"
                                    >
                                        <Clock className="w-4 h-4 mr-2" /> Pasar a Revisión
                                    </button>
                                    <button
                                        onClick={() => updateStatus(selectedTicket.id_reporte, 'EN MANTENIMIENTO')}
                                        className="py-3 px-4 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition-all flex items-center justify-center shadow-sm shadow-indigo-100"
                                    >
                                        <Wrench className="w-4 h-4 mr-2" /> Iniciar Mantenimiento
                                    </button>
                                    <button
                                        onClick={() => updateStatus(selectedTicket.id_reporte, 'RESUELTO')}
                                        className="col-span-2 py-3 px-4 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-sm hover:bg-emerald-100 transition-all flex items-center justify-center mt-2"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" /> Marcar como Resuelto
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Soporte;

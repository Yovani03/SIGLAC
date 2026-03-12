import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, X, Search, Filter, Clock, CheckCircle, MoreVertical, History, Monitor, Edit2, Trash2, Box, Cpu } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ReportesDocente = () => {
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [itemsDisponibles, setItemsDisponibles] = useState([]);
    const [laboratorios, setLaboratorios] = useState([]);
    const [formData, setFormData] = useState({
        item_id: '',
        tipo_item: 'mobiliario', // 'mobiliario' o 'pc'
        detalle_problema: '',
        urgencia: 'MEDIA',
        id_laboratorio: '',
        estado: 'PENDIENTE'
    });
    const [submitting, setSubmitting] = useState(false);
    const [editingReport, setEditingReport] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [repRes, labRes] = await Promise.all([
                api.get('/reportes-fallos/me/'),
                api.get('/laboratorios/')
            ]);
            setReportes(repRes.data);
            setLaboratorios(labRes.data);
        } catch (error) {
            console.error("Error fetching initial data", error);
            toast.error("Error al cargar reportes");
        } finally {
            setLoading(false);
        }
    };

    // Load items (mob and pc) when lab is selected
    useEffect(() => {
        const fetchItems = async () => {
            if (!formData.id_laboratorio) {
                setItemsDisponibles([]);
                return;
            }
            try {
                const [mobRes, pcRes] = await Promise.all([
                    api.get(`/mobiliario/?laboratorio=${formData.id_laboratorio}`),
                    api.get(`/equipos-computo/?laboratorio=${formData.id_laboratorio}`)
                ]);

                const mobs = mobRes.data.map(m => ({ ...m, tipo: 'mobiliario' }));
                const pcs = pcRes.data.map(p => ({ ...p, tipo: 'pc' }));

                setItemsDisponibles([...pcs, ...mobs]);
            } catch (error) {
                console.error("Error fetching items", error);
            }
        };
        fetchItems();
    }, [formData.id_laboratorio]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                detalle_problema: formData.detalle_problema,
                urgencia: formData.urgencia,
                estado: formData.estado,
                // Decidir qué campo enviar según el tipo seleccionado
                mobiliario: formData.tipo_item === 'mobiliario' ? formData.item_id : null,
                equipo_computo: formData.tipo_item === 'pc' ? formData.item_id : null
            };

            if (editingReport) {
                await api.put(`/reportes-fallos/${editingReport.id_reporte}/`, payload);
                toast.success("Reporte actualizado");
            } else {
                await api.post('/reportes-fallos/', payload);
                toast.success("Reporte enviado correctamente");
            }

            setShowModal(false);
            setEditingReport(null);
            setFormData({ item_id: '', tipo_item: 'mobiliario', detalle_problema: '', urgencia: 'MEDIA', id_laboratorio: '', estado: 'PENDIENTE' });
            fetchInitialData();
        } catch (error) {
            console.error("Error saving report:", error.response?.data || error);
            const detail = error.response?.data ? JSON.stringify(error.response.data) : "Verifique los datos e intente de nuevo.";
            toast.error(`Error: ${detail}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await api.delete(`/reportes-fallos/${deleteConfirm.id_reporte}/`);
            toast.success("Reporte eliminado");
            setDeleteConfirm(null);
            fetchInitialData();
        } catch (error) {
            console.error("Error deleting report", error);
            toast.error("No se pudo eliminar el reporte");
        }
    };

    const openEdit = (reporte) => {
        setEditingReport(reporte);
        setFormData({
            item_id: reporte.equipo_computo || reporte.mobiliario || '',
            tipo_item: reporte.equipo_computo ? 'pc' : 'mobiliario',
            detalle_problema: reporte.detalle_problema,
            urgencia: reporte.urgencia,
            estado: reporte.estado,
            id_laboratorio: '' // No lo tenemos directo en el reporte, pero al cargar se filtrará
        });
        setShowModal(true);
    };

    const getUrgenciaBadge = (urgencia) => {
        const styles = {
            'ALTA': 'bg-rose-50 text-rose-600 border-rose-100',
            'MEDIA': 'bg-amber-50 text-amber-600 border-amber-100',
            'BAJA': 'bg-blue-50 text-blue-600 border-blue-100'
        };
        return (
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[urgencia] || styles.MEDIA}`}>
                {urgencia}
            </span>
        );
    };

    const getEstadoBadge = (estado) => {
        const styles = {
            'PENDIENTE': 'bg-slate-100 text-slate-500',
            'EN REVISION': 'bg-indigo-50 text-indigo-600',
            'RESUELTO': 'bg-emerald-50 text-emerald-600',
            'EN MANTENIMIENTO': 'bg-amber-50 text-amber-600'
        };
        return (
            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${styles[estado] || styles.PENDIENTE}`}>
                {estado}
            </span>
        );
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Reporte de Fallas</h1>
                    <p className="text-slate-500 font-medium">Gestiona y consulta el estado de tus tickets de soporte.</p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-4 rounded-3xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center space-x-2"
                >
                    <Plus className="w-5 h-5" />
                    <span>NUEVO REPORTE</span>
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-4">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pendientes</p>
                        <p className="text-2xl font-black text-slate-800">{reportes.filter(r => r.estado === 'PENDIENTE').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-4">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <History className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">En Revisión</p>
                        <p className="text-2xl font-black text-slate-800">{reportes.filter(r => r.estado === 'EN REVISION').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Resueltos</p>
                        <p className="text-2xl font-black text-slate-800">{reportes.filter(r => r.estado === 'RESUELTO').length}</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-10 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Historial de Reportes</h2>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar reporte..."
                                className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-left border-b border-slate-100">
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Folio</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Detalle del Problema</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Equipo / Lab</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Urgencia</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportes.length > 0 ? (
                                reportes.map((reporte) => (
                                    <tr key={reporte.id_reporte} className="border-b border-slate-50 hover:bg-slate-50/30 transition-all group">
                                        <td className="p-8">
                                            <span className="text-sm font-black text-slate-400">#RP-{reporte.id_reporte.toString().padStart(4, '0')}</span>
                                        </td>
                                        <td className="p-8">
                                            <p className="text-sm font-bold text-slate-700 line-clamp-2 max-w-xs">{reporte.detalle_problema}</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1">{new Date(reporte.fecha_reporte).toLocaleDateString()}</p>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-indigo-600 mb-1 flex items-center">
                                                    {reporte.equipo_computo ? <Cpu className="w-3 h-3 mr-1" /> : <Box className="w-3 h-3 mr-1" />}
                                                    {reporte.equipo_computo || reporte.mobiliario}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{reporte.mobiliario_detalle || "PC - " + (reporte.equipo_computo || "")}</span>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            {getUrgenciaBadge(reporte.urgencia)}
                                        </td>
                                        <td className="p-8">
                                            {getEstadoBadge(reporte.estado)}
                                        </td>
                                        <td className="p-8 text-right">
                                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(reporte)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => setDeleteConfirm(reporte)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <AlertCircle className="w-12 h-12 text-slate-100 mb-4" />
                                            <p className="text-slate-400 font-bold">No has levantado ningún reporte.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Nuevo Reporte */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-slideUp overflow-hidden">
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">{editingReport ? 'Actualizar Ticket' : 'Levantar Ticket'}</h3>
                                <p className="text-indigo-100 text-sm font-medium">{editingReport ? 'Modifica el estado o detalles' : 'Describe el problema para ser atendido.'}</p>
                            </div>
                            <button onClick={() => { setShowModal(false); setEditingReport(null); }} className="p-3 hover:bg-white/10 rounded-full transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            {editingReport && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Estado del Reporte</label>
                                    <select
                                        value={formData.estado}
                                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="PENDIENTE">Pendiente</option>
                                        <option value="EN REVISION">En revisión</option>
                                        <option value="EN MANTENIMIENTO">En mantenimiento</option>
                                        <option value="RESUELTO">Resuelto</option>
                                    </select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Laboratorio</label>
                                <select
                                    required
                                    value={formData.id_laboratorio}
                                    onChange={(e) => setFormData({ ...formData, id_laboratorio: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Seleccionar...</option>
                                    {laboratorios.map(lab => (
                                        <option key={lab.id_laboratorio} value={lab.id_laboratorio}>{lab.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Equipo / Mobiliario con Falla</label>
                                <select
                                    required
                                    disabled={!formData.id_laboratorio}
                                    value={formData.item_id}
                                    onChange={(e) => {
                                        const selected = itemsDisponibles.find(i => i.numero_inventario === e.target.value);
                                        setFormData({
                                            ...formData,
                                            item_id: e.target.value,
                                            tipo_item: selected?.tipo || 'mobiliario'
                                        });
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                                >
                                    <option value="">Seleccionar equipo...</option>
                                    {itemsDisponibles.map(item => (
                                        <option key={item.numero_inventario} value={item.numero_inventario}>
                                            [{item.tipo === 'pc' ? 'PC' : 'MOB'}] {item.numero_inventario} - {item.marca} {item.modelo}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nivel de Urgencia</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {['BAJA', 'MEDIA', 'ALTA'].map((u) => (
                                        <button
                                            key={u}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, urgencia: u })}
                                            className={`py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${formData.urgencia === u
                                                ? (u === 'ALTA' ? 'bg-rose-50 border-rose-200 text-rose-600' : u === 'MEDIA' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-blue-50 border-blue-200 text-blue-600')
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                }`}
                                        >
                                            {u}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descripción del Problema</label>
                                <textarea
                                    required
                                    rows="4"
                                    placeholder="Describe detalladamente la falla observada..."
                                    value={formData.detalle_problema}
                                    onChange={(e) => setFormData({ ...formData, detalle_problema: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-3xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                {submitting ? "ENVIANDO..." : (
                                    <>
                                        <AlertCircle className="w-5 h-5" />
                                        <span>ENVIAR REPORTE</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Eliminación */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn">
                        <div className="p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle className="w-10 h-10 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">¿Eliminar Reporte?</h3>
                                <p className="text-slate-500 font-medium mt-2">Esta acción borrará definitivamente el reporte <span className="text-rose-600 font-bold">#RP-{deleteConfirm.id_reporte.toString().padStart(4, '0')}</span>.</p>
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-100 transition-all"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportesDocente;

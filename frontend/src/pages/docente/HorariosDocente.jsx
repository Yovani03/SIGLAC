import LoadingSpinner from '../../components/LoadingSpinner';
import React, { useState, useEffect } from 'react';
import {
    Clock, Plus, Search, Filter, Edit2, Trash2,
    Save, X, Check, AlertTriangle, Calendar, User,
    MapPin, Info
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const HorariosDocente = () => {
    const { user } = useAuth();
    const isAdmin = user?.rol === 'admin';
    const [horarios, setHorarios] = useState([]);
    const [laboratorios, setLaboratorios] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLab, setSelectedLab] = useState('all');

    // Form States
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        dia_semana: 'Lunes',
        hora_inicio: '07:00',
        hora_fin: '09:00',
        descripcion_actividad: '',
        laboratorio: '',
        docente: ''
    });

    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [horariosRes, labsRes, docentesRes] = await Promise.all([
                api.get('/horarios-laboratorio/'),
                api.get('/laboratorios/'),
                api.get('/usuarios/?rol=docente')
            ]);
            setHorarios(horariosRes.data);
            setLaboratorios(labsRes.data);
            setDocentes(docentesRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
            toast.error("Error al cargar los horarios");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await api.put(`/horarios-laboratorio/${editingItem.id_horario}/`, formData);
                toast.success("Horario actualizado correctamente");
            } else {
                await api.post('/horarios-laboratorio/', formData);
                toast.success("Horario registrado correctamente");
            }

            setShowForm(false);
            setEditingItem(null);
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Error saving horario", error);
            toast.error("Error al guardar el horario. Verifique que no haya traslapes.");
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await api.delete(`/horarios-laboratorio/${deleteConfirm.id}/`);
            toast.success("Horario eliminado correctamente");
            setDeleteConfirm(null);
            fetchData();
        } catch (error) {
            console.error("Error deleting item", error);
            toast.error("Error al eliminar el horario");
        }
    };

    const resetForm = () => {
        setFormData({
            dia_semana: 'Lunes',
            hora_inicio: '07:00',
            hora_fin: '09:00',
            descripcion_actividad: '',
            laboratorio: '',
            docente: ''
        });
    };

    const openEdit = (item) => {
        setEditingItem(item);
        setFormData({
            dia_semana: item.dia_semana,
            hora_inicio: item.hora_inicio.substring(0, 5),
            hora_fin: item.hora_fin.substring(0, 5),
            descripcion_actividad: item.descripcion_actividad,
            laboratorio: item.laboratorio,
            docente: item.docente || ''
        });
        setShowForm(true);
    };

    const filteredItems = horarios.filter(item => {
        const matchesSearch =
            item.descripcion_actividad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.docente_nombre?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesLab = selectedLab === 'all' || item.laboratorio === parseInt(selectedLab);

        return matchesSearch && matchesLab;
    }).sort((a, b) => {
        const diaA = dias.indexOf(a.dia_semana);
        const diaB = dias.indexOf(b.dia_semana);
        if (diaA !== diaB) return diaA - diaB;
        return a.hora_inicio.localeCompare(b.hora_inicio);
    });

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Módulo de Horarios</h1>
                    <p className="text-slate-500 font-medium text-sm">Registro de horarios de disponibilidad y clases en laboratorios.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => { resetForm(); setEditingItem(null); setShowForm(true); }}
                        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 font-black uppercase text-xs tracking-widest"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Registrar Horario</span>
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por actividad o docente..."
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <select
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none appearance-none font-bold text-slate-700"
                        value={selectedLab}
                        onChange={(e) => setSelectedLab(e.target.value)}
                    >
                        <option value="all">Todos los Laboratorios</option>
                        {laboratorios.map(lab => (
                            <option key={lab.id_laboratorio} value={lab.id_laboratorio}>{lab.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                <th className="px-8 py-6">Día</th>
                                <th className="px-8 py-6">Horario</th>
                                <th className="px-8 py-6">Laboratorio</th>
                                <th className="px-8 py-6">Actividad / Docente</th>
                                {isAdmin && <th className="px-8 py-6 text-right">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredItems.map((item) => (
                                <tr key={item.id_horario} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${['Lunes', 'Miércoles', 'Viernes'].includes(item.dia_semana) ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                            {item.dia_semana}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center text-slate-700 font-bold">
                                            <Clock className="w-4 h-4 mr-2 text-slate-300" />
                                            {item.hora_inicio.substring(0, 5)} - {item.hora_fin.substring(0, 5)}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center text-slate-700 font-bold">
                                            <MapPin className="w-4 h-4 mr-2 text-indigo-400" />
                                            {item.laboratorio_nombre}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-black text-slate-800">{item.descripcion_actividad}</p>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tight flex items-center mt-1">
                                            <User className="w-3 h-3 mr-1" /> {item.docente_nombre || 'N/A'}
                                        </p>
                                    </td>
                                    {isAdmin && (
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEdit(item)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ id: item.id_horario, name: `${item.dia_semana} (${item.hora_inicio})` })}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredItems.length === 0 && (
                    <div className="p-20 text-center">
                        <Calendar className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-300">No hay horarios registrados</h3>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl animate-scaleIn">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">{editingItem ? 'Editar Horario' : 'Nuevo Horario'}</h3>
                                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Define el bloque temporal de actividad</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Día de la Semana</label>
                                    <select
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                                        value={formData.dia_semana}
                                        onChange={(e) => setFormData({ ...formData, dia_semana: e.target.value })}
                                        required
                                    >
                                        {dias.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Laboratorio</label>
                                    <select
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                                        value={formData.laboratorio}
                                        onChange={(e) => setFormData({ ...formData, laboratorio: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccione...</option>
                                        {laboratorios.map(lab => (
                                            <option key={lab.id_laboratorio} value={lab.id_laboratorio}>{lab.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora Inicio</label>
                                    <input
                                        type="time"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                                        value={formData.hora_inicio}
                                        onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora Fin</label>
                                    <input
                                        type="time"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                                        value={formData.hora_fin}
                                        onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Docente Responsable</label>
                                <select
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                                    value={formData.docente}
                                    onChange={(e) => setFormData({ ...formData, docente: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione Docente...</option>
                                    {docentes.map(d => (
                                        <option key={d.id} value={d.id}>{d.nombre} {d.apellido_paterno}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción de Actividad</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                                    value={formData.descripcion_actividad}
                                    onChange={(e) => setFormData({ ...formData, descripcion_actividad: e.target.value })}
                                    placeholder="Ej: Clase de Programación Web"
                                    required
                                />
                            </div>

                            <button className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all flex items-center justify-center active:scale-95 mt-4">
                                <Save className="w-5 h-5 mr-3" />
                                {editingItem ? 'Actualizar Horario' : 'Registrar Horario'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn">
                        <div className="p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-10 h-10 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">¿Eliminar Horario?</h3>
                                <p className="text-slate-500 font-medium mt-2">Se eliminará el bloque de <span className="text-rose-600 font-bold">{deleteConfirm.name}</span> del calendario.</p>
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

export default HorariosDocente;

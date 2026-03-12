import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Calendar, Clock, MapPin, Search, Plus,
    CheckCircle, XCircle, MoreVertical, Trash2, Edit2,
    Filter, RefreshCw, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Horarios = () => {
    const [estadoLabs, setEstadoLabs] = useState([]);
    const [horariosFijos, setHorariosFijos] = useState([]);
    const [laboratorios, setLaboratorios] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedLabId, setSelectedLabId] = useState(null);
    const [activeTab, setActiveTab] = useState('monitoreo'); // 'monitoreo' or 'gestion'
    const [formData, setFormData] = useState({
        dia_semana: 'Lunes',
        hora_inicio: '07:00',
        hora_fin: '09:00',
        descripcion_actividad: '',
        laboratorio: '',
        docente: ''
    });

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const horasOpciones = Array.from({ length: 24 }, (_, i) => {
        return `${i.toString().padStart(2, '0')}:00`;
    });

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchEstado, 30000); // Cada 30 seg
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchEstado(),
                fetchHorariosFijos(),
                fetchLaboratorios(),
                fetchDocentes()
            ]);
        } catch (error) {
            toast.error("Error al cargar datos");
        } finally {
            setLoading(false);
        }
    };

    const fetchEstado = async () => {
        const res = await api.get('/laboratorios/estado_actual/');
        setEstadoLabs(res.data);
    };

    const fetchHorariosFijos = async () => {
        const res = await api.get('/horarios-laboratorio/');
        setHorariosFijos(res.data);
    };

    const fetchLaboratorios = async () => {
        const res = await api.get('/laboratorios/');
        setLaboratorios(res.data);
    };

    const fetchDocentes = async () => {
        const res = await api.get('/usuarios/?rol=docente');
        setDocentes(res.data);
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData({
            dia_semana: 'Lunes',
            hora_inicio: '07:00',
            hora_fin: '09:00',
            descripcion_actividad: '',
            laboratorio: '',
            docente: ''
        });
        setShowModal(true);
    };

    const handleOpenEdit = (h) => {
        setEditingId(h.id_horario);
        setFormData({
            dia_semana: h.dia_semana,
            hora_inicio: h.hora_inicio.substring(0, 5),
            hora_fin: h.hora_fin.substring(0, 5),
            descripcion_actividad: h.descripcion_actividad || '',
            laboratorio: h.laboratorio,
            docente: h.docente
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/horarios-laboratorio/${editingId}/`, formData);
                toast.success("Horario actualizado");
            } else {
                await api.post('/horarios-laboratorio/', formData);
                toast.success("Horario guardado correctamente");
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            toast.error("Error al guardar horario");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Seguro que deseas eliminar este horario?")) {
            try {
                await api.delete(`/horarios-laboratorio/${id}/`);
                toast.success("Horario eliminado");
                fetchHorariosFijos();
                fetchEstado();
            } catch (error) {
                toast.error("Error al eliminar");
            }
        }
    };

    const labsDisponibles = estadoLabs.filter(l => !l.ocupado);
    const labsOcupados = estadoLabs.filter(l => l.ocupado);

    const filteredHorarios = selectedLabId
        ? horariosFijos.filter(h => h.laboratorio === parseInt(selectedLabId))
        : [];

    const selectedLabData = laboratorios.find(l => l.id_laboratorio === parseInt(selectedLabId));

    const getHorariosPorDia = (dia) => {
        return filteredHorarios
            .filter(h => h.dia_semana === dia)
            .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl">
                        <Calendar className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Módulo de Horarios</h2>
                        <p className="text-slate-500 font-medium">Gestión de disponibilidad y clases programadas</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={fetchEstado}
                        className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        title="Actualizar estado"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center space-x-2 px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nuevo Horario</span>
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('monitoreo')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'monitoreo' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Monitoreo en Tiempo Real
                </button>
                <button
                    onClick={() => setActiveTab('gestion')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'gestion' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Gestión de Horarios Fijos
                </button>
            </div>

            {activeTab === 'monitoreo' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Disponibilidad (Labs Libres) */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" />
                                Disponibilidad Actual
                            </h3>
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black">
                                {labsDisponibles.length} LIBRES
                            </span>
                        </div>
                        <div className="space-y-3">
                            {labsDisponibles.map(lab => (
                                <div key={lab.id_laboratorio} className="group p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-emerald-200">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-800 text-lg">{lab.nombre}</p>
                                            <div className="flex items-center text-xs text-slate-500 mt-1">
                                                <MapPin className="w-3 h-3 mr-1" /> {lab.ubicacion}
                                            </div>
                                        </div>
                                        <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                            Libre
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <span className="text-xs text-slate-400 font-medium">Capacidad: {lab.capacidad} pers.</span>
                                        <button className="text-indigo-600 text-xs font-bold hover:underline">Ver detalle</button>
                                    </div>
                                </div>
                            ))}
                            {labsDisponibles.length === 0 && (
                                <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <p className="text-slate-400 font-medium italic">No hay laboratorios disponibles en este momento.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Horarios Registrados (Labs Ocupados) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-indigo-500" />
                                Clases en Curso
                            </h3>
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black">
                                {labsOcupados.length} ACTIVAS
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {labsOcupados.map(lab => (
                                <div key={lab.id_laboratorio} className="relative overflow-hidden p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-lg transition-all border-l-4 border-l-indigo-500">
                                    <div className="flex justify-between mb-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-indigo-500 mb-1 block uppercase tracking-widest">{lab.tipo_ocupacion.replace('_', ' ')}</span>
                                            <h4 className="font-bold text-slate-800 text-xl">{lab.nombre}</h4>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-xl">
                                            <Clock className="w-5 h-5 text-indigo-500" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="bg-indigo-50/50 p-3 rounded-2xl">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Actividad:</p>
                                            <p className="text-slate-700 font-bold">{lab.detalles}</p>
                                            {lab.docente_nombre ? (
                                                <p className="text-[10px] text-indigo-400 font-medium mt-1">Imparte: {lab.docente_nombre}</p>
                                            ) : (
                                                <p className="text-[10px] text-slate-400 font-medium mt-1 italic">Sin docente asignado</p>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500 font-medium">Hasta: <b className="text-slate-800">{lab.hora_fin?.substring(0, 5)} hrs</b></span>
                                            <span className="flex items-center text-indigo-600 font-bold text-[10px] bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> En curso
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {labsOcupados.length === 0 && (
                                <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <p className="text-slate-400 font-medium italic text-lg">No hay actividades registradas en este momento.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Gestión de Horarios Fijos */
                <div className="space-y-6 animate-fadeIn">
                    {!selectedLabId ? (
                        /* Paso 1: Selección de Laboratorio */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="col-span-full mb-2">
                                <h3 className="text-xl font-bold text-slate-800">Selecciona un Laboratorio</h3>
                                <p className="text-slate-500">Elige un espacio para gestionar sus horarios semanales</p>
                            </div>
                            {laboratorios.map(lab => {
                                const count = horariosFijos.filter(h => h.laboratorio === lab.id_laboratorio).length;
                                return (
                                    <button
                                        key={lab.id_laboratorio}
                                        onClick={() => setSelectedLabId(lab.id_laboratorio)}
                                        className="text-left p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <MapPin className="w-12 h-12 text-indigo-600" />
                                        </div>
                                        <h4 className="font-black text-slate-800 text-xl mb-1">{lab.nombre}</h4>
                                        <p className="text-slate-500 text-xs font-medium mb-4">{lab.ubicacion}</p>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase">
                                                {count} {count === 1 ? 'Horario' : 'Horarios'}
                                            </span>
                                            <span className="text-indigo-600 font-bold text-sm group-hover:translate-x-1 transition-transform">Ver horarios →</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        /* Paso 2: Vista de Calendario del Laboratorio */
                        <div className="space-y-6">
                            {/* Header de Laboratorio Seleccionado */}
                            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => setSelectedLabId(null)}
                                        className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                                    >
                                        <RefreshCw className="w-5 h-5 rotate-180" />
                                    </button>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800">{selectedLabData?.nombre}</h3>
                                        <p className="text-slate-500 font-medium text-sm">Calendario de Horarios Fijos</p>
                                    </div>
                                </div>
                                <div className="flex bg-slate-100 p-1 rounded-2xl">
                                    <span className="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Capacidad: {selectedLabData?.capacidad}</span>
                                </div>
                            </div>

                            {/* Grid Semanal */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                                {diasSemana.map(dia => {
                                    const horariosDia = getHorariosPorDia(dia);
                                    return (
                                        <div key={dia} className="flex flex-col space-y-3">
                                            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                                                <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-widest">{dia}</h4>
                                            </div>

                                            <div className="space-y-3 min-h-[200px] p-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                                {horariosDia.map(h => (
                                                    <div key={h.id_horario} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">
                                                                    {h.hora_inicio.substring(0, 5)} - {h.hora_fin.substring(0, 5)}
                                                                </span>
                                                                <span className="font-bold text-slate-700 text-sm leading-tight mt-1">{h.descripcion_actividad}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-[9px] text-slate-400 font-medium mb-3 truncate">Doc: {h.docente_nombre || 'N/A'}</p>

                                                        <div className="flex items-center space-x-1 border-t border-slate-50 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleOpenEdit(h)}
                                                                className="flex-1 p-1 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-[10px] font-bold"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(h.id_horario)}
                                                                className="p-1 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {horariosDia.length === 0 && (
                                                    <div className="flex-1 flex items-center justify-center">
                                                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">Libre</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal para Nuevo/Editar Horario */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden relative animate-scaleUp">
                        <div className="p-8 pb-0">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-slate-800">{editingId ? 'Editar Horario' : 'Crear Nuevo Horario'}</h3>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                    <XCircle className="w-8 h-8" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Laboratorio</label>
                                    <select
                                        required
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
                                        value={formData.laboratorio}
                                        onChange={e => setFormData({ ...formData, laboratorio: e.target.value })}
                                    >
                                        <option value="">Selecciona un laboratorio</option>
                                        {laboratorios.map(lab => (
                                            <option key={lab.id_laboratorio} value={lab.id_laboratorio}>{lab.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Docente Responsable</label>
                                    <select
                                        required
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
                                        value={formData.docente}
                                        onChange={e => setFormData({ ...formData, docente: e.target.value })}
                                    >
                                        <option value="">Selecciona un docente</option>
                                        {docentes.map(doc => (
                                            <option key={doc.id} value={doc.id}>{doc.nombre} {doc.apellido_paterno}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Día</label>
                                        <select
                                            required
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700"
                                            value={formData.dia_semana}
                                            onChange={e => setFormData({ ...formData, dia_semana: e.target.value })}
                                        >
                                            {diasSemana.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Actividad</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Clase Programación"
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700"
                                            value={formData.descripcion_actividad}
                                            onChange={e => setFormData({ ...formData, descripcion_actividad: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Hora Inicio</label>
                                        <select
                                            required
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-indigo-600"
                                            value={formData.hora_inicio}
                                            onChange={e => setFormData({ ...formData, hora_inicio: e.target.value })}
                                        >
                                            {horasOpciones.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Hora Fin</label>
                                        <select
                                            required
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-rose-600"
                                            value={formData.hora_fin}
                                            onChange={e => setFormData({ ...formData, hora_fin: e.target.value })}
                                        >
                                            {horasOpciones.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 mt-4"
                                >
                                    {editingId ? 'Actualizar Horario' : 'Guardar Horario'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Horarios;

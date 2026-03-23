import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import {
    Calendar, Clock, MapPin, Search, Plus,
    CheckCircle, XCircle, MoreVertical, Trash2, Edit2,
    Filter, RefreshCw, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

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
    const [selectedBlocks, setSelectedBlocks] = useState([]);
    const [editBlockData, setEditBlockData] = useState({
        dia_semana: 'Lunes',
        hora_inicio: '08:00',
        hora_fin: '09:00'
    });
    const [formData, setFormData] = useState({
        descripcion_actividad: '',
        laboratorio: '',
        docente: '',
        grado: '',
        grupo: '',
        carrera: ''
    });

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const dias_calendario = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const horas_calendario = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const opcionesGrado = ['1ro', '2do', '3ro', '4to', '5to', '6to', '7mo', '8vo', '9no', '10mo'];
    const opcionesGrupo = ['A', 'B', 'C', 'D'];
    const opcionesCarrera = ['DSM', 'ENTORNOS', 'REDES'];
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
        setSelectedBlocks([]); // Reset clicked cells
        setFormData({
            descripcion_actividad: '',
            laboratorio: '',
            docente: '',
            grado: '',
            grupo: '',
            carrera: ''
        });
        setShowModal(true);
    };

    const handleOpenEdit = (h) => {
        setEditingId(h.id_horario);
        setFormData({
            descripcion_actividad: h.descripcion_actividad || '',
            laboratorio: h.laboratorio,
            docente: h.docente,
            grado: h.grado || '',
            grupo: h.grupo || '',
            carrera: h.carrera || ''
        });
        setEditBlockData({
            dia_semana: h.dia_semana,
            hora_inicio: h.hora_inicio.substring(0, 5),
            hora_fin: h.hora_fin.substring(0, 5)
        });
        setShowModal(true);
    };

    const toggleBlock = (dia, hora) => {
        const key = `${dia}-${hora}`;
        if (selectedBlocks.includes(key)) {
            setSelectedBlocks(selectedBlocks.filter(b => b !== key));
        } else {
            setSelectedBlocks([...selectedBlocks, key]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/horarios-laboratorio/${editingId}/`, {
                    ...formData,
                    ...editBlockData
                });
                toast.success("Horario de clase actualizado");
            } else {
                if (selectedBlocks.length === 0) {
                    toast.error("Seleccione al menos una celda en el calendario.", { icon: '🗓️' });
                    return;
                }
                const promises = selectedBlocks.map(blockKey => {
                    const [dia, horaStr] = blockKey.split('-');
                    const startHr = parseInt(horaStr.split(':')[0]);
                    const hora_fin = `${(startHr + 1).toString().padStart(2, '0')}:00`;
                    return api.post('/horarios-laboratorio/', {
                        ...formData,
                        dia_semana: dia,
                        hora_inicio: horaStr,
                        hora_fin: hora_fin
                    });
                });
                await Promise.all(promises);
                toast.success("Clase agendada en los horarios seleccionados.");
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            toast.error("Error al guardar clase");
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: '¿Seguro que deseas eliminar este horario?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
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

    const isHoraOcupada = (dia, horaStr) => {
        if (!formData.laboratorio) return false;
        const horariosLab = horariosFijos.filter(h => h.laboratorio === parseInt(formData.laboratorio));
        return horariosLab.some(h => {
            if (h.dia_semana !== dia) return false;
            // Solo comparamos si el ID de la clase editándose es distinto
            if (editingId && h.id_horario === editingId) return false;
            const cellStart = parseInt(horaStr.split(':')[0]);
            const blockStart = parseInt(h.hora_inicio.split(':')[0]);
            const blockEnd = parseInt(h.hora_fin.split(':')[0]);
            return cellStart >= blockStart && cellStart < blockEnd;
        });
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
                    <Button
                        onClick={handleOpenCreate}
                        variant="primary"
                        icon={Plus}
                    >
                        Nuevo Horario
                    </Button>
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
                                                                <span className="font-bold text-slate-700 text-sm leading-tight mt-1 truncate">{h.descripcion_actividad}</span>
                                                                {h.grado && (
                                                                    <span className="text-[9px] font-black tracking-widest text-slate-400 mt-1 uppercase truncate">
                                                                        {h.grado} {h.grupo} {h.carrera ? `| ${h.carrera}` : ''}
                                                                    </span>
                                                                )}
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

            {/* Modal para Nuevo/Editar Horario/Clase */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
                    <div className={`bg-white rounded-[2.5rem] w-full ${editingId ? 'max-w-lg' : 'max-w-4xl'} shadow-2xl relative animate-scaleUp my-8 flex flex-col max-h-[90vh]`}>
                        <div className="p-8 pb-4 shrink-0 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800">{editingId ? 'Editar Horario Fijo' : 'Alta de Nueva Clase'}</h3>
                                {!editingId && <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Selección interactiva de celdas horarias</p>}
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Datos Base */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Laboratorio Asignado</label>
                                        <select
                                            required
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
                                            value={formData.laboratorio}
                                            onChange={e => setFormData({ ...formData, laboratorio: e.target.value })}
                                        >
                                            <option value="">Selecciona espacio...</option>
                                            {laboratorios.map(lab => (
                                                <option key={lab.id_laboratorio} value={lab.id_laboratorio}>{lab.nombre}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Docente Responsable</label>
                                        <select
                                            required
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
                                            value={formData.docente}
                                            onChange={e => setFormData({ ...formData, docente: e.target.value })}
                                        >
                                            <option value="">Selecciona docente...</option>
                                            {docentes.map(doc => (
                                                <option key={doc.id} value={doc.id}>{doc.nombre} {doc.apellido_paterno}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Materia / Actividad</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: Programación Avanzada, Redes II..."
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-black text-slate-700 text-lg"
                                        value={formData.descripcion_actividad}
                                        onChange={e => setFormData({ ...formData, descripcion_actividad: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1">Grado</label>
                                        <select
                                            className="w-full p-4 bg-amber-50/50 border border-amber-100 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none font-bold text-amber-700"
                                            value={formData.grado}
                                            onChange={e => setFormData({ ...formData, grado: e.target.value })}
                                        >
                                            <option value="">N/A</option>
                                            {opcionesGrado.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Grupo</label>
                                        <select
                                            className="w-full p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold text-emerald-700"
                                            value={formData.grupo}
                                            onChange={e => setFormData({ ...formData, grupo: e.target.value })}
                                        >
                                            <option value="">N/A</option>
                                            {opcionesGrupo.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Carrera</label>
                                        <select
                                            className="w-full p-4 bg-blue-50/50 border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-blue-700"
                                            value={formData.carrera}
                                            onChange={e => setFormData({ ...formData, carrera: e.target.value })}
                                        >
                                            <option value="">N/A</option>
                                            {opcionesCarrera.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Selección de Horas */}
                                {editingId ? (
                                    <div className="grid grid-cols-3 gap-4 p-5 bg-indigo-50/50 border border-indigo-100 rounded-3xl mt-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Día</label>
                                            <select
                                                required
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700"
                                                value={editBlockData.dia_semana}
                                                onChange={e => setEditBlockData({ ...editBlockData, dia_semana: e.target.value })}
                                            >
                                                {diasSemana.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Hora Inicio</label>
                                            <select
                                                required
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-indigo-600"
                                                value={editBlockData.hora_inicio}
                                                onChange={e => setEditBlockData({ ...editBlockData, hora_inicio: e.target.value })}
                                            >
                                                {horasOpciones.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Hora Fin</label>
                                            <select
                                                required
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-rose-600"
                                                value={editBlockData.hora_fin}
                                                onChange={e => setEditBlockData({ ...editBlockData, hora_fin: e.target.value })}
                                            >
                                                {horasOpciones.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full mt-8 animate-fadeIn">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center">
                                                <Calendar className="w-5 h-5 mr-2 text-indigo-500" /> Horario Interactivo Semanal
                                            </label>
                                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black">
                                                {selectedBlocks.length} horas seleccionadas
                                            </span>
                                        </div>

                                        <div className="border-[3px] border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
                                            {/* Header Row */}
                                            <div className="flex bg-slate-100 border-b-[3px] border-slate-200">
                                                <div className="w-16 sm:w-20 shrink-0 border-r-[3px] border-slate-200"></div>
                                                {dias_calendario.map(dia => (
                                                    <div key={dia} className="flex-1 text-center py-3 font-black text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 border-r border-slate-200 last:border-0">{dia}</div>
                                                ))}
                                            </div>
                                            {/* Hours Rows */}
                                            {horas_calendario.map(hora => (
                                                <div key={hora} className="flex border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                                    <div className="w-16 sm:w-20 shrink-0 bg-slate-50/80 flex items-center justify-center border-r-[3px] border-slate-200 py-2">
                                                        <span className="text-[10px] font-black text-slate-400">{hora}H</span>
                                                    </div>
                                                    {dias_calendario.map(dia => {
                                                        const blockKey = `${dia}-${hora}`;
                                                        const isSelected = selectedBlocks.includes(blockKey);
                                                        const ocupado = isHoraOcupada(dia, hora);
                                                        return (
                                                            <div
                                                                key={blockKey}
                                                                onClick={() => { if (!ocupado) toggleBlock(dia, hora); }}
                                                                title={ocupado ? 'Este laboratorio ya tiene clase' : 'Disponible'}
                                                                style={ocupado ? { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.03) 5px, rgba(0,0,0,0.03) 10px)' } : {}}
                                                                className={`flex-1 min-h-[40px] border-r border-slate-100 last:border-0 transition-all duration-200 relative group
                                                                    ${ocupado ? 'cursor-not-allowed bg-slate-50' : isSelected ? 'bg-indigo-500 cursor-pointer shadow-inner' : 'bg-transparent hover:bg-indigo-50/50 cursor-pointer'}`}
                                                            >
                                                                {ocupado && (
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <XCircle className="w-4 h-4 text-slate-300 opacity-50" />
                                                                    </div>
                                                                )}
                                                                {!ocupado && isSelected && (
                                                                    <div className="absolute inset-0 flex items-center justify-center animate-scaleIn">
                                                                        <CheckCircle className="w-4 h-4 text-white" />
                                                                    </div>
                                                                )}
                                                                {!ocupado && !isSelected && (
                                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                        <div className="w-2 h-2 rounded-full bg-indigo-200"></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 mt-3 text-center bg-slate-50 p-2 rounded-xl">
                                            💡 TIP: Haz clic en las celdas en blanco para pintar el bloque donde transcurrirá la clase. Puedes seleccionar varios días y horas en simultáneo.
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-100">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        icon={CheckCircle}
                                        fullWidth
                                    >
                                        {editingId ? 'Confirmar Edición de Horario' : 'Registrar Clase en Calendario'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Horarios;

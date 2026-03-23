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
    const [selectedLab, setSelectedLab] = useState('');
    const [selectedGrado, setSelectedGrado] = useState('all');
    const [selectedGrupo, setSelectedGrupo] = useState('all');
    const [selectedCarrera, setSelectedCarrera] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    const [misOpciones, setMisOpciones] = useState({
        grados: [],
        grupos: [],
        carreras: []
    });

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const horasOpciones = Array.from({ length: 16 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);
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

            // Seleccionar el primer laboratorio por defecto si no hay uno seleccionado
            if (labsRes.data.length > 0 && !selectedLab) {
                setSelectedLab(labsRes.data[0].id_laboratorio.toString());
            }

            // Extraer opciones personalizadas para el docente logueado (usando == para evitar problemas de tipos)
            const misHorarios = horariosRes.data.filter(h => h.docente == user.id);
            setMisOpciones({
                grados: [...new Set(misHorarios.map(h => h.grado).filter(Boolean))].sort(),
                grupos: [...new Set(misHorarios.map(h => h.grupo).filter(Boolean))].sort(),
                carreras: [...new Set(misHorarios.map(h => h.carrera).filter(Boolean))].sort()
            });
            
            // Fallback: Si el docente no tiene horarios asignados, mostrar todos los disponibles para evitar selectores vacíos
            if (misHorarios.length === 0) {
                setMisOpciones({
                    grados: [...new Set(horariosRes.data.map(h => h.grado).filter(Boolean))].sort(),
                    grupos: [...new Set(horariosRes.data.map(h => h.grupo).filter(Boolean))].sort(),
                    carreras: [...new Set(horariosRes.data.map(h => h.carrera).filter(Boolean))].sort()
                });
            }
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
        const matchesGrado = selectedGrado === 'all' || item.grado === selectedGrado;
        const matchesGrupo = selectedGrupo === 'all' || item.grupo === selectedGrupo;
        const matchesCarrera = selectedCarrera === 'all' || item.carrera === selectedCarrera;

        return matchesSearch && matchesLab && matchesGrado && matchesGrupo && matchesCarrera;
    });

    const isHighlight = (item) => {
        // Resaltar en verde las clases asignadas por ese docente
        const sameDocente = item.docente == user.id;
        const matchesGroupFilters = (selectedGrado === 'all' || item.grado === selectedGrado) &&
                                     (selectedGrupo === 'all' || item.grupo === selectedGrupo) &&
                                     (selectedCarrera === 'all' || item.carrera === selectedCarrera);
        
        return sameDocente && matchesGroupFilters && (selectedGrado !== 'all' || selectedGrupo !== 'all' || selectedCarrera !== 'all');
    };

    const getHorarioAt = (dia, hora) => {
        return filteredItems.find(h => {
            const h_inicio = parseInt(h.hora_inicio.split(':')[0]);
            const h_fin = parseInt(h.hora_fin.split(':')[0]);
            const check_h = parseInt(hora.split(':')[0]);
            return h.dia_semana === dia && check_h >= h_inicio && check_h < h_fin;
        });
    };

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

            {/* Advanced Filters */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por actividad o docente..."
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Laboratorio</label>
                        <select
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none appearance-none font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                            value={selectedLab}
                            onChange={(e) => setSelectedLab(e.target.value)}
                        >
                            {laboratorios.map(lab => (
                                <option key={lab.id_laboratorio} value={lab.id_laboratorio}>{lab.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grado</label>
                        <select
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none appearance-none font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                            value={selectedGrado}
                            onChange={(e) => setSelectedGrado(e.target.value)}
                        >
                            <option value="all">Mis Grados</option>
                            {misOpciones.grados.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grupo</label>
                        <select
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none appearance-none font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                            value={selectedGrupo}
                            onChange={(e) => setSelectedGrupo(e.target.value)}
                        >
                            <option value="all">Mis Grupos</option>
                            {misOpciones.grupos.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Carrera</label>
                        <select
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none appearance-none font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                            value={selectedCarrera}
                            onChange={(e) => setSelectedCarrera(e.target.value)}
                        >
                            <option value="all">Mis Carreras</option>
                            {misOpciones.carreras.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <div 
                            className="px-4 py-2 rounded-lg text-xs font-black bg-white shadow-sm text-indigo-600"
                        >
                            Vista Calendario
                        </div>
                    </div>
                    {(selectedLab !== 'all' || selectedGrado !== 'all' || selectedGrupo !== 'all' || selectedCarrera !== 'all' || searchTerm !== '') && (
                        <button 
                            onClick={() => {
                                setSelectedLab('all'); setSelectedGrado('all'); setSelectedGrupo('all'); 
                                setSelectedCarrera('all'); setSearchTerm('');
                            }}
                            className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest flex items-center"
                        >
                            <X className="w-3 h-3 mr-1" /> Limpiar Filtros
                        </button>
                    )}
                </div>
            </div>            {/* Content View */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden p-4 md:p-8">
                <div className="overflow-x-auto">
                    <div className="min-w-[1000px]">
                        {/* Grid Header */}
                        <div className="grid grid-cols-8 border-b border-slate-100 mb-2">
                            <div className="p-4"></div>
                            {dias.map(dia => (
                                <div key={dia} className="p-4 text-center">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{dia}</span>
                                </div>
                            ))}
                        </div>

                        {/* Grid Body */}
                        <div className="space-y-1">
                            {horasOpciones.map(hora => (
                                <div key={hora} className="grid grid-cols-8 group">
                                    <div className="p-4 flex items-center justify-center border-r border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                        <span className="text-[11px] font-black text-slate-400">{hora}</span>
                                    </div>
                                    {dias.map(dia => {
                                        const item = getHorarioAt(dia, hora);
                                        const highlight = item ? isHighlight(item) : false;
                                        
                                        return (
                                            <div 
                                                key={dia} 
                                                className={`h-24 m-1 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center p-2 text-center relative overflow-hidden group/cell ${
                                                    item 
                                                        ? (highlight 
                                                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-100 scale-[1.02] z-10' 
                                                            : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200 hover:shadow-md') 
                                                        : 'bg-slate-50/30 border-dashed border-slate-100'
                                                }`}
                                            >
                                                {item ? (
                                                    <>
                                                        <span className={`text-[9px] font-black uppercase tracking-tighter mb-1 opacity-80 ${highlight ? 'text-emerald-100' : 'text-indigo-500'}`}>
                                                            {item.hora_inicio.substring(0, 5)} - {item.hora_fin.substring(0, 5)}
                                                        </span>
                                                        <p className={`text-[10px] font-black leading-tight line-clamp-2 ${highlight ? 'text-white' : 'text-slate-800'}`}>
                                                            {item.descripcion_actividad}
                                                        </p>
                                                        {highlight && (
                                                            <div className="absolute top-1 right-1">
                                                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-sm"></div>
                                                            </div>
                                                        )}
                                                        {!highlight && isAdmin && (
                                                            <button 
                                                                  onClick={() => openEdit(item)}
                                                                className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover/cell:opacity-100 flex items-center justify-center transition-all rounded-2xl"
                                                            >
                                                                <Edit2 className="w-4 h-4 text-indigo-600" />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                                        <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Libre</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {filteredItems.length === 0 && (
                <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-100">
                    <div className="p-8 bg-white rounded-full shadow-2xl shadow-slate-200 animate-pulse">
                        <Calendar className="w-16 h-16 text-slate-200" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-300 tracking-tighter">Planificador Vacío</h3>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">No se encontraron horarios con los filtros actuales</p>
                    </div>
                </div>
            )}

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

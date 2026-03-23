import LoadingSpinner from '../../components/LoadingSpinner';
import React, { useState, useEffect } from 'react';
import {
    Users, Plus, Search, Filter, Edit2, Trash2,
    Save, X, Check, AlertTriangle, Calendar, User,
    MapPin, Laptop, FileText, History, CheckCircle2,
    ShieldAlert, AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AsistenciaResponsabilidad = () => {
    const [asignaciones, setAsignaciones] = useState([]);
    const [asistencias, setAsistencias] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [laboratorios, setLaboratorios] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [mobiliario, setMobiliario] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('asignaciones');
    const [searchTerm, setSearchTerm] = useState('');

    // Form States
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        alumno: '',
        equipo_computo: '',
        mobiliario: '',
        cuatrimestre: '2026-1',
        observaciones: '',
        fecha_devolucion_programada: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [asigRes, asisRes, alumRes, labsRes, equipRes, mobiRes] = await Promise.all([
                api.get('/asignaciones/'),
                api.get('/asistencias/'),
                api.get('/usuarios/?rol=alumno'),
                api.get('/laboratorios/'),
                api.get('/equipos-computo/'),
                api.get('/mobiliario/')
            ]);
            setAsignaciones(asigRes.data);
            setAsistencias(asisRes.data);
            setAlumnos(alumRes.data);
            setLaboratorios(labsRes.data);
            setEquipos(equipRes.data);
            setMobiliario(mobiRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
            toast.error("Error al cargar datos de control");
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        try {
            await api.post('/asignaciones/', formData);
            toast.success("Equipo asignado correctamente");
            setShowForm(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Error creating assignment", error);
            toast.error("Error al realizar la asignación");
        }
    };

    const handleAttendance = async (asignacion) => {
        try {
            await api.post('/asistencias/', {
                usuario: asignacion.alumno,
                laboratorio: asignacion.equipo_computo_detalle?.laboratorio || 1, // Placeholder for lab
                asignacion_equipo: asignacion.id_asignacion,
                observaciones: 'Asistencia automática vía asignación'
            });
            toast.success("Asistencia registrada para el alumno");
            fetchData();
        } catch (error) {
            console.error("Error recording attendance", error);
            toast.error("Error al registrar asistencia");
        }
    };

    const resetForm = () => {
        setFormData({
            alumno: '',
            equipo_computo: '',
            mobiliario: '',
            cuatrimestre: '2026-1',
            observaciones: '',
            fecha_devolucion_programada: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0]
        });
    };

    const filteredAsignaciones = asignaciones.filter(a =>
        a.alumno_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.equipo_detalle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Asistencia y Responsabilidad</h1>
                    <p className="text-slate-500 font-medium text-sm">Control de equipos asignados y seguimiento de asistencia por alumno.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 font-black uppercase text-xs tracking-widest"
                >
                    <Plus className="w-5 h-5" />
                    <span>Asignar Equipo</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 p-1.5 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('asignaciones')}
                    className={`flex items-center px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'asignaciones' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                    <Laptop className="w-4 h-4 mr-2" /> Equipos Asignados
                </button>
                <button
                    onClick={() => setActiveTab('asistencias')}
                    className={`flex items-center px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'asistencias' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Historial de Asistencia
                </button>
                <button
                    onClick={() => setActiveTab('reportes')}
                    className={`flex items-center px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'reportes' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                    <ShieldAlert className="w-4 h-4 mr-2" /> Reportes de Daños
                </button>
            </div>

            {/* Search */}
            <div className="max-w-2xl">
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar alumno o equipo..."
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {activeTab === 'asignaciones' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredAsignaciones.map((asig) => (
                        <div key={asig.id_asignacion} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300">
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800">{asig.alumno_nombre}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{asig.cuatrimestre}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${asig.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {asig.estado}
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Laptop className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm font-bold text-slate-700">Equipo Asignado</span>
                                        </div>
                                        <span className="text-xs font-black text-indigo-600">{asig.equipo_computo || asig.mobiliario}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium italic">"{asig.observaciones || 'Sin observaciones'}"</p>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center text-slate-400 font-bold">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Vence: {asig.fecha_devolucion_programada}
                                    </div>
                                    <button
                                        onClick={() => handleAttendance(asig)}
                                        className="flex items-center space-x-1 text-indigo-600 font-black hover:underline"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span>Tomar Asistencia</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'asistencias' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <th className="px-8 py-6">Fecha</th>
                                    <th className="px-8 py-6">Alumno</th>
                                    <th className="px-8 py-6">Laboratorio</th>
                                    <th className="px-8 py-6">Hora Entrada</th>
                                    <th className="px-8 py-6">Equipo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {asistencias.map((asis) => (
                                    <tr key={asis.id_asistencia} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-8 py-6 font-bold text-slate-700">{asis.fecha}</td>
                                        <td className="px-8 py-6">
                                            <div className="font-black text-slate-800">{asis.usuario_nombre}</div>
                                        </td>
                                        <td className="px-8 py-6 text-indigo-600 font-bold">{asis.laboratorio_nombre}</td>
                                        <td className="px-8 py-6 font-mono text-slate-500">{asis.hora_entrada}</td>
                                        <td className="px-8 py-6 text-xs text-slate-400">ID Asignación: {asis.asignacion_equipo}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'reportes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-rose-50 rounded-[3rem] p-12 border border-rose-100 flex flex-col items-center justify-center text-center space-y-6">
                        <AlertCircle className="w-20 h-20 text-rose-500" />
                        <div>
                            <h3 className="text-2xl font-black text-rose-800 tracking-tight">Reportes de Daños</h3>
                            <p className="text-rose-600 font-medium">Historial de incidencias y responsabilidad por pérdida o desperfecto.</p>
                        </div>
                        <button className="px-8 py-4 bg-white text-rose-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-100">Ver Historial de Fallos</button>
                    </div>

                    <div className="bg-white rounded-[3rem] p-12 border border-slate-100 space-y-6 flex flex-col justify-center">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                                <History className="w-6 h-6" />
                            </div>
                            <h4 className="text-xl font-black text-slate-800">App Móvil</h4>
                        </div>
                        <p className="text-slate-500 font-medium">Recepción de reportes automáticos enviados por alumnos desde la aplicación móvil mediante códigos QR.</p>
                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin reportes pendientes hoy</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Assignment Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl animate-scaleIn">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">Asignación de Equipo</h3>
                                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Vincula a un alumno con un recurso</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAssign} className="p-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alumno</label>
                                <select
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                                    value={formData.alumno}
                                    onChange={(e) => setFormData({ ...formData, alumno: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione Alumno...</option>
                                    {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre} {a.apellido_paterno} ({a.username})</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Equipo de Cómputo</label>
                                    <select
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                                        value={formData.equipo_computo}
                                        onChange={(e) => setFormData({ ...formData, equipo_computo: e.target.value })}
                                    >
                                        <option value="">No asignar PC...</option>
                                        {equipos.filter(e => e.activo).map(e => (
                                            <option key={e.numero_inventario} value={e.numero_inventario}>S/N: {e.serie} - {e.marca}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobiliario / Periférico</label>
                                    <select
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                                        value={formData.mobiliario}
                                        onChange={(e) => setFormData({ ...formData, mobiliario: e.target.value })}
                                    >
                                        <option value="">No asignar mobiliario...</option>
                                        {mobiliario.filter(m => m.activo).map(m => (
                                            <option key={m.numero_inventario} value={m.numero_inventario}>{m.tipo_nombre} - S/N: {m.serie}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cuatrimestre</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                                        value={formData.cuatrimestre}
                                        onChange={(e) => setFormData({ ...formData, cuatrimestre: e.target.value })}
                                        placeholder="Ej: 2026-1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Devolución Programada</label>
                                    <input
                                        type="date"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                                        value={formData.fecha_devolucion_programada}
                                        onChange={(e) => setFormData({ ...formData, fecha_devolucion_programada: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observaciones</label>
                                <textarea
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700 h-24 resize-none"
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                    placeholder="Condición de entrega..."
                                />
                            </div>

                            <button className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all flex items-center justify-center active:scale-95 mt-4">
                                <Save className="w-5 h-5 mr-3" />
                                Generar Responsiva y Asignar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AsistenciaResponsabilidad;

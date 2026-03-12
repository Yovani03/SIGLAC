import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from '../../components/Toast';
import api from '../../services/api';
import {
    Monitor, Users, ToggleLeft, ToggleRight, Settings,
    MoreVertical, Edit2, Trash2, Plus, ChevronLeft,
    MousePointer2, Layout, Info, Cpu, Box, Server, X, Search
} from 'lucide-react';

const StationCard = ({ name, estacion, onClick }) => {
    const hasPC = estacion?.equipo_detalle;
    const peripherals = estacion?.perifericos_detalle || [];
    const monitor = peripherals.find(p => p.tipo?.toLowerCase().includes('monitor'));
    const kb = peripherals.find(p => p.tipo?.toLowerCase().includes('teclado'));
    const ms = peripherals.find(p => p.tipo?.toLowerCase().includes('mouse'));
    const chair = peripherals.find(p => p.tipo?.toLowerCase().includes('silla'));

    return (
        <div
            onClick={onClick}
            className={`relative group cursor-pointer p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center space-y-1.5
                ${estacion ? (hasPC ? 'bg-white border-indigo-200 shadow-md' : 'bg-slate-50 border-slate-200') : 'bg-slate-100/50 border-dashed border-slate-300 opacity-40 hover:opacity-80'}`}
        >
            <span className="text-[9px] font-black text-slate-400 absolute top-1.5 left-2">{name}</span>
            <div className="flex flex-col items-center">
                <div className={`w-10 h-6 rounded-md border flex items-center justify-center mb-0.5 ${monitor ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                    <Monitor className={`w-3 h-3 ${monitor ? 'text-indigo-600' : 'text-slate-200'}`} />
                </div>
                <div className="flex space-x-1 items-center">
                    <Cpu className={`w-2.5 h-2.5 ${hasPC ? 'text-indigo-600' : 'text-slate-200'}`} />
                    <div className={`w-1 h-1 rounded-full ${kb ? 'bg-indigo-400' : 'bg-slate-200'}`} />
                    <div className={`w-0.5 h-0.5 rounded-full ${ms ? 'bg-indigo-400' : 'bg-slate-200'}`} />
                </div>
            </div>
            <div className={`absolute -bottom-1.5 ${chair ? 'opacity-100' : 'opacity-0'}`}>
                <Box className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity flex items-center justify-center">
                <Info className="text-indigo-600 w-5 h-5" />
            </div>
        </div>
    );
};

const Laboratorios = () => {
    const [laboratorios, setLaboratorios] = useState([]);
    const [areas, setAreas] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLab, setSelectedLab] = useState(null);
    const [estaciones, setEstaciones] = useState([]);
    const [loadingEstaciones, setLoadingEstaciones] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [selectedEstacion, setSelectedEstacion] = useState(null);
    const [availablePCs, setAvailablePCs] = useState([]);
    const [availableMobiliario, setAvailableMobiliario] = useState([]);
    const [searchTermPC, setSearchTermPC] = useState('');
    const [searchTermHW, setSearchTermHW] = useState('');
    const [currentLab, setCurrentLab] = useState({
        nombre: '',
        ubicacion: '',
        capacidad: '',
        equipos_por_fila: 4,
        area: '',
        responsable: '',
        activo: true
    });
    const [notification, setNotification] = useState(null);

    const showToast = (message, type = 'success') => {
        setNotification({ message, type });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [labsRes, areasRes, usersRes] = await Promise.all([
                api.get('/laboratorios/'),
                api.get('/areas/'),
                api.get('/usuarios/')
            ]);
            setLaboratorios(labsRes.data);
            setAreas(areasRes.data);
            // Filtrar solo usuarios con rol 'docente' (ID 2 según base de datos)
            setDocentes(usersRes.data.filter(u => u.rol === 2 || u.nombre_rol?.toLowerCase() === 'docente'));
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    };

    const fetchEstaciones = async (labId) => {
        setLoadingEstaciones(true);
        try {
            const res = await api.get(`/estaciones/?laboratorio=${labId}`);
            setEstaciones(res.data);
            setLoadingEstaciones(false);
        } catch (error) {
            console.error("Error fetching estaciones:", error);
            setLoadingEstaciones(false);
        }
    };

    const handleSelectLab = (lab) => {
        setSelectedLab(lab);
        // Carga inmediata si ya vienen en el objeto lab
        if (lab.estaciones) {
            setEstaciones(lab.estaciones);
        } else {
            fetchEstaciones(lab.id_laboratorio);
        }
        fetchAvailableItems();
    };

    const fetchAvailableItems = async () => {
        try {
            const [pcsRes, hwRes] = await Promise.all([
                api.get('/equipos-computo/'),
                api.get('/mobiliario/')
            ]);
            // Filtrar ítems que no tengan estación asignada (stock global)
            setAvailablePCs(pcsRes.data.filter(pc => !pc.estacion));
            setAvailableMobiliario(hwRes.data.filter(hw => !hw.estacion));
        } catch (error) {
            console.error("Error fetching available items:", error);
        }
    };

    const handleAssign = async (type, itemId, stationId) => {
        const endpoint = type === 'pc' ? '/equipos-computo/' : '/mobiliario/';
        const itemInfo = type === 'pc'
            ? availablePCs.find(pc => pc.numero_inventario === itemId)
            : availableMobiliario.find(hw => hw.numero_inventario === itemId);

        try {
            // Se asigna tanto el laboratorio actual como la estación específica
            await api.patch(`${endpoint}${itemId}/`, {
                estacion: stationId,
                laboratorio: selectedLab.id_laboratorio
            });
            // Recargar datos
            fetchEstaciones(selectedLab.id_laboratorio);
            fetchAvailableItems();
            showToast("Equipo vinculado a la estación correctamente");

            // Actualizar modal si está abierto
            const res = await api.get(`/estaciones/${selectedEstacion.id_estacion}/`);
            setSelectedEstacion(res.data);
            setSearchTermPC('');
            setSearchTermHW('');
        } catch (error) {
            console.error("Error linking item:", error);
            showToast("Error al asociar el ítem. Verifique si el número de serie es válido.", "error");
        }
    };

    const handleUnassign = async (type, itemId) => {
        const endpoint = type === 'pc' ? '/equipos-computo/' : '/mobiliario/';
        try {
            await api.patch(`${endpoint}${itemId}/`, { estacion: null });
            fetchEstaciones(selectedLab.id_laboratorio);
            fetchAvailableItems(selectedLab.id_laboratorio);

            const res = await api.get(`/estaciones/${selectedEstacion.id_estacion}/`);
            setSelectedEstacion(res.data);
        } catch (error) {
            console.error("Error unlinking item:", error);
        }
    };

    const handleClearStation = async (station) => {
        if (!window.confirm(`¿Liberar todos los equipos de la estación ${station.nombre}?`)) return;

        try {
            // Desvincular PC si tiene
            if (station.equipo_detalle) {
                await api.patch(`/equipos-computo/${station.equipo_detalle.id_equipo}/`, { estacion: null });
            }
            // Desvincular periféricos
            if (station.perifericos_detalle) {
                for (const p of station.perifericos_detalle) {
                    await api.patch(`/mobiliario/${p.id_mobiliario}/`, { estacion: null });
                }
            }
            fetchEstaciones(selectedLab.id_laboratorio);
            fetchAvailableItems(selectedLab.id_laboratorio);
            setShowAssignmentModal(false);
        } catch (error) {
            console.error("Error clearing station:", error);
        }
    };

    const handleStationClick = (estName) => {
        const est = estaciones.find(e => e.nombre === estName);
        if (est) {
            setSelectedEstacion(est);
            setShowAssignmentModal(true);
        } else {
            // El usuario ya no ve una confirmación nativa molesta, 
            // pero para estaciones inexistentes podriamos simplemente no hacer nada 
            // o crearla bajo demanda silenciosamente si se quiere todo funcional.
            // Dado que el usuario pidió que todo sea funcional desde el inicio,
            // ya no debería entrar aquí si las estaciones se crearon al crear el lab.
        }
    };

    const handleCloseAssignmentModal = () => {
        setShowAssignmentModal(false);
        setSearchTermPC('');
        setSearchTermHW('');
    };
    const handleOpenModal = (lab = null) => {
        if (lab) {
            setIsEditing(true);
            setCurrentLab({
                ...lab,
                equipos_por_fila: lab.equipos_por_fila || 4,
                area: lab.area || '',
                responsable: lab.responsable || ''
            });
        } else {
            setIsEditing(false);
            setCurrentLab({
                nombre: '',
                ubicacion: '',
                capacidad: '',
                equipos_por_fila: 4,
                area: areas.length > 0 ? areas[0].id_area : '',
                responsable: '',
                activo: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Asegurar que los valores numéricos sean enteros
            const labData = {
                ...currentLab,
                capacidad: parseInt(currentLab.capacidad) || 0,
                equipos_por_fila: parseInt(currentLab.equipos_por_fila) || 4
            };

            if (isEditing) {
                await api.put(`/laboratorios/${currentLab.id_laboratorio}/`, labData);
                showToast("Laboratorio actualizado correctamente");
            } else {
                const res = await api.post('/laboratorios/', labData);
                showToast(`Laboratorio "${labData.nombre}" creado con éxito.`);
                // Opcionalmente podemos seleccionar el nuevo lab automáticamente para ver el mapa
                setSelectedLab(res.data);
                if (res.data.estaciones) setEstaciones(res.data.estaciones);
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error("Error saving laboratory detail:", error.response?.data || error.message);
            const errorMsg = error.response?.data
                ? JSON.stringify(error.response.data)
                : "Error al procesar la solicitud. Revisa la consola.";
            showToast(errorMsg, "error");
        }
    };

    const toggleStatus = async (lab) => {
        try {
            await api.patch(`/laboratorios/${lab.id_laboratorio}/`, { activo: !lab.activo });
            fetchData();
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Está seguro de que desea eliminar este laboratorio? Esta acción no se puede deshacer.")) {
            try {
                await api.delete(`/laboratorios/${id}/`);
                alert("Laboratorio eliminado con éxito.");
                setSelectedLab(null);
                fetchData();
            } catch (error) {
                console.error("Error deleting lab:", error);
                alert("Error al eliminar el laboratorio.");
            }
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn text-slate-900">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-cyan-500/10 rounded-xl">
                        <Monitor className="w-8 h-8 text-cyan-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Módulo de Laboratorios</h2>
                        <p className="text-slate-500 text-sm">Registro, edición, eliminación y consulta de laboratorios registrados.</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Nuevo Laboratorio
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(n => (
                        <div key={n} className="h-64 bg-slate-100 rounded-3xl animate-pulse"></div>
                    ))}
                </div>
            ) : selectedLab ? (
                /* VISTA DETALLADA DEL LABORATORIO */
                <div className="animate-fadeIn space-y-6">
                    {/* Botón Volver y Header de Detalle */}
                    <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center space-x-6">
                            <button
                                onClick={() => setSelectedLab(null)}
                                className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all group"
                            >
                                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedLab.nombre}</h3>
                                <div className="flex items-center space-x-3 mt-1">
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md">{selectedLab.area_nombre || 'Sin Área'}</span>
                                    <span className="text-[10px] font-bold text-slate-400 flex items-center uppercase tracking-widest">
                                        <Settings className="w-3 h-3 mr-1 opacity-40 text-indigo-500" /> {selectedLab.ubicacion}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => handleOpenModal(selectedLab)}
                                className="flex items-center px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95"
                            >
                                <Edit2 className="w-4 h-4 mr-2" /> Editar Información
                            </button>
                            <button
                                onClick={() => handleDelete(selectedLab.id_laboratorio)}
                                className="flex items-center px-4 py-2.5 bg-rose-50 text-rose-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95"
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Eliminar Espacio
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Panel Lateral: Estadísticas e Info */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Resumen Técnico</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                                        <div className="flex items-center text-slate-600">
                                            <Users className="w-4 h-4 mr-3 text-indigo-500" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Capacidad</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-800">{selectedLab.capacidad}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                                        <div className="flex items-center text-slate-600">
                                            <Monitor className="w-4 h-4 mr-3 text-indigo-500" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Estaciones</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-800">{estaciones.length}</span>
                                    </div>
                                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
                                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Responsable Actual</p>
                                        <p className="text-sm font-bold text-white truncate">{selectedLab.responsable_nombre || 'Por asignar'}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => toggleStatus(selectedLab)}
                                className={`w-full p-6 rounded-[2rem] border transition-all flex flex-col items-center justify-center space-y-2 active:scale-95 ${selectedLab.activo ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm' : 'bg-rose-50 border-rose-100 text-rose-500'}`}
                            >
                                {selectedLab.activo ? (
                                    <>
                                        <ToggleRight className="w-8 h-8" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Disponible</span>
                                    </>
                                ) : (
                                    <>
                                        <ToggleLeft className="w-8 h-8" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Fuera de Servicio</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Mapa del Laboratorio */}
                        <div className="lg:col-span-3">
                            <div className="bg-[#fcfdfe] p-8 md:p-12 rounded-[3.5rem] border border-slate-200 shadow-xl relative overflow-hidden min-h-[600px]">
                                {/* Blueprint Grid Lines */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-12">
                                        <h3 className="text-xl font-black text-slate-700 tracking-tighter uppercase italic flex items-center">
                                            <MousePointer2 className="w-6 h-6 mr-3 text-indigo-600 animate-pulse" /> Plano de Distribución
                                        </h3>
                                        <div className="flex space-x-2 bg-white px-4 py-2 rounded-full border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Layout className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Vista Administrativa
                                        </div>
                                    </div>

                                    {/* Architectural Header (Pantalla/Profesor) */}
                                    <div className="flex flex-col items-center mb-16">
                                        <div className="w-1/2 h-5 bg-slate-900 rounded-b-2xl flex items-center justify-center shadow-lg relative">
                                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.6em] font-mono">PANTALLA</span>
                                        </div>

                                        <div className="mt-8 flex flex-col items-center">
                                            <div className="w-32 h-16 bg-white border-2 border-slate-200 rounded-[1.5rem] shadow-sm flex flex-col items-center justify-center">
                                                <div className="w-12 h-6 bg-slate-50 flex items-center justify-center rounded-lg border border-slate-100 mb-0.5">
                                                    <Monitor className="w-3.5 h-3.5 text-slate-300" />
                                                </div>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest tracking-tighter">Docente</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Blueprint Grid Body */}
                                    <div className="grid grid-cols-[30px_1fr_60px_1fr] gap-4 max-w-4xl mx-auto">
                                        <div className="flex flex-col justify-around py-2 items-center text-slate-200 text-xl font-black font-mono">
                                            {Array.from(new Set(estaciones.map(e => e.nombre[0]))).sort().map(rowLetter => (
                                                <div key={rowLetter} className="h-20 flex items-center">{rowLetter}</div>
                                            ))}
                                        </div>

                                        {/* Left Side */}
                                        <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${Math.ceil((selectedLab.equipos_por_fila || 4) / 2)}, minmax(0, 1fr))` }}>
                                            {Array.from(new Set(estaciones.map(e => e.fila))).sort((a, b) => a - b).map(rowIdx => (
                                                Array.from({ length: Math.ceil((selectedLab.equipos_por_fila || 4) / 2) }, (_, i) => i + 1).map(colIdx => {
                                                    const est = estaciones.find(e => e.fila === rowIdx && e.columna === colIdx);
                                                    return est ? (
                                                        <StationCard key={est.id_estacion} name={est.nombre} estacion={est} onClick={() => handleStationClick(est.nombre)} />
                                                    ) : <div key={`${rowIdx}-${colIdx}`} className="h-20" />;
                                                })
                                            ))}
                                        </div>

                                        {/* Central Pasillo */}
                                        <div className="flex flex-col items-center py-4 relative opacity-10">
                                            <div className="absolute inset-y-0 w-px border-l-2 border-slate-300 border-dashed"></div>
                                        </div>

                                        {/* Right Side */}
                                        <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${Math.floor((selectedLab.equipos_por_fila || 4) / 2)}, minmax(0, 1fr))` }}>
                                            {Array.from(new Set(estaciones.map(e => e.fila))).sort((a, b) => a - b).map(rowIdx => (
                                                Array.from({ length: Math.floor((selectedLab.equipos_por_fila || 4) / 2) }, (_, i) => i + 1 + Math.ceil((selectedLab.equipos_por_fila || 4) / 2)).map(colIdx => {
                                                    const est = estaciones.find(e => e.fila === rowIdx && e.columna === colIdx);
                                                    return est ? (
                                                        <StationCard key={est.id_estacion} name={est.nombre} estacion={est} onClick={() => handleStationClick(est.nombre)} />
                                                    ) : <div key={`${rowIdx}-${colIdx}`} className="h-20" />;
                                                })
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-16 pt-8 border-t border-slate-100 flex justify-center space-x-12 opacity-60">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 rounded bg-indigo-600"></div>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Activo</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 rounded bg-slate-50 border border-slate-200"></div>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Incompleto</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {laboratorios.map((lab) => (
                        <div
                            key={lab.id_laboratorio}
                            onClick={() => handleSelectLab(lab)}
                            className={`group relative bg-white rounded-3xl p-6 shadow-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col cursor-pointer ${lab.activo ? 'border-slate-100 shadow-slate-200/50' : 'border-rose-100 bg-rose-50/30'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl transition-colors ${lab.activo ? 'bg-indigo-50 text-indigo-500' : 'bg-rose-100 text-rose-500'}`}>
                                    <Monitor className="w-6 h-6" />
                                </div>
                                <div className="text-[10px] bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <Users className="w-3 h-3 mr-1.5 text-indigo-400" /> {lab.capacidad}
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">{lab.area_nombre || 'Sin Área'}</div>
                                <h3 className="text-xl font-black text-slate-800 mb-1 leading-tight group-hover:text-indigo-600 transition-colors">{lab.nombre}</h3>
                                <p className="text-slate-500 text-xs font-medium flex items-center">
                                    <Settings className="w-3 h-3 mr-1 opacity-40" />
                                    {lab.ubicacion || 'Ubicación no especificada'}
                                </p>
                            </div>

                            <div className="mt-auto pt-4 flex justify-between items-center bg-slate-50/50 px-4 py-3 rounded-2xl border border-slate-100 group-hover:bg-indigo-50/50 group-hover:border-indigo-100 transition-colors">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-400">Ver Detalles</span>
                                <ChevronLeft className="w-4 h-4 text-slate-300 transform rotate-180 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp border border-white/20 my-auto">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 leading-tight">
                                    {isEditing ? 'Editar Laboratorio' : 'Nuevo Laboratorio'}
                                </h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1.5">Completa los datos del espacio</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white text-slate-400 hover:text-rose-500 hover:rotate-90 transition-all duration-300 border border-slate-100 shadow-sm"
                            >
                                <Plus className="w-6 h-6 transform rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nombre del Laboratorio</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Laboratorio de Redes y Telecom"
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300"
                                        value={currentLab.nombre}
                                        onChange={(e) => setCurrentLab({ ...currentLab, nombre: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ubicación / Edificio</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Edificio B - Planta Alta"
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300"
                                        value={currentLab.ubicacion}
                                        onChange={(e) => setCurrentLab({ ...currentLab, ubicacion: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Capacidad Total</label>
                                        <input
                                            type="number"
                                            placeholder="Máx alumnos"
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300"
                                            value={currentLab.capacidad}
                                            onChange={(e) => setCurrentLab({ ...currentLab, capacidad: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Equipos por Fila</label>
                                        <input
                                            type="number"
                                            placeholder="Ej. 4"
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300"
                                            value={currentLab.equipos_por_fila}
                                            onChange={(e) => setCurrentLab({ ...currentLab, equipos_por_fila: e.target.value })}
                                            required
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Área Académica</label>
                                    <select
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-700 appearance-none cursor-pointer"
                                        value={currentLab.area}
                                        onChange={(e) => setCurrentLab({ ...currentLab, area: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccionar Área</option>
                                        {areas.map(area => (
                                            <option key={area.id_area} value={area.id_area}>{area.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Responsable del Laboratorio</label>
                                    <select
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-700 appearance-none cursor-pointer"
                                        value={currentLab.responsable}
                                        onChange={(e) => setCurrentLab({ ...currentLab, responsable: e.target.value })}
                                    >
                                        <option value="">Por asignar (Opcional)</option>
                                        {docentes.map(doc => (
                                            <option key={doc.id} value={doc.id}>{doc.nombre} {doc.apellido_paterno} (Docente)</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] font-bold text-indigo-400 ml-1 italic">* Solo se muestran usuarios con rol Docente</p>
                                </div>
                            </div>

                            <div className="pt-4 flex space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-indigo-600 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                                >
                                    {isEditing ? 'Guardar Cambios' : 'Crear Laboratorio'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Asignación de Equipos a Estación */}
            {showAssignmentModal && selectedEstacion && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn border border-white/20">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-600">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Estación {selectedEstacion.nombre}</h3>
                                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Gestión de Equipamiento</p>
                            </div>
                            <button onClick={handleCloseAssignmentModal} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                            {/* PC Assignment */}
                            <div className="space-y-4">
                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <Cpu className="w-4 h-4 mr-2 text-indigo-500" /> Computadora Principal
                                </label>
                                {selectedEstacion.equipo_detalle ? (
                                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center group">
                                        <div>
                                            <p className="font-black text-slate-800 text-lg">{selectedEstacion.equipo_detalle.serie}</p>
                                            <p className="text-xs text-slate-500 font-bold uppercase">{selectedEstacion.equipo_detalle.marca} {selectedEstacion.equipo_detalle.modelo}</p>
                                        </div>
                                        <button
                                            onClick={() => handleUnassign('pc', selectedEstacion.equipo_detalle.id_equipo)}
                                            className="p-3 text-rose-500 hover:bg-rose-100 rounded-xl transition-all"
                                            title="Desvincular"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="flex bg-slate-50 rounded-2xl border-2 border-slate-50 focus-within:bg-white focus-within:border-indigo-500 transition-all p-1">
                                            <div className="p-3"><Search className="w-5 h-5 text-slate-400" /></div>
                                            <input
                                                type="text"
                                                className="w-full bg-transparent py-3 outline-none font-bold text-slate-600 placeholder:text-slate-300"
                                                placeholder="Teclea No. de Serie de PC..."
                                                value={searchTermPC}
                                                onChange={(e) => setSearchTermPC(e.target.value)}
                                            />
                                        </div>
                                        {searchTermPC && (
                                            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[110] max-h-48 overflow-y-auto p-2">
                                                {availablePCs.filter(pc => (pc.serie || '').toLowerCase().includes(searchTermPC.toLowerCase())).length > 0 ? (
                                                    availablePCs.filter(pc => (pc.serie || '').toLowerCase().includes(searchTermPC.toLowerCase())).map(pc => (
                                                        <button
                                                            key={pc.numero_inventario}
                                                            onClick={() => handleAssign('pc', pc.numero_inventario, selectedEstacion.id_estacion)}
                                                            className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl transition-colors flex justify-between items-center border-b border-slate-50 last:border-0"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-slate-800 tracking-tighter">{pc.serie}</span>
                                                                <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">{pc.marca} {pc.modelo}</span>
                                                            </div>
                                                            <Plus className="w-4 h-4 text-indigo-300" />
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase italic tracking-widest">No hay resultados en stock</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Peripherals Assignment */}
                            <div className="space-y-4">
                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <Monitor className="w-4 h-4 mr-2 text-indigo-500" /> Periféricos y Mobiliario
                                </label>
                                <div className="grid gap-2">
                                    {selectedEstacion.perifericos_detalle?.map(p => (
                                        <div key={p.id_mobiliario} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                            <div>
                                                <p className="font-black text-slate-700">{p.serie} <span className="text-[10px] text-indigo-500 ml-2 bg-indigo-50 px-2 py-0.5 rounded uppercase font-black">{p.tipo_nombre}</span></p>
                                                <p className="text-xs text-slate-400 font-bold">{p.marca} {p.modelo}</p>
                                            </div>
                                            <button
                                                onClick={() => handleUnassign('hw', p.id_mobiliario)}
                                                className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="relative">
                                    <div className="flex bg-slate-50 rounded-2xl border-2 border-slate-50 focus-within:bg-white focus-within:border-emerald-500 transition-all p-1">
                                        <div className="p-3"><Search className="w-5 h-5 text-slate-400" /></div>
                                        <input
                                            type="text"
                                            className="w-full bg-transparent py-3 outline-none font-bold text-slate-600 placeholder:text-slate-300"
                                            placeholder="Teclea No. de Serie de Periférico..."
                                            value={searchTermHW}
                                            onChange={(e) => setSearchTermHW(e.target.value)}
                                        />
                                    </div>
                                    {searchTermHW && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[110] max-h-48 overflow-y-auto p-2">
                                            {availableMobiliario.filter(hw => (hw.serie || '').toLowerCase().includes(searchTermHW.toLowerCase())).length > 0 ? (
                                                availableMobiliario.filter(hw => (hw.serie || '').toLowerCase().includes(searchTermHW.toLowerCase())).map(hw => (
                                                    <button
                                                        key={hw.numero_inventario}
                                                        onClick={() => handleAssign('hw', hw.numero_inventario, selectedEstacion.id_estacion)}
                                                        className="w-full text-left p-3 hover:bg-emerald-50 rounded-xl transition-colors flex justify-between items-center border-b border-slate-50 last:border-0"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-emerald-700 tracking-tighter">{hw.serie}</span>
                                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">[{hw.tipo_nombre}] {hw.marca}</span>
                                                        </div>
                                                        <Plus className="w-4 h-4 text-emerald-300" />
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase italic tracking-widest">No hay resultados en stock</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 flex justify-between items-center">
                            <button
                                onClick={() => handleClearStation(selectedEstacion)}
                                className="flex items-center text-xs font-black text-rose-500 uppercase tracking-widest hover:underline"
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Liberar Estación Completa
                            </button>
                            <button onClick={handleCloseAssignmentModal} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-200 active:scale-95 transition-all">Listo</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Toxix Notifications */}
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

export default Laboratorios;

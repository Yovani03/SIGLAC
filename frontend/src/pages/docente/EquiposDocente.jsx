import LoadingSpinner from '../../components/LoadingSpinner';
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { AnimatePresence } from 'framer-motion';
import Toast from '../../components/Toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    Cpu, HardDrive, Layout, Plus, Info, Box, Search,
    Monitor, Save, Server, X, MousePointer2, ChevronRight, ChevronLeft, MapPin, Eye,
    Trash2, Edit2, Settings, Users
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

const EquiposDocente = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('inventario');
    const [showAltaModal, setShowAltaModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [laboratorios, setLaboratorios] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [tiposMobiliario, setTiposMobiliario] = useState([]);
    const [estaciones, setEstaciones] = useState([]);
    const [hardwares, setHardwares] = useState([]);
    const [equiposComputo, setEquiposComputo] = useState([]);
    const [selectedLabId, setSelectedLabId] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedEstacion, setSelectedEstacion] = useState(null);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);
    const [searchTermPC, setSearchTermPC] = useState('');
    const [searchTermHW, setSearchTermHW] = useState('');

    const [newItem, setNewItem] = useState({
        numero_inventario: '',
        marca: '',
        modelo: '',
        serie: '',
        estado_condicion: 'BUENO',
        ubicacion_especifica: '',
        categoria: '',
        tipo_mobiliario: '',
        procesador: '',
        ram: '',
        disco_duro: '',
        laboratorio: '',
        detalles_tecnicos: {}
    });
    const [notification, setNotification] = useState(null);

    const showToast = (message, type = 'success') => {
        setNotification({ message, type });
    };

    useEffect(() => {
        fetchData(true);
    }, []);

    const fetchData = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const [labsRes, catsRes, tiposRes, estRes, hwRes, pcsRes] = await Promise.all([
                api.get('/laboratorios/'),
                api.get('/categorias/'),
                api.get('/tipos-mobiliario/'),
                api.get('/estaciones/'),
                api.get('/mobiliario/'),
                api.get('/equipos-computo/')
            ]);
            setLaboratorios(labsRes.data);
            setCategorias(catsRes.data);
            setTiposMobiliario(tiposRes.data);
            setEstaciones(estRes.data);
            setHardwares(hwRes.data);
            setEquiposComputo(pcsRes.data);

            if (labsRes.data.length > 0 && !selectedLabId) {
                setSelectedLabId(labsRes.data[0].id_laboratorio);
                setNewItem(prev => ({ ...prev, laboratorio: labsRes.data[0].id_laboratorio }));
            }

            if (showLoading) setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            if (showLoading) setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!newItem.categoria || !newItem.serie) {
            showToast("La categoría y el No. Serie son obligatorios.", "error");
            return;
        }

        const categoriaVal = parseInt(newItem.categoria);
        const labVal = parseInt(newItem.laboratorio || selectedLabId);
        const tipoMobVal = newItem.tipo_mobiliario ? parseInt(newItem.tipo_mobiliario) : null;

        const categoriaSeleccionada = categorias.find(c => c.id_categoria === categoriaVal);
        const isPCVal = categoriaSeleccionada && (categoriaSeleccionada.nombre_tipo.toLowerCase().includes('computo') || categoriaSeleccionada.nombre_tipo.toLowerCase().includes('cómputo'));

        try {
            const commonData = {
                numero_inventario: newItem.serie,
                serie: newItem.serie,
                marca: newItem.marca,
                modelo: newItem.modelo,
                estado_condicion: newItem.estado_condicion,
                ubicacion_especifica: newItem.ubicacion_especifica,
                laboratorio: labVal,
                categoria: categoriaVal,
            };

            console.log("Dato a enviar:", commonData);

            if (isPCVal) {
                if (editingItem) {
                    await api.patch(`/equipos-computo/${editingItem.numero_inventario}/`, {
                        ...commonData,
                        procesador: newItem.procesador || '',
                        ram: newItem.ram || '',
                        disco_duro: newItem.disco_duro || '',
                    });
                } else {
                    await api.post('/equipos-computo/', {
                        ...commonData,
                        procesador: newItem.procesador || '',
                        ram: newItem.ram || '',
                        disco_duro: newItem.disco_duro || '',
                    });
                }
            } else {
                if (editingItem) {
                    await api.patch(`/mobiliario/${editingItem.numero_inventario}/`, {
                        ...commonData,
                        tipo_mobiliario: tipoMobVal,
                        detalles_tecnicos: {}
                    });
                } else {
                    await api.post('/mobiliario/', {
                        ...commonData,
                        tipo_mobiliario: tipoMobVal,
                        detalles_tecnicos: {}
                    });
                }
            }
            showToast(editingItem ? "Ítem actualizado con éxito." : "Ítem registrado con éxito.");
            setShowAltaModal(false);
            setEditingItem(null);
            setNewItem({
                numero_inventario: '', marca: '', modelo: '', serie: '',
                estado_condicion: 'BUENO', ubicacion_especifica: '',
                categoria: '', tipo_mobiliario: '',
                procesador: '', ram: '', disco_duro: '', detalles_tecnicos: {},
                laboratorio: labVal
            });
            fetchData();
        } catch (error) {
            console.error("DEBUG - Error al guardar:", error.response?.data || error);
            const errorData = error.response?.data;
            let detail = "Error interno del servidor.";

            if (errorData) {
                if (typeof errorData === 'object') {
                    detail = Object.entries(errorData)
                        .map(([key, val]) => `${key}: ${JSON.stringify(val)}`)
                        .join(" | ");
                } else {
                    detail = JSON.stringify(errorData);
                }
            }

            showToast(`No se pudo registrar: ${detail}`, "error");
        }
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        setNewItem({
            numero_inventario: item.numero_inventario,
            marca: item.marca || '',
            modelo: item.modelo || '',
            serie: item.serie || '',
            estado_condicion: item.estado_condicion || 'BUENO',
            ubicacion_especifica: item.ubicacion_especifica || '',
            categoria: item.categoria || '',
            tipo_mobiliario: item.tipo_mobiliario || '',
            procesador: item.procesador || '',
            ram: item.ram || '',
            disco_duro: item.disco_duro || '',
            laboratorio: item.laboratorio || selectedLabId,
        });
        setShowAltaModal(true);
    };

    const handleViewItem = (item) => {
        setViewingItem(item);
    };

    const handleAssign = async (type, itemId, stationId) => {
        const endpoint = type === 'pc' ? '/equipos-computo/' : '/mobiliario/';
        try {
            await api.patch(`${endpoint}${itemId}/`, {
                estacion: parseInt(stationId),
                laboratorio: parseInt(selectedLabId)
            });
            fetchData();
            const res = await api.get(`/estaciones/${stationId}/`);
            setSelectedEstacion(res.data);
            setSearchTermPC('');
            setSearchTermHW('');
            showToast("Equipo vinculado correctamente.");
        } catch (error) {
            console.error("Error linking item:", error);
            showToast("Error al asociar el ítem. Revise los logs del servidor.", "error");
        }
    };

    const handleUnassign = async (type, itemId) => {
        const endpoint = type === 'pc' ? '/equipos-computo/' : '/mobiliario/';
        try {
            await api.patch(`${endpoint}${itemId}/`, { estacion: null });
            fetchData();
            const res = await api.get(`/estaciones/${selectedEstacion.id_estacion}/`);
            setSelectedEstacion(res.data);
            showToast("Equipo liberado.");
        } catch (error) {
            console.error("Error unlinking item:", error);
        }
    };

    const handleDeleteItem = async (type, itemId) => {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: `¿Eliminar permanentemente este ítem (${itemId})? Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (!result.isConfirmed) return;

        const endpoint = (type === 'pc' || itemId.startsWith('PC')) ? `/equipos-computo/${itemId}/` : `/mobiliario/${itemId}/`;
        try {
            await api.delete(endpoint);
            showToast("Ítem eliminado correctamente.");
            fetchData();
        } catch (error) {
            console.error("Error deleting item:", error);
            showToast("No se pudo eliminar. Verifique si tiene dependencias activas.", "error");
        }
    };

    const handleClearStation = async (station) => {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: `¿Liberar todos los equipos de la estación ${station.nombre}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sí, liberar',
            cancelButtonText: 'Cancelar'
        });
        if (!result.isConfirmed) return;
        try {
            if (station.equipo_detalle) {
                await api.patch(`/equipos-computo/${station.equipo_detalle.numero_inventario}/`, { estacion: null });
            }
            if (station.perifericos_detalle) {
                for (const p of station.perifericos_detalle) {
                    await api.patch(`/mobiliario/${p.numero_inventario}/`, { estacion: null });
                }
            }
            fetchData();
            setShowAssignmentModal(false);
            showToast("Estación liberada totalmente.");
        } catch (error) {
            console.error("Error clearing station:", error);
        }
    };

    const isPC = () => {
        const cat = categorias.find(c => c.id_categoria === parseInt(newItem.categoria));
        return cat && (cat.nombre_tipo.toLowerCase().includes('computo') || cat.nombre_tipo.toLowerCase().includes('cómputo'));
    };

    const allItems = [...hardwares, ...equiposComputo].sort((a, b) =>
        (a.serie || '').localeCompare(b.serie || '')
    );

    const filteredItems = allItems.filter(item =>
        item.serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.numero_inventario?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeLab = laboratorios.find(l => l.id_laboratorio === parseInt(selectedLabId));
    const labEstaciones = estaciones.filter(e => e.laboratorio === parseInt(selectedLabId));

    if (loading) return <LoadingSpinner />;

    if (laboratorios.length === 0) return (
        <div className="p-20 text-center">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-800">No tiene laboratorios a cargo</h2>
            <p className="text-slate-500">Consulte con el administrador para que se le asigne la responsabilidad de un espacio.</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            {/* Modal de Asignación */}
            {showAssignmentModal && selectedEstacion && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn border border-white/20">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-600">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Estación {selectedEstacion.nombre}</h3>
                                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">{activeLab?.nombre}</p>
                            </div>
                            <button onClick={() => setShowAssignmentModal(false)} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-4">
                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <Cpu className="w-4 h-4 mr-2 text-indigo-500" /> Computadora Principal
                                </label>
                                {selectedEstacion.equipo_detalle ? (
                                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                                        <div>
                                            <p className="font-black text-slate-800 text-lg">{selectedEstacion.equipo_detalle.serie}</p>
                                            <p className="text-xs text-slate-500 font-bold uppercase">{selectedEstacion.equipo_detalle.marca} {selectedEstacion.equipo_detalle.modelo}</p>
                                        </div>
                                        <button
                                            onClick={() => handleUnassign('pc', selectedEstacion.equipo_detalle.id_equipo)}
                                            className="p-3 text-rose-500 hover:bg-rose-100 rounded-xl transition-all"
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
                                                className="w-full bg-transparent py-3 outline-none font-bold text-slate-600"
                                                placeholder="Buscar PC en stock por No. Serie..."
                                                value={searchTermPC}
                                                onChange={(e) => setSearchTermPC(e.target.value)}
                                            />
                                        </div>
                                        {searchTermPC && (
                                            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[110] max-h-48 overflow-y-auto p-2">
                                                {equiposComputo.filter(pc => !pc.estacion && pc.laboratorio === parseInt(selectedLabId) && (pc.serie || '').toLowerCase().includes(searchTermPC.toLowerCase())).map(pc => (
                                                    <button
                                                        key={pc.numero_inventario}
                                                        onClick={() => handleAssign('pc', pc.numero_inventario, selectedEstacion.id_estacion)}
                                                        className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl transition-colors flex justify-between items-center"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-slate-800">{pc.serie}</span>
                                                            <span className="text-[9px] text-indigo-400 font-black uppercase">{pc.marca} {pc.modelo}</span>
                                                        </div>
                                                        <Plus className="w-4 h-4 text-indigo-300" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <Monitor className="w-4 h-4 mr-2 text-indigo-500" /> Mobiliario y Periféricos
                                </label>
                                <div className="grid gap-2">
                                    {selectedEstacion.perifericos_detalle?.map(p => (
                                        <div key={p.id_mobiliario} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                            <div>
                                                <p className="font-black text-slate-700">{p.serie} <span className="text-[10px] text-indigo-500 ml-2 bg-indigo-50 px-2 py-0.5 rounded uppercase font-black">{p.tipo_nombre}</span></p>
                                                <p className="text-xs text-slate-400 font-bold">{p.marca} {p.modelo}</p>
                                            </div>
                                            <button onClick={() => handleUnassign('hw', p.id_mobiliario)} className="p-2 text-rose-400 hover:text-rose-600 transition-colors">
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
                                            className="w-full bg-transparent py-3 outline-none font-bold text-slate-600"
                                            placeholder="Buscar periférico/mueble en stock..."
                                            value={searchTermHW}
                                            onChange={(e) => setSearchTermHW(e.target.value)}
                                        />
                                    </div>
                                    {searchTermHW && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[110] max-h-48 overflow-y-auto p-2">
                                            {hardwares.filter(hw => !hw.estacion && hw.laboratorio === parseInt(selectedLabId) && (hw.serie || '').toLowerCase().includes(searchTermHW.toLowerCase())).map(hw => (
                                                <button
                                                    key={hw.numero_inventario}
                                                    onClick={() => handleAssign('hw', hw.numero_inventario, selectedEstacion.id_estacion)}
                                                    className="w-full text-left p-3 hover:bg-emerald-50 rounded-xl transition-colors flex justify-between items-center"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-emerald-700">{hw.serie}</span>
                                                        <span className="text-[9px] text-slate-400 font-bold">[{hw.tipo_nombre}] {hw.marca}</span>
                                                    </div>
                                                    <Plus className="w-4 h-4 text-emerald-300" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 flex justify-between items-center">
                            <button onClick={() => handleClearStation(selectedEstacion)} className="text-xs font-black text-rose-500 uppercase hover:underline">Liberar Estación</button>
                            <button onClick={() => setShowAssignmentModal(false)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl">
                        <Box className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Equipos</h2>
                        <p className="text-slate-500 text-sm font-medium">Control de inventario y estaciones de trabajo.</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <MapPin className="w-4 h-4 text-indigo-500 ml-2" />
                    <select
                        value={selectedLabId}
                        onChange={(e) => {
                            setSelectedLabId(e.target.value);
                            setNewItem(prev => ({ ...prev, laboratorio: e.target.value }));
                        }}
                        className="bg-transparent border-none outline-none font-black text-slate-700 text-sm py-2 pr-8"
                    >
                        {laboratorios.map(l => (
                            <option key={l.id_laboratorio} value={l.id_laboratorio}>{l.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
                <div className="flex space-x-1 bg-slate-100 p-1.5 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('inventario')}
                        className={`flex items-center px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'inventario' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <HardDrive className="w-4 h-4 mr-2" /> Inventario
                    </button>
                    <button
                        onClick={() => setActiveTab('mapa')}
                        className={`flex items-center px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'mapa' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Layout className="w-4 h-4 mr-2" /> Mapa de Estaciones
                    </button>
                </div>

                <button
                    onClick={() => setShowAltaModal(true)}
                    className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                    <Plus className="w-5 h-5 mr-2" /> Nuevo Equipo
                </button>
            </div>

            {/* Modal de Alta de Equipo */}
            <AnimatePresence>
                {showAltaModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                        <div className="bg-white rounded-[3.5rem] w-full max-w-4xl shadow-2xl relative animate-scaleIn flex flex-col max-h-[90vh] overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                                <h3 className="text-2xl font-black text-slate-800 flex items-center">
                                    <Plus className="w-8 h-8 mr-4 text-amber-500" /> {editingItem ? 'Editar Registro de Equipo' : 'Nuevo Registro de Equipo'}
                                </h3>
                                <button onClick={() => setShowAltaModal(false)} className="p-2 bg-white hover:bg-slate-100 text-slate-400 rounded-full transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-8 overflow-y-auto">
                                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                                            <select
                                                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-amber-500 transition-all outline-none font-bold text-slate-700"
                                                value={newItem.categoria}
                                                onChange={(e) => setNewItem({ ...newItem, categoria: e.target.value })}
                                                required
                                            >
                                                <option value="">Seleccionar...</option>
                                                {categorias
                                                    .filter(c => !c.nombre_tipo.toLowerCase().includes('monitor') && !c.nombre_tipo.toLowerCase().includes('monitores'))
                                                    .map(c => (
                                                        <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_tipo}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>

                                        {newItem.categoria && (
                                            <>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No. Serie</label>
                                                    <input type="text" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-amber-500 transition-all outline-none font-black text-lg" value={newItem.serie} onChange={(e) => setNewItem({ ...newItem, serie: e.target.value })} placeholder="ESCRIBE O ESCANEA SERIE..." required />
                                                </div>

                                                {!isPC() && (
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo Mobiliario</label>
                                                        <select className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-amber-500 transition-all outline-none font-bold" value={newItem.tipo_mobiliario} onChange={(e) => setNewItem({ ...newItem, tipo_mobiliario: e.target.value })} required>
                                                            <option value="">Seleccione...</option>
                                                            {tiposMobiliario.map(t => <option key={t.id_tipo} value={t.id_tipo}>{t.nombre}</option>)}
                                                        </select>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marca</label>
                                                        <input type="text" className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:bg-white" value={newItem.marca} onChange={(e) => setNewItem({ ...newItem, marca: e.target.value })} />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo</label>
                                                        <input type="text" className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:bg-white" value={newItem.modelo} onChange={(e) => setNewItem({ ...newItem, modelo: e.target.value })} />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        {newItem.categoria && (
                                            <>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado / Condición</label>
                                                    <select
                                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-amber-500 transition-all outline-none font-bold"
                                                        value={newItem.estado_condicion}
                                                        onChange={(e) => setNewItem({ ...newItem, estado_condicion: e.target.value })}
                                                    >
                                                        <option value="BUENO">Excelente / Nuevo</option>
                                                        <option value="REGULAR">Funcional</option>
                                                        <option value="MALO">Requiere Atención</option>
                                                    </select>
                                                </div>

                                                {isPC() && (
                                                    <div className="p-6 bg-amber-50 rounded-[2rem] space-y-4 border border-amber-100">
                                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Detalles de Cómputo</p>
                                                        <input type="text" placeholder="Procesador (Ej: i7 12th Gen)" className="w-full px-5 py-3 bg-white border border-amber-100 rounded-xl text-sm font-bold" value={newItem.procesador} onChange={(e) => setNewItem({ ...newItem, procesador: e.target.value })} />
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="relative">
                                                                <input type="text" placeholder="RAM" className="w-full px-5 py-3 pr-10 bg-white border border-amber-100 rounded-xl text-sm font-bold" value={(newItem.ram || '').replace(/\D/g, '')} onChange={(e) => { const digits = e.target.value.replace(/\D/g, ''); setNewItem({ ...newItem, ram: digits ? digits + ' GB' : '' }); }} />
                                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-500 uppercase">GB</span>
                                                            </div>
                                                            <div className="relative">
                                                                <input type="text" placeholder="Almacenm." className="w-full px-5 py-3 pr-10 bg-white border border-amber-100 rounded-xl text-sm font-bold" value={(newItem.disco_duro || '').replace(/\D/g, '')} onChange={(e) => { const digits = e.target.value.replace(/\D/g, ''); setNewItem({ ...newItem, disco_duro: digits ? digits + ' MB' : '' }); }} />
                                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-500 uppercase">MB</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <button className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all flex items-center justify-center active:scale-95 mt-6">
                                                    <Save className="w-6 h-6 mr-3 text-amber-500" /> Completar Registro
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal de Detalles de Equipo */}
            <AnimatePresence>
                {viewingItem && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                        <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl relative animate-scaleIn flex flex-col overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-50 shrink-0">
                                <h3 className="text-2xl font-black text-slate-800 flex items-center">
                                    <Info className="w-8 h-8 mr-4 text-indigo-500" /> Detalles de Equipo
                                </h3>
                                <button onClick={() => setViewingItem(null)} className="p-2 bg-white hover:bg-slate-100 text-slate-400 rounded-full transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No. Serie / ID</p>
                                        <p className="font-bold text-slate-800 text-lg">{viewingItem.numero_inventario}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</p>
                                        <p className="font-bold text-slate-800 text-lg">{viewingItem.categoria_nombre || 'General'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marca / Modelo</p>
                                        <p className="font-bold text-slate-800 text-lg">{viewingItem.marca} {viewingItem.modelo}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Condición</p>
                                        <p className="font-bold text-slate-800 text-lg">{viewingItem.estado_condicion}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación</p>
                                        <p className="font-bold text-slate-800 text-lg">{viewingItem.laboratorio_nombre || 'Sin Laboratorio'}</p>
                                    </div>
                                    {viewingItem.estacion_nombre && (
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estación</p>
                                            <p className="font-bold text-slate-800 text-lg">{viewingItem.estacion_nombre}</p>
                                        </div>
                                    )}
                                    {viewingItem.procesador && (
                                        <>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Procesador</p>
                                                <p className="font-bold text-slate-800 text-lg">{viewingItem.procesador}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RAM / Almacenamiento</p>
                                                <p className="font-bold text-slate-800 text-lg">{viewingItem.ram} / {viewingItem.disco_duro}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="pt-6 border-t border-slate-100 flex justify-end">
                                    <button onClick={() => setViewingItem(null)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                                        Cerrar Detalles
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {activeTab === 'inventario' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="max-w-2xl mx-auto">
                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Filtrar inventario por serie o ID..."
                                className="w-full pl-16 pr-8 py-5 bg-white rounded-3xl border border-slate-100 shadow-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
                            <div>
                                <h3 className="font-black text-slate-800 text-xl tracking-tight">Listado de Equipos</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total en este laboratorio: {filteredItems.filter(item => item.laboratorio === parseInt(selectedLabId)).length}</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-slate-400 font-black uppercase tracking-widest bg-slate-50/50">
                                        <th className="px-8 py-5">Serie / ID</th>
                                        <th className="px-8 py-5">Descripción</th>
                                        <th className="px-8 py-5">Estado Estación</th>
                                        <th className="px-8 py-5 text-center">Condición</th>
                                        <th className="px-8 py-5 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredItems.filter(item => item.laboratorio === parseInt(selectedLabId)).map(hw => (
                                        <tr key={hw.numero_inventario} className="hover:bg-emerald-50/30 transition-all group">
                                            <td className="px-8 py-6 font-black text-slate-800">{hw.serie}</td>
                                            <td className="px-8 py-6">
                                                <div className="font-bold text-slate-700">{hw.marca} {hw.modelo}</div>
                                                <div className="text-[9px] text-slate-400 font-bold uppercase">{hw.categoria_nombre}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${hw.estacion_nombre ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                                                    {hw.estacion_nombre ? `Est: ${hw.estacion_nombre}` : 'Sin Asignar'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className={`w-3 h-3 rounded-full mx-auto ${hw.estado_condicion === 'BUENO' ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-rose-500 shadow-lg shadow-rose-200'}`} />
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleViewItem(hw)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-white rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200"
                                                        title="Ver Detalles"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditItem(hw)}
                                                        className="p-2 text-slate-400 hover:text-amber-500 transition-colors bg-white rounded-xl shadow-sm border border-slate-100 hover:border-amber-200"
                                                        title="Editar Equipo"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteItem(hw.procesador ? 'pc' : 'hw', hw.numero_inventario)}
                                                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-white rounded-xl shadow-sm border border-slate-100 hover:border-rose-200"
                                                        title="Eliminar Equipo"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'mapa' && (
                <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-200 shadow-xl relative overflow-hidden min-h-[700px] animate-fadeIn">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-12">
                            <h3 className="text-xl font-black text-slate-700 tracking-tighter uppercase italic flex items-center">
                                <Layout className="w-6 h-6 mr-3 text-indigo-600" /> Plano de {activeLab?.nombre}
                            </h3>
                        </div>

                        <div className="flex flex-col items-center mb-16">
                            <div className="w-1/2 h-5 bg-slate-900 rounded-b-2xl flex items-center justify-center shadow-lg">
                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.6em]">PANTALLA</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-[30px_1fr_60px_1fr] gap-4 max-w-4xl mx-auto">
                            <div className="flex flex-col justify-around py-2 items-center text-slate-200 text-xl font-black font-mono">
                                {Array.from(new Set(labEstaciones.map(e => e.fila))).sort((a, b) => a - b).map(rowIdx => {
                                    const firstInRow = labEstaciones.find(e => e.fila === rowIdx);
                                    const rowLetter = firstInRow ? firstInRow.nombre[0] : '?';
                                    return <div key={rowIdx} className="h-20 flex items-center">{rowLetter}</div>;
                                })}
                            </div>

                            <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${Math.ceil((activeLab?.equipos_por_fila || 4) / 2)}, minmax(0, 1fr))` }}>
                                {Array.from(new Set(labEstaciones.map(e => e.fila))).sort((a, b) => a - b).map(rowIdx => (
                                    Array.from({ length: Math.ceil((activeLab?.equipos_por_fila || 4) / 2) }, (_, i) => i + 1).map(colIdx => {
                                        const est = labEstaciones.find(e => e.fila === rowIdx && e.columna === colIdx);
                                        return est ? (
                                            <StationCard key={est.id_estacion} name={est.nombre} estacion={est} onClick={() => { setSelectedEstacion(est); setShowAssignmentModal(true); }} />
                                        ) : <div key={`${rowIdx}-${colIdx}`} className="h-20" />;
                                    })
                                ))}
                            </div>

                            <div className="flex flex-col items-center py-4 relative opacity-10">
                                <div className="absolute inset-y-0 w-px border-l-2 border-slate-300 border-dashed"></div>
                            </div>

                            <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${Math.floor((activeLab?.equipos_por_fila || 4) / 2)}, minmax(0, 1fr))` }}>
                                {Array.from(new Set(labEstaciones.map(e => e.fila))).sort((a, b) => a - b).map(rowIdx => (
                                    Array.from({ length: Math.floor((activeLab?.equipos_por_fila || 4) / 2) }, (_, i) => i + 1 + Math.ceil((activeLab?.equipos_por_fila || 4) / 2)).map(colIdx => {
                                        const est = labEstaciones.find(e => e.fila === rowIdx && e.columna === colIdx);
                                        return est ? (
                                            <StationCard key={est.id_estacion} name={est.nombre} estacion={est} onClick={() => { setSelectedEstacion(est); setShowAssignmentModal(true); }} />
                                        ) : <div key={`${rowIdx}-${colIdx}`} className="h-20" />;
                                    })
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed bottom-8 right-8 z-[200]">
                <AnimatePresence>
                    {notification && (
                        <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default EquiposDocente;

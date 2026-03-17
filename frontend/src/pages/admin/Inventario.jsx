import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from '../../components/Toast';
import api from '../../services/api';
import {
    Cpu, HardDrive, Layout, Plus, Info, Box, Search,
    Monitor, Save, Server, X, MousePointer2, ChevronRight, ChevronLeft, MapPin
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
            className={`relative group cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center space-y-2
                ${estacion ? (hasPC ? 'bg-white border-indigo-200 shadow-lg' : 'bg-slate-50 border-slate-200') : 'bg-slate-100 border-dashed border-slate-300 opacity-40 hover:opacity-100'}`}
        >
            <span className="text-[10px] font-black text-slate-400 absolute top-2 left-2">{name}</span>
            <div className="flex flex-col items-center">
                <div className={`w-12 h-8 rounded-md border flex items-center justify-center mb-1 ${monitor ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                    <Monitor className={`w-4 h-4 ${monitor ? 'text-indigo-600' : 'text-slate-200'}`} />
                </div>
                <div className="flex space-x-1 items-center">
                    <Cpu className={`w-3 h-3 ${hasPC ? 'text-indigo-600' : 'text-slate-200'}`} />
                    <div className={`w-1.5 h-1.5 rounded-full ${kb ? 'bg-indigo-400' : 'bg-slate-200'}`} />
                    <div className={`w-1 h-1 rounded-full ${ms ? 'bg-indigo-400' : 'bg-slate-200'}`} />
                </div>
            </div>
            <div className="absolute -bottom-2">
                <Box className={`w-4 h-4 ${chair ? 'text-amber-500' : 'text-slate-200'}`} />
            </div>

            <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity flex items-center justify-center">
                <Info className="text-indigo-600 w-6 h-6" />
            </div>
        </div>
    );
};

const Inventario = () => {
    const [activeTab, setActiveTab] = useState('alta');
    const [searchTerm, setSearchTerm] = useState('');
    const [laboratorios, setLaboratorios] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [tiposMobiliario, setTiposMobiliario] = useState([]);
    const [estaciones, setEstaciones] = useState([]);
    const [hardwares, setHardwares] = useState([]);
    const [equiposComputo, setEquiposComputo] = useState([]);
    const [softwares, setSoftwares] = useState([]);
    const [selectedLabId, setSelectedLabId] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedEstacion, setSelectedEstacion] = useState(null);
    const [showModal, setShowModal] = useState(false);

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
        detalles_tecnicos: {}
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
            const [labsRes, catsRes, tiposRes, estRes, hwRes, pcsRes, swRes] = await Promise.all([
                api.get('/laboratorios/'),
                api.get('/categorias/'),
                api.get('/tipos-mobiliario/'),
                api.get('/estaciones/'),
                api.get('/mobiliario/'),
                api.get('/equipos-computo/'),
                api.get('/software/')
            ]);
            setLaboratorios(labsRes.data);
            setCategorias(catsRes.data);
            setTiposMobiliario(tiposRes.data);
            setEstaciones(estRes.data);
            setHardwares(hwRes.data);
            setEquiposComputo(pcsRes.data);
            setSoftwares(swRes.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const categoriaSeleccionada = categorias.find(c => c.id_categoria === parseInt(newItem.categoria));
        const isPCVal = categoriaSeleccionada && (categoriaSeleccionada.nombre_tipo.toLowerCase().includes('computo') || categoriaSeleccionada.nombre_tipo.toLowerCase().includes('cómputo'));

        try {
            const dataToSave = {
                ...newItem,
                numero_inventario: newItem.serie, // Use serie as inventario ID
                detalles_tecnicos: {}
            };

            if (isPCVal) {
                await api.post('/equipos-computo/', {
                    ...dataToSave,
                    procesador: newItem.procesador,
                    ram: newItem.ram,
                    disco_duro: newItem.disco_duro,
                });
            } else {
                await api.post('/mobiliario/', {
                    ...dataToSave,
                    tipo_mobiliario: newItem.tipo_mobiliario || null,
                });
            }
            showToast("Ítem registrado con éxito mediante No. Serie.");
            setNewItem({
                numero_inventario: '', marca: '', modelo: '', serie: '',
                estado_condicion: 'BUENO', ubicacion_especifica: '',
                categoria: '', tipo_mobiliario: '',
                procesador: '', ram: '', disco_duro: '', detalles_tecnicos: {}
            });
            fetchData();
        } catch (error) {
            console.error("Error saving equipment:", error);
            showToast("Error al registrar. Verifique si el ID de inventario ya existe.", "error");
        }
    };

    const toggleSoftwareInLab = async (swId, labId) => {
        try {
            const sw = softwares.find(s => s.id_software === swId);
            const isInstalled = sw.laboratorios.includes(labId);
            let updatedLabs = isInstalled ? sw.laboratorios.filter(id => id !== labId) : [...sw.laboratorios, labId];
            await api.patch(`/software/${swId}/`, { laboratorios: updatedLabs });
            fetchData();
        } catch (error) {
            console.error("Error updating software:", error);
        }
    };
    const allItems = [...hardwares, ...equiposComputo].sort((a, b) =>
        (a.serie || '').localeCompare(b.serie || '')
    );

    const filteredItems = allItems.filter(item =>
        item.serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.numero_inventario?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isPC = () => {
        const cat = categorias.find(c => c.id_categoria === parseInt(newItem.categoria));
        return cat && (cat.nombre_tipo.toLowerCase().includes('computo') || cat.nombre_tipo.toLowerCase().includes('cómputo'));
    };

    const handleAssign = async (type, itemId, stationId) => {
        const endpoint = type === 'pc' ? '/equipos-computo/' : '/mobiliario/';
        try {
            await api.patch(`${endpoint}${itemId}/`, { estacion: stationId });
            fetchData();
            // Refetch current station details to keep modal updated
            const res = await api.get(`/estaciones/${selectedEstacion.id_estacion}/`);
            setSelectedEstacion(res.data);
        } catch (error) {
            console.error("Error linking item:", error);
            alert("Error al asociar el ítem.");
        }
    };

    const handleUnassign = async (type, itemId) => {
        const endpoint = type === 'pc' ? '/equipos-computo/' : '/mobiliario/';
        try {
            await api.patch(`${endpoint}${itemId}/`, { estacion: null });
            fetchData();
            const res = await api.get(`/estaciones/${selectedEstacion.id_estacion}/`);
            setSelectedEstacion(res.data);
        } catch (error) {
            console.error("Error unlinking item:", error);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest">Cargando...</div>;

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            {/* Modal de Detalle/Asociación de Estación */}
            {showModal && selectedEstacion && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-600">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">{selectedEstacion.nombre}</h3>
                                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">{laboratorios.find(l => l.id_laboratorio === selectedEstacion.laboratorio)?.nombre}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-4">
                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <Cpu className="w-4 h-4 mr-2" /> Computadora de la Estación
                                </label>
                                {selectedEstacion.equipo_detalle ? (
                                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                                        <div>
                                            <p className="font-black text-slate-800">{selectedEstacion.equipo_detalle.numero_inventario}</p>
                                            <p className="text-xs text-slate-500">S/N: {selectedEstacion.equipo_detalle.serie || 'N/A'}</p>
                                        </div>
                                        <button
                                            onClick={() => handleUnassign('pc', selectedEstacion.equipo_detalle.id_equipo)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500"
                                        onChange={(e) => handleAssign('pc', e.target.value, selectedEstacion.id_estacion)}
                                        value=""
                                    >
                                        <option value="">Seleccionar Equipo por No. Serie...</option>
                                        {equiposComputo.filter(pc => !pc.estacion && pc.laboratorio === selectedEstacion.laboratorio).map(pc => (
                                            <option key={pc.numero_inventario} value={pc.numero_inventario}>
                                                S/N: {pc.serie || 'S/S'} - [{pc.marca} {pc.modelo}]
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <Monitor className="w-4 h-4 mr-2" /> Periféricos y Mobiliario
                                </label>
                                <div className="space-y-2">
                                    {selectedEstacion.perifericos_detalle?.map(p => (
                                        <div key={p.id_mobiliario} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                            <div>
                                                <p className="font-black text-slate-700">{p.numero_inventario} <span className="text-[10px] text-indigo-500 ml-2">[{p.tipo}]</span></p>
                                                <p className="text-xs text-slate-400">S/N: {p.serie || 'N/A'}</p>
                                            </div>
                                            <button
                                                onClick={() => handleUnassign('hw', p.id_mobiliario)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <select
                                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                                    onChange={(e) => handleAssign('hw', e.target.value, selectedEstacion.id_estacion)}
                                    value=""
                                >
                                    <option value="">Añadir Periférico por No. Serie...</option>
                                    {hardwares.filter(h => !h.estacion && h.laboratorio === selectedEstacion.laboratorio).map(h => (
                                        <option key={h.numero_inventario} value={h.numero_inventario}>
                                            S/N: {h.serie || 'S/S'} - [{h.tipo_nombre}] {h.marca}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 text-right">
                            <button onClick={() => setShowModal(false)} className="px-10 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-700 shadow-xl shadow-slate-200">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl">
                        <Box className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Módulo de Equipos</h2>
                        <p className="text-slate-500 text-sm font-medium">Alta de equipos e inventario.</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 p-1.5 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('alta')}
                    className={`flex items-center px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'alta' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Plus className="w-4 h-4 mr-2" /> Alta de Equipos
                </button>
                <button
                    onClick={() => setActiveTab('listado')}
                    className={`flex items-center px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'listado' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <HardDrive className="w-4 h-4 mr-2" /> Inventario
                </button>
            </div>

            {activeTab === 'alta' && (
                <div className="max-w-4xl mx-auto animate-fadeIn">
                    <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-xl">
                        <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center">
                            <Plus className="w-8 h-8 mr-4 text-amber-500" /> Nuevo Registro de Equipo
                        </h3>
                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Categoría del Bien</label>
                                    <select
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-amber-500 transition-all outline-none font-bold text-slate-700"
                                        value={newItem.categoria}
                                        onChange={(e) => setNewItem({ ...newItem, categoria: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccione...</option>
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
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Num. de Serie (Identificador Único)</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-amber-500 transition-all outline-none font-black text-lg"
                                                    value={newItem.serie}
                                                    onChange={(e) => setNewItem({ ...newItem, serie: e.target.value })}
                                                    placeholder="ESCRIBE O ESCANEA SERIE..."
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {!isPC() && (
                                            <div className="space-y-2 animate-fadeIn">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Mobiliario</label>
                                                <select
                                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-amber-500 transition-all outline-none font-bold"
                                                    value={newItem.tipo_mobiliario}
                                                    onChange={(e) => setNewItem({ ...newItem, tipo_mobiliario: e.target.value })}
                                                    required
                                                >
                                                    <option value="">Seleccione Estilo...</option>
                                                    {tiposMobiliario.map(t => (
                                                        <option key={t.id_tipo} value={t.id_tipo}>{t.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Marca</label>
                                                <input type="text" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-amber-500 transition-all outline-none font-bold" value={newItem.marca} onChange={(e) => setNewItem({ ...newItem, marca: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Modelo</label>
                                                <input type="text" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-amber-500 transition-all outline-none font-bold" value={newItem.modelo} onChange={(e) => setNewItem({ ...newItem, modelo: e.target.value })} />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-6">
                                {newItem.categoria && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Condición Inicial</label>
                                            <select
                                                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-amber-500 transition-all outline-none font-bold"
                                                value={newItem.estado_condicion}
                                                onChange={(e) => setNewItem({ ...newItem, estado_condicion: e.target.value })}
                                            >
                                                <option value="BUENO">Óptimo / Nuevo</option>
                                                <option value="REGULAR">Funcional / Usado</option>
                                                <option value="MALO">Dañado / Reparación</option>
                                            </select>
                                        </div>

                                        {isPC() && (
                                            <div className="p-6 bg-amber-50 rounded-3xl space-y-4 border border-amber-100 animate-fadeIn">
                                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Especificaciones de Cómputo</p>
                                                <input type="text" placeholder="Procesador (Ej: Core i7)" className="w-full px-4 py-3 bg-white border border-amber-100 rounded-xl text-sm font-bold" value={newItem.procesador} onChange={(e) => setNewItem({ ...newItem, procesador: e.target.value })} />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input type="text" placeholder="RAM" className="px-4 py-3 bg-white border border-amber-100 rounded-xl text-sm font-bold" value={newItem.ram} onChange={(e) => setNewItem({ ...newItem, ram: e.target.value })} />
                                                    <input type="text" placeholder="Almacenamiento" className="px-4 py-3 bg-white border border-amber-100 rounded-xl text-sm font-bold" value={newItem.disco_duro} onChange={(e) => setNewItem({ ...newItem, disco_duro: e.target.value })} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-4">
                                            <button className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all flex items-center justify-center active:scale-95">
                                                <Save className="w-6 h-6 mr-3 text-amber-500" /> Confirmar Alta de Equipo
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeTab === 'listado' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="max-w-2xl mx-auto">
                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar por Número de Serie o ID de Inventario..."
                                className="w-full pl-16 pr-8 py-5 bg-white rounded-3xl border border-slate-100 shadow-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h3 className="font-black text-slate-800 text-xl tracking-tight">Inventario de Equipos</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Consulta de ubicación y estado</p>
                            </div>
                            <div className="flex space-x-3">
                                <div className="px-4 py-2 bg-indigo-50 rounded-xl text-indigo-600 font-black text-[10px] uppercase tracking-wider border border-indigo-100">
                                    Total: {filteredItems.length} Artículos
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-slate-400 font-black uppercase tracking-widest bg-slate-50/50">
                                        <th className="px-8 py-5 text-indigo-600">No. Serie (ID)</th>
                                        <th className="px-8 py-5">Modelo / Marca</th>
                                        <th className="px-8 py-5">Ubicación Actual</th>
                                        <th className="px-8 py-5 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredItems.length > 0 ? (
                                        filteredItems.map(hw => (
                                            <tr key={hw.numero_inventario} className="hover:bg-indigo-50/30 transition-all group">
                                                <td className="px-8 py-6">
                                                    <div className="font-black text-slate-800">{hw.serie || 'S/N'}</div>
                                                    <div className="text-[10px] text-indigo-500 font-black uppercase tracking-wider">{hw.categoria_nombre} {hw.tipo_nombre ? `(${hw.tipo_nombre})` : ''}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="font-bold text-slate-700">{hw.marca} {hw.modelo}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center">
                                                        <MapPin className="w-4 h-4 mr-2 text-rose-500" />
                                                        <div>
                                                            <div className="font-black text-slate-800 uppercase tracking-tight">{hw.laboratorio_nombre}</div>
                                                            <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block font-black uppercase tracking-tighter mt-1 ${hw.estacion_nombre ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-200 text-slate-500'}`}>
                                                                {hw.estacion_nombre ? `Estación: ${hw.estacion_nombre}` : 'Sin Estación / Stock'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-3 h-3 rounded-full mb-1 ${hw.estado_condicion === 'BUENO' ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-red-500 shadow-lg shadow-red-200'}`} />
                                                        <span className="text-[9px] font-black uppercase">{hw.estado_condicion}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center opacity-20">
                                                    <Search className="w-16 h-16 mb-4" />
                                                    <p className="font-black uppercase tracking-[0.5em]">Sin resultados para la búsqueda</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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

export default Inventario;

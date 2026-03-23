import LoadingSpinner from '../../components/LoadingSpinner';
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Search, Laptop, MapPin, Box,
    Monitor, Cpu, Info, ChevronRight,
    Wrench, X, Save, Calendar
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Toast from '../../components/Toast';

const EquiposTecnico = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [allItems, setAllItems] = useState([]);

    // Maintenance Modal State
    const [showMaintModal, setShowMaintModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [maintData, setMaintData] = useState({
        tipo: 'PREVENTIVO',
        descripcion: '',
        fecha_proximo_mantenimiento: ''
    });

    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [hwRes, pcsRes] = await Promise.all([
                api.get('/mobiliario/'),
                api.get('/equipos-computo/')
            ]);
            const combined = [...hwRes.data, ...pcsRes.data].sort((a, b) =>
                (a.serie || '').localeCompare(b.serie || '')
            );
            setAllItems(combined);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching inventory:", error);
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const handleOpenMaint = (item) => {
        setSelectedItem(item);
        setMaintData({
            tipo: 'PREVENTIVO',
            descripcion: '',
            fecha_proximo_mantenimiento: ''
        });
        setShowMaintModal(true);
    };

    const handleSaveMaint = async (e) => {
        e.preventDefault();
        try {
            const isPC = !!selectedItem.procesador;
            const payload = {
                tipo: maintData.tipo,
                descripcion: maintData.descripcion,
                fecha_proximo_mantenimiento: maintData.fecha_proximo_mantenimiento || null,
                [isPC ? 'equipo_computo' : 'mobiliario']: selectedItem.numero_inventario
            };

            await api.post('/mantenimientos/', payload);
            showToast("Equipo enviado a mantenimiento preventivo y desactivado del catálogo.");
            setShowMaintModal(false);
            fetchData();
        } catch (error) {
            console.error("Error creating maintenance:", error);
            showToast("Error al registrar mantenimiento.", "error");
        }
    };

    const filteredItems = allItems.filter(item =>
        item.serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.numero_inventario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.modelo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && allItems.length === 0) return <LoadingSpinner />;

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            {/* Maintenance Modal */}
            <AnimatePresence>
                {showMaintModal && selectedItem && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-blue-600">
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tight">Mantenimiento Preventivo</h3>
                                    <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mt-1">S/N: {selectedItem.serie}</p>
                                </div>
                                <button onClick={() => setShowMaintModal(false)} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveMaint} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Descripción del Mantenimiento</label>
                                        <textarea
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300 min-h-[120px]"
                                            placeholder="Detalla las acciones a realizar..."
                                            value={maintData.descripcion}
                                            onChange={(e) => setMaintData({ ...maintData, descripcion: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Fecha Próximo Mantenimiento (Opcional)</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="date"
                                                className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none font-bold text-slate-700"
                                                value={maintData.fecha_proximo_mantenimiento}
                                                onChange={(e) => setMaintData({ ...maintData, fecha_proximo_mantenimiento: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowMaintModal(false)}
                                        className="flex-1 py-4 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-blue-600 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center"
                                    >
                                        <Save className="w-4 h-4 mr-2" /> Confirmar Salida
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                        <Laptop className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Consulta de Equipos</h2>
                        <p className="text-slate-500 text-sm font-medium">Búsqueda y estado de hardware y equipos de cómputo.</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto">
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por No. Serie, Marca, Modelo o ID de Inventario..."
                        className="w-full pl-16 pr-8 py-5 bg-white rounded-3xl border border-slate-100 shadow-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                    <div>
                        <h3 className="font-black text-slate-800 text-xl tracking-tight">Inventario Global</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total: {filteredItems.length} registros encontrados</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-slate-400 font-black uppercase tracking-widest bg-slate-50/50">
                                <th className="px-8 py-5 text-blue-600">No. Serie / ID</th>
                                <th className="px-8 py-5">Especificaciones</th>
                                <th className="px-8 py-5">Ubicación</th>
                                <th className="px-8 py-5 text-center">Estado</th>
                                <th className="px-8 py-5 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredItems.length > 0 ? (
                                filteredItems.map(item => (
                                    <tr key={item.numero_inventario} className="hover:bg-blue-50/30 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="font-black text-slate-800">{item.serie || 'S/N'}</div>
                                            <div className="text-[10px] text-blue-500 font-black uppercase tracking-wider">
                                                ID: {item.numero_inventario}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-slate-700">{item.marca} {item.modelo}</div>
                                            <div className="flex items-center mt-1 space-x-2">
                                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-black text-slate-400 uppercase">
                                                    {item.categoria_nombre || 'General'}
                                                </span>
                                                {item.procesador && (
                                                    <span className="text-[10px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded font-black uppercase">
                                                        {item.procesador} | {item.ram}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-2 text-rose-500" />
                                                <div>
                                                    <div className="font-black text-slate-800 uppercase tracking-tight">{item.laboratorio_nombre || 'S/L'}</div>
                                                    <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block font-black uppercase tracking-tighter mt-1 ${item.estacion_nombre ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-200 text-slate-500'}`}>
                                                        {item.estacion_nombre ? `Estación: ${item.estacion_nombre}` : 'En Stock / Bodega'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full mb-1 ${item.activo ? (item.estado_condicion === 'BUENO' ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-amber-500 shadow-lg shadow-amber-200') : 'bg-red-500 shadow-lg shadow-red-200'}`} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{item.activo ? item.estado_condicion : 'MANTENIMIENTO'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {item.activo ? (
                                                <button
                                                    onClick={() => handleOpenMaint(item)}
                                                    className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:shadow-lg active:scale-90"
                                                    title="Enviar a Mantenimiento Preventivo"
                                                >
                                                    <Wrench className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-300 uppercase italic">Fuera de Servicio</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center opacity-20">
                                            <Search className="w-16 h-16 mb-4" />
                                            <p className="font-black uppercase tracking-[0.5em]">No se encontraron coincidencias</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Toxic Notifications */}
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

export default EquiposTecnico;

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Layout, Monitor, Users, Settings,
    ChevronRight, ChevronLeft, MapPin, Cpu, Info, Box
} from 'lucide-react';

const StationCard = ({ name, estacion }) => {
    const hasPC = estacion?.equipo_detalle;
    const peripherals = estacion?.perifericos_detalle || [];
    const monitor = peripherals.find(p => p.tipo?.toLowerCase().includes('monitor'));

    return (
        <div className={`relative p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center space-y-1.5
                ${estacion ? (hasPC ? 'bg-white border-blue-200 shadow-md' : 'bg-slate-50 border-slate-200') : 'bg-slate-100/50 border-dashed border-slate-300 opacity-40'}`}>
            <span className="text-[9px] font-black text-slate-400 absolute top-1.5 left-2">{name}</span>
            <div className="flex flex-col items-center">
                <div className={`w-10 h-6 rounded-md border flex items-center justify-center mb-0.5 ${monitor ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
                    <Monitor className={`w-3 h-3 ${monitor ? 'text-blue-600' : 'text-slate-200'}`} />
                </div>
                <div className="flex space-x-1 items-center">
                    <Cpu className={`w-2.5 h-2.5 ${hasPC ? 'text-blue-600' : 'text-slate-200'}`} />
                </div>
            </div>
            {hasPC && (
                <div className="absolute -bottom-1 opacity-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
            )}
        </div>
    );
};

const LaboratoriosTecnico = () => {
    const [laboratorios, setLaboratorios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLab, setSelectedLab] = useState(null);
    const [estaciones, setEstaciones] = useState([]);

    useEffect(() => {
        const fetchLabs = async () => {
            try {
                const res = await api.get('/laboratorios/');
                setLaboratorios(res.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching labs:", error);
                setLoading(false);
            }
        };
        fetchLabs();
    }, []);

    const handleSelectLab = async (lab) => {
        setLoading(true);
        try {
            const res = await api.get(`/estaciones/?laboratorio=${lab.id_laboratorio}`);
            setEstaciones(res.data);
            setSelectedLab(lab);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching estaciones:", error);
            setLoading(false);
        }
    };

    if (loading && !selectedLab) return <div className="p-10 text-center font-black text-slate-400 animate-pulse tracking-widest uppercase">Cargando Laboratorios...</div>;

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                    <Layout className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Registro de Laboratorios</h2>
                    <p className="text-slate-500 text-sm font-medium">Consulta de infraestructura y distribución de estaciones.</p>
                </div>
            </div>

            {selectedLab ? (
                <div className="animate-fadeIn space-y-6">
                    <div className="flex items-center space-x-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <button
                            onClick={() => setSelectedLab(null)}
                            className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all group"
                        >
                            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedLab.nombre}</h3>
                            <div className="flex items-center space-x-3 mt-1">
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">{selectedLab.area_nombre}</span>
                                <span className="text-[10px] font-bold text-slate-400 flex items-center uppercase tracking-widest">
                                    <MapPin className="w-3 h-3 mr-1 opacity-40 text-blue-500" /> {selectedLab.ubicacion}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-fit">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Detalles Técnicos</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                                    <div className="flex items-center text-slate-600">
                                        <Users className="w-4 h-4 mr-3 text-blue-500" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Capacidad</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-800">{selectedLab.capacidad}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                                    <div className="flex items-center text-slate-600">
                                        <Monitor className="w-4 h-4 mr-3 text-blue-500" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Estaciones</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-800">{estaciones.length}</span>
                                </div>
                                <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100">
                                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Responsable</p>
                                    <p className="text-sm font-bold text-white truncate">{selectedLab.responsable_nombre || 'No asignado'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3">
                            <div className="bg-[#fcfdfe] p-8 md:p-12 rounded-[3.5rem] border border-slate-200 shadow-xl relative overflow-hidden min-h-[500px]">
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#2563eb 1px, transparent 1px), linear-gradient(90deg, #2563eb 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                                <div className="relative z-10">
                                    <h3 className="text-lg font-black text-slate-700 tracking-tighter uppercase italic mb-12 flex items-center">Plano de Distribución</h3>

                                    <div className="flex flex-col items-center mb-16">
                                        <div className="w-1/2 h-5 bg-slate-900 rounded-b-2xl flex items-center justify-center opacity-80">
                                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.6em]">PANTALLA</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-[30px_1fr_60px_1fr] gap-4 max-w-4xl mx-auto">
                                        <div className="flex flex-col justify-around py-2 items-center text-slate-200 text-xl font-black font-mono">
                                            {Array.from(new Set(estaciones.map(e => (e.nombre || 'Z')[0]))).sort().map(rowLetter => (
                                                <div key={rowLetter} className="h-20 flex items-center">{rowLetter}</div>
                                            ))}
                                        </div>

                                        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.ceil((selectedLab.equipos_por_fila || 4) / 2)}, minmax(0, 1fr))` }}>
                                            {Array.from(new Set(estaciones.map(e => e.fila))).sort((a, b) => a - b).map(rowIdx => (
                                                Array.from({ length: Math.ceil((selectedLab.equipos_por_fila || 4) / 2) }, (_, i) => i + 1).map(colIdx => {
                                                    const est = estaciones.find(e => e.fila === rowIdx && e.columna === colIdx);
                                                    return est ? <StationCard key={est.id_estacion} name={est.nombre} estacion={est} /> : <div key={`${rowIdx}-${colIdx}`} className="h-20" />;
                                                })
                                            ))}
                                        </div>

                                        <div className="flex flex-col items-center py-4 opacity-5">
                                            <div className="absolute inset-y-0 w-px border-l-2 border-slate-300 border-dashed"></div>
                                        </div>

                                        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.floor((selectedLab.equipos_por_fila || 4) / 2)}, minmax(0, 1fr))` }}>
                                            {Array.from(new Set(estaciones.map(e => e.fila))).sort((a, b) => a - b).map(rowIdx => (
                                                Array.from({ length: Math.floor((selectedLab.equipos_por_fila || 4) / 2) }, (_, i) => i + 1 + Math.ceil((selectedLab.equipos_por_fila || 4) / 2)).map(colIdx => {
                                                    const est = estaciones.find(e => e.fila === rowIdx && e.columna === colIdx);
                                                    return est ? <StationCard key={est.id_estacion} name={est.nombre} estacion={est} /> : <div key={`${rowIdx}-${colIdx}`} className="h-20" />;
                                                })
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {laboratorios.map(lab => (
                        <div
                            key={lab.id_laboratorio}
                            onClick={() => handleSelectLab(lab)}
                            className="group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500"></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                        <Monitor className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{lab.activo ? 'ACTIVO' : 'FUERA'}</span>
                                </div>

                                <div className="mb-8">
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">{lab.area_nombre}</p>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">{lab.nombre}</h3>
                                    <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-tighter">
                                        <MapPin className="w-3 h-3 mr-1" /> {lab.ubicacion}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Capacidad</span>
                                            <span className="text-sm font-black text-slate-800">{lab.capacidad}</span>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LaboratoriosTecnico;

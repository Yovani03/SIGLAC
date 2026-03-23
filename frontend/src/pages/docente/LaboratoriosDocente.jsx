import LoadingSpinner from '../../components/LoadingSpinner';
import React, { useState, useEffect } from 'react';
import { Monitor, Info, Box, Cpu, HardDrive, Package, Search, ChevronRight } from 'lucide-react';
import api from '../../services/api';

const LaboratoriosDocente = () => {
    const [laboratorios, setLaboratorios] = useState([]);
    const [selectedLab, setSelectedLab] = useState(null);
    const [loading, setLoading] = useState(true);
    const [labDetail, setLabDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        const fetchLabs = async () => {
            try {
                const res = await api.get('/laboratorios/');
                setLaboratorios(res.data);
                if (res.data.length > 0) {
                    handleSelectLab(res.data[0]);
                }
            } catch (error) {
                console.error("Error fetching labs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLabs();
    }, []);

    const handleSelectLab = async (lab) => {
        setSelectedLab(lab);
        setDetailLoading(true);
        try {
            const res = await api.get(`/laboratorios/${lab.id_laboratorio}/recursos/`);
            setLabDetail(res.data);
        } catch (error) {
            console.error("Error fetching lab details", error);
        } finally {
            setDetailLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Catálogo de Laboratorios</h1>
                <p className="text-slate-500 font-medium">Consulta el equipamiento y software disponible en cada espacio.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* List of Labs */}
                <div className="lg:col-span-4 space-y-4">
                    {laboratorios.map((lab) => (
                        <button
                            key={lab.id_laboratorio}
                            onClick={() => handleSelectLab(lab)}
                            className={`w-full text-left p-6 rounded-[2rem] border transition-all duration-300 flex items-center justify-between group ${selectedLab?.id_laboratorio === lab.id_laboratorio
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100'
                                    : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:shadow-lg'
                                }`}
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`p-3 rounded-2xl ${selectedLab?.id_laboratorio === lab.id_laboratorio ? 'bg-indigo-500' : 'bg-slate-50'
                                    }`}>
                                    <Monitor className={`w-6 h-6 ${selectedLab?.id_laboratorio === lab.id_laboratorio ? 'text-white' : 'text-indigo-600'
                                        }`} />
                                </div>
                                <div>
                                    <p className="font-black text-lg">{lab.nombre}</p>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedLab?.id_laboratorio === lab.id_laboratorio ? 'text-indigo-100' : 'text-slate-400'
                                        }`}>{lab.ubicacion}</p>
                                </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 transition-transform ${selectedLab?.id_laboratorio === lab.id_laboratorio ? 'rotate-90 opacity-100' : 'opacity-30 group-hover:translate-x-1'
                                }`} />
                        </button>
                    ))}
                </div>

                {/* Details View */}
                <div className="lg:col-span-8">
                    {detailLoading ? (
                        <div className="bg-white rounded-[2.5rem] p-20 flex flex-col items-center justify-center border border-slate-100 shadow-sm space-y-4">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-400 font-bold">Obteniendo recursos...</p>
                        </div>
                    ) : labDetail ? (
                        <div className="space-y-8 animate-fadeIn">
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2 text-indigo-600 font-black text-xs uppercase tracking-[0.2em]">
                                            <Info className="w-4 h-4" />
                                            <span>Detalles del Espacio</span>
                                        </div>
                                        <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{selectedLab?.nombre}</h2>
                                    </div>
                                    <div className="bg-emerald-50 px-6 py-4 rounded-3xl border border-emerald-100 flex flex-col items-center">
                                        <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-1">Capacidad Total</span>
                                        <span className="text-3xl font-black text-emerald-700">{labDetail.capacidad} <span className="text-lg font-bold opacity-60">Eq.</span></span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Equipment Summary */}
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                            <Box className="w-5 h-5 mr-3 text-slate-400" />
                                            Infraestructura Actual
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-4">
                                                <div className="p-3 bg-white rounded-xl shadow-sm text-slate-500">
                                                    <Cpu className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">Equipos Activos</p>
                                                    <p className="text-xs text-slate-400 font-medium">PCs de escritorio en red</p>
                                                </div>
                                                <span className="ml-auto text-xl font-black text-indigo-600">{labDetail.capacidad}</span>
                                            </div>
                                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-4">
                                                <div className="p-3 bg-white rounded-xl shadow-sm text-slate-500">
                                                    <HardDrive className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">Proyectores / Pantallas</p>
                                                    <p className="text-xs text-slate-400 font-medium">Equipamiento multimedia</p>
                                                </div>
                                                <span className="ml-auto text-xl font-black text-indigo-600">01</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Software List */}
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                            <Package className="w-5 h-5 mr-3 text-slate-400" />
                                            Software Instalado
                                        </h3>
                                        <div className="bg-slate-50 rounded-3xl border border-slate-100 p-6">
                                            <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto pr-2 scrollbar-hide">
                                                {labDetail.software && labDetail.software.length > 0 ? (
                                                    labDetail.software.map((sw) => (
                                                        <div key={sw.id_software} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                                                            <div>
                                                                <p className="font-bold text-slate-700 text-sm">{sw.nombre}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{sw.version}</p>
                                                            </div>
                                                            <div className="px-2 py-1 bg-indigo-50 rounded-lg text-indigo-500">
                                                                <CheckCircle className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-center py-10 text-slate-400 text-sm font-medium italic">No hay software registrado.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] p-20 flex flex-col items-center justify-center border border-slate-100 shadow-sm text-center">
                            <Search className="w-16 h-16 text-slate-100 mb-6" />
                            <h3 className="text-xl font-bold text-slate-400">Selecciona un laboratorio</h3>
                            <p className="text-slate-300">Para ver sus especificaciones técnicas.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Check circle icon not in lucide-react? It's CheckCircle.
const CheckCircleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

export default LaboratoriosDocente;

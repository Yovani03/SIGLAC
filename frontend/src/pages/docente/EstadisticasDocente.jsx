import React, { useState, useEffect } from 'react';
import {
    BarChart3, PieChart, TrendingUp, Download,
    Calendar, AlertTriangle, Clock, Users,
    FileBarChart, ChevronRight, Filter,
    CheckCircle2, AlertCircle, FileText, X,
    CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LoadingSpinner from '../../components/LoadingSpinner';

const EstadisticasDocente = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        equiposFallados: [],
        mantenimiento: { preventivo: 0, correctivo: 0, activity: [] },
        asistencia: [],
        statsMensuales: [],
        global: { total: 0, resolved: 0, pending: 0 }
    });

    const [showExportModal, setShowExportModal] = useState(false);
    const [showMaintModal, setShowMaintModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/reportes/stats/');
                const data = response.data;

                setStats({
                    equiposFallados: data.top_failures || [],
                    mantenimiento: {
                        preventivo: data.maintenance?.preventive || 0,
                        corrective: data.maintenance?.corrective || 0,
                        activity: data.maintenance?.activity || []
                    },
                    asistencia: data.attendance || [],
                    statsMensuales: data.stats_mensuales || [],
                    global: data.global_stats || { total: 0, resolved: 0, pending: 0 }
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
                toast.error("No se pudieron cargar las estadísticas reales.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const generatePDFReport = (monthNum) => {
        try {
            const monthData = stats.statsMensuales.find(m => m.numero === monthNum);
            if (!monthData) {
                toast.error("No hay datos para este mes.");
                return;
            }

            const doc = new jsPDF();

            // Header
            doc.setFillColor(63, 81, 181); // Indigo
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text("SIGLAC - REPORTE MENSUAL", 20, 25);
            doc.setFontSize(14);
            doc.text(`Mes: ${monthData.mes} ${new Date().getFullYear()}`, 20, 33);

            // Content
            doc.setTextColor(33, 33, 33);
            doc.setFontSize(16);
            doc.text("Resumen de Incidencias", 20, 55);

            const tableData = [
                ["Estado", "Cantidad", "Porcentaje"],
                ["Casos Resueltos", monthData.resolved, `${((monthData.resolved / monthData.total) * 100 || 0).toFixed(1)}%`],
                ["Casos Activos", monthData.active, `${((monthData.active / monthData.total) * 100 || 0).toFixed(1)}%`],
                ["Total de Reportes", monthData.total, "100%"]
            ];

            autoTable(doc, {
                startY: 65,
                head: [tableData[0]],
                body: tableData.slice(1),
                theme: 'striped',
                headStyles: { fillColor: [63, 81, 181] }
            });

            // Top Failure Section
            doc.setFontSize(16);
            doc.text("Equipos con Mayor Incidencia", 20, doc.lastAutoTable.finalY + 20);

            const failuresData = stats.equiposFallados.map((item, idx) => [
                idx + 1, item.id, item.modelo, item.lab, item.count
            ]);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 30,
                head: [["#", "ID Equipo", "Modelo", "Laboratorio", "Fallas"]],
                body: failuresData,
                theme: 'grid'
            });

            doc.save(`Reporte_SIGLAC_${monthData.mes}.pdf`);
            toast.success(`Reporte de ${monthData.mes} descargado.`);
            setShowExportModal(false);
        } catch (err) {
            console.error("PDF generation error:", err);
            toast.error("Error al generar el PDF.");
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-10 animate-fadeIn pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Reportes Estadísticos</h1>
                    <p className="text-slate-500 font-medium text-lg">Análisis en tiempo real de rendimiento y asistencia.</p>
                </div>

                {/* Unified Export Card */}
                <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-2">
                    <button
                        onClick={() => setShowExportModal(true)}
                        className="flex items-center space-x-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 group"
                    >
                        <FileBarChart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-black uppercase text-[10px] tracking-widest whitespace-nowrap">Generar Reporte Mensual</span>
                    </button>
                </div>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center space-x-6">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <AlertCircle className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-800">{stats.global.total}</p>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Reportes Totales</p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center space-x-6">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-800">{stats.global.resolved}</p>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Casos Resueltos</p>
                    </div>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2.5rem] flex items-center space-x-6 text-white overflow-hidden relative">
                    <div className="w-14 h-14 bg-white/10 text-amber-400 rounded-2xl flex items-center justify-center relative z-10">
                        <TrendingUp className="w-7 h-7" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-3xl font-black text-white">
                            {((stats.global.resolved / stats.global.total) * 100 || 0).toFixed(1)}%
                        </p>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Eficiencia</p>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Resumen Mensual (New Section) */}
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                <CalendarDays className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Desempeño Mensual</h3>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {stats.statsMensuales.map((mes) => (
                            <div key={mes.numero} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="font-black text-slate-800 text-lg">{mes.mes}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total: {mes.total} incidencias</p>
                                </div>
                                <div className="flex items-center space-x-6">
                                    <div className="text-center">
                                        <p className="text-xl font-black text-emerald-500">{mes.resolved}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Resueltos</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-black text-amber-500">{mes.active}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Activos</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Equipos con más fallos */}
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Equipos con Mayor Incidencia</h3>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {stats.equiposFallados.length > 0 ? stats.equiposFallados.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:shadow-lg transition-all">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-slate-400">
                                        0{idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-slate-800 truncate">{item.id}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{item.modelo} • {item.lab}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-rose-500">{item.count}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Fallas</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center py-10 text-slate-400 font-bold">Sin datos de fallas suficientes.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Historial de Mantenimiento - Oculto temporalmente
            <div className="grid grid-cols-1 gap-8">
                <button
                    onClick={() => setShowMaintModal(true)}
                    className="w-full text-left bg-slate-900 rounded-[3rem] p-10 text-white space-y-8 shadow-2xl shadow-slate-200 transition-all hover:ring-4 hover:ring-indigo-500/30 group"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/10 rounded-2xl text-amber-400 group-hover:scale-110 transition-transform">
                                <Filter className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Carga de Mantenimiento</h3>
                        </div>
                        <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-white group-hover:translate-x-2 transition-all" />
                    </div>

                    <p className="text-slate-400 font-medium">Intervenciones realizadas en equipos bajo tu responsabilidad o compartidos.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 group-hover:bg-white/10 transition-all">
                            <p className="text-3xl font-black text-amber-400">{stats.mantenimiento.preventivo}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Preventivos</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 group-hover:bg-white/10 transition-all">
                            <p className="text-3xl font-black text-rose-400">{stats.mantenimiento.corrective || 0}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Correctivos</p>
                        </div>
                    </div>
                </button>
            </div>
            */}

            {/* Maintenance Detail Modal */}
            <AnimatePresence>
                {showMaintModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMaintModal(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-10 space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Actividad de Mantenimiento</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowMaintModal(false)}
                                        className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"
                                    >
                                        <X className="w-6 h-6 text-slate-400" />
                                    </button>
                                </div>

                                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
                                    {stats.mantenimiento.activity.length > 0 ? stats.mantenimiento.activity.map((m, idx) => (
                                        <div key={idx} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start justify-between group hover:bg-white hover:shadow-xl transition-all">
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-3">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${m.tipo === 'PREVENTIVO' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                                        }`}>
                                                        {m.tipo}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-400">{m.fecha}</span>
                                                </div>
                                                <h4 className="font-black text-slate-800 text-lg">Equipo: {m.item}</h4>
                                                <p className="text-sm text-slate-500 line-clamp-2">{m.descripcion}</p>
                                                <div className="flex items-center space-x-2 pt-2">
                                                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                                        {m.encargado[0]}
                                                    </div>
                                                    <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{m.encargado}</span>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-white rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className="w-5 h-5 text-indigo-600" />
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-20 opacity-30">
                                            <Filter className="w-16 h-16 mx-auto mb-4" />
                                            <p className="text-xl font-black uppercase tracking-widest">Sin actividad reciente</p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowMaintModal(false)}
                                    className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all"
                                >
                                    Cerrar Detalles
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Monthly Export Modal */}
            <AnimatePresence>
                {showExportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowExportModal(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black text-slate-800">Seleccionar Mes</h3>
                                    <button
                                        onClick={() => setShowExportModal(false)}
                                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                                <p className="text-slate-500 font-medium">Elige el mes para generar el reporte estadístico de incidencias.</p>

                                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                                    {stats.statsMensuales.map((m) => (
                                        <button
                                            key={m.numero}
                                            onClick={() => setSelectedMonth(m.numero)}
                                            className={`p-4 rounded-2xl border transition-all text-left group ${selectedMonth === m.numero
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-white'
                                                }`}
                                        >
                                            <p className="font-black text-sm">{m.mes}</p>
                                            <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedMonth === m.numero ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                {m.total} reportes
                                            </p>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => generatePDFReport(selectedMonth)}
                                    className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center space-x-3"
                                >
                                    <FileText className="w-4 h-4" />
                                    <span>Generar Reporte PDF</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
};

export default EstadisticasDocente;


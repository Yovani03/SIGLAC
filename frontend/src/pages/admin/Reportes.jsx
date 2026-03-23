import React, { useState, useEffect } from 'react';
import {
    AlertCircle, BarChart3, PieChart, Activity,
    TrendingDown, ClipboardList, Download, Calendar,
    ChevronRight, ArrowUpRight, ArrowDownRight, RefreshCw,
    Shield, CheckCircle2, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/common/Button';

const Reportes = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        setRefreshing(true);
        try {
            const res = await api.get('/reportes/stats/');
            setData(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching reports stats:", error);
            setLoading(false);
        } finally {
            setRefreshing(false);
        }
    };

    const exportarInformePDF = () => {
        if (!data) return;

        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const primaryColor = [225, 29, 72]; // Rose-600
        const accentColor = [79, 70, 229];  // Indigo-600
        const secondaryColor = [100, 116, 139]; // Slate-500

        // Header Design
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 0, pageWidth, 60, 'F');

        // Logo and Title
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('SIGLAC', 15, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('SISTEMA DE GESTIÓN DE LABORATORIOS DE CÓMPUTO', 15, 32);

        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORME ESTADÍSTICO DE RENDIMIENTO', 15, 42);

        const reportDate = new Date().toLocaleString('es-MX');
        doc.setFont('helvetica', 'normal');
        doc.text(`Fecha de Emisión: ${reportDate}`, pageWidth - 15, 25, { align: 'right' });
        doc.text('Documento Oficial de Auditoría', pageWidth - 15, 32, { align: 'right' });

        // Section 1: Kpis (Quick Stats)
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('1. RESUMEN EJECUTIVO', 15, 75);
        doc.setDrawColor(226, 232, 240);
        doc.line(15, 78, pageWidth - 15, 78);

        const summaryStats = [
            ['Indicador', 'Valor Actual', 'Descripción'],
            ['Total de Fallos', `${data?.global_stats?.total || 0}`, 'Historial acumulado de reportes'],
            ['Uso de Laboratorios', `${data?.lab_usage?.[0]?.horarios_count || 0} hrs/sem`, `Máximo: ${data?.lab_usage?.[0]?.nombre || 'N/A'}`],
            ['Mantenimiento', `${data?.maintenance?.preventive || 0}`, 'Actividades preventivas realizadas'],
            ['Estatus de Atención', `${data?.global_stats?.resolved || 0} Resueltos / ${data?.global_stats?.pending || 0} Pendientes`, 'Eficiencia de soporte técnico']
        ];

        autoTable(doc, {
            startY: 85,
            head: [summaryStats[0]],
            body: summaryStats.slice(1),
            theme: 'striped',
            headStyles: { fillColor: accentColor, textColor: [255, 255, 255] },
            styles: { fontSize: 10, cellPadding: 5 }
        });

        // Section 2: Use of Labs
        let lastY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('2. USO DE LABORATORIOS (ACTIVIDADES)', 15, lastY);
        doc.line(15, lastY + 3, pageWidth - 15, lastY + 3);

        const labsBody = data?.lab_usage?.sort((a, b) => b.horarios_count - a.horarios_count).map((l, i) => [
            `#0${i + 1}`, l.nombre, `${l.horarios_count} Actividades`
        ]) || [];

        autoTable(doc, {
            startY: lastY + 8,
            head: [['Rango', 'Laboratorio', 'Nivel de Uso']],
            body: labsBody,
            theme: 'plain',
            headStyles: { textColor: secondaryColor, fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: { 0: { cellWidth: 20 }, 2: { fontStyle: 'bold', textColor: accentColor } }
        });

        // Section 3: Active Failures
        lastY = doc.lastAutoTable.finalY + 15;

        // Page break if needed
        if (lastY > 230) {
            doc.addPage();
            lastY = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('3. DETALLE DE FALLOS ACTUALES', 15, lastY);
        doc.line(15, lastY + 3, pageWidth - 15, lastY + 3);

        const fallosBody = data?.top_failures?.map(f => [f.fecha, f.name, f.lab, f.descripcion]) || [];

        if (fallosBody.length > 0) {
            autoTable(doc, {
                startY: lastY + 8,
                head: [['Fecha', 'Equipo', 'Laboratorio', 'Problema Reportado']],
                body: fallosBody,
                theme: 'grid',
                headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 4 },
                columnStyles: { 3: { cellWidth: 80 } }
            });
        } else {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(148, 163, 184);
            doc.text("No se detectan fallos críticos activos en el sistema.", 15, lastY + 12);
        }

        // Footer
        const finalPageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setDrawColor(226, 232, 240);
        doc.line(15, finalPageHeight - 20, pageWidth - 15, finalPageHeight - 20);
        doc.text('SIGLAC - Sistema de Gestión de Laboratorios • Reporte Automatizado', pageWidth / 2, finalPageHeight - 12, { align: 'center' });
        doc.text(`Página ${doc.internal.getNumberOfPages()}`, pageWidth - 15, finalPageHeight - 12, { align: 'right' });

        doc.save(`Informe_Estadistico_SIGLAC_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading && !data) return <LoadingSpinner />;

    const statsCards = [
        {
            title: 'Total de fallos',
            icon: TrendingDown,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            count: `${data?.global_stats?.total || 0} fallos`,
            detail: 'Reportes registrados'
        },
        {
            title: 'Uso de Labs',
            icon: Activity,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            count: `${data?.lab_usage?.[0]?.horarios_count || 0} hrs/sem`,
            detail: `Top: ${data?.lab_usage?.[0]?.nombre || 'S/D'}`
        },
        {
            title: 'Mant. Preventivo',
            icon: ClipboardList,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            count: `${data?.maintenance?.preventive || 0}`,
            detail: 'Actividades Realizadas'
        },
        {
            title: 'Reportes Globales',
            icon: BarChart3,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            count: `${data?.global_stats?.total || 0}`,
            detail: 'Historial completo'
        },
    ];

    // Active Failures List Component
    const ActiveFailuresList = ({ items }) => (
        <div className="space-y-3 w-full">
            {items.map((item, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start space-x-4 hover:shadow-md transition-all">
                    <div className="p-3 rounded-xl bg-rose-100/50 text-rose-500 shadow-inner flex-shrink-0">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                            <h4 className="text-sm font-black text-slate-800 tracking-tight truncate pr-2">{item.name}</h4>
                            <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100 whitespace-nowrap">{item.fecha}</span>
                        </div>
                        <p className="text-[11px] font-bold text-rose-600 mb-1 flex items-center">
                            <Activity className="w-3 h-3 mr-1" /> {item.lab}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium leading-snug line-clamp-2">{item.descripcion}</p>
                    </div>
                </div>
            ))}
        </div>
    );

    // Distribution Circles
    const DistributionList = ({ items }) => (
        <div className="grid grid-cols-2 gap-4 w-full">
            {items.map((item, i) => {
                const colors = {
                    'PENDIENTE': 'from-rose-500 to-rose-400',
                    'EN REVISION': 'from-amber-500 to-amber-400',
                    'EN MANTENIMIENTO': 'from-blue-500 to-blue-400',
                    'RESUELTO': 'from-emerald-500 to-emerald-400'
                };
                return (
                    <div key={i} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col justify-center items-center group hover:bg-white hover:shadow-xl hover:scale-105 transition-all transition-duration-300">
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${colors[item.estado] || 'from-slate-500 to-slate-400'} flex items-center justify-center text-white font-black text-sm mb-2 shadow-lg`}>
                            {item.count}
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">{item.estado}</span>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="space-y-10 animate-fadeIn pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-5">
                    <div className="p-4 bg-rose-600 rounded-[1.5rem] shadow-xl shadow-rose-200 text-white">
                        <BarChart3 className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Reportes Estadísticos</h2>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="text-slate-400 text-sm font-medium">Análisis profundo del rendimiento institucional</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={fetchData}
                        disabled={refreshing}
                        className={`p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all ${refreshing ? 'animate-spin' : 'active:scale-95'}`}
                    >
                        <RefreshCw className={`w-5 h-5 text-slate-400 ${refreshing ? 'text-rose-500' : ''}`} />
                    </button>
                    <Button
                        onClick={exportarInformePDF}
                        variant="primary"
                        icon={Download}
                    >
                        Exportar Informe
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 group relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 shadow-inner`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            {/* Etiqueta oculta temporalmente
                            <div className="bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center">
                                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                                <span className="text-[10px] font-black text-emerald-600 tracking-tighter">SIGLAC LIVE</span>
                            </div>
                            */}
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">{stat.title}</h4>
                            <p className="text-4xl font-black text-slate-800 tracking-tighter mb-1">{stat.count}</p>
                            <p className="text-[11px] font-black text-slate-500 uppercase flex items-center">
                                <ChevronRight className="w-3 h-3 mr-1 text-slate-300" /> {stat.detail}
                            </p>
                        </div>
                        {/* Decorative Gradient */}
                        <div className={`absolute -right-10 -bottom-10 w-32 h-32 ${stat.bg} opacity-20 group-hover:opacity-40 rounded-full blur-3xl transition-opacity duration-700`}></div>
                    </motion.div>
                ))}
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-1 max-w-4xl mx-auto w-full gap-8">
                {/* Active Failures List */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col"
                >
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center">
                                <TrendingDown className="w-6 h-6 mr-3 text-rose-500" /> Fallos Actuales
                            </h3>
                            <p className="text-slate-400 text-xs font-bold mt-1">Detalles de los equipos que están presentando incidencias en este momento.</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        {data?.top_failures?.length > 0 ? (
                            <ActiveFailuresList items={data.top_failures} />
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center opacity-20 italic">
                                <Monitor className="w-16 h-16 mb-4" />
                                <p className="font-black uppercase tracking-widest text-xs">Sin fallos registrados</p>
                            </div>
                        )}
                    </div>

                    {/* Botón oculto temporalmente
                    <button className="mt-10 pt-8 border-t border-slate-50 text-[10px] font-black text-rose-500 uppercase tracking-[0.25em] text-center hover:translate-y-[-2px] transition-all">
                        Ir al Módulo de Reportes
                    </button>
                    */}
                </motion.div>

                {/* Distribution Chart */}
                {/* Chart oculto temporalmente
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col"
                >
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center">
                                <PieChart className="w-6 h-6 mr-3 text-indigo-500" /> Distribución de Estados
                            </h3>
                            <p className="text-slate-400 text-xs font-bold mt-1">Estatus actual de todos los incidentes en el sistema.</p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        {data?.distribution?.length > 0 ? (
                            <DistributionList items={data.distribution} />
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center opacity-20 italic">
                                <AlertCircle className="w-16 h-16 mb-4" />
                                <p className="font-black uppercase tracking-widest text-xs">Sin datos de distribución</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 flex items-center justify-center space-x-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <div>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Resueltos</p>
                                <p className="text-lg font-black text-slate-800">{data?.global_stats?.resolved || 0}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-rose-50 rounded-[1.5rem] border border-rose-100 flex items-center justify-center space-x-3">
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                            <div>
                                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Pendientes</p>
                                <p className="text-lg font-black text-slate-800">{data?.global_stats?.pending || 0}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
                */}
            </div>

            {/* Entire Maintenance Section temporarily hidden
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-100"
            >
                <div className="relative z-10 grid grid-cols-1 gap-12 items-center">
                    {/* Sección oculta temporalmente
                    <div>
                        <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md">Resumen de Mantenimiento</div>
                        <h3 className="text-4xl font-black mb-6 leading-tight tracking-tighter">Eficiencia del <br /> Mantenimiento Preventivo</h3>
                        <p className="text-slate-300 text-base max-w-md mb-10 font-medium leading-relaxed">
                            Se han realizado <span className="text-emerald-400 font-black">{data?.maintenance?.preventive || 0}</span> actividades preventivas, logrando reducir los incidentes críticos en un 30%.
                        </p>
                        <div className="flex space-x-4">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preventivos</p>
                                <p className="text-3xl font-black">{data?.maintenance?.preventive || 0}</p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Correctivos</p>
                                <p className="text-3xl font-black">{data?.maintenance?.corrective || 0}</p>
                            </div>
                        </div>
                    </div>
                    * /}

                    <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-sm max-w-3xl mx-auto w-full">
                        <h4 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center">
                            <Activity className="w-4 h-4 mr-2 text-indigo-400" /> Ranking Uso de Labs
                        </h4>
                        <div className="space-y-4">
                            {data?.lab_usage?.sort((a, b) => b.horarios_count - a.horarios_count).map((lab, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-xs font-black text-slate-500">0{i + 1}</span>
                                        <span className="text-sm font-bold">{lab.nombre}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-black text-indigo-400">{lab.horarios_count}</span>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Actividades</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Decorative Blobs * /}
                <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
                <div className="absolute top-10 right-10 opacity-5 transform rotate-12">
                    <ClipboardList className="w-96 h-96" />
                </div>
            </motion.div>
            */}
        </div>
    );
};

export default Reportes;

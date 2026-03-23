import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    FileText, Search, User, Calendar, Clock,
    Filter, Download, ChevronRight, Activity,
    Shield, CheckCircle2, AlertCircle, RefreshCw,
    Printer, FileJson, FileSpreadsheet, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/common/Button';

const Bitacoras = () => {
    const [bitacoras, setBitacoras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    const fetchData = async () => {
        setRefreshing(true);
        try {
            const res = await api.get('/bitacoras/');
            const sortedData = res.data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            setBitacoras(sortedData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching logs:", error);
            setLoading(false);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredLogs = bitacoras.filter(log =>
        (log.usuario_nombre || `Usuario #${log.usuario}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.actividad_realizada || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.tipo_actividad || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
            shortDate: date.toLocaleDateString('es-MX'),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            full: date.toLocaleString('es-MX')
        };
    };

    const getLogTypeColor = (type) => {
        const t = (type || '').toLowerCase();
        if (t.includes('error') || t.includes('falla') || t.includes('elimin')) return 'bg-rose-50 text-rose-600 border-rose-100';
        if (t.includes('crea') || t.includes('nuevo')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (t.includes('edit') || t.includes('actualiz')) return 'bg-indigo-50 text-indigo-600 border-indigo-100';
        return 'bg-slate-50 text-slate-500 border-slate-100';
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Settings & Colors
        const primaryColor = [79, 70, 229]; // Indigo-600
        const secondaryColor = [100, 116, 139]; // Slate-500

        // --- Header Section ---
        // Header Rectangle
        doc.setFillColor(248, 250, 252); // Slate-50
        doc.rect(0, 0, pageWidth, 40, 'F');

        // Title
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('SIGLAC : REPORTE DE BITÁCORA', 15, 20);

        // Subtitle & Date
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('AUDITORÍA DE MOVIMIENTOS DEL SISTEMA', 15, 28);

        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        const now = new Date().toLocaleString('es-MX');
        doc.text(`Fecha de generación: ${now}`, pageWidth - 15, 20, { align: 'right' });
        doc.text(`Total de registros: ${filteredLogs.length}`, pageWidth - 15, 28, { align: 'right' });

        // --- Table Section ---
        const tableColumn = ["USUARIO", "ACTIVIDAD REALIZADA", "TIPO", "FECHA Y HORA"];
        const tableRows = filteredLogs.map(log => [
            log.usuario_nombre || `Usuario #${log.usuario}`,
            log.actividad_realizada,
            log.tipo_actividad || 'GENERAL',
            new Date(log.fecha).toLocaleString('es-MX')
        ]);

        autoTable(doc, {
            startY: 45,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'left'
            },
            bodyStyles: {
                fontSize: 9,
                cellPadding: 5
            },
            columnStyles: {
                0: { cellWidth: 35, fontStyle: 'bold' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 30 },
                3: { cellWidth: 40 }
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251]
            },
            margin: { top: 45 },
            didDrawPage: (data) => {
                // Footer
                doc.setFontSize(8);
                doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
                doc.text(
                    `Página ${data.pageNumber}`,
                    pageWidth / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: 'center' }
                );
            }
        });

        doc.save(`Bitacora_SIGLAC_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const generateSingleBitacoraPDF = (log) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const primaryColor = [79, 70, 229]; // Indigo-600
        const secondaryColor = [100, 116, 139]; // Slate-500

        // Header
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 0, pageWidth, 50, 'F');

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('SIGLAC', 15, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('SISTEMA DE GESTIÓN DE LABORATORIOS DE CÓMPUTO', 15, 32);

        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFontSize(8);
        doc.text('REPORTE INDIVIDUAL DE ACTIVIDAD', 15, 40);

        const reportDate = new Date(log.fecha).toLocaleString('es-MX');
        doc.text(`Fecha de Registro: ${reportDate}`, pageWidth - 15, 25, { align: 'right' });
        doc.text(`ID Registro: #${log.id_bitacora}`, pageWidth - 15, 32, { align: 'right' });

        // Content Body
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('DETALLES DE LA ACTIVIDAD', 15, 65);

        doc.setDrawColor(226, 232, 240);
        doc.line(15, 68, pageWidth - 15, 68);

        const details = [
            ['Responsable:', log.usuario_nombre || `Usuario #${log.usuario}`],
            ['ID Usuario:', log.usuario.toString()],
            ['Laboratorio:', log.laboratorio_nombre || 'General / No especificado'],
            ['Categoría:', log.tipo_actividad || 'General'],
            ['Fecha y Hora:', reportDate],
        ];

        autoTable(doc, {
            startY: 75,
            body: details,
            theme: 'plain',
            bodyStyles: {
                fontSize: 11,
                cellPadding: 5,
                textColor: [51, 65, 85],
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 40, textColor: [100, 116, 139] },
                1: { cellWidth: 'auto' }
            }
        });

        // Activity Description
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('DESCRIPCIÓN DE ACTIVIDAD', 15, finalY);

        doc.setDrawColor(226, 232, 240);
        doc.line(15, finalY + 3, pageWidth - 15, finalY + 3);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);

        const splitText = doc.splitTextToSize(log.actividad_realizada, pageWidth - 30);
        doc.text(splitText, 15, finalY + 12);

        // Signatures
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setDrawColor(203, 213, 225);

        doc.line(40, pageHeight - 40, 90, pageHeight - 40);
        doc.setFontSize(8);
        doc.text('FIRMA RESPONSABLE', 65, pageHeight - 35, { align: 'center' });

        doc.line(pageWidth - 90, pageHeight - 40, pageWidth - 40, pageHeight - 40);
        doc.text('SELLO INSTITUCIONAL', pageWidth - 65, pageHeight - 35, { align: 'center' });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('Este documento es un comprobante digital generado por el sistema SIGLAC.', pageWidth / 2, pageHeight - 15, { align: 'center' });

        doc.save(`Reporte_Bitacora_${log.id_bitacora}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const totalLogsToday = bitacoras.filter(l => new Date(l.fecha).toDateString() === new Date().toDateString()).length;
    const uniqueUsers = new Set(bitacoras.map(l => l.usuario)).size;

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-5">
                    <div className="p-4 bg-indigo-600 rounded-[1.5rem] shadow-xl shadow-indigo-200 text-white relative overflow-hidden group">
                        <FileText className="w-8 h-8 relative z-10" />
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Historial de Bitácoras</h2>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="text-slate-400 text-sm font-medium tracking-tight">Registro de auditoría institucional</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={fetchData}
                        disabled={refreshing}
                        className={`p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all ${refreshing ? 'animate-spin' : 'active:scale-95'}`}
                        title="Actualizar datos"
                    >
                        <RefreshCw className={`w-5 h-5 text-slate-400 ${refreshing ? 'text-indigo-500' : ''}`} />
                    </button>

                    {/* Botones ocultos temporalmente
                    <Button
                        onClick={generatePDF}
                        disabled={bitacoras.length === 0}
                        variant="danger"
                        icon={Printer}
                    >
                        Generar Informe PDF
                    </Button>

                    <Button
                        variant="primary"
                        icon={Download}
                    >
                        Excel
                    </Button>
                    */}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { label: 'Eventos Hoy', value: totalLogsToday, icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50', detail: 'Actividad del día' },
                    { label: 'Registros Totales', value: bitacoras.length, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50', detail: 'Historial almacenado' },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm flex items-center space-x-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
                            <stat.icon className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{stat.detail}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[2.8rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col relative">
                {/* Search & Filter Header */}
                <div className="p-10 border-b border-slate-100 bg-slate-50/20 flex flex-col lg:row-row justify-between items-center gap-6">
                    <div className="relative w-full lg:w-[500px] group">
                        <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filtrar por usuario, descripción de actividad o tipo de evento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-medium focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm"
                        />
                    </div>

                    {/* Filtros ocultos temporalmente 
                    <div className="flex items-center space-x-4">
                        <div className="h-10 w-[1px] bg-slate-200 hidden lg:block mx-2"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar por:</span>
                        <div className="flex space-x-2">
                            {['Todo', 'Errores', 'Cambios', 'Sesiones'].map((f) => (
                                <button key={f} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-all uppercase tracking-widest shrink-0">
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    */}
                </div>

                {/* Table Layout */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <LoadingSpinner />
                    ) : filteredLogs.length > 0 ? (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Responsable</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Actividad y Detalles</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Categoría</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Timestamp</th>
                                    <th className="px-10 py-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <AnimatePresence mode='popLayout'>
                                    {filteredLogs.map((log, index) => {
                                        const dt = formatDateTime(log.fecha);
                                        return (
                                            <motion.tr
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ delay: index * 0.02 }}
                                                key={log.id_bitacora}
                                                className="hover:bg-indigo-50/20 transition-all duration-300 group cursor-default"
                                            >
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center">
                                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mr-5 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                                                            <User className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-800 tracking-tight text-base leading-none mb-1.5">
                                                                {log.usuario_nombre || `Usuario #${log.usuario}`}
                                                            </p>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">ID Acceso: {log.usuario}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="max-w-md">
                                                        <p className="text-slate-600 font-bold tracking-tight text-[15px] leading-snug group-hover:text-slate-900 transition-colors">
                                                            {log.actividad_realizada}
                                                        </p>
                                                        {log.laboratorio_nombre && (
                                                            <div className="flex items-center space-x-2 mt-2">
                                                                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                                                                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">
                                                                    Área: {log.laboratorio_nombre}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getLogTypeColor(log.tipo_actividad)}`}>
                                                        {log.tipo_actividad || 'GENERAL'}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-800 font-black tracking-tighter text-lg flex items-center leading-none">
                                                            <Clock className="w-4 h-4 mr-2 text-slate-300" />
                                                            {dt.time}
                                                        </span>
                                                        <span className="text-slate-400 font-bold text-[10px] uppercase flex items-center mt-1.5 tracking-tight">
                                                            <Calendar className="w-3.5 h-3.5 mr-2 opacity-50" />
                                                            {dt.shortDate}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <button
                                                        onClick={() => generateSingleBitacoraPDF(log)}
                                                        className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm group/btn relative"
                                                        title="Descargar Reporte PDF"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                            Descargar PDF
                                                        </div>
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-40 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-8 shadow-inner border border-slate-100">
                                <Search className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="font-black text-slate-800 uppercase tracking-[0.3em] text-sm">Sin coincidencias</h3>
                            <p className="text-slate-400 text-xs mt-3 font-medium max-w-[250px] leading-relaxed">
                                No pudimos encontrar registros que coincidan con tu búsqueda. Prueba con términos más generales.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer / Pagination Placeholder */}
                <div className="p-10 border-t border-slate-100 bg-slate-50/40 flex flex-col md:flex-row justify-between items-center mt-auto gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em]">
                            Registros Totales • {bitacoras.length}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Bitacoras;

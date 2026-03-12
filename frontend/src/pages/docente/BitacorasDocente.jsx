import React, { useState, useEffect } from 'react';
import {
    ClipboardList, Plus, Search, Filter, Edit2, Trash2,
    Save, X, Check, AlertTriangle, Calendar, User,
    MapPin, Info, FileText
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BitacorasDocente = () => {
    const { user } = useAuth();
    const [bitacoras, setBitacoras] = useState([]);
    const [laboratorios, setLaboratorios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLab, setSelectedLab] = useState('all');

    // Form States
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        actividad_realizada: '',
        tipo_actividad: 'USO', // USO, LIMPIEZA, MANTENIMIENTO
        laboratorio: '',
        usuario: user?.id || ''
    });

    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bitacorasRes, labsRes] = await Promise.all([
                api.get('/bitacoras/'),
                api.get('/laboratorios/')
            ]);
            setBitacoras(bitacorasRes.data);
            setLaboratorios(labsRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
            toast.error("Error al cargar las bitácoras");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                usuario: user?.id // Ensure current user is the one recording
            };

            if (editingItem) {
                await api.put(`/bitacoras/${editingItem.id_bitacora}/`, payload);
                toast.success("Bitácora actualizada correctamente");
            } else {
                await api.post('/bitacoras/', payload);
                toast.success("Actividad registrada correctamente");
            }

            setShowForm(false);
            setEditingItem(null);
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Error saving bitacora", error);
            toast.error("Error al guardar la bitácora");
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await api.delete(`/bitacoras/${deleteConfirm.id}/`);
            toast.success("Registro eliminado correctamente");
            setDeleteConfirm(null);
            fetchData();
        } catch (error) {
            console.error("Error deleting item", error);
            toast.error("Error al eliminar el registro");
        }
    };

    const resetForm = () => {
        setFormData({
            actividad_realizada: '',
            tipo_actividad: 'USO',
            laboratorio: '',
            usuario: user?.id || ''
        });
    };

    const openEdit = (item) => {
        setEditingItem(item);
        setFormData({
            actividad_realizada: item.actividad_realizada,
            tipo_actividad: item.tipo_actividad,
            laboratorio: item.laboratorio,
            usuario: item.usuario
        });
        setShowForm(true);
    };

    const filteredItems = bitacoras.filter(item => {
        const matchesSearch =
            item.actividad_realizada?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.usuario_nombre?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesLab = selectedLab === 'all' || item.laboratorio === parseInt(selectedLab);

        return matchesSearch && matchesLab;
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

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
        doc.text('REPORTE INDIVIDUAL DE ACTIVIDAD (DOCENTE)', 15, 40);

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
        doc.text('FIRMA DOCENTE', 65, pageHeight - 35, { align: 'center' });

        doc.line(pageWidth - 90, pageHeight - 40, pageWidth - 40, pageHeight - 40);
        doc.text('SELLO LABORATORIO', pageWidth - 65, pageHeight - 35, { align: 'center' });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('Este documento es un comprobante digital generado por el sistema SIGLAC.', pageWidth / 2, pageHeight - 15, { align: 'center' });

        doc.save(`Reporte_Bitacora_Docente_${log.id_bitacora}.pdf`);
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">CARGANDO BITÁCORAS...</div>;

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bitácoras de Actividad</h1>
                    <p className="text-slate-500 font-medium text-sm">Registro digital de uso, limpieza y mantenimiento de laboratorios.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setEditingItem(null); setShowForm(true); }}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 font-black uppercase text-xs tracking-widest"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nueva Entrada</span>
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por actividad o usuario..."
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <select
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none appearance-none font-bold text-slate-700"
                        value={selectedLab}
                        onChange={(e) => setSelectedLab(e.target.value)}
                    >
                        <option value="all">Todos los Laboratorios</option>
                        {laboratorios.map(lab => (
                            <option key={lab.id_laboratorio} value={lab.id_laboratorio}>{lab.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Timeline View */}
            <div className="space-y-6">
                {filteredItems.map((item) => (
                    <div key={item.id_bitacora} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 hover:shadow-lg transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 left-0 bottom-0 w-2 ${item.tipo_actividad === 'LIMPIEZA' ? 'bg-emerald-400' :
                            item.tipo_actividad === 'USO' ? 'bg-indigo-400' : 'bg-amber-400'
                            }`} />

                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${item.tipo_actividad === 'LIMPIEZA' ? 'bg-emerald-50 text-emerald-600' :
                                        item.tipo_actividad === 'USO' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                                        }`}>
                                        {item.tipo_actividad}
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 flex items-center">
                                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                        {new Date(item.fecha).toLocaleString('es-MX', {
                                            day: '2-digit', month: 'long', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                    <span className="text-xs font-bold text-indigo-500 uppercase flex items-center">
                                        <MapPin className="w-3.5 h-3.5 mr-1.5" />
                                        {item.laboratorio_nombre}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 leading-relaxed italic">
                                    "{item.actividad_realizada}"
                                </h3>

                                <div className="flex items-center space-x-2 pt-2 border-t border-slate-50">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                        <User className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-tight">Registrado por: {item.usuario_nombre}</span>
                                </div>
                            </div>

                            <div className="flex md:flex-col justify-end space-y-2">
                                <button
                                    onClick={() => openEdit(item)}
                                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                                    title="Editar"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => generateSingleBitacoraPDF(item)}
                                    className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"
                                    title="Descargar PDF"
                                >
                                    <FileText className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm({ id: item.id_bitacora, name: `Registro del ${new Date(item.fecha).toLocaleDateString()}` })}
                                    className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <FileText className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-300">No hay registros de bitácora</h3>
                </div>
            )}

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl animate-scaleIn">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">{editingItem ? 'Editar Registro' : 'Nueva Actividad'}</h3>
                                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Documenta el uso o limpieza del laboratorio</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Actividad</label>
                                    <select
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                                        value={formData.tipo_actividad}
                                        onChange={(e) => setFormData({ ...formData, tipo_actividad: e.target.value })}
                                        required
                                    >
                                        <option value="USO">Uso Académico</option>
                                        <option value="LIMPIEZA">Limpieza / Sanitización</option>
                                        <option value="MANTENIMIENTO">Mantenimiento Preventivo</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Laboratorio</label>
                                    <select
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                                        value={formData.laboratorio}
                                        onChange={(e) => setFormData({ ...formData, laboratorio: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccione...</option>
                                        {laboratorios.map(lab => (
                                            <option key={lab.id_laboratorio} value={lab.id_laboratorio}>{lab.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detalle de Actividad</label>
                                <textarea
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700 h-40 resize-none"
                                    value={formData.actividad_realizada}
                                    onChange={(e) => setFormData({ ...formData, actividad_realizada: e.target.value })}
                                    placeholder="Describe brevemente lo realizado..."
                                    required
                                />
                            </div>

                            <button className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all flex items-center justify-center active:scale-95 mt-4">
                                <Save className="w-5 h-5 mr-3" />
                                {editingItem ? 'Actualizar Registro' : 'Registrar Activity'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn">
                        <div className="p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-10 h-10 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">¿Eliminar Registro?</h3>
                                <p className="text-slate-500 font-medium mt-2">Esta acción borrará definitivamente el registro de <span className="text-rose-600 font-bold">{deleteConfirm.name}</span>.</p>
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-100 transition-all"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BitacorasDocente;

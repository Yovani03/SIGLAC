import LoadingSpinner from '../../components/LoadingSpinner';
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Search, Monitor, Clock } from 'lucide-react';
import api from '../../services/api';

const Reservaciones = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [laboratorios, setLaboratorios] = useState([]);
    const [reservaciones, setReservaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedLab, setSelectedLab] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [formData, setFormData] = useState({
        materia_grupo: '',
        hora_inicio: '',
        hora_fin: ''
    });
    const [error, setError] = useState(null);

    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 to 20:00

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const labsRes = await api.get('/laboratorios/');
                setLaboratorios(labsRes.data);

                const resRes = await api.get(`/reservaciones/?fecha=${date}`);
                setReservaciones(resRes.data);
            } catch (err) {
                console.error("Error fetching reservations data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [date]);

    const handleCellClick = (lab, hour) => {
        setSelectedLab(lab);
        setSelectedTime(hour);
        const startTime = `${String(hour).padStart(2, '0')}:00`;
        const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
        setFormData({
            ...formData,
            hora_inicio: startTime,
            hora_fin: endTime
        });
        setError(null);
        setShowModal(true);
    };

    const handleCreateReservacion = async (e) => {
        e.preventDefault();
        try {
            await api.post('/reservaciones/', {
                fecha: date,
                hora_inicio: formData.hora_inicio,
                hora_fin: formData.hora_fin,
                materia_grupo: formData.materia_grupo,
                laboratorio: selectedLab.id_laboratorio
            });
            setShowModal(false);
            setFormData({ materia_grupo: '', hora_inicio: '', hora_fin: '' });
            // Refresh reservations
            const resRes = await api.get(`/reservaciones/?fecha=${date}`);
            setReservaciones(resRes.data);
        } catch (err) {
            setError(err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || "Error al crear reservación");
        }
    };

    const isReserved = (labId, hour) => {
        const timeStr = `${String(hour).padStart(2, '0')}:00:00`;
        return reservaciones.find(r =>
            r.laboratorio === labId &&
            r.estado === 'ACTIVA' &&
            timeStr >= r.hora_inicio &&
            timeStr < r.hora_fin
        );
    };

    if (loading && laboratorios.length === 0) return <LoadingSpinner />;

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Calendario de Reservaciones</h1>
                    <p className="text-slate-500 font-medium">Gestiona el uso de los laboratorios por fecha y hora.</p>
                </div>

                <div className="flex items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => {
                            const newDate = new Date(date);
                            newDate.setDate(newDate.getDate() - 1);
                            setDate(newDate.toISOString().split('T')[0]);
                        }}
                        className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="px-4 flex items-center space-x-2">
                        <CalendarIcon className="w-4 h-4 text-indigo-600" />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="font-bold text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer"
                        />
                    </div>
                    <button
                        onClick={() => {
                            const newDate = new Date(date);
                            newDate.setDate(newDate.getDate() + 1);
                            setDate(newDate.toISOString().split('T')[0]);
                        }}
                        className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Grid view */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="p-6 text-left bg-slate-50/50 min-w-[200px]">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">LABORATORIO / HORA</span>
                                </th>
                                {hours.map(h => (
                                    <th key={h} className="p-4 text-center min-w-[100px] border-l border-slate-100 bg-slate-50/30">
                                        <span className="text-sm font-bold text-slate-600">{h}:00</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {laboratorios.map(lab => (
                                <tr key={lab.id_laboratorio} className="border-b border-slate-100 group">
                                    <td className="p-6 bg-white sticky left-0 z-10 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.05)]">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mr-3">
                                                <Monitor className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 leading-none mb-1">{lab.nombre}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cap: {lab.capacidad}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {hours.map(h => {
                                        const reservation = isReserved(lab.id_laboratorio, h);
                                        return (
                                            <td key={h} className="p-1 border-l border-slate-100 min-w-[100px]">
                                                {reservation ? (
                                                    <div
                                                        className="h-16 w-full bg-indigo-600 text-white rounded-xl p-2 text-[10px] shadow-md shadow-indigo-100 flex flex-col justify-center overflow-hidden"
                                                        title={reservation.materia_grupo}
                                                    >
                                                        <span className="font-black truncate uppercase tracking-tighter">{reservation.materia_grupo}</span>
                                                        <span className="opacity-70 font-bold">{reservation.usuario_nombre}</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleCellClick(lab, h)}
                                                        className="h-16 w-full text-transparent hover:bg-slate-50 hover:text-indigo-400 flex items-center justify-center rounded-xl transition-all"
                                                    >
                                                        <Plus className="w-6 h-6" />
                                                    </button>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal para Crear Reservación */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl animate-slideUp overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Nueva Reservación</h3>
                                <p className="text-slate-500 text-sm font-medium">{selectedLab?.nombre} • {date}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateReservacion} className="p-8 space-y-6">
                            {error && (
                                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">MATERIA Y GRUPO</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. Programación Avanzada - 5A"
                                        value={formData.materia_grupo}
                                        onChange={(e) => setFormData({ ...formData, materia_grupo: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">HORA INICIO</label>
                                        <div className="relative">
                                            <Clock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="time"
                                                required
                                                value={formData.hora_inicio}
                                                onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3.5 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">HORA FIN</label>
                                        <div className="relative">
                                            <Clock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="time"
                                                required
                                                value={formData.hora_fin}
                                                onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3.5 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center space-x-2"
                            >
                                <Plus className="w-5 h-5" />
                                <span>CREAR RESERVACIÓN</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reservaciones;

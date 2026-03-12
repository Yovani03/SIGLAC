import React, { useState } from 'react';
import { User, Key, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Perfil = () => {
    const { user } = useAuth();
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [status, setStatus] = useState({ type: null, message: '' });
    const [loading, setLoading] = useState(false);

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            setStatus({ type: 'error', message: 'Las contraseñas nuevas no coinciden.' });
            return;
        }

        setLoading(true);
        try {
            await api.put('/usuarios/change-password/', {
                old_password: passwordData.old_password,
                new_password: passwordData.new_password
            });
            setStatus({ type: 'success', message: 'Contraseña actualizada con éxito.' });
            setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
        } catch (error) {
            console.error("Error updating password", error);
            setStatus({
                type: 'error',
                message: error.response?.data?.old_password?.[0] || 'Error al actualizar contraseña. Verifica tus datos.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Mi Perfil</h1>
                <p className="text-slate-500 font-medium">Administra la información de tu cuenta y seguridad.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* User Info Card */}
                <div className="md:col-span-5">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col items-center p-10">
                        <div className="w-32 h-32 bg-indigo-50 border-4 border-white shadow-xl rounded-[2.5rem] flex items-center justify-center text-indigo-600 mb-6 font-black text-4xl">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2 text-center">{user?.first_name} {user?.apellido_paterno}</h2>
                        <span className="px-6 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-8">DOCENTE</span>

                        <div className="w-full space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre de Usuario</p>
                                <p className="font-bold text-slate-700">{user?.username}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Correo Institucional</p>
                                <p className="font-bold text-slate-700">{user?.correo_institucional}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Password Update Card */}
                <div className="md:col-span-7">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
                        <div className="flex items-center space-x-3 text-indigo-600 font-black text-xs uppercase tracking-[0.2em] mb-8">
                            <Shield className="w-4 h-4" />
                            <span>Seguridad de la Cuenta</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-8">Cambiar Contraseña</h2>

                        {status.message && (
                            <div className={`p-4 rounded-2xl border mb-8 text-sm font-bold flex items-center ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
                                }`}>
                                {status.type === 'success' ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                                {status.message}
                            </div>
                        )}

                        <form onSubmit={handlePasswordUpdate} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña Actual</label>
                                <div className="relative">
                                    <Key className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.old_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3.5 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-100 my-8" />

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nueva Contraseña</label>
                                <div className="relative">
                                    <Key className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3.5 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirmar Nueva Contraseña</label>
                                <div className="relative">
                                    <Key className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3.5 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-lg shadow-slate-100 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                {loading ? "ACTUALIZANDO..." : "ACTUALIZAR CONTRASEÑA"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Perfil;

import React, { useState, useEffect } from 'react';
import { User, Key, Shield, CheckCircle, AlertCircle, Save, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const UserProfile = () => {
    const { user, updateUser } = useAuth();
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = useState(false);
    const [fullUserData, setFullUserData] = useState(null);
    const [loadingData, setLoadingData] = useState(true);
    const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'avatar1');
    const [updatingAvatar, setUpdatingAvatar] = useState(false);
    const [showAvatarMenu, setShowAvatarMenu] = useState(false);

    const avatars = [
        { id: 'avatar1', label: 'Avatar 1', color: 'bg-indigo-100 text-indigo-600' },
        { id: 'avatar2', label: 'Avatar 2', color: 'bg-emerald-100 text-emerald-600' },
        { id: 'avatar3', label: 'Avatar 3', color: 'bg-rose-100 text-rose-600' },
        { id: 'avatar4', label: 'Avatar 4', color: 'bg-amber-100 text-amber-600' },
        { id: 'avatar5', label: 'Avatar 5', color: 'bg-sky-100 text-sky-600' },
        { id: 'avatar6', label: 'Avatar 6', color: 'bg-violet-100 text-violet-600' },
        { id: 'avatar7', label: 'Avatar 7', color: 'bg-fuchsia-100 text-fuchsia-600' },
        { id: 'avatar8', label: 'Avatar 8', color: 'bg-orange-100 text-orange-600' },
    ];

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.id) return;
            try {
                const response = await api.get(`/usuarios/${user.id}/`);
                setFullUserData(response.data);
                if (response.data.avatar) {
                    setSelectedAvatar(response.data.avatar);
                }
            } catch (error) {
                console.error("Error fetching full user data", error);
                toast.error("No se pudo cargar la información completa.");
            } finally {
                setLoadingData(false);
            }
        };

        fetchUserData();
    }, [user?.id]);

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error('Las contraseñas nuevas no coinciden.');
            return;
        }

        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: 'Estas acciones son irreversibles. Si olvidas tu nueva contraseña, tendrás que contactar con el administrador del sistema para un restablecimiento manual.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#1e293b',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Sí, cambiar contraseña',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[2rem]',
                confirmButton: 'rounded-xl font-black px-6 py-3',
                cancelButton: 'rounded-xl font-black px-6 py-3'
            }
        });

        if (!result.isConfirmed) return;

        setLoading(true);
        try {
            await api.put('/usuarios/change-password/', {
                old_password: passwordData.old_password,
                new_password: passwordData.new_password
            });
            
            Swal.fire({
                title: '¡Éxito!',
                text: 'Contraseña actualizada correctamente.',
                icon: 'success',
                confirmButtonColor: '#4f46e5',
                customClass: { popup: 'rounded-[2rem]' }
            });

            setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
        } catch (error) {
            console.error("Error updating password", error);
            Swal.fire({
                title: 'Error',
                text: error.response?.data?.old_password?.[0] || 'Error al actualizar contraseña. Verifica tus datos.',
                icon: 'error',
                confirmButtonColor: '#f43f5e',
                customClass: { popup: 'rounded-[2rem]' }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpdate = async (avatarId) => {
        setSelectedAvatar(avatarId);
        setUpdatingAvatar(true);
        try {
            await api.patch(`/usuarios/${user.id}/`, {
                avatar: avatarId
            });
            updateUser({ avatar: avatarId });
            setFullUserData(prev => prev ? { ...prev, avatar: avatarId } : null);
            toast.success('Avatar actualizado');
            setShowAvatarMenu(false); // Close menu after selection
        } catch (error) {
            console.error("Error updating avatar", error);
            toast.error('No se pudo actualizar el avatar');
        } finally {
            setUpdatingAvatar(false);
        }
    };

    const getRoleColor = (rol) => {
        const r = rol?.toLowerCase() || '';
        if (r.includes('admin')) return 'bg-indigo-600';
        if (r.includes('tecnico') || r.includes('técnico')) return 'bg-blue-600';
        return 'bg-emerald-600'; // Docente
    };

    const getCurrentAvatarColor = () => {
        return avatars.find(a => a.id === selectedAvatar)?.color || 'bg-slate-100 text-slate-600';
    };

    if (loadingData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Mi Perfil</h1>
                    <p className="text-slate-500 font-medium">Gestiona tu identidad y seguridad en el sistema.</p>
                </div>
                <div className="px-6 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">En línea ahora</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Avatar & Info */}
                <div className="lg:col-span-5 space-y-8">
                    {/* Character Card */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <div className={`h-32 ${getRoleColor(fullUserData?.rol_detalle?.nombre_rol)} relative`}>
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                        </div>
                        <div className="px-10 pb-10 -mt-16 relative z-10 flex flex-col items-center">
                            <button 
                                onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                                className={`w-32 h-32 ${getCurrentAvatarColor()} border-8 border-white shadow-2xl rounded-[2.5rem] flex items-center justify-center mb-6 transition-all duration-500 transform hover:scale-110 active:scale-95 group relative cursor-pointer outline-none`}
                                title="Click para cambiar avatar"
                            >
                                <User className="w-16 h-16 transition-transform group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-[2.2rem] flex flex-col items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                    <ImageIcon className="w-8 h-8 text-white mb-1" />
                                    <span className="text-[8px] font-black text-white uppercase tracking-tighter">CAMBIAR</span>
                                </div>
                                {updatingAvatar && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-[2.2rem] flex items-center justify-center">
                                        <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </button>
                            
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight text-center">
                                {fullUserData?.nombre} {fullUserData?.apellido_paterno}
                            </h2>
                            <p className="text-slate-400 font-bold mb-6 italic">@{fullUserData?.username}</p>
                            
                            <span className={`px-8 py-2 ${getRoleColor(fullUserData?.rol_detalle?.nombre_rol)} text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 mb-10`}>
                                {fullUserData?.rol_detalle?.nombre_rol || 'USUARIO'}
                            </span>

                            <div className="w-full space-y-3">
                                <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 group hover:bg-white hover:border-indigo-100 transition-all">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center">
                                        <User className="w-3 h-3 mr-2" /> Nombre Completo
                                    </p>
                                    <p className="font-bold text-slate-700">
                                        {fullUserData?.nombre} {fullUserData?.apellido_paterno} {fullUserData?.apellido_materno}
                                    </p>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 group hover:bg-white hover:border-indigo-100 transition-all">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center">
                                        <Shield className="w-3 h-3 mr-2" /> Correo Institucional
                                    </p>
                                    <p className="font-bold text-slate-700">{fullUserData?.correo_institucional}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Avatar Picker - Conditional */}
                    {showAvatarMenu && (
                        <div className="bg-white rounded-[3rem] border-2 border-indigo-100 shadow-xl shadow-indigo-100/30 p-10 animate-slideUp">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-black text-slate-800 flex items-center">
                                    <ImageIcon className="w-5 h-5 mr-3 text-indigo-500" /> Selecciona tu Avatar
                                </h3>
                                <button 
                                    onClick={() => setShowAvatarMenu(false)}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                {avatars.map((av) => (
                                    <button
                                        key={av.id}
                                        onClick={() => handleAvatarUpdate(av.id)}
                                        className={`aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 relative group
                                            ${av.color} 
                                            ${selectedAvatar === av.id ? 'ring-4 ring-indigo-500 ring-offset-4 scale-90' : 'hover:scale-110 opacity-70 hover:opacity-100'}
                                        `}
                                    >
                                        <User className="w-6 h-6" />
                                        {selectedAvatar === av.id && (
                                            <div className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 shadow-lg">
                                                <CheckCircle className="w-3 h-3" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-8 text-center italic">Esto actualizará tu apariencia en el sistema</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Security */}
                <div className="lg:col-span-7">
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-lg shadow-slate-200/30 p-12 sticky top-24">
                        <div className="flex items-center space-x-3 text-indigo-600 font-black text-xs uppercase tracking-[0.2em] mb-10">
                            <Key className="w-5 h-5" />
                            <span>Centro de Seguridad</span>
                        </div>
                        
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-4">Actualizar Contraseña</h2>
                        <p className="text-slate-400 text-sm mb-10">Se recomienda usar una combinación de letras, números y caracteres especiales.</p>

                        <form onSubmit={handlePasswordUpdate} className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Contraseña Actual</label>
                                <div className="relative group">
                                    <Key className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••••••"
                                        value={passwordData.old_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] pl-14 pr-6 py-4.5 font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner shadow-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Nueva Contraseña</label>
                                    <div className="relative group">
                                        <Key className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.new_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] pl-14 pr-6 py-4.5 font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner shadow-slate-100"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Confirmar Nueva</label>
                                    <div className="relative group">
                                        <Key className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.confirm_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] pl-14 pr-6 py-4.5 font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner shadow-slate-100"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-slate-300 transition-all flex items-center justify-center space-x-3 group active:scale-[0.98] disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" />
                                            <span>GUARDAR CAMBIOS DE SEGURIDAD</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;

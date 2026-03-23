import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Users, UserPlus, X, CheckCircle, Search, Save, Key, XCircle } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/common/Button';
import api from '../../services/api';

const Usuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUser, setCurrentUser] = useState({
        username: '',
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        correo_institucional: '',
        telefono: '',
        rol: '',
        password: '',
        activo: true
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get('/usuarios/'),
                api.get('/roles/')
            ]);
            setUsuarios(usersRes.data);
            setRoles(rolesRes.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setIsEditing(true);
            setCurrentUser(user);
        } else {
            setIsEditing(false);
            setCurrentUser({
                username: '',
                nombre: '',
                apellido_paterno: '',
                apellido_materno: '',
                correo_institucional: '',
                telefono: '',
                rol: '',
                password: '',
                activo: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/usuarios/${currentUser.id}/`, currentUser);
            } else {
                await api.post('/usuarios/', currentUser);
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error("Error saving user:", error);
        }
    };

    const handleResetPassword = async (id) => {
        const { value: newPass } = await Swal.fire({
            title: 'Restablecer Contraseña',
            text: 'Ingrese la nueva contraseña:',
            input: 'text',
            showCancelButton: true,
            confirmButtonText: 'Restablecer',
            cancelButtonText: 'Cancelar',
        });
        if (newPass) {
            try {
                await api.post(`/usuarios/${id}/reset-password/`, { password: newPass });
                Swal.fire('Éxito', 'Contraseña restablecida correctamente.', 'success');
            } catch (error) {
                console.error("Error resetting password:", error);
                Swal.fire('Error', 'No se pudo restablecer la contraseña.', 'error');
            }
        }
    };

    const toggleStatus = async (user) => {
        try {
            await api.patch(`/usuarios/${user.id}/`, { activo: !user.activo });
            fetchData();
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: '¿Desea eliminar este usuario? Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/usuarios/${id}/`);
                Swal.fire('Eliminado', 'Usuario eliminado con éxito.', 'success');
                fetchData();
            } catch (error) {
                console.error("Error deleting user:", error);
                Swal.fire('Error', 'Error al eliminar el usuario.', 'error');
            }
        }
    };

    const filteredUsuarios = usuarios.filter(u => 
        u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.apellido_paterno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.correo_institucional?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && usuarios.length === 0) return <LoadingSpinner />;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                        <Users className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Módulo de Gestión de Usuarios</h2>
                        <p className="text-slate-500 text-sm">Registro, edición, eliminación y consulta de usuarios registrados.</p>
                    </div>
                </div>
                <Button
                    onClick={() => handleOpenModal()}
                    variant="primary"
                    icon={UserPlus}
                >
                    Nueva Cuenta
                </Button>
            </div>

            <div className="relative max-w-md">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-5 h-5" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar usuario por nombre, correo o ID..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px] md:min-w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre y Correo</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsuarios.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500 text-sm font-mono">{u.username}</td>
                                    <td className="px-6 py-4 text-slate-700">
                                        <div className="font-medium text-slate-800">{u.nombre} {u.apellido_paterno} {u.apellido_materno}</div>
                                        <div className="text-sm text-slate-500">{u.correo_institucional}</div>
                                        {u.telefono && <div className="text-[10px] text-slate-400">Tel: {u.telefono}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium border border-slate-200 uppercase">
                                            {u.nombre_rol || 'Estudiante'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.activo ? (
                                            <div className="flex items-center text-emerald-600 text-sm">
                                                <CheckCircle className="w-4 h-4 mr-1.5" /> Activo
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-rose-500 text-sm">
                                                <XCircle className="w-4 h-4 mr-1.5" /> Inactivo
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => handleResetPassword(u.id)}
                                                className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                                title="Restablecer Contraseña"
                                            >
                                                <Key className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal(u)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => toggleStatus(u)}
                                                className={`p-2 rounded-lg transition-all ${u.activo ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                title={u.activo ? "Desactivar" : "Activar"}
                                            >
                                                {u.activo ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
                                                title="Eliminar permanentemente"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredUsuarios.length === 0 && !loading && (
                <div className="py-20 text-center bg-white rounded-2xl border border-slate-100 border-dashed">
                    <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-300">No se encontraron usuarios</h3>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800">
                                {isEditing ? 'Editar Usuario' : 'Nueva Cuenta'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre(s)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        value={currentUser.nombre}
                                        onChange={(e) => setCurrentUser({ ...currentUser, nombre: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Apellido Paterno</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        value={currentUser.apellido_paterno}
                                        onChange={(e) => setCurrentUser({ ...currentUser, apellido_paterno: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Apellido Materno</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        value={currentUser.apellido_materno}
                                        onChange={(e) => setCurrentUser({ ...currentUser, apellido_materno: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teléfono / Celular</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        value={currentUser.telefono}
                                        onChange={(e) => setCurrentUser({ ...currentUser, telefono: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Correo Institucional</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                    value={currentUser.correo_institucional}
                                    onChange={(e) => setCurrentUser({ ...currentUser, correo_institucional: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        value={currentUser.username}
                                        onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-white"
                                        value={currentUser.rol}
                                        onChange={(e) => setCurrentUser({ ...currentUser, rol: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccionar Rol</option>
                                        {roles
                                            .filter(r => ['Administrador', 'Docente', 'Técnico', 'Tecnico'].includes(r.nombre_rol))
                                            .map(r => (
                                                <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                            {!isEditing && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contraseña</label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        value={currentUser.password}
                                        onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                                        required
                                    />
                                </div>
                            )}
                            <div className="pt-4 flex space-x-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-1"
                                >
                                    {isEditing ? 'Guardar Cambios' : 'Crear Cuenta'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Usuarios;

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const user = await login(username, password);
            // Redirect based on role
            if (user.rol === 'admin' || user.rol === 'administrador') navigate('/admin');
            else if (user.rol === 'encargado') navigate('/encargado');
            else if (user.rol === 'docente') navigate('/docente');
            else navigate('/dashboard');
        } catch (err) {
            setError('Credenciales inválidas o error de conexión');
        }
    };

    return (
        <div className="bg-[url('/bg-login2.jpg')] bg-cover bg-center min-h-screen flex items-center justify-center">
            <div className="min-h-screen flex items-center justify-center px-4 ">
            
                
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 ">
                    <div className="text-center mb-4">
                        
                        <img src="/logo_SIGLAC.png" alt="SIGLAC Logo"className="mx-auto w-64 mb-8"/>
                        <p className="text-gray-600 mt-2">Bienvenido</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Usuario</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Nombre de usuario"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña</label>
                            <input
                                type="password"
                                className="w-full mb-8 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="*****"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
                        >
                            Ingresar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;

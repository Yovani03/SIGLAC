import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [keepSession, setKeepSession] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(username, password);

      if (user.rol === 'admin' || user.rol === 'administrador') navigate('/admin');
      else if (user.rol === 'encargado') navigate('/encargado');
      else if (user.rol === 'docente') navigate('/docente');
      else navigate('/dashboard');
    } catch (err) {
      setError('Credenciales inválidas o error de conexión');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-white">

  <div className="squares-bg z-0">
    {[...Array(25)].map((_, i) => (
      <div
        key={i}
        className="square"
        style={{
          left: `${Math.random() * 100}%`,
          animationDuration: `${6 + Math.random() * 6}s`,
          animationDelay: `${Math.random() * 5}s`,
          width: `${8 + Math.random() * 10}px`,
          height: `${8 + Math.random() * 10}px`,
          opacity: Math.random() * 0.4,
        }}
      />
    ))}
  </div>

      <div className="absolute inset-0 grid-animated z-0"></div>

      <div className="absolute inset-0 glow-bg bg-gradient-to-br from-[#155dfc]/20 to-blue-400/20 blur-3xl"></div>

      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]"></div>


      <div className="relative z-10 flex w-[850px] h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-white">
        
        <div className="flex-1 bg-gradient-to-br from-[#155dfc] to-blue-400 text-white flex flex-col justify-center items-center text-center p-10">
          <h1 className="text-4xl font-bold mb-3">SIGLAC</h1>
          <p className="opacity-90 text-sm">
            Sistema Integral de Gestión de Laboratorios de Cómputo
          </p>
        </div>

        <div className="flex-1 p-10 flex flex-col justify-center">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">
            Bienvenido al Sistema
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Por favor, ingresa tus credenciales.
          </p>

          {error && (
            <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              className="peer w-full px-3 pt-6 pb-2 bg-transparent border-b-2 border-gray-300 
              focus:border-blue-500 focus:outline-none transition-all duration-300"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <label
              className="absolute left-3 top-4 text-gray-500 text-base transition-all duration-300
              peer-focus:top-1 
              peer-focus:text-sm 
              peer-focus:text-blue-500
              peer-valid:top-1 
              peer-valid:text-sm"
            >
              Usuario
            </label>

            <span
              className="absolute left-0 bottom-0 h-[2px] w-0 bg-blue-500 transition-all duration-300
              peer-focus:w-full"
            ></span>

            <span
              className="absolute inset-0 rounded-md opacity-0 peer-focus:opacity-100 
              bg-blue-500/10 blur-md transition-all duration-300 -z-10"
            ></span>
          </div>

          <div className="relative">
            <input
              type="password"
              className="peer w-full px-3 pt-6 pb-2 bg-transparent border-b-2 border-gray-300 
              focus:border-blue-500 focus:outline-none transition-all duration-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <label
              className="absolute left-3 top-4 text-gray-500 text-base transition-all duration-300
              peer-focus:top-1 
              peer-focus:text-sm 
              peer-focus:text-blue-500
              peer-valid:top-1 
              peer-valid:text-sm"
            >
              Contraseña
            </label>

            <span
              className="absolute left-0 bottom-0 h-[2px] w-0 bg-blue-500 transition-all duration-300
              peer-focus:w-full"
            ></span>

            <span
              className="absolute inset-0 rounded-md opacity-0 peer-focus:opacity-100 
              bg-blue-500/10 blur-md transition-all duration-300 -z-10"
            ></span>
          </div>

            <button
              type="submit"
              className="w-full bg-[#155dfc] hover:bg-blue-700 text-white font-semibold py-3 rounded-lg 
              transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              Acceder
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-6 text-center">
            Al ingresar, aceptas los Términos de Servicio y la Política de Privacidad de SIGLAC.
          </p>
          <p className="text-xs text-gray-400 mt-2 text-center">
            © 2025 SIGLAC - V1.1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
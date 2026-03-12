import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AdminDashboardLayout from './components/AdminDashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { Toaster } from 'react-hot-toast';

// Admin Pages
import Usuarios from './pages/admin/Usuarios';
import Laboratorios from './pages/admin/Laboratorios';
import Inventario from './pages/admin/Inventario';
import Horarios from './pages/admin/Horarios';
import Bitacoras from './pages/admin/Bitacoras';
import Reportes from './pages/admin/Reportes';

// Docente Pages
import DocenteDashboardLayout from './components/DocenteDashboardLayout';
import DocenteDashboard from './pages/docente/DocenteDashboard';
import Reservaciones from './pages/docente/Reservaciones';
import LaboratoriosDocente from './pages/docente/LaboratoriosDocente';
import ReportesDocente from './pages/docente/ReportesDocente';
import Perfil from './pages/docente/Perfil';
import EquiposDocente from './pages/docente/EquiposDocente';
import HorariosDocente from './pages/docente/HorariosDocente';
import BitacorasDocente from './pages/docente/BitacorasDocente';
import AsistenciaResponsabilidad from './pages/docente/AsistenciaResponsabilidad';
import EstadisticasDocente from './pages/docente/EstadisticasDocente';

// Técnico Pages
import TecnicoDashboardLayout from './components/TecnicoDashboardLayout';
import TecnicoDashboard from './pages/tecnico/TecnicoDashboard';
import EquiposTecnico from './pages/tecnico/EquiposTecnico';
import LaboratoriosTecnico from './pages/tecnico/LaboratoriosTecnico';
import ReportesTecnico from './pages/tecnico/ReportesTecnico';

const RoleBasedRedirect = () => {
  const { user } = useAuth();
  if (user?.rol?.toLowerCase() === 'admin' || user?.rol?.toLowerCase() === 'administrador') {
    return <Navigate to="/admin" replace />;
  }
  if (user?.rol?.toLowerCase() === 'docente' || user?.rol?.toLowerCase() === 'profesor') {
    return <Navigate to="/docente" replace />;
  }
  if (user?.rol?.toLowerCase() === 'tecnico' || user?.rol?.toLowerCase() === 'técnico') {
    return <Navigate to="/tecnico" replace />;
  }
  return <Layout><Dashboard /></Layout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<RoleBasedRedirect />} />

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'administrador']} />}>
              <Route path="/admin" element={<AdminDashboardLayout><Dashboard /></AdminDashboardLayout>} />
              <Route path="/admin/usuarios" element={<AdminDashboardLayout><Usuarios /></AdminDashboardLayout>} />
              <Route path="/admin/laboratorios" element={<AdminDashboardLayout><Laboratorios /></AdminDashboardLayout>} />
              <Route path="/admin/equipos" element={<AdminDashboardLayout><Inventario /></AdminDashboardLayout>} />
              <Route path="/admin/horarios" element={<AdminDashboardLayout><Horarios /></AdminDashboardLayout>} />
              <Route path="/admin/bitacoras" element={<AdminDashboardLayout><Bitacoras /></AdminDashboardLayout>} />
              <Route path="/admin/reportes" element={<AdminDashboardLayout><Reportes /></AdminDashboardLayout>} />
            </Route>

            {/* Docente Routes */}
            <Route element={<ProtectedRoute allowedRoles={['docente', 'profesor']} />}>
              <Route path="/docente" element={<DocenteDashboardLayout><DocenteDashboard /></DocenteDashboardLayout>} />
              {/* <Route path="/docente/reservaciones" element={<DocenteDashboardLayout><Reservaciones /></DocenteDashboardLayout>} /> */}
              {/* <Route path="/docente/laboratorios" element={<DocenteDashboardLayout><LaboratoriosDocente /></DocenteDashboardLayout>} /> */}
              <Route path="/docente/reportes" element={<DocenteDashboardLayout><ReportesDocente /></DocenteDashboardLayout>} />
              <Route path="/docente/perfil" element={<DocenteDashboardLayout><Perfil /></DocenteDashboardLayout>} />
              <Route path="/docente/equipos" element={<DocenteDashboardLayout><EquiposDocente /></DocenteDashboardLayout>} />
              <Route path="/docente/horarios" element={<DocenteDashboardLayout><HorariosDocente /></DocenteDashboardLayout>} />
              <Route path="/docente/bitacoras" element={<DocenteDashboardLayout><BitacorasDocente /></DocenteDashboardLayout>} />
              {/* <Route path="/docente/asistencia" element={<DocenteDashboardLayout><AsistenciaResponsabilidad /></DocenteDashboardLayout>} /> */}
              <Route path="/docente/estadisticas" element={<DocenteDashboardLayout><EstadisticasDocente /></DocenteDashboardLayout>} />
            </Route>

            {/* Técnico Routes */}
            <Route element={<ProtectedRoute allowedRoles={['tecnico', 'técnico']} />}>
              <Route path="/tecnico" element={<TecnicoDashboardLayout><TecnicoDashboard /></TecnicoDashboardLayout>} />
              <Route path="/tecnico/equipos" element={<TecnicoDashboardLayout><EquiposTecnico /></TecnicoDashboardLayout>} />
              <Route path="/tecnico/laboratorios" element={<TecnicoDashboardLayout><LaboratoriosTecnico /></TecnicoDashboardLayout>} />
              <Route path="/tecnico/reportes" element={<TecnicoDashboardLayout><ReportesTecnico /></TecnicoDashboardLayout>} />
            </Route>

            {/* Other roles specific routes (placeholders) */}
            <Route element={<ProtectedRoute allowedRoles={['encargado']} />}>
              <Route path="/encargado" element={<Layout><Dashboard /></Layout>} />
            </Route>
          </Route>

          <Route path="/unauthorized" element={<div className="p-10 text-center">No tienes permiso para ver esto.</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
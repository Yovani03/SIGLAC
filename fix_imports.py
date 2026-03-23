import os

files_to_update = [
    r"c:\SIGLAC\frontend\src\pages\tecnico\TecnicoDashboard.jsx",
    r"c:\SIGLAC\frontend\src\pages\tecnico\ReportesTecnico.jsx",
    r"c:\SIGLAC\frontend\src\pages\tecnico\LaboratoriosTecnico.jsx",
    r"c:\SIGLAC\frontend\src\pages\tecnico\EquiposTecnico.jsx",
    r"c:\SIGLAC\frontend\src\pages\docente\Reservaciones.jsx",
    r"c:\SIGLAC\frontend\src\pages\docente\LaboratoriosDocente.jsx",
    r"c:\SIGLAC\frontend\src\pages\docente\HorariosDocente.jsx",
    r"c:\SIGLAC\frontend\src\pages\docente\EquiposDocente.jsx",
    r"c:\SIGLAC\frontend\src\pages\docente\BitacorasDocente.jsx",
    r"c:\SIGLAC\frontend\src\pages\docente\AsistenciaResponsabilidad.jsx",
    r"c:\SIGLAC\frontend\src\pages\admin\Inventario.jsx",
    r"c:\SIGLAC\frontend\src\components\ProtectedRoute.jsx",
]

import_stm1 = "import LoadingSpinner from '../../components/LoadingSpinner';\n"
import_stm2 = "import LoadingSpinner from './LoadingSpinner';\n"

for filepath in files_to_update:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        import_stm = import_stm2 if "ProtectedRoute" in filepath else import_stm1
        
        # Check if import already exists
        if "import LoadingSpinner" not in content:
            # find first import React
            if "import React" in content:
                content = content.replace("import React", f"{import_stm}import React", 1)
            else:
                content = import_stm + content
                
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed import in {filepath}")

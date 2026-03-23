import os
import re

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
]

for filepath in files_to_update:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Simple single line replacements for the ones that match exactly "if (loading) return <div>..."
        # or "if (loading && ...) return <div>..."
        content = re.sub(
            r'if\s*\((loading|loading\s*&&[^)]+)\)\s*return\s*<div[^>]*>.*?</div>;',
            r'if (\1) return <LoadingSpinner />;',
            content,
            flags=re.IGNORECASE | re.DOTALL
        )

        import_stm = "import LoadingSpinner from '../../components/LoadingSpinner';\n"
        if "LoadingSpinner" not in content:
            # find first import
            content = content.replace("import React", f"{import_stm}import React", 1)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

# Protect Route
pr_path = r"c:\SIGLAC\frontend\src\components\ProtectedRoute.jsx"
if os.path.exists(pr_path):
    with open(pr_path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(
        r'if\s*\(loading\)\s*return\s*<div[^>]*>.*?</div>;',
        r'if (loading) return <LoadingSpinner />;',
        content,
        flags=re.IGNORECASE | re.DOTALL
    )
    if "LoadingSpinner" not in content:
        content = content.replace("import React", "import LoadingSpinner from './LoadingSpinner';\nimport React", 1)
    with open(pr_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {pr_path}")

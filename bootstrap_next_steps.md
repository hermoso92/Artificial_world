# Bootstrap Next Steps

Fecha: 2026-03-08T10:30:01.7908098+01:00

Camino recomendado: "python"

## Resumen
- Python disponible: True
- Node disponible: True
- npm disponible: True
- Ollama disponible: False
- Backend escuchando en 3001: True
- Frontend escuchando en 5173: False

## Siguiente paso recomendado
La parte mas verificable y defendible del repo sigue siendo el motor Python. Usalo primero para ensenar el proyecto sin mezclar demo web ni modulos externos.

## Caminos soportados
- `python`: instala lo minimo de Python y ejecuta `principal.py`
- `web`: instala dependencias web y delega en `scripts\iniciar_fullstack.ps1`
- `debug`: ejecuta una verificacion corta (`pruebas\test_core.py`)
- `verify`: ejecuta el runner `pruebas\run_tests_produccion.py`
- `ai`: revisa Ollama y deja listo el backend para `/api/ai/*`

## Notas
- `Artificial World` sigue teniendo como golden path el motor Python.
- La IA local es opcional y complementaria; no sustituye al motor Python.
- `DobackSoft` real queda como contrato futuro, no como integracion implementada aqui.

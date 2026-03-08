# Trailer DobackSoft — Fire Truck

Coloca aquí las imágenes del camión de bomberos (PNG o JPG). Orden alfabético.

## Generar todo desde cero

```powershell
pip install imageio imageio-ffmpeg numpy Pillow
python scripts/generar_placeholder_trailer.py
python scripts/crear_video_dobacksoft.py
```

El script usa **imageio-ffmpeg** (H.264) para que el video funcione en navegadores.

- `generar_placeholder_trailer.py` crea 4 imágenes placeholder con branding DobackSoft
- `crear_video_dobacksoft.py` genera el MP4 desde las imágenes

## Solo regenerar video (si ya tienes imágenes)

```powershell
pip install imageio imageio-ffmpeg numpy Pillow
python scripts/crear_video_dobacksoft.py
```

El video se genera en `assets/dobacksoft/fire_truck_trailer.mp4`.

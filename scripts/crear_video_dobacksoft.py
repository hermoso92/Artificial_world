#!/usr/bin/env python3
"""
Crea un video MP4 a partir de imágenes (trailer DobackSoft).
Compatible con navegadores (H.264). Usa imageio-ffmpeg.

Uso: pip install imageio imageio-ffmpeg && python scripts/crear_video_dobacksoft.py

Coloca las imágenes en assets/dobacksoft/trailer/ (orden alfabético).
"""
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main() -> int:
    parser = argparse.ArgumentParser(description="Crea video MP4 desde imágenes (H.264, compatible navegadores)")
    parser.add_argument(
        "--input", "-i",
        default=str(ROOT / "assets" / "dobacksoft" / "trailer"),
        help="Carpeta con imágenes PNG/JPG",
    )
    parser.add_argument(
        "--output", "-o",
        default=str(ROOT / "assets" / "dobacksoft" / "fire_truck_trailer.mp4"),
        help="Archivo de salida MP4",
    )
    parser.add_argument(
        "--duracion",
        type=float,
        default=2.0,
        help="Segundos por imagen (default: 2)",
    )
    args = parser.parse_args()

    try:
        import imageio.v3 as iio
        import numpy as np
    except ImportError:
        print("Instala: pip install imageio imageio-ffmpeg numpy")
        return 1

    input_dir = Path(args.input)
    output_path = Path(args.output)

    if not input_dir.is_dir():
        print(f"Error: carpeta no existe: {input_dir}")
        return 1

    images = sorted(
        list(input_dir.glob("*.png")) + list(input_dir.glob("*.jpg")) + list(input_dir.glob("*.jpeg")),
        key=lambda p: p.name.lower(),
    )

    if not images:
        print(f"Error: no hay imágenes en {input_dir}")
        return 1

    # Leer imágenes (glob ya excluye subcarpetas)
    frames = []
    for p in images:
        try:
            img = iio.imread(str(p))
            frames.append(img)
        except Exception as e:
            print(f"Advertencia: no se pudo leer {p}: {e}")

    if not frames:
        print("Error: no se pudo leer ninguna imagen")
        return 1

    # Redimensionar al tamaño de la primera para consistencia
    h, w = frames[0].shape[:2]
    resized = []
    for f in frames:
        if f.shape[:2] != (h, w):
            from PIL import Image
            pil = Image.fromarray(f)
            pil = pil.resize((w, h), Image.Resampling.LANCZOS)
            resized.append(np.array(pil))
        else:
            resized.append(f)
    frames = resized

    # fps = 1/duracion para que cada imagen dure 'duracion' segundos
    fps = 1.0 / args.duracion

    try:
        iio.imwrite(
            output_path,
            frames,
            fps=fps,
            codec="libx264",
            quality=8,
        )
    except Exception as e:
        print(f"Error al escribir video: {e}")
        return 1

    print(f"Video creado: {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

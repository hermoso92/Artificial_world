#!/usr/bin/env python3
"""
Genera imágenes placeholder para el trailer DobackSoft.
Crea 4 frames con el branding. Ejecutar antes de crear_video_dobacksoft.py.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TRAILER_DIR = ROOT / "assets" / "dobacksoft" / "trailer"
TRAILER_DIR.mkdir(parents=True, exist_ok=True)


def main() -> int:
    try:
        import cv2
        import numpy as np
    except ImportError:
        print("Instala: pip install opencv-python-headless numpy")
        return 1

    w, h = 1280, 720
    colors = [
        ((249, 115, 22), "DobackSoft"),      # naranja
        ((30, 30, 30), "Fire Simulator"),   # oscuro
        ((249, 115, 22), "Acceso por cupón"),
        ((30, 30, 30), "FUNDADOR1000"),
    ]
    filenames = [
        "01_dashcam_lateral.png",
        "02_dashcam_trasera.png",
        "03_giro_rotonda.png",
        "04_vista_aerea.png",
    ]

    for (bgr, text), fname in zip(colors, filenames):
        img = np.zeros((h, w, 3), dtype=np.uint8)
        img[:] = (bgr[2], bgr[1], bgr[0])  # BGR para OpenCV

        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 2.5
        thickness = 4
        (tw, th), _ = cv2.getTextSize(text, font, font_scale, thickness)
        x = (w - tw) // 2
        y = (h + th) // 2
        cv2.putText(img, text, (x, y), font, font_scale, (255, 255, 255), thickness)
        cv2.rectangle(img, (50, 50), (w - 50, h - 50), (200, 200, 200), 2)

        out_path = TRAILER_DIR / fname
        cv2.imwrite(str(out_path), img)
        print(f"Creado: {out_path}")

    print(f"\n{len(filenames)} imágenes en {TRAILER_DIR}")
    print("Ejecuta: python scripts/crear_video_dobacksoft.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())

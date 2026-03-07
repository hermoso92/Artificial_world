# artificial word — Enfoque Startup Millonaria

**Objetivo:** Llevar el proyecto a startup viable con verificación automática como base de confianza.

---

## 1. Verificación automática = confianza para clientes

### Qué hemos automatizado

| Verificación | Qué comprueba | Valor para startup |
|--------------|---------------|--------------------|
| **sintaxis** | Todos los .py compilan | Base técnica sólida |
| **tests_produccion** | 9 suites, 68+ tests | Motor, modo sombra, watchdog, persistencia |
| **modo_competencia** | Registro + integridad forense | Auditoría, compliance, defensa legal |
| **simulacion_completa** | 50 ticks + guardar + cargar + reporte | Flujo end-to-end funcional |
| **modo_sombra** | Activar, comando, desactivar | Control humano en el loop |

### Cómo ejecutarlo

```powershell
cd "c:\Users\Cosigein SL\Desktop\artificial word"
python pruebas/verificar_todo.py
```

**Salida:** `verificacion_completa.json` + consola. Exit 0 = todo OK.

### Integración CI

Cada push/PR ejecuta:
1. `run_tests_produccion.py` (9 suites)
2. `verificar_todo.py` (5 verificaciones)

**Mensaje para clientes B2B:** *"Cada cambio pasa 5 verificaciones automáticas. El producto está listo para demos."*

---

## 2. Enfoque por camino (según VISION_STARTUP_MILLONARIA.md)

### Camino B: IA para NPCs (recomendado)

**Pitch:** *"NPCs que recuerdan. Sin LLMs. Sin latencia."*

| Activo | Verificación |
|--------|--------------|
| Motor utility-based | test_core, test_motor_decide_accion |
| Relaciones (confianza/miedo) | test_interacciones_sociales |
| Memoria + percepción | test_core, simulacion_completa |
| Directivas + Modo Sombra | test_modo_sombra_completo, verificar_modo_sombra |
| Watchdog anomalías | test_watchdog_*, simulacion_completa |
| Persistencia | test_guardar_cargar, simulacion_completa |
| Modo Competencia | verificar_modo_competencia |

**Checklist antes de demo a estudio indie:**
- [ ] `verificar_todo.py` → 5/5 OK
- [ ] Trailer 60 s o doc 2 páginas listo
- [ ] Landing con artificialword.io (o similar)
- [ ] 3 emails con plantillas de outreach

### Camino A: Juego

**Pitch:** *"Cada criatura piensa, recuerda y elige."*

Mismas verificaciones + foco en:
- Grabación de gameplay (OBS)
- Cortar a 60 s con música
- Subir a YouTube/TikTok

### Camino C: Enterprise / Simulación

**Pitch:** *"Simula antes de decidir. 100% trazable."*

Mismas verificaciones + foco en:
- Modo Competencia como evidencia de auditoría
- Exportación PDF de métricas
- Caso de uso: equipo 7 personas, rasgos, dinámicas

---

## 3. Próximos pasos concretos

### Esta semana

1. **Ejecutar verificación antes de cada demo**
   ```powershell
   python pruebas/verificar_todo.py
   ```

2. **Elegir camino** (A, B o C) y ejecutar el primer paso del plan del finde en VISION_STARTUP_MILLONARIA.md

3. **Añadir verificación a README** para que cualquier colaborador sepa cómo validar

### Próximo mes

- Integrar `verificar_todo` en script de release (si hay .exe)
- Documentar "Cómo contribuir" con: tests + verificación
- Si Camino B: enviar 3 emails con doc de 2 páginas

---

## 4. Resumen ejecutivo

> **artificial word tiene verificación automática de todas las funcionalidades críticas.**
>
> 5 checks en <10 s. CI en cada push. Listo para demos B2B.

**Archivos clave:**
- `pruebas/verificar_todo.py` — script único de verificación
- `verificacion_completa.json` — reporte generado
- `VISION_STARTUP_MILLONARIA.md` — plan por camino
- `docs/ARTIFICIAL_WORD_ENGINE.md` — doc técnico 2 páginas (Camino B)

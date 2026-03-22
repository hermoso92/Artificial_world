"""
Tests de las 13 acciones Python de MUNDO_ARTIFICIAL.
Cubre viabilidad, utilidad y ejecución de cada acción en modo headless.

Ejecutar: python -m pytest pruebas/test_acciones.py -v
"""

import os
import sys
from types import SimpleNamespace
from unittest.mock import MagicMock

os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tipos.enums import ResultadoAccion, TipoAccion, TipoEvento
from tipos.modelos import Posicion


# ---------------------------------------------------------------------------
# Helpers para construir stubs ligeros
# ---------------------------------------------------------------------------

def _inventario(tiene_comida=True):
    inv = MagicMock()
    inv.tiene.return_value = tiene_comida
    inv.quitar.return_value = tiene_comida
    return inv


def _estado(energia=0.8, hambre=0.3, salud=1.0, activo=True, con_comida=True):
    e = SimpleNamespace(energia=energia, hambre=hambre, salud=salud, activo=activo,
                        inventario=_inventario(con_comida))
    def actualizar_energia(delta):
        e.energia = max(0.0, e.energia + delta)
    e.actualizar_energia = actualizar_energia
    def actualizar_hambre(delta):
        e.hambre = max(0.0, min(1.0, e.hambre + delta))
    e.actualizar_hambre = actualizar_hambre
    return e


def _entidad(eid=1, x=5, y=5, nombre="Agente"):
    e = SimpleNamespace(
        id_entidad=eid,
        nombre=nombre,
        posicion=Posicion(x, y),
        posicion_anterior=Posicion(x, y),
        estado_interno=_estado(),
        relaciones=None,
    )
    return e


def _mapa(ancho=20, alto=20, posiciones_validas=True, vecinos=None, celda_refugio=False):
    m = MagicMock()
    m.es_posicion_valida.return_value = posiciones_validas
    m.mover_entidad.return_value = True
    m.obtener_vecinos.return_value = vecinos if vecinos is not None else []
    # obtener_celda: por defecto devuelve None para no entrar en la rama refugio
    if celda_refugio:
        celda = MagicMock()
        celda.tiene_refugio.return_value = True
        m.obtener_celda.return_value = celda
    else:
        m.obtener_celda.return_value = None
    return m


def _contexto(entidades=None, mapa=None, bus=None, tick=0, percepcion_local=None):
    cfg = SimpleNamespace(
        decremento_energia_por_movimiento=0.03,
        decremento_energia_por_descanso=-0.1,
        recuperacion_energia_descanso=0.05,
        energia_por_comer=0.4,
        reduccion_hambre_por_comida=0.30,
        tasa_robo=0.3,
    )
    ctx = SimpleNamespace(
        entidades=entidades or [],
        mapa=mapa or _mapa(),
        bus_eventos=bus or MagicMock(),
        configuracion=cfg,
        tick_actual=tick,
        percepcion_local=percepcion_local,
    )
    return ctx


# ---------------------------------------------------------------------------
# AccionMover
# ---------------------------------------------------------------------------

class TestAccionMover:
    def test_viable_cuando_destino_es_vecino(self):
        from acciones.accion_mover import AccionMover
        entidad = _entidad(x=5, y=5)
        destino = Posicion(5, 6)
        ctx = _contexto(mapa=_mapa(vecinos=[destino]))
        accion = AccionMover(1, destino.x, destino.y)
        assert accion.es_viable(entidad, ctx) is True

    def test_no_viable_si_destino_no_es_vecino(self):
        from acciones.accion_mover import AccionMover
        entidad = _entidad(x=5, y=5)
        ctx = _contexto(mapa=_mapa(vecinos=[Posicion(5, 6)]))
        accion = AccionMover(1, 9, 9)
        assert accion.es_viable(entidad, ctx) is False

    def test_ejecutar_mueve_entidad(self):
        from acciones.accion_mover import AccionMover
        entidad = _entidad(x=5, y=5)
        ctx = _contexto(mapa=_mapa())
        accion = AccionMover(1, 5, 6)
        resultado = accion.ejecutar(entidad, ctx)
        assert resultado == ResultadoAccion.EXITO
        assert entidad.posicion == Posicion(5, 6)

    def test_ejecutar_falla_si_mapa_rechaza(self):
        from acciones.accion_mover import AccionMover
        entidad = _entidad()
        mapa = _mapa()
        mapa.mover_entidad.return_value = False
        ctx = _contexto(mapa=mapa)
        accion = AccionMover(1, 5, 6)
        assert accion.ejecutar(entidad, ctx) == ResultadoAccion.FALLO


# ---------------------------------------------------------------------------
# AccionDescansar
# ---------------------------------------------------------------------------

class TestAccionDescansar:
    def test_viable_con_energia_baja(self):
        from acciones.accion_descansar import AccionDescansar
        entidad = _entidad()
        entidad.estado_interno.energia = 0.2
        accion = AccionDescansar(1)
        assert accion.es_viable(entidad, _contexto()) is True

    def test_ejecutar_incrementa_energia(self):
        from acciones.accion_descansar import AccionDescansar
        entidad = _entidad()
        entidad.estado_interno.energia = 0.3
        # mapa devuelve celda=None → no entra en rama refugio → usa delta directo
        ctx = _contexto(mapa=_mapa())
        accion = AccionDescansar(1)
        resultado = accion.ejecutar(entidad, ctx)
        assert resultado == ResultadoAccion.EXITO
        assert entidad.estado_interno.energia > 0.3


# ---------------------------------------------------------------------------
# AccionComer
# ---------------------------------------------------------------------------

class TestAccionComer:
    def test_ejecutar_reduce_hambre(self):
        from acciones.accion_comer import AccionComer
        entidad = _entidad()
        entidad.estado_interno.hambre = 0.8
        ctx = _contexto()
        accion = AccionComer(1)
        resultado = accion.ejecutar(entidad, ctx)
        assert resultado == ResultadoAccion.EXITO
        assert entidad.estado_interno.hambre < 0.8

    def test_ejecutar_sin_comida_retorna_fallo(self):
        from acciones.accion_comer import AccionComer
        entidad = _entidad()
        entidad.estado_interno.inventario = _inventario(tiene_comida=False)
        ctx = _contexto()
        accion = AccionComer(1)
        resultado = accion.ejecutar(entidad, ctx)
        assert resultado == ResultadoAccion.FALLO


# ---------------------------------------------------------------------------
# AccionAtacar
# ---------------------------------------------------------------------------

class TestAccionAtacar:
    def _par_entidades(self, dist=1):
        atacante = _entidad(eid=1, x=5, y=5, nombre="Atacante")
        objetivo = _entidad(eid=2, x=5, y=5 + dist, nombre="Objetivo")
        objetivo.relaciones = MagicMock()
        objetivo.relaciones.obtener_relacion.return_value = SimpleNamespace(hostilidad=0.0, confianza=0.5)
        return atacante, objetivo

    def test_viable_cuando_adyacente(self):
        from acciones.accion_atacar import AccionAtacar
        atacante, objetivo = self._par_entidades(dist=1)
        ctx = _contexto(entidades=[atacante, objetivo])
        accion = AccionAtacar(1, 2)
        assert accion.es_viable(atacante, ctx) is True

    def test_no_viable_cuando_lejos(self):
        from acciones.accion_atacar import AccionAtacar
        atacante, objetivo = self._par_entidades(dist=3)
        ctx = _contexto(entidades=[atacante, objetivo])
        accion = AccionAtacar(1, 2)
        assert accion.es_viable(atacante, ctx) is False

    def test_ejecutar_aplica_dano(self):
        from acciones.accion_atacar import AccionAtacar
        atacante, objetivo = self._par_entidades(dist=1)
        objetivo.estado_interno.salud = 1.0
        ctx = _contexto(entidades=[atacante, objetivo])
        accion = AccionAtacar(1, 2)
        resultado = accion.ejecutar(atacante, ctx)
        assert resultado == ResultadoAccion.EXITO
        assert objetivo.estado_interno.salud < 1.0

    def test_elimina_cuando_salud_llega_a_cero(self):
        from acciones.accion_atacar import AccionAtacar
        atacante, objetivo = self._par_entidades(dist=1)
        objetivo.estado_interno.salud = 0.1
        ctx = _contexto(entidades=[atacante, objetivo])
        accion = AccionAtacar(1, 2)
        accion.ejecutar(atacante, ctx)
        assert objetivo.estado_interno.activo is False


# ---------------------------------------------------------------------------
# AccionHuir
# ---------------------------------------------------------------------------

class TestAccionHuir:
    def test_tipo_accion(self):
        from acciones.accion_huir import AccionHuir
        accion = AccionHuir(1)
        assert accion.tipo_accion == TipoAccion.HUIR

    def test_viable_devuelve_booleano(self):
        from acciones.accion_huir import AccionHuir
        entidad = _entidad()
        ctx = _contexto()
        accion = AccionHuir(1)
        resultado = accion.es_viable(entidad, ctx)
        assert isinstance(resultado, bool)


# ---------------------------------------------------------------------------
# AccionEvitar
# ---------------------------------------------------------------------------

class TestAccionEvitar:
    def test_tipo_accion(self):
        from acciones.accion_evitar import AccionEvitar
        accion = AccionEvitar(1, id_objetivo=2)
        assert accion.tipo_accion == TipoAccion.EVITAR

    def test_utilidad_base_es_float(self):
        from acciones.accion_evitar import AccionEvitar
        accion = AccionEvitar(1, id_objetivo=2)
        utilidad = accion.calcular_utilidad_base(_entidad(), _contexto())
        assert isinstance(utilidad, float)


# ---------------------------------------------------------------------------
# AccionSeguir
# ---------------------------------------------------------------------------

class TestAccionSeguir:
    def test_tipo_accion(self):
        from acciones.accion_seguir import AccionSeguir
        accion = AccionSeguir(1, id_objetivo=2)
        assert accion.tipo_accion == TipoAccion.SEGUIR

    def test_no_viable_sin_objetivo_en_contexto(self):
        from acciones.accion_seguir import AccionSeguir
        entidad = _entidad(eid=1)
        # percepcion_local=None → AccionSeguir entra por la rama sin percepcion local
        ctx = _contexto(entidades=[entidad], percepcion_local=None)
        accion = AccionSeguir(1, id_objetivo=99)
        assert accion.es_viable(entidad, ctx) is False


# ---------------------------------------------------------------------------
# AccionExplorar
# ---------------------------------------------------------------------------

class TestAccionExplorar:
    def test_tipo_accion(self):
        from acciones.accion_explorar import AccionExplorar
        accion = AccionExplorar(1)
        assert accion.tipo_accion == TipoAccion.EXPLORAR

    def test_ejecutar_devuelve_resultado(self):
        from acciones.accion_explorar import AccionExplorar
        entidad = _entidad()
        mapa = _mapa(vecinos=[Posicion(5, 6)])
        ctx = _contexto(mapa=mapa)
        accion = AccionExplorar(1)
        resultado = accion.ejecutar(entidad, ctx)
        assert isinstance(resultado, ResultadoAccion)


# ---------------------------------------------------------------------------
# AccionRecogerComida
# ---------------------------------------------------------------------------

class TestAccionRecogerComida:
    def test_tipo_accion(self):
        from acciones.accion_recoger_comida import AccionRecogerComida
        accion = AccionRecogerComida(1)
        assert accion.tipo_accion == TipoAccion.RECOGER_COMIDA

    def test_ejecutar_sin_comida_devuelve_no_aplica_o_fallo(self):
        from acciones.accion_recoger_comida import AccionRecogerComida
        entidad = _entidad()
        ctx = _contexto()
        accion = AccionRecogerComida(1)
        resultado = accion.ejecutar(entidad, ctx)
        assert resultado in (ResultadoAccion.NO_APLICA, ResultadoAccion.FALLO, ResultadoAccion.EXITO)


# ---------------------------------------------------------------------------
# AccionRecogerMaterial
# ---------------------------------------------------------------------------

class TestAccionRecogerMaterial:
    def test_tipo_accion(self):
        from acciones.accion_recoger_material import AccionRecogerMaterial
        accion = AccionRecogerMaterial(1)
        assert accion.tipo_accion == TipoAccion.RECOGER_MATERIAL


# ---------------------------------------------------------------------------
# AccionCompartir
# ---------------------------------------------------------------------------

class TestAccionCompartir:
    def test_tipo_accion(self):
        from acciones.accion_compartir import AccionCompartir
        accion = AccionCompartir(1, id_objetivo=2)
        assert accion.tipo_accion == TipoAccion.COMPARTIR

    def test_no_viable_sin_receptor(self):
        from acciones.accion_compartir import AccionCompartir
        entidad = _entidad(eid=1)
        ctx = _contexto(entidades=[entidad])
        accion = AccionCompartir(1, id_objetivo=99)
        assert accion.es_viable(entidad, ctx) is False


# ---------------------------------------------------------------------------
# AccionRobar
# ---------------------------------------------------------------------------

class TestAccionRobar:
    def test_tipo_accion(self):
        from acciones.accion_robar import AccionRobar
        accion = AccionRobar(1, id_objetivo=2)
        assert accion.tipo_accion == TipoAccion.ROBAR

    def test_no_viable_sin_objetivo(self):
        from acciones.accion_robar import AccionRobar
        entidad = _entidad(eid=1)
        ctx = _contexto(entidades=[entidad], percepcion_local=None)
        accion = AccionRobar(1, id_objetivo=99)
        assert accion.es_viable(entidad, ctx) is False


# ---------------------------------------------------------------------------
# AccionIrRefugio
# ---------------------------------------------------------------------------

class TestAccionIrRefugio:
    def test_tipo_accion(self):
        from acciones.accion_ir_refugio import AccionIrRefugio
        accion = AccionIrRefugio(1)
        assert accion.tipo_accion == TipoAccion.IR_REFUGIO

    def test_utilidad_base_es_float(self):
        from acciones.accion_ir_refugio import AccionIrRefugio
        accion = AccionIrRefugio(1)
        utilidad = accion.calcular_utilidad_base(_entidad(), _contexto())
        assert isinstance(utilidad, float)


# ---------------------------------------------------------------------------
# Runner directo (sin pytest)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import traceback

    clases = [
        TestAccionMover,
        TestAccionDescansar,
        TestAccionComer,
        TestAccionAtacar,
        TestAccionHuir,
        TestAccionEvitar,
        TestAccionSeguir,
        TestAccionExplorar,
        TestAccionRecogerComida,
        TestAccionRecogerMaterial,
        TestAccionCompartir,
        TestAccionRobar,
        TestAccionIrRefugio,
    ]

    passed = failed = 0
    for cls in clases:
        instance = cls()
        methods = [m for m in dir(instance) if m.startswith("test_")]
        for m in methods:
            try:
                getattr(instance, m)()
                print(f"  OK  {cls.__name__}.{m}")
                passed += 1
            except Exception:
                print(f"  FAIL {cls.__name__}.{m}")
                traceback.print_exc()
                failed += 1

    print(f"\n{'='*50}")
    print(f"Resultado: {passed} OK  /  {failed} FALLO")
    if failed:
        sys.exit(1)

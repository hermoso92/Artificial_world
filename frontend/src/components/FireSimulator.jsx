/**
 * Fire Simulator — Superficie de demo, entrenamiento y storytelling.
 * No es el núcleo del negocio. Ver docs/SUPERFICIE_JUEGO.md y docs/OWNERSHIP_ESTRATEGICO.md.
 * Mapa despacho, telemetría, paisajes 2D, incidentes, progresión por niveles.
 * Modo ruta real: cuando hay datos en sessionStorage (desde VisorRuta2D "Jugar esta ruta").
 */
import { useState, useEffect, useCallback } from 'react';
import { RouteReplayView } from './FireSimulator/RouteReplayView';
import { FireSimulatorGate } from './FireSimulator/FireSimulatorGate';
import { FireSimulatorLevelSelect } from './FireSimulator/FireSimulatorLevelSelect';
import { FireSimulatorGame } from './FireSimulator/FireSimulatorGame';
import { FireSimulatorWon, FireSimulatorFailed } from './FireSimulator/FireSimulatorResult';
import {
  ROUTE_CANVAS_W,
  ROUTE_CANVAS_H,
  LEVELS,
  ACCESS_CODE_REGEX,
  DEMO_CODE,
} from './FireSimulator/constants';

const ACCESS_CODE_KEY = 'dobacksoft_access_code';
const ROUTE_SESSION_KEY = 'dobacksoft_route_session';
const ROUTE_DATA_KEY = 'dobacksoft_route_data';

function isValidAccessCode(code) {
  if (!code) return false;
  const c = String(code).trim().toUpperCase();
  if (c === DEMO_CODE) return true;
  return ACCESS_CODE_REGEX.test(c);
}

export function FireSimulator({ onBack, accessCodeFromParent }) {
  const [routeData, setRouteData] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessInput, setAccessInput] = useState('');
  const [accessError, setAccessError] = useState(null);
  const [level, setLevel] = useState(1);
  const [levelSelect, setLevelSelect] = useState(true);
  const [won, setWon] = useState(false);
  const [failed, setFailed] = useState(null);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' && sessionStorage.getItem(ROUTE_DATA_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.route?.length) setRouteData(data);
      }
    } catch (_) { /* ignore */ }
  }, []);

  const clearRouteAndBack = useCallback(() => {
    try {
      sessionStorage.removeItem(ROUTE_SESSION_KEY);
      sessionStorage.removeItem(ROUTE_DATA_KEY);
    } catch (_) { /* ignore */ }
    setRouteData(null);
    onBack?.();
  }, [onBack]);

  const checkAccess = useCallback(() => {
    const fromParent = accessCodeFromParent && isValidAccessCode(accessCodeFromParent);
    const fromStorage = typeof window !== 'undefined' && isValidAccessCode(localStorage.getItem(ACCESS_CODE_KEY));
    return fromParent || fromStorage;
  }, [accessCodeFromParent]);

  useEffect(() => {
    if (accessCodeFromParent && isValidAccessCode(accessCodeFromParent)) {
      localStorage.setItem(ACCESS_CODE_KEY, accessCodeFromParent.trim().toUpperCase());
      setHasAccess(true);
    } else if (checkAccess()) {
      setHasAccess(true);
    }
  }, [accessCodeFromParent, checkAccess]);

  const handleUnlock = () => {
    setAccessError(null);
    const code = accessInput.trim().toUpperCase();
    if (!isValidAccessCode(code)) {
      setAccessError('Formato: DOBACK-XXXX-XXXX o código DEMO');
      return;
    }
    localStorage.setItem(ACCESS_CODE_KEY, code === DEMO_CODE ? 'DOBACK-DEMO-PLAY' : code);
    setHasAccess(true);
    setAccessInput('');
  };

  const initLevel = useCallback((lvl) => {
    setLevel(lvl);
    setLevelSelect(false);
    setWon(false);
    setFailed(null);
  }, []);

  const resetGame = useCallback(() => {
    initLevel(level);
  }, [initLevel, level]);

  if (routeData?.route?.length) {
    return (
      <RouteReplayView
        routeData={routeData}
        onBack={clearRouteAndBack}
        canvasW={ROUTE_CANVAS_W}
        canvasH={ROUTE_CANVAS_H}
      />
    );
  }

  if (!hasAccess) {
    return (
      <FireSimulatorGate
        onBack={onBack}
        accessInput={accessInput}
        setAccessInput={setAccessInput}
        handleUnlock={handleUnlock}
        accessError={accessError}
      />
    );
  }

  if (levelSelect) {
    return (
      <FireSimulatorLevelSelect
        onBack={onBack}
        initLevel={initLevel}
      />
    );
  }

  if (won) {
    return (
      <FireSimulatorWon
        onBack={onBack}
        level={level}
        resetGame={resetGame}
        initLevel={initLevel}
        setLevelSelect={setLevelSelect}
      />
    );
  }

  if (failed) {
    return (
      <FireSimulatorFailed
        onBack={onBack}
        failed={failed}
        resetGame={resetGame}
      />
    );
  }

  return (
    <FireSimulatorGame
      level={level}
      setLevelSelect={setLevelSelect}
      setWon={setWon}
      setFailed={setFailed}
      onBack={onBack}
    />
  );
}

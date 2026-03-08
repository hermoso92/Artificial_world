/** FireSimulatorGate — Pantalla de acceso con código */
export function FireSimulatorGate({ onBack, accessInput, setAccessInput, handleUnlock, accessError }) {
  return (
    <div className="firesim">
      <div className="firesim-gate">
        <button className="back-btn" onClick={onBack}>← DobackSoft</button>
        <h2 className="firesim-gate-title">🚒 Fire Simulator</h2>
        <p className="firesim-gate-desc">
          Introduce <strong>DEMO</strong> para jugar directamente, o tu código DOBACK-XXXX-XXXX.
        </p>
        <div className="firesim-gate-row">
          <input
            type="text"
            className="firesim-gate-input"
            placeholder="DEMO"
            value={accessInput}
            onChange={(e) => setAccessInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
          />
          <button className="firesim-gate-btn" onClick={handleUnlock}>
            Jugar
          </button>
        </div>
        {accessError && <p className="firesim-gate-error">{accessError}</p>}
      </div>
    </div>
  );
}

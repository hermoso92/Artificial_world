/**
 * Genetic Assembler Panel - design life forms with trait sliders.
 */
import { useState, useEffect } from 'react';

const TRAITS = [
  { key: 'movementSpeed', label: 'Movement Speed', min: 0.1, max: 2, step: 0.1 },
  { key: 'metabolism', label: 'Metabolism', min: 0.1, max: 2, step: 0.1 },
  { key: 'attack', label: 'Attack', min: 0, max: 2, step: 0.1 },
  { key: 'defense', label: 'Defense', min: 0, max: 2, step: 0.1 },
  { key: 'gatheringRate', label: 'Gathering Rate', min: 0.1, max: 2, step: 0.1 },
  { key: 'reproductionThreshold', label: 'Reproduction Threshold', min: 0.5, max: 1, step: 0.05 },
];

const DEFAULT_TRAITS = {
  movementSpeed: 1,
  metabolism: 0.5,
  attack: 0,
  defense: 0,
  gatheringRate: 1,
  reproductionThreshold: 0.8,
};

export function GeneticAssemblerPanel({ blueprints, onCreateBlueprint, onRelease, onQuickStart, loading, agentCount = 0 }) {
  const [name, setName] = useState('New Species');
  const [traits, setTraits] = useState({ ...DEFAULT_TRAITS });
  const [selectedBlueprintId, setSelectedBlueprintId] = useState(null);
  const [releaseCount, setReleaseCount] = useState(5);

  useEffect(() => {
    if (blueprints?.length && !selectedBlueprintId) {
      setSelectedBlueprintId(blueprints[0]?.id ?? null);
    }
  }, [blueprints, selectedBlueprintId]);

  const handleTraitChange = (key, value) => {
    setTraits((t) => ({ ...t, [key]: parseFloat(value) }));
  };

  const handleCreate = () => {
    onCreateBlueprint?.(name, traits);
    setSelectedBlueprintId(null);
  };

  const handleRelease = () => {
    const bpId = selectedBlueprintId ?? blueprints?.[0]?.id;
    if (bpId) onRelease?.(bpId, releaseCount);
  };

  const needsQuickStart = agentCount === 0;
  const canQuickStart = !!onQuickStart;

  return (
    <div className="panel genetic-assembler-panel">
      <h3>Genetic Assembler</h3>
      <p className="panel-hint">Design life. Watch it survive.</p>

      {needsQuickStart && canQuickStart && (
        <div className="panel-actions" style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onQuickStart}
            disabled={loading}
          >
            Empezar rápido — crear especie y soltar 5 agentes
          </button>
        </div>
      )}

      <div className="trait-editor">
        <label className="trait-label">Species Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="trait-input"
          placeholder="New Species"
        />

        {TRAITS.map(({ key, label, min, max, step }) => (
          <div key={key} className="trait-row">
            <label className="trait-label">{label}</label>
            <div className="trait-slider-wrap">
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={traits[key] ?? DEFAULT_TRAITS[key]}
                onChange={(e) => handleTraitChange(key, e.target.value)}
                className="trait-slider"
              />
              <span className="trait-value">{(traits[key] ?? DEFAULT_TRAITS[key]).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="panel-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleCreate}
          disabled={loading}
        >
          Create Blueprint
        </button>
      </div>

      {blueprints?.length > 0 && (
        <>
          <h4 className="panel-subtitle">Release into Refuge</h4>
          <select
            value={selectedBlueprintId ?? ''}
            onChange={(e) => setSelectedBlueprintId(Number(e.target.value) || null)}
            className="trait-select"
          >
            <option value="">Select blueprint</option>
            {blueprints.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <div className="release-row">
            <input
              type="number"
              min={1}
              max={50}
              value={releaseCount}
              onChange={(e) => setReleaseCount(Number(e.target.value) || 5)}
              className="trait-input small"
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRelease}
              disabled={loading || !(selectedBlueprintId ?? blueprints[0]?.id)}
            >
              Release
            </button>
          </div>
        </>
      )}
    </div>
  );
}

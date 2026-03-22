/**
 * Agent tab content for HeroRefugePanel.
 */
import { AgentBubble } from './AgentBubble';
import { inputStyle, btnStyle } from './constants';

export function HeroRefugeAgentView({ hero, agentAnswer, query, setQuery, handleQuery, loading, colors }) {
  return (
    <div>
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px', marginBottom: '8px', fontSize: '11px' }}>
        <div style={{ color: colors.accent, fontWeight: 700, marginBottom: '4px' }}>{hero.agent?.name}</div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px' }}>
          Conversaciones: {hero.agent?.interactions ?? 0} · Recuerdos: {hero.agent?.memoryCount ?? 0}
        </div>
        {hero.agent?.recentMemory?.slice(0, 2).map((m, i) => (
          <div key={i} style={{ marginTop: '3px', fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>› {m.event}</div>
        ))}
      </div>
      <AgentBubble message={agentAnswer} mode={hero.activeMode} />
      <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
        <input placeholder="Habla con tu compañero..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleQuery()} style={{ ...inputStyle, flex: 1 }} />
        <button onClick={handleQuery} disabled={loading || !query.trim()} style={btnStyle(colors.accent)}>➤</button>
      </div>
      <div style={{ marginTop: '10px' }}>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>PERSONALIDAD</div>
        {Object.entries(hero.agent?.traits ?? {}).map(([trait, val]) => (
          <div key={trait} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', width: '90px' }}>{trait}</span>
            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
              <div style={{ width: `${(val * 100).toFixed(0)}%`, height: '100%', background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}88)`, borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', width: '28px', textAlign: 'right' }}>{(val * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

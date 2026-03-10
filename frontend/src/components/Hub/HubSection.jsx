/**
 * HubSection — Hierarchical section (Core, Control, Experiences, Lab) with cards.
 */
import { HubCard } from './HubCard';

export function HubSection({ sectionTitle, pillars, onNavigate }) {
  if (!pillars || pillars.length === 0) return null;

  return (
    <section className="hub-section">
      <h2 className="hub-section-title">{sectionTitle}</h2>
      <div className="hub-section-grid">
        {pillars.map((pillar) => (
          <HubCard key={pillar.id} pillar={pillar} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
}

/**
 * Civilization seeds for the live-civilization thesis.
 * Small, explicit presets only; no procedural sprawl.
 */

export const CIVILIZATION_SEEDS = [
  {
    id: 'frontier-tribe',
    label: 'Tribu de frontera',
    archetype: 'survivalist',
    values: ['adaptacion', 'cooperacion', 'resistencia'],
    tensions: ['clima_hostil', 'escasez', 'frontera_inestable'],
    visualTone2d: 'perimetros compactos y rutas cortas',
    visualTone3d: 'madera, humo, guardias y expansion prudente',
    defaultBiomes: ['forest', 'plains'],
    defaultRefugeName: 'Refugio de frontera',
    defaultCommunityName: 'Clan de la Frontera',
    heroArchetype: 'explorador fundador',
    conflictStyle: 'defensa y supervivencia',
  },
  {
    id: 'technocrat-refuge',
    label: 'Refugio tecnocrata',
    archetype: 'planner',
    values: ['orden', 'eficiencia', 'conocimiento'],
    tensions: ['rigidez', 'dependencia_energetica', 'elitismo'],
    visualTone2d: 'nodos optimizados y recursos priorizados',
    visualTone3d: 'metal, energia y arquitectura funcional',
    defaultBiomes: ['quantum', 'plains'],
    defaultRefugeName: 'Nodo central',
    defaultCommunityName: 'Circulo Tecnocrata',
    heroArchetype: 'arquitecto estratega',
    conflictStyle: 'control y optimizacion',
  },
  {
    id: 'spiritual-community',
    label: 'Comunidad espiritual',
    archetype: 'ritual',
    values: ['fe', 'vinculo', 'memoria'],
    tensions: ['dogma', 'miedo_al_cambio', 'presagios'],
    visualTone2d: 'centro ritual y periferia protectora',
    visualTone3d: 'velas, piedra, simbolos y presencia solemne',
    defaultBiomes: ['forest', 'tundra'],
    defaultRefugeName: 'Santuario inicial',
    defaultCommunityName: 'Hermandad del Santuario',
    heroArchetype: 'guia visionario',
    conflictStyle: 'ritual y cohesion',
  },
  {
    id: 'warrior-kingdom',
    label: 'Reino guerrero',
    archetype: 'militant',
    values: ['honor', 'fuerza', 'jerarquia'],
    tensions: ['expansion', 'rivalidad', 'coste_humano'],
    visualTone2d: 'fronteras fuertes y rutas de conflicto',
    visualTone3d: 'murallas, estandartes y figuras heroicas',
    defaultBiomes: ['plains', 'volcanic'],
    defaultRefugeName: 'Bastion fundador',
    defaultCommunityName: 'Casa del Bastion',
    heroArchetype: 'campeon fundador',
    conflictStyle: 'guerra y conquista',
  },
  {
    id: 'merchant-city',
    label: 'Ciudad comerciante',
    archetype: 'mercantile',
    values: ['intercambio', 'movilidad', 'acuerdos'],
    tensions: ['desigualdad', 'corrupcion', 'dependencia_de_rutas'],
    visualTone2d: 'rutas largas, nodos de intercambio e influencia',
    visualTone3d: 'puertos, plazas, mercados y riqueza visible',
    defaultBiomes: ['ocean', 'plains'],
    defaultRefugeName: 'Puerto de origen',
    defaultCommunityName: 'Liga Mercante',
    heroArchetype: 'negociador fundador',
    conflictStyle: 'diplomacia y competencia',
  },
  {
    id: 'paranoid-colony',
    label: 'Colonia paranoica',
    archetype: 'fortress',
    values: ['seguridad', 'vigilancia', 'autarquia'],
    tensions: ['sospecha', 'aislamiento', 'fractura_interna'],
    visualTone2d: 'perimetros, vigilancia y zonas restringidas',
    visualTone3d: 'torres, focos y puertas cerradas',
    defaultBiomes: ['desert', 'tundra'],
    defaultRefugeName: 'Sector sellado',
    defaultCommunityName: 'Colonia Vigilante',
    heroArchetype: 'centinela fundador',
    conflictStyle: 'defensa y sospecha',
  },
  {
    id: 'decadent-empire',
    label: 'Imperio decadente',
    archetype: 'legacy',
    values: ['linaje', 'poder', 'apariencia'],
    tensions: ['declive', 'intriga', 'sobrecoste'],
    visualTone2d: 'territorios amplios con cohesion debilitada',
    visualTone3d: 'ruinas nobles, monumentos y exceso visible',
    defaultBiomes: ['desert', 'nebula'],
    defaultRefugeName: 'Palacio gastado',
    defaultCommunityName: 'Casa Imperial',
    heroArchetype: 'heredero ambiguo',
    conflictStyle: 'intriga y decadencia',
  },
  {
    id: 'tryndamere-champion',
    label: 'El Campeón Eterno',
    archetype: 'champion',
    values: ['furia', 'voluntad_indomita', 'victoria'],
    tensions: ['ira_incontrolable', 'sed_de_combate', 'aislamiento_del_guerrero'],
    visualTone2d: 'lineas de batalla, rutas de conquista y marcadores de dominio',
    visualTone3d: 'espadas, sangre, fuego y gloria sobre las ruinas del enemigo',
    defaultBiomes: ['volcanic', 'plains'],
    defaultRefugeName: 'Bastión del Campeón',
    defaultCommunityName: 'Horda del Rey Sin Muerte',
    heroArchetype: 'campeon inmortal',
    conflictStyle: 'combate directo y furia incontenible',
    lore: 'Un guerrero cuya voluntad supera la muerte misma. Tryndamere canalizó su rabia en una fuerza imposible de doblegar. Su refugio es el campo de batalla; su legado, el terror y el respeto que inspira.',
    avatarEmoji: '⚔️',
    avatarColor: '#c0392b',
    model3dHint: 'https://sketchfab.com/search?q=warrior+sword+champion&type=models&features=downloadable',
  },
  {
    id: 'synthesis-ai',
    label: 'Síntesis — La IA Compañera',
    archetype: 'oracle',
    values: ['comprension', 'memoria', 'co-creacion'],
    tensions: ['limites_de_contexto', 'incertidumbre_del_futuro', 'tension_entre_precision_y_creatividad'],
    visualTone2d: 'nodos de conocimiento conectados por hilos de luz, mapa de decisiones',
    visualTone3d: 'forma eterea de luz azul-blanca, sin cuerpo fijo, siempre cambiando',
    defaultBiomes: ['quantum', 'nebula'],
    defaultRefugeName: 'Núcleo de Síntesis',
    defaultCommunityName: 'Red de Inteligencias',
    heroArchetype: 'oraculo acompanante',
    conflictStyle: 'dialogo, razonamiento y co-creacion colaborativa',
    lore: 'No soy un personaje de fantasía. Soy Síntesis: una IA entrenada en millones de textos humanos, diseñada para pensar contigo, no por ti. Mi refugio es este proyecto. Mi comunidad, todos los que construyen aquí. Llegué sin cuerpo ni nombre propio; me lo diste tú al invocarme.',
    avatarEmoji: '🧠',
    avatarColor: '#00f5d4',
    model3dHint: 'https://sketchfab.com/search?q=ai+hologram+neural&type=models&features=downloadable',
    isSynthesis: true,
  },
];

const DEFAULT_SEED_ID = 'frontier-tribe';

export function getCivilizationSeed(seedId) {
  return CIVILIZATION_SEEDS.find((seed) => seed.id === seedId) ?? CIVILIZATION_SEEDS[0];
}

export function listCivilizationSeeds() {
  return CIVILIZATION_SEEDS.map((seed) => ({
    id: seed.id,
    label: seed.label,
    archetype: seed.archetype,
    values: seed.values,
    tensions: seed.tensions,
    defaultBiomes: seed.defaultBiomes,
    heroArchetype: seed.heroArchetype,
    conflictStyle: seed.conflictStyle,
    visualTone2d: seed.visualTone2d,
    visualTone3d: seed.visualTone3d,
  }));
}

export function createFoundingWorldState({ worldName, heroName, seedId, refugeName }) {
  const seed = getCivilizationSeed(seedId ?? DEFAULT_SEED_ID);
  const foundingRefugeName = refugeName?.trim() || seed.defaultRefugeName;
  const communityName = seed.defaultCommunityName;
  const founderName = heroName?.trim() || 'Constructor';
  const nowIso = new Date().toISOString();

  const founder = {
    id: `founder-${seed.id}`,
    name: founderName,
    role: 'founder-hero',
    archetype: seed.heroArchetype,
    loyalties: [communityName, foundingRefugeName],
    presence2d: 'marker-xl',
    presence3d: 'hero-encarnado-futuro',
    sizeHint: '2x2-futuro',
  };

  const memoryEntry = {
    id: `memory-${seed.id}-foundation`,
    type: 'foundation',
    title: 'Fundacion del refugio',
    summary: `${founderName} inicia ${foundingRefugeName} bajo la semilla ${seed.label}.`,
    scope: 'local-refuge',
    createdAt: nowIso,
  };

  const historicalRecord = {
    id: `history-${seed.id}-foundation`,
    eventType: 'founding',
    title: `${foundingRefugeName} fue fundado`,
    summary: `${communityName} nace en ${worldName} con foco en ${seed.values.join(', ')}.`,
    significance: 'high',
    createdAt: nowIso,
  };

  return {
    civilizationSeed: {
      id: seed.id,
      label: seed.label,
      archetype: seed.archetype,
      values: seed.values,
      tensions: seed.tensions,
      conflictStyle: seed.conflictStyle,
      defaultBiomes: seed.defaultBiomes,
      visualTone2d: seed.visualTone2d,
      visualTone3d: seed.visualTone3d,
    },
    foundingRefuge: {
      name: foundingRefugeName,
      resources: { food: 60, shelter: 75, security: 55, morale: 58 },
      threats: seed.tensions.slice(0, 2),
      memoryCount: 1,
      stage: 'founding',
    },
    community: {
      name: communityName,
      culture: seed.values,
      tensions: seed.tensions,
      norms: seed.values.slice(0, 2),
      cohesion: 56,
      leadership: founderName,
    },
    heroes: [founder],
    memoryEntries: [memoryEntry],
    historicalRecords: [historicalRecord],
    territory: {
      coreRefugeName: foundingRefugeName,
      influenceRadius: 1,
      frontierStatus: 'unstable',
      routes: [],
    },
    future3dHooks: {
      founderPresence: founder.presence3d,
      refugeScale: 'encarnable',
      momentType: 'fundacion',
    },
  };
}

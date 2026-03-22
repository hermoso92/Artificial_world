-- Artificial Worlds - PostgreSQL schema (prepared for future persistence)
-- Design per postgresql-database-engineering best practices

-- Players (user accounts)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (tier IN ('spectator', 'free', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_tier ON players(tier);

-- Worlds (AW-256, AW-512, etc.)
CREATE TABLE IF NOT EXISTS worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_class VARCHAR(20) NOT NULL CHECK (world_class IN ('AW-256', 'AW-512', 'AW-1024')),
  tick BIGINT NOT NULL DEFAULT 0,
  running BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_worlds_class ON worlds(world_class);

-- Refuges (player-owned plots within a world)
CREATE TABLE IF NOT EXISTS refuges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  plot_index INTEGER NOT NULL,
  owner_id UUID REFERENCES players(id) ON DELETE SET NULL,
  grid_size INTEGER NOT NULL DEFAULT 32,
  max_agents INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(world_id, plot_index)
);

CREATE INDEX idx_refuges_world ON refuges(world_id);
CREATE INDEX idx_refuges_owner ON refuges(owner_id);

-- Blueprints (genetic designs)
CREATE TABLE IF NOT EXISTS blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  traits JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blueprints_player ON blueprints(player_id);
CREATE INDEX idx_blueprints_traits ON blueprints USING GIN(traits);

-- Lineages (for tracking evolution)
CREATE TABLE IF NOT EXISTS lineages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  refuge_id UUID NOT NULL REFERENCES refuges(id) ON DELETE CASCADE,
  parent_lineage_id UUID REFERENCES lineages(id) ON DELETE SET NULL,
  birth_tick BIGINT NOT NULL,
  death_tick BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lineages_blueprint ON lineages(blueprint_id);
CREATE INDEX idx_lineages_refuge ON lineages(refuge_id);
CREATE INDEX idx_lineages_birth ON lineages(birth_tick);

-- Agent snapshots (periodic state for analytics)
CREATE TABLE IF NOT EXISTS agent_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refuge_id UUID NOT NULL REFERENCES refuges(id) ON DELETE CASCADE,
  lineage_id UUID REFERENCES lineages(id) ON DELETE SET NULL,
  grid_x INTEGER NOT NULL,
  grid_y INTEGER NOT NULL,
  energy DECIMAL(5,4) NOT NULL,
  matter DECIMAL(5,4) NOT NULL,
  traits JSONB NOT NULL,
  tick BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_snapshots_refuge_tick ON agent_snapshots(refuge_id, tick);
CREATE INDEX idx_agent_snapshots_lineage ON agent_snapshots(lineage_id);

-- Events (for audit/replay)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refuge_id UUID REFERENCES refuges(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB,
  tick BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_refuge_tick ON events(refuge_id, tick);
CREATE INDEX idx_events_type ON events(event_type);

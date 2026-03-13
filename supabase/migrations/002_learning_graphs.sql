-- Learning Graphs: visual node-edge learning paths built from podcasts

CREATE TABLE IF NOT EXISTS learning_graphs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL CHECK (domain IN ('AMG','ARG','QRMG','AITG','LEAP','Independence')),
  is_published BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  graph_id UUID NOT NULL REFERENCES learning_graphs(id) ON DELETE CASCADE,
  podcast_id UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  label TEXT,
  node_type TEXT DEFAULT 'default' CHECK (node_type IN ('default','start','milestone','end')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  graph_id UUID NOT NULL REFERENCES learning_graphs(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES learning_graph_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES learning_graph_nodes(id) ON DELETE CASCADE,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (graph_id, source_node_id, target_node_id)
);

CREATE INDEX learning_graph_nodes_graph_id_idx ON learning_graph_nodes(graph_id);
CREATE INDEX learning_graph_edges_graph_id_idx ON learning_graph_edges(graph_id);

-- Reuse the existing update_updated_at trigger function
CREATE TRIGGER learning_graphs_updated_at
  BEFORE UPDATE ON learning_graphs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE learning_graphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_graph_edges ENABLE ROW LEVEL SECURITY;

-- Public read for published graphs
CREATE POLICY "Public can view published graphs"
  ON learning_graphs FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage graphs"
  ON learning_graphs FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- Nodes: public read if parent graph is published, admin write
CREATE POLICY "Public can view nodes of published graphs"
  ON learning_graph_nodes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM learning_graphs WHERE id = graph_id AND is_published = true
  ));

CREATE POLICY "Admins can manage graph nodes"
  ON learning_graph_nodes FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- Edges: same pattern
CREATE POLICY "Public can view edges of published graphs"
  ON learning_graph_edges FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM learning_graphs WHERE id = graph_id AND is_published = true
  ));

CREATE POLICY "Admins can manage graph edges"
  ON learning_graph_edges FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'superadmin'));

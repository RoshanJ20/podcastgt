-- Add path_type to learning_graphs (linear vs graph mode)
ALTER TABLE learning_graphs ADD COLUMN IF NOT EXISTS path_type TEXT NOT NULL DEFAULT 'graph'
  CHECK (path_type IN ('linear', 'graph'));

-- Add sort_order to learning_graph_nodes (for linear mode ordering)
ALTER TABLE learning_graph_nodes ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

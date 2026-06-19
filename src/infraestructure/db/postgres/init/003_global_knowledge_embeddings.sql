CREATE TABLE IF NOT EXISTS global_knowledge_embeddings (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding vector(768) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_global_knowledge_embeddings_source_type
  ON global_knowledge_embeddings (source_type);

CREATE INDEX IF NOT EXISTS idx_global_knowledge_embeddings_embedding
  ON global_knowledge_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

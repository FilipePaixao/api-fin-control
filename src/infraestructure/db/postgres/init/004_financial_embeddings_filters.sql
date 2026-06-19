ALTER TABLE financial_embeddings
  ADD COLUMN IF NOT EXISTS reference_month TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT;

UPDATE financial_embeddings
SET
  reference_month = COALESCE(reference_month, metadata->>'referenceMonth'),
  category = COALESCE(category, metadata->>'category'),
  status = COALESCE(status, metadata->>'status')
WHERE reference_month IS NULL
   OR category IS NULL
   OR status IS NULL;

CREATE INDEX IF NOT EXISTS idx_financial_embeddings_filter
  ON financial_embeddings (user_id, source_type, reference_month, category, status);

DO $$
DECLARE
  current_dim integer;
BEGIN
  SELECT atttypmod INTO current_dim
  FROM pg_attribute
  WHERE attrelid = 'financial_embeddings'::regclass
    AND attname = 'embedding';

  IF current_dim = 1536 THEN
    TRUNCATE financial_embeddings;
    TRUNCATE global_knowledge_embeddings;

    DROP INDEX IF EXISTS idx_financial_embeddings_embedding;
    DROP INDEX IF EXISTS idx_global_knowledge_embeddings_embedding;

    ALTER TABLE financial_embeddings
      ALTER COLUMN embedding TYPE vector(768);

    ALTER TABLE global_knowledge_embeddings
      ALTER COLUMN embedding TYPE vector(768);

    CREATE INDEX IF NOT EXISTS idx_financial_embeddings_embedding
      ON financial_embeddings
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);

    CREATE INDEX IF NOT EXISTS idx_global_knowledge_embeddings_embedding
      ON global_knowledge_embeddings
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
  END IF;
END $$;

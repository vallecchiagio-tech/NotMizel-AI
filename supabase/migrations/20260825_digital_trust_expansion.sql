-- 1. AGGIUNTA DELLE NUOVE COLONNE (Idempotente: non dà errore se esistono già)
ALTER TABLE public.notarizations ADD COLUMN IF NOT EXISTS jurisdiction_level TEXT DEFAULT 'national';
ALTER TABLE public.notarizations ADD COLUMN IF NOT EXISTS country_code VARCHAR(3) DEFAULT 'ITA';
ALTER TABLE public.notarizations ADD COLUMN IF NOT EXISTS metadata_embedded JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.notarizations ADD COLUMN IF NOT EXISTS is_zero_knowledge BOOLEAN DEFAULT TRUE;
ALTER TABLE public.notarizations ADD COLUMN IF NOT EXISTS blockchain_network TEXT;
ALTER TABLE public.notarizations ADD COLUMN IF NOT EXISTS tsa_provider TEXT;
ALTER TABLE public.notarizations ADD COLUMN IF NOT EXISTS encrypted_file_hash TEXT;

-- 2. RIMOZIONE E RI-APPLICAZIONE DEI VINCOLI DI INTEGRITÀ (Zero Errori se rieseguito)
ALTER TABLE public.notarizations DROP CONSTRAINT IF EXISTS chk_jurisdiction_level;
ALTER TABLE public.notarizations ADD CONSTRAINT chk_jurisdiction_level 
    CHECK (jurisdiction_level IN ('national', 'continental', 'international'));

ALTER TABLE public.notarizations DROP CONSTRAINT IF EXISTS chk_blockchain_network;
ALTER TABLE public.notarizations ADD CONSTRAINT chk_blockchain_network 
    CHECK (blockchain_network IS NULL OR blockchain_network IN ('ethereum', 'bitcoin', 'polygon', 'private_chain'));

-- 3. CREAZIONE DEGLI INDICI AVANZATI PER PERFORMANCE ESTREME
-- Indice GIN: Permette di cercare istantaneamente all'interno dei metadati JSON (es. cercare tutte le licenze "Creative Commons")
CREATE INDEX IF NOT EXISTS idx_notarizations_metadata_gin ON public.notarizations USING gin (metadata_embedded);

-- Indice Composto: Velocizza le ricerche combinate come "Trovami le notarizzazioni in Europa (continental) fatte in Francia (FRA)"
CREATE INDEX IF NOT EXISTS idx_notarizations_jurisdiction_country ON public.notarizations(jurisdiction_level, country_code);

-- Estensione della tabella notarizations per la Digital Trust Suite
ALTER TABLE public.notarizations 
ADD COLUMN IF NOT EXISTS jurisdiction_level TEXT DEFAULT 'national' CHECK (jurisdiction_level IN ('national', 'continental', 'international')),
ADD COLUMN IF NOT EXISTS country_code VARCHAR(3) DEFAULT 'ITA',
ADD COLUMN IF NOT EXISTS encrypted_file_hash TEXT,
ADD COLUMN IF NOT EXISTS is_zero_knowledge BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS metadata_embedded JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS tsa_provider TEXT,
ADD COLUMN IF NOT EXISTS blockchain_network TEXT;

-- Indici per interrogazioni veloci su giurisdizione e paese
CREATE INDEX IF NOT EXISTS idx_notarizations_jurisdiction ON public.notarizations(jurisdiction_level);
CREATE INDEX IF NOT EXISTS idx_notarizations_country ON public.notarizations(country_code);

-- Table for Notarizations
CREATE TABLE IF NOT EXISTS public.notarized_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    filename TEXT NOT NULL,
    sha256_hash TEXT NOT NULL UNIQUE,
    proof_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for Music Copyrights
CREATE TABLE IF NOT EXISTS public.music_copyrights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_name TEXT NOT NULL,
    work_title TEXT NOT NULL,
    license_type TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    certificate_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for In-House KYC Vault Records
CREATE TABLE IF NOT EXISTS public.kyc_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    document_number TEXT NOT NULL,
    identity_vault_hash TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'VERIFIED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.notarized_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_copyrights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_records ENABLE ROW LEVEL SECURITY;

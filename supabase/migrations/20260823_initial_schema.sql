-- Abilita l'estensione per gli identificativi unici globali (UUID)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabella Profili Utente
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'free' CHECK (role IN ('free', 'premium', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabella Notarizzazioni (Salva solo gli hash e le prove TSR, mai i file)
CREATE TABLE IF NOT EXISTS public.notarizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_hash TEXT NOT NULL,
    file_name TEXT NOT NULL,
    tsr_data TEXT NOT NULL,
    blockchain_tx_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabella Abbonamenti per il piano Premium
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due')),
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indici di performance per query ultra-rapide
CREATE INDEX IF NOT EXISTS idx_notarizations_user_id ON public.notarizations(user_id);
CREATE INDEX IF NOT EXISTS idx_notarizations_file_hash ON public.notarizations(file_hash);

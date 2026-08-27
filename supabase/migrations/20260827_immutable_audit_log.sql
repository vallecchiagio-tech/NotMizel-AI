-- Immutable Audit Ledger for Legal Non-Repudiation
CREATE TABLE IF NOT EXISTS public.audit_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_hash TEXT NOT NULL,
    action_type TEXT NOT NULL,
    payload_sha256 TEXT NOT NULL,
    previous_record_hash TEXT,
    signature TEXT NOT NULL
);

-- RLS: Only INSERT and SELECT allowed, UPDATE/DELETE strictly revoked
ALTER TABLE public.audit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow Insert to Authenticated Users" ON public.audit_ledger FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow Read to Authenticated Users" ON public.audit_ledger FOR SELECT TO authenticated USING (true);

-- ============================================================
-- NotMizel-AI — Schema ufficiale (Week 4)
-- Tabelle: stamps, waitlist — RLS attivo, deny by default
-- Nota: le migrazioni 20260823-27 del vecchio progetto NON sono
-- mai state applicate (verificato: "No migrations" nel dashboard).
-- ============================================================

-- ---------- TABELLA STAMPS ----------
create table if not exists public.stamps (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    file_hash text not null,
    ots_proof text,
    status text not null default 'pending'
        check (status in ('pending', 'confirmed')),
    created_at timestamptz not null default now()
);

create index if not exists idx_stamps_user_id
    on public.stamps(user_id);
create index if not exists idx_stamps_file_hash
    on public.stamps(file_hash);

alter table public.stamps enable row level security;

create policy "Lettura: solo le proprie stampe"
    on public.stamps for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Inserimento: solo proprie righe"
    on public.stamps for insert
    to authenticated
    with check (auth.uid() = user_id);

-- ---------- TABELLA WAITLIST ----------
create table if not exists public.waitlist (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Nessuna policy = nessuno (tranne service_role) accede.
-- L'inserimento avverrà SOLO tramite il Worker con la
-- service_role key (mai esposta al client).

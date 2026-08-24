-- Attivazione obbligatoria della sicurezza a livello di riga su tutte le tabelle
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notarizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Politiche per public.profiles (L'utente vede solo il proprio profilo)
CREATE POLICY "Utenti possono leggere il proprio profilo"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Utenti possono aggiornare il proprio profilo"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Politiche per public.notarizations (L'utente gestisce solo le proprie prove)
CREATE POLICY "Utenti possono leggere le proprie notarizzazioni"
ON public.notarizations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Utenti possono inserire le proprie notarizzazioni"
ON public.notarizations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger di Sistema: Crea automaticamente un profilo 'free' quando un utente si registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (new.id, new.email, 'free');
    RETURN NEW;
END;
$language$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================================
-- SYSTEM SETTINGS & LOCKS (ADDITION)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all authenticated users"
    ON public.system_settings FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow write for admins"
    ON public.system_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

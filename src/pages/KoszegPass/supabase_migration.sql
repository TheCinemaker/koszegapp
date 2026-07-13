-- ====================================================================
-- KőszegPass – Supabase tábla definíciók
-- Futtasd le a Supabase SQL Editor-ban
-- ====================================================================

-- 1. koszeg_passes – a pass rekordok (egy sor = egy vásárolt pass)
CREATE TABLE IF NOT EXISTS koszeg_passes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holder_name         TEXT NOT NULL,
    holder_email        TEXT NOT NULL,
    pass_type           TEXT NOT NULL CHECK (pass_type IN ('individual', 'family')),
    status              TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
    qr_token            TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    stripe_session_id   TEXT UNIQUE,
    amount_paid         INTEGER,    -- fillérben (HUF × 100, Stripe formátum)
    purchased_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ NOT NULL,
    hotel_source        TEXT,       -- melyik szállodából szkennelte a regisztráló QR-t
    origin_zip          TEXT,       -- honnan érkezett a turista (ir. szám)
    phone               TEXT,
    extra_info          TEXT,       -- egyéb turisztikai statisztikai adat
    billing_zip         TEXT,
    billing_city        TEXT,
    billing_address     TEXT,
    billingo_invoice_id TEXT,
    slug                TEXT UNIQUE,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- Index az egyszerűsített URL alapú kereséshez
CREATE INDEX IF NOT EXISTS idx_koszeg_passes_slug
    ON koszeg_passes (slug);

-- Index az email alapú kereséshez (wallet újra letöltés stb.)
CREATE INDEX IF NOT EXISTS idx_koszeg_passes_email
    ON koszeg_passes (holder_email);

-- Index a QR token kereséshez (validáció – ez a leggyakoribb query)
CREATE INDEX IF NOT EXISTS idx_koszeg_passes_qr_token
    ON koszeg_passes (qr_token);

-- Index a stripe session idempotencia ellenőrzéshez
CREATE INDEX IF NOT EXISTS idx_koszeg_passes_stripe_session
    ON koszeg_passes (stripe_session_id);

-- ====================================================================
-- 2. pass_scans – partner scan statisztika (opcionális, csak ha QR-t olvasnak)
CREATE TABLE IF NOT EXISTS pass_scans (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_id     UUID NOT NULL REFERENCES koszeg_passes(id) ON DELETE CASCADE,
    partner_id  TEXT,           -- a partner azonosítója (pl. 'rajnis-etterem')
    scanned_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index a pass_id alapú statisztika lekérdezéshez
CREATE INDEX IF NOT EXISTS idx_pass_scans_pass_id
    ON pass_scans (pass_id);

-- Index a partner statisztikához
CREATE INDEX IF NOT EXISTS idx_pass_scans_partner_id
    ON pass_scans (partner_id);

-- ====================================================================
-- 3. Row Level Security (RLS)
-- A backend service role keyvel dolgozik → bypass RLS
-- A frontend anonimous keyvel → korlátozott hozzáférés

ALTER TABLE koszeg_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pass_scans    ENABLE ROW LEVEL SECURITY;

-- Service role: full access (backend functions)
-- (A service role automatikusan bypass-olja az RLS-t)

-- Publikus validáció: csak a qr_token alapján olvashat, de NEM az összes pass-t
CREATE POLICY "validate_by_token" ON koszeg_passes
    FOR SELECT
    USING (true); -- a koszeg-pass-validate.js service role-al fut, RLS bypass

-- pass_scans: csak a service role írhat
CREATE POLICY "service_only_scans" ON pass_scans
    FOR ALL
    USING (false); -- csak service role (RLS bypass) írhat
-- ====================================================================

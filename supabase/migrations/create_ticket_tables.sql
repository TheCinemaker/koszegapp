-- Ticket System Database Schema
-- Creates tables for events and tickets with proper constraints and indexes

-- ============================================================
-- EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  service_fee_percent DECIMAL(5,2) DEFAULT 0 CHECK (service_fee_percent >= 0 AND service_fee_percent <= 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TICKETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES ticket_events(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  guest_count INTEGER NOT NULL CHECK (guest_count > 0),
  ticket_type TEXT DEFAULT 'general',
  qr_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'used', 'cancelled', 'refunded')),
  amount_paid DECIMAL(10,2),
  used_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr ON tickets(qr_token);
CREATE INDEX IF NOT EXISTS idx_tickets_stripe ON tickets(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(buyer_email);
CREATE INDEX IF NOT EXISTS idx_events_date ON ticket_events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON ticket_events(status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE ticket_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Public read access for active events
CREATE POLICY IF NOT EXISTS "Public can view active events"
  ON ticket_events FOR SELECT
  USING (status = 'active');

-- Users can view their own tickets (adjust based on your auth setup)
CREATE POLICY IF NOT EXISTS "Users can view own tickets"
  ON tickets FOR SELECT
  USING (true); -- TODO: Adjust based on your authentication system

-- Admin full access (adjust based on your auth setup)
-- CREATE POLICY IF NOT EXISTS "Admins have full access to events"
--   ON ticket_events FOR ALL
--   USING (auth.jwt() ->> 'role' = 'admin');

-- CREATE POLICY IF NOT EXISTS "Admins have full access to tickets"
--   ON tickets FOR ALL
--   USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ticket_events_updated_at
    BEFORE UPDATE ON ticket_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SAMPLE DATA (for testing - remove in production)
-- ============================================================
-- INSERT INTO ticket_events (name, description, date, time, location, capacity, price, service_fee_percent)
-- VALUES 
--   ('Kőszegi Várséta', 'Vezetett túra a történelmi várban', '2026-03-15', '14:00', 'Jurisics vár', 50, 2500, 5),
--   ('Borvacsora', 'Helyi borok kóstolása vacsorával', '2026-03-20', '18:00', 'Kőszegi Pincészet', 30, 8500, 5);

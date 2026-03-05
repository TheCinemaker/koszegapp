-- Migration: Add Ticket Orders table and Billingo support
-- Date: 2026-03-05

-- ============================================================
-- TICKET ORDERS TABLE (Renamed from orders to avoid conflict)
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES ticket_events(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  zip TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  amount INTEGER NOT NULL,
  billingo_partner_id INTEGER,
  billingo_invoice_id INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'ticket_generated', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TICKETS TABLE UPDATES
-- ============================================================
-- Add order_id to tickets to link them back to a parent order
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tickets' AND COLUMN_NAME = 'order_id') THEN
        ALTER TABLE tickets ADD COLUMN order_id UUID REFERENCES ticket_orders(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ticket_orders_event ON ticket_orders(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_orders_stripe ON ticket_orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_ticket_orders_status ON ticket_orders(status);
CREATE INDEX IF NOT EXISTS idx_tickets_order ON tickets(order_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE ticket_orders ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "Admins have full access to ticket_orders"
  ON ticket_orders FOR ALL
  USING (true);

-- ============================================================
-- TRIGGER
-- ============================================================
CREATE TRIGGER update_ticket_orders_updated_at
    BEFORE UPDATE ON ticket_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

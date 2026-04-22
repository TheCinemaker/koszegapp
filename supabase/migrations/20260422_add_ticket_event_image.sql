-- Add image_url to ticket_events for posters/logos
ALTER TABLE ticket_events ADD COLUMN IF NOT EXISTS image_url text;

-- Create storage bucket for ticket images
insert into storage.buckets (id, name, public) 
values ('ticket-images', 'ticket-images', true)
on conflict (id) do nothing;

-- Drop existing policies if any (cleanup for retry)
drop policy if exists "tickets_public_access" on storage.objects;
drop policy if exists "tickets_admin_upload" on storage.objects;

-- Set up security policies for the bucket with unique names
create policy "tickets_public_access" 
on storage.objects for select 
using ( bucket_id = 'ticket-images' );

create policy "tickets_admin_upload" 
on storage.objects for insert 
with check ( bucket_id = 'ticket-images' and auth.role() = 'authenticated' );

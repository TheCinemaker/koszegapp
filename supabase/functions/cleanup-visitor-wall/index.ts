import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Runs daily via pg_cron. Deletes visitor wall entries older than 10 days
// from both the kiosk_visitor_messages table AND the kiosk-postcards storage bucket.

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Fetch rows to delete
  const { data: rows, error: fetchError } = await supabase
    .from('kiosk_visitor_messages')
    .select('id, photo_url')
    .lt('created_at', tenDaysAgo)

  if (fetchError) {
    console.error('Fetch error:', fetchError.message)
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
  }

  if (!rows || rows.length === 0) {
    return new Response(JSON.stringify({ deleted: 0, message: 'Nothing to clean up.' }))
  }

  // 2. Delete storage files (extract filename from full public URL)
  const filenames = rows
    .map(r => r.photo_url?.split('/').pop())
    .filter(Boolean) as string[]

  if (filenames.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('kiosk-postcards')
      .remove(filenames)
    if (storageError) console.error('Storage delete error:', storageError.message)
  }

  // 3. Delete DB rows
  const { error: deleteError } = await supabase
    .from('kiosk_visitor_messages')
    .delete()
    .lt('created_at', tenDaysAgo)

  if (deleteError) {
    console.error('DB delete error:', deleteError.message)
    return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 })
  }

  console.log(`Cleaned up ${rows.length} visitor wall entries.`)
  return new Response(JSON.stringify({ deleted: rows.length }))
})

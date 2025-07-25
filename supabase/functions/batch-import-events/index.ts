import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { events, api_source } = await req.json()

    if (!events || !Array.isArray(events)) {
      return new Response(
        JSON.stringify({ error: 'events array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Starting batch import of ${events.length} events from ${api_source}...`)

    // Log sync start
    const { data: syncLog } = await supabaseClient
      .from('poreve_api_sync_log')
      .insert({
        api_source: api_source || 'manual',
        sync_type: 'batch_import',
        status: 'running'
      })
      .select()
      .single()

    let totalProcessed = 0
    let totalAdded = 0
    let totalUpdated = 0
    const errors: string[] = []

    // Process events in batches of 10 for better performance
    const BATCH_SIZE = 10
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE)
      
      // Transform events to match database schema
      const transformedEvents = batch.map((event: any) => {
        // Generate external_id if not provided
        const external_id = event.external_id || `${api_source}-${event.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        return {
          external_id,
          api_source: api_source || 'manual',
          title: event.title || 'Untitled Event',
          description: event.description || null,
          category: event.category || 'other',
          venue_name: event.venue_name || 'TBA',
          venue_address: event.venue_address || null,
          venue_city: event.venue_city || 'Portland',
          venue_state: event.venue_state || 'Oregon',
          venue_zip: event.venue_zip || null,
          start_date: event.start_date ? new Date(event.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          start_time: event.start_time || null,
          end_time: event.end_time || null,
          price_display: event.price_display || event.price || null,
          ticket_url: event.ticket_url || event.url || null,
          website_url: event.website_url || event.website || null,
          facebook_url: event.facebook_url || null,
          instagram_url: event.instagram_url || null,
          twitter_url: event.twitter_url || null,
          youtube_url: event.youtube_url || null,
          image_url: event.image_url || event.image || null,
          status: 'approved', // Auto-approve API events
          is_featured: event.is_featured || false,
          is_recurring: false, // Default for API events
          recurrence_type: null,
          recurrence_pattern: null,
          recurrence_end_date: null
        }
      })

      try {
        // Use upsert for batch processing
        const { data, error, count } = await supabaseClient
          .from('user_events')
          .upsert(transformedEvents, { 
            onConflict: 'external_id,api_source',
            count: 'exact'
          })

        if (error) {
          console.error(`Batch ${i + 1} error:`, error)
          errors.push(`Batch ${i + 1}: ${error.message}`)
        } else {
          totalProcessed += batch.length
          if (count !== null) {
            totalAdded += count
          }
          console.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(events.length / BATCH_SIZE)}`)
        }
      } catch (batchError) {
        console.error(`Batch ${i + 1} processing error:`, batchError)
        errors.push(`Batch ${i + 1}: ${batchError.message}`)
      }
    }

    // Update sync log
    if (syncLog) {
      await supabaseClient
        .from('poreve_api_sync_log')
        .update({
          status: errors.length > 0 ? 'partial_success' : 'success',
          events_processed: totalProcessed,
          events_added: totalAdded,
          events_updated: totalUpdated,
          completed_at: new Date().toISOString(),
          error_message: errors.length > 0 ? errors.join('; ') : null
        })
        .eq('id', syncLog.id)
    }

    console.log(`Batch import completed: ${totalProcessed} events processed, ${totalAdded} added, ${errors.length} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Batch import completed`,
        stats: {
          processed: totalProcessed,
          added: totalAdded,
          updated: totalUpdated,
          errors: errors.length,
          error_details: errors.length > 0 ? errors : undefined
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in batch import:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
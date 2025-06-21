
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EventbriteEvent {
  id: string
  name: { text: string }
  description: { text: string }
  start: { utc: string }
  end: { utc: string }
  venue?: {
    name: string
    address: {
      address_1: string
      city: string
      region: string
      postal_code: string
    }
  }
  category_id: string
  is_free: boolean
  ticket_availability: {
    minimum_ticket_price?: {
      major_value: number
    }
    maximum_ticket_price?: {
      major_value: number
    }
  }
  logo?: { url: string }
  url: string
  organizer: {
    name: string
    url: string
  }
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

    const eventbriteApiKey = Deno.env.get('EVENTBRITE_API_KEY')
    if (!eventbriteApiKey) {
      throw new Error('EVENTBRITE_API_KEY not found in secrets')
    }

    // Log sync start
    const { data: syncLog } = await supabaseClient
      .from('poreve_api_sync_log')
      .insert({
        api_source: 'eventbrite',
        sync_type: 'manual',
        status: 'running'
      })
      .select()
      .single()

    let totalProcessed = 0
    let totalAdded = 0
    let totalUpdated = 0

    console.log('Starting Eventbrite API sync...')

    // Fetch events from Eventbrite API for Portland, Oregon
    const eventbriteUrl = 'https://www.eventbriteapi.com/v3/events/search/'
    const params = new URLSearchParams({
      'location.address': 'Portland, Oregon',
      'location.within': '25mi',
      'start_date.range_start': new Date().toISOString(),
      'expand': 'venue,organizer,ticket_availability,category',
      'sort_by': 'date',
      'page_size': '50'
    })

    const response = await fetch(`${eventbriteUrl}?${params}`, {
      headers: {
        'Authorization': `Bearer ${eventbriteApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Eventbrite API error: ${response.status} ${response.statusText}`)
    }

    const eventbriteData = await response.json()
    console.log(`Found ${eventbriteData.events?.length || 0} events from Eventbrite`)

    // Process Eventbrite events
    if (eventbriteData.events) {
      for (const event of eventbriteData.events) {
        try {
          // Map category ID to readable category
          const categoryMap: { [key: string]: string } = {
            '103': 'music',
            '110': 'food-drink',
            '105': 'arts-culture',
            '102': 'business',
            '108': 'sports',
            '109': 'technology',
            '116': 'health-wellness',
            '115': 'family',
            '104': 'entertainment',
            '107': 'outdoor'
          }

          const eventData = {
            external_id: event.id,
            api_source: 'eventbrite',
            title: event.name.text,
            description: event.description?.text || '',
            start_date: event.start.utc,
            end_date: event.end?.utc,
            venue_name: event.venue?.name || 'TBA',
            venue_address: event.venue?.address?.address_1 || '',
            venue_city: event.venue?.address?.city || 'Portland',
            venue_state: event.venue?.address?.region || 'Oregon',
            venue_zip: event.venue?.address?.postal_code || '',
            category: categoryMap[event.category_id] || 'entertainment',
            price_min: event.is_free ? 0 : (event.ticket_availability?.minimum_ticket_price?.major_value || 0),
            price_max: event.is_free ? 0 : (event.ticket_availability?.maximum_ticket_price?.major_value || 0),
            price_display: event.is_free ? 'Free' : (event.ticket_availability?.minimum_ticket_price ? `$${event.ticket_availability.minimum_ticket_price.major_value}` : 'TBA'),
            image_url: event.logo?.url || '/placeholder.svg',
            ticket_url: event.url,
            organizer_name: event.organizer?.name || 'Unknown',
            organizer_url: event.organizer?.url || ''
          }

          const { error } = await supabaseClient
            .from('poreve_events')
            .upsert(eventData, { onConflict: 'external_id,api_source' })

          if (!error) {
            totalProcessed++
            totalAdded++
            console.log(`Added event: ${event.name.text}`)
          } else {
            console.error(`Error upserting event ${event.id}:`, error)
          }
        } catch (eventError) {
          console.error(`Error processing event ${event.id}:`, eventError)
        }
      }
    }

    // Update sync log
    await supabaseClient
      .from('poreve_api_sync_log')
      .update({
        status: 'success',
        events_processed: totalProcessed,
        events_added: totalAdded,
        events_updated: totalUpdated,
        completed_at: new Date().toISOString()
      })
      .eq('id', syncLog.id)

    console.log(`Sync completed: ${totalProcessed} events processed`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sync completed successfully`,
        stats: {
          processed: totalProcessed,
          added: totalAdded,
          updated: totalUpdated
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error syncing events:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

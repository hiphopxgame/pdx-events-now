
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

    // Fixed Eventbrite API endpoint - removed trailing slash
    const eventbriteUrl = 'https://www.eventbriteapi.com/v3/events/search'
    const params = new URLSearchParams({
      'location.address': 'Portland, OR',
      'location.within': '25mi',
      'start_date.range_start': new Date().toISOString(),
      'start_date.range_end': new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // Next 60 days
      'expand': 'venue,organizer,ticket_availability,category',
      'sort_by': 'date',
      'page_size': '50',
      'status': 'live'
    })

    console.log(`Fetching from: ${eventbriteUrl}?${params}`)

    const response = await fetch(`${eventbriteUrl}?${params}`, {
      headers: {
        'Authorization': `Bearer ${eventbriteApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`Eventbrite API response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Eventbrite API error response: ${errorText}`)
      
      // Update sync log with error
      if (syncLog) {
        await supabaseClient
          .from('poreve_api_sync_log')
          .update({
            status: 'error',
            error_message: `Eventbrite API error: ${response.status} - ${errorText}`,
            completed_at: new Date().toISOString()
          })
          .eq('id', syncLog.id)
      }
      
      throw new Error(`Eventbrite API error: ${response.status} ${response.statusText}`)
    }

    const eventbriteData = await response.json()
    console.log(`Found ${eventbriteData.events?.length || 0} events from Eventbrite`)
    
    if (eventbriteData.events && eventbriteData.events.length > 0) {
      console.log('Sample event structure:', JSON.stringify(eventbriteData.events[0], null, 2))
    }

    // Process Eventbrite events
    if (eventbriteData.events && eventbriteData.events.length > 0) {
      for (const event of eventbriteData.events) {
        try {
          console.log(`Processing event: ${event.name?.text || 'Unknown'}`)
          
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
            title: event.name?.text || 'Untitled Event',
            description: event.description?.text || '',
            start_date: event.start?.utc || new Date().toISOString(),
            end_date: event.end?.utc || null,
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
            ticket_url: event.url || '',
            organizer_name: event.organizer?.name || 'Unknown',
            organizer_url: event.organizer?.url || ''
          }

          const { error } = await supabaseClient
            .from('poreve_events')
            .upsert(eventData, { onConflict: 'external_id,api_source' })

          if (!error) {
            totalProcessed++
            totalAdded++
            console.log(`Successfully added/updated event: ${event.name?.text}`)
          } else {
            console.error(`Error upserting event ${event.id}:`, error)
          }
        } catch (eventError) {
          console.error(`Error processing event ${event.id}:`, eventError)
        }
      }
    } else {
      console.log('No events found in the API response')
    }

    // Update sync log
    if (syncLog) {
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
    }

    console.log(`Sync completed: ${totalProcessed} events processed, ${totalAdded} added, ${totalUpdated} updated`)

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

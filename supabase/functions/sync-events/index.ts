
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
  venue: {
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
    minimum_ticket_price: {
      major_value: number
    }
    maximum_ticket_price: {
      major_value: number
    }
  }
  logo: { url: string }
  url: string
  organizer: {
    name: string
    url: string
  }
}

interface TicketmasterEvent {
  id: string
  name: string
  info?: string
  dates: {
    start: {
      dateTime: string
    }
    end?: {
      dateTime: string
    }
  }
  _embedded?: {
    venues: Array<{
      name: string
      address: {
        line1: string
        line2?: string
      }
      city: {
        name: string
      }
      state: {
        name: string
        stateCode: string
      }
      postalCode: string
    }>
  }
  classifications: Array<{
    segment: {
      name: string
    }
  }>
  priceRanges?: Array<{
    min: number
    max: number
  }>
  images: Array<{
    url: string
  }>
  url: string
  promoter?: {
    name: string
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

    // Log sync start
    const { data: syncLog } = await supabaseClient
      .from('poreve_api_sync_log')
      .insert({
        api_source: 'multiple',
        sync_type: 'manual',
        status: 'running'
      })
      .select()
      .single()

    let totalProcessed = 0
    let totalAdded = 0
    let totalUpdated = 0

    // Fetch from Eventbrite (mock data for now - replace with real API)
    const mockEventbriteEvents = [
      {
        id: 'eb_001',
        name: { text: 'Portland Food & Wine Festival' },
        description: { text: 'Annual celebration of Portland\'s culinary scene with local restaurants and wineries.' },
        start: { utc: '2025-06-25T18:00:00Z' },
        end: { utc: '2025-06-25T23:00:00Z' },
        venue: {
          name: 'Pioneer Courthouse Square',
          address: {
            address_1: '701 SW 5th Ave',
            city: 'Portland',
            region: 'Oregon',
            postal_code: '97204'
          }
        },
        category_id: 'food-drink',
        is_free: false,
        ticket_availability: {
          minimum_ticket_price: { major_value: 45 },
          maximum_ticket_price: { major_value: 75 }
        },
        logo: { url: '/placeholder.svg' },
        url: 'https://eventbrite.com/e/portland-food-wine-festival',
        organizer: {
          name: 'Portland Food Events',
          url: 'https://portlandfoodevents.com'
        }
      }
    ]

    // Process Eventbrite events
    for (const event of mockEventbriteEvents) {
      const eventData = {
        external_id: event.id,
        api_source: 'eventbrite',
        title: event.name.text,
        description: event.description.text,
        start_date: event.start.utc,
        end_date: event.end.utc,
        venue_name: event.venue.name,
        venue_address: event.venue.address.address_1,
        venue_city: event.venue.address.city,
        venue_state: event.venue.address.region,
        venue_zip: event.venue.address.postal_code,
        category: event.category_id,
        price_min: event.is_free ? 0 : event.ticket_availability.minimum_ticket_price.major_value,
        price_max: event.is_free ? 0 : event.ticket_availability.maximum_ticket_price.major_value,
        price_display: event.is_free ? 'Free' : `$${event.ticket_availability.minimum_ticket_price.major_value}`,
        image_url: event.logo.url,
        ticket_url: event.url,
        organizer_name: event.organizer.name,
        organizer_url: event.organizer.url
      }

      const { error } = await supabaseClient
        .from('poreve_events')
        .upsert(eventData, { onConflict: 'external_id,api_source' })

      if (!error) {
        totalProcessed++
        totalAdded++
      }
    }

    // Mock Ticketmaster events
    const mockTicketmasterEvents = [
      {
        id: 'tm_001',
        name: 'Indie Rock at Doug Fir',
        info: 'Local indie bands showcase their latest music in an intimate venue setting.',
        dates: {
          start: { dateTime: '2025-06-22T20:00:00Z' },
          end: { dateTime: '2025-06-22T23:00:00Z' }
        },
        _embedded: {
          venues: [{
            name: 'Doug Fir Lounge',
            address: { line1: '830 E Burnside St' },
            city: { name: 'Portland' },
            state: { name: 'Oregon', stateCode: 'OR' },
            postalCode: '97214'
          }]
        },
        classifications: [{ segment: { name: 'Music' } }],
        priceRanges: [{ min: 25, max: 35 }],
        images: [{ url: '/placeholder.svg' }],
        url: 'https://ticketmaster.com/indie-rock-doug-fir',
        promoter: { name: 'Doug Fir Events' }
      }
    ]

    // Process Ticketmaster events
    for (const event of mockTicketmasterEvents) {
      const venue = event._embedded?.venues[0]
      const eventData = {
        external_id: event.id,
        api_source: 'ticketmaster',
        title: event.name,
        description: event.info || '',
        start_date: event.dates.start.dateTime,
        end_date: event.dates.end?.dateTime,
        venue_name: venue?.name || 'TBA',
        venue_address: venue?.address.line1 || '',
        venue_city: venue?.city.name || 'Portland',
        venue_state: venue?.state.name || 'Oregon',
        venue_zip: venue?.postalCode || '',
        category: event.classifications[0]?.segment.name.toLowerCase() || 'entertainment',
        price_min: event.priceRanges?.[0]?.min || 0,
        price_max: event.priceRanges?.[0]?.max || 0,
        price_display: event.priceRanges?.[0] ? `$${event.priceRanges[0].min}` : 'TBA',
        image_url: event.images[0]?.url || '/placeholder.svg',
        ticket_url: event.url,
        organizer_name: event.promoter?.name || 'Unknown',
        organizer_url: ''
      }

      const { error } = await supabaseClient
        .from('poreve_events')
        .upsert(eventData, { onConflict: 'external_id,api_source' })

      if (!error) {
        totalProcessed++
        totalAdded++
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

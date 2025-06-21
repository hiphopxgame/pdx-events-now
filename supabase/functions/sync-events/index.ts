
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

    console.log('API Key exists:', !!eventbriteApiKey)
    console.log('API Key length:', eventbriteApiKey.length)

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

    // Try the organizations/me endpoint first to verify API key
    console.log('Testing API key with organizations endpoint...')
    const testResponse = await fetch('https://www.eventbriteapi.com/v3/users/me/', {
      headers: {
        'Authorization': `Bearer ${eventbriteApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('Test API response status:', testResponse.status)
    if (!testResponse.ok) {
      const testErrorText = await testResponse.text()
      console.error('API Key test failed:', testErrorText)
    } else {
      const testData = await testResponse.json()
      console.log('API Key test successful. User:', testData.name || 'Unknown')
    }

    // Try different event search approaches
    const searchApproaches = [
      // Approach 1: Simple search without location
      {
        url: 'https://www.eventbriteapi.com/v3/events/search',
        params: new URLSearchParams({
          'q': 'Portland',
          'start_date.range_start': new Date().toISOString().split('T')[0],
          'start_date.range_end': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          'sort_by': 'date',
          'page_size': '20',
          'status': 'live'
        })
      },
      // Approach 2: Location-based search
      {
        url: 'https://www.eventbriteapi.com/v3/events/search',
        params: new URLSearchParams({
          'location.address': 'Portland, OR, USA',
          'location.within': '15mi',
          'start_date.range_start': new Date().toISOString().split('T')[0],
          'start_date.range_end': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          'sort_by': 'date',
          'page_size': '20',
          'status': 'live'
        })
      }
    ]

    let eventbriteData = null
    let successfulApproach = null

    for (let i = 0; i < searchApproaches.length; i++) {
      const approach = searchApproaches[i]
      const fullUrl = `${approach.url}?${approach.params}`
      
      console.log(`Trying approach ${i + 1}: ${fullUrl}`)

      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${eventbriteApiKey}`,
          'Content-Type': 'application/json'
        }
      })

      console.log(`Approach ${i + 1} response status:`, response.status)

      if (response.ok) {
        eventbriteData = await response.json()
        successfulApproach = i + 1
        console.log(`Approach ${i + 1} successful! Found ${eventbriteData.events?.length || 0} events`)
        break
      } else {
        const errorText = await response.text()
        console.error(`Approach ${i + 1} failed:`, response.status, errorText)
      }
    }

    if (!eventbriteData) {
      // Update sync log with error
      if (syncLog) {
        await supabaseClient
          .from('poreve_api_sync_log')
          .update({
            status: 'error',
            error_message: 'All Eventbrite API approaches failed',
            completed_at: new Date().toISOString()
          })
          .eq('id', syncLog.id)
      }
      
      throw new Error('All Eventbrite API approaches failed')
    }

    console.log(`Using successful approach ${successfulApproach}`)
    
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
        message: `Sync completed successfully using approach ${successfulApproach}`,
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

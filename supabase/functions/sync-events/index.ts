
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Sample Portland events to populate initially
const sampleEvents = [
  {
    external_id: 'sample-1',
    api_source: 'sample',
    title: 'Portland Saturday Market',
    description: 'The largest continuously operating outdoor arts and crafts market in the United States.',
    start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    end_date: new Date(Date.now() + 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(), // Tomorrow + 8 hours
    venue_name: 'Tom McCall Waterfront Park',
    venue_address: 'SW Naito Parkway',
    venue_city: 'Portland',
    venue_state: 'Oregon',
    venue_zip: '97204',
    category: 'arts-culture',
    price_min: 0,
    price_max: 0,
    price_display: 'Free',
    image_url: '/placeholder.svg',
    ticket_url: 'https://www.portlandsaturdaymarket.com',
    organizer_name: 'Portland Saturday Market',
    organizer_url: 'https://www.portlandsaturdaymarket.com'
  },
  {
    external_id: 'sample-2',
    api_source: 'sample',
    title: 'Portland Food Truck Festival',
    description: 'Experience the best food trucks Portland has to offer in one location.',
    start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
    end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
    venue_name: 'Pioneer Courthouse Square',
    venue_address: '701 SW 5th Ave',
    venue_city: 'Portland',
    venue_state: 'Oregon',
    venue_zip: '97204',
    category: 'food-drink',
    price_min: 5,
    price_max: 25,
    price_display: '$5-25',
    image_url: '/placeholder.svg',
    ticket_url: 'https://example.com/food-truck-festival',
    organizer_name: 'Portland Food Events',
    organizer_url: 'https://example.com'
  },
  {
    external_id: 'sample-3',
    api_source: 'sample',
    title: 'Portland Hiking Meetup',
    description: 'Join fellow hiking enthusiasts for a guided hike through Forest Park.',
    start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    venue_name: 'Forest Park',
    venue_address: 'NW Forest Park Dr',
    venue_city: 'Portland',
    venue_state: 'Oregon',
    venue_zip: '97210',
    category: 'outdoor',
    price_min: 0,
    price_max: 0,
    price_display: 'Free',
    image_url: '/placeholder.svg',
    ticket_url: 'https://example.com/hiking-meetup',
    organizer_name: 'Portland Hiking Club',
    organizer_url: 'https://example.com'
  },
  {
    external_id: 'sample-4',
    api_source: 'sample',
    title: 'Tech Talk: AI in Portland',
    description: 'Learn about the latest AI developments from local tech companies.',
    start_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
    end_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    venue_name: 'Portland State University',
    venue_address: '1825 SW Broadway',
    venue_city: 'Portland',
    venue_state: 'Oregon',
    venue_zip: '97201',
    category: 'technology',
    price_min: 15,
    price_max: 15,
    price_display: '$15',
    image_url: '/placeholder.svg',
    ticket_url: 'https://example.com/tech-talk',
    organizer_name: 'Portland Tech Meetup',
    organizer_url: 'https://example.com'
  },
  {
    external_id: 'sample-5',
    api_source: 'sample',
    title: 'Portland Jazz Festival',
    description: 'An evening of smooth jazz featuring local and visiting musicians.',
    start_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    venue_name: 'Crystal Ballroom',
    venue_address: '1332 W Burnside St',
    venue_city: 'Portland',
    venue_state: 'Oregon',
    venue_zip: '97209',
    category: 'music',
    price_min: 25,
    price_max: 45,
    price_display: '$25-45',
    image_url: '/placeholder.svg',
    ticket_url: 'https://example.com/jazz-festival',
    organizer_name: 'Portland Jazz Society',
    organizer_url: 'https://example.com'
  },
  {
    external_id: 'sample-6',
    api_source: 'sample',
    title: 'Family Fun Day at OMSI',
    description: 'Interactive exhibits and activities for the whole family.',
    start_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
    end_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    venue_name: 'Oregon Museum of Science and Industry',
    venue_address: '1945 SE Water Ave',
    venue_city: 'Portland',
    venue_state: 'Oregon',
    venue_zip: '97214',
    category: 'family',
    price_min: 12,
    price_max: 18,
    price_display: '$12-18',
    image_url: '/placeholder.svg',
    ticket_url: 'https://omsi.edu',
    organizer_name: 'OMSI',
    organizer_url: 'https://omsi.edu'
  }
]

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {

    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Ensure caller is admin
    const { data: isAdmin, error: adminCheckError } = await supabaseClient.rpc('is_current_user_admin')
    if (adminCheckError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Starting automatic event population...')

    // Log sync start
    const { data: syncLog } = await supabaseClient
      .from('poreve_api_sync_log')
      .insert({
        api_source: 'auto-populate',
        sync_type: 'automatic',
        status: 'running'
      })
      .select()
      .single()

    let totalProcessed = 0
    let totalAdded = 0

    // Add sample events
    for (const eventData of sampleEvents) {
      try {
        console.log(`Processing event: ${eventData.title}`)
        
        const { error } = await supabaseClient
          .from('user_events')
          .upsert({
            ...eventData,
            status: 'approved' // Auto-approve API events
          }, { onConflict: 'external_id,api_source' })

        if (!error) {
          totalProcessed++
          totalAdded++
          console.log(`Successfully added/updated event: ${eventData.title}`)
        } else {
          console.error(`Error upserting event ${eventData.external_id}:`, error)
        }
      } catch (eventError) {
        console.error(`Error processing event ${eventData.external_id}:`, eventError)
      }
    }

    // Try a simple Eventbrite API call as backup (optional)
    const eventbriteApiKey = Deno.env.get('EVENTBRITE_API_KEY')
    if (eventbriteApiKey) {
      console.log('Attempting simplified Eventbrite API call...')
      try {
        const response = await fetch('https://www.eventbriteapi.com/v3/events/search/?location.address=Portland,OR&expand=venue', {
          headers: {
            'Authorization': `Bearer ${eventbriteApiKey}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`Eventbrite API successful: found ${data.events?.length || 0} events`)
          
          // Process a few Eventbrite events if available
          if (data.events && data.events.length > 0) {
            for (const event of data.events.slice(0, 3)) { // Only take first 3
              try {
                const eventData = {
                  external_id: event.id,
                  api_source: 'eventbrite',
                  title: event.name?.text || 'Eventbrite Event',
                  description: event.description?.text || '',
                  start_date: event.start?.utc || new Date().toISOString(),
                  end_date: event.end?.utc || null,
                  venue_name: event.venue?.name || 'TBA',
                  venue_address: event.venue?.address?.address_1 || '',
                  venue_city: event.venue?.address?.city || 'Portland',
                  venue_state: event.venue?.address?.region || 'Oregon',
                  venue_zip: event.venue?.address?.postal_code || '',
                  category: 'entertainment',
                  price_min: event.is_free ? 0 : null,
                  price_max: event.is_free ? 0 : null,
                  price_display: event.is_free ? 'Free' : 'TBA',
                  image_url: event.logo?.url || '/placeholder.svg',
                  ticket_url: event.url || '',
                  organizer_name: event.organizer?.name || 'Unknown',
                  organizer_url: event.organizer?.url || ''
                }

                const { error } = await supabaseClient
                  .from('user_events')
                  .upsert({
                    ...eventData,
                    status: 'approved' // Auto-approve API events
                  }, { onConflict: 'external_id,api_source' })

                if (!error) {
                  totalProcessed++
                  totalAdded++
                  console.log(`Successfully added Eventbrite event: ${event.name?.text}`)
                }
              } catch (eventError) {
                console.error(`Error processing Eventbrite event:`, eventError)
              }
            }
          }
        } else {
          console.log('Eventbrite API call failed, continuing with sample data only')
        }
      } catch (apiError) {
        console.log('Eventbrite API error, continuing with sample data only:', apiError)
      }
    }

    // Update sync log
    if (syncLog) {
      await supabaseClient
        .from('poreve_api_sync_log')
        .update({
          status: 'success',
          events_processed: totalProcessed,
          events_added: totalAdded,
          events_updated: 0,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id)
    }

    console.log(`Auto-population completed: ${totalProcessed} events processed, ${totalAdded} added`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto-population completed successfully`,
        stats: {
          processed: totalProcessed,
          added: totalAdded,
          updated: 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in auto-population:', error)
    
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

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client using the service role key to bypass RLS
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { amount, donorName, message, donorEmail } = await req.json();

    if (!amount || amount < 100) { // Minimum $1.00
      throw new Error("Amount must be at least $1.00");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get authenticated user (optional for donations)
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
    }

    // Create a one-time payment session for donation
    const session = await stripe.checkout.sessions.create({
      customer_email: donorEmail || user?.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: "Support Portland.Events Development",
              description: "Help us build a better event discovery platform for Portland and beyond!"
            },
            unit_amount: amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/donation-cancelled`,
      metadata: {
        donor_name: donorName || "Anonymous",
        message: message || "",
        user_id: user?.id || "",
      },
    });

    // Record the donation in our database
    await supabaseClient.from("donations").insert({
      user_id: user?.id || null,
      email: donorEmail || user?.email || null,
      stripe_session_id: session.id,
      amount: amount,
      donor_name: donorName || "Anonymous",
      message: message || "",
      status: "pending",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
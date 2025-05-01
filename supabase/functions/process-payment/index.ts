import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type',
  'Access-Control-Max-Age': '86400',
};

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'DEICER Donation',
    version: '1.0.0',
  },
});

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  // For 204 No Content, don't include Content-Type or body
  if (status === 204) {
    return new Response(null, { status, headers: corsHeaders });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { payment_method_id, amount, currency, description, email } = await req.json();

    if (!payment_method_id || !amount || !currency) {
      return corsResponse({ error: 'Missing required parameters' }, 400);
    }

    // Create a customer if email is provided
    let customerId;
    if (email) {
      const customer = await stripe.customers.create({
        email,
        payment_method: payment_method_id,
        invoice_settings: {
          default_payment_method: payment_method_id,
        },
      });
      customerId = customer.id;
    }

    // Create a payment intent
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        description,
        payment_method: payment_method_id,
        confirm: true,
        customer: customerId,
        return_url: `${req.headers.get('origin') || 'https://deicer.org'}/donate-success`,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'always'
        }
      });
    } catch (stripeError) {
      console.error('Stripe payment intent error:', stripeError);
      return corsResponse({ error: stripeError.message }, 400);
    }

    // If customer was created, store in database
    if (customerId && email) {
      try {
        const { error: customerError } = await supabase.from('stripe_customers').insert({
          customer_id: customerId,
          user_id: null, // Anonymous donation
        });

        if (customerError) {
          console.error('Error storing customer:', customerError);
        }

        // Store the order
        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id: paymentIntent.id,
          payment_intent_id: paymentIntent.id,
          customer_id: customerId,
          amount_subtotal: amount,
          amount_total: amount,
          currency,
          payment_status: paymentIntent.status,
          status: 'completed',
        });

        if (orderError) {
          console.error('Error storing order:', orderError);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue even if database operations fail
      }
    }

    return corsResponse({
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
    });
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return corsResponse({ error: error.message }, 500);
  }
});
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createRazorpayOrderHandler } from '../_shared/create-razorpay-order-handler.js';

serve(createRazorpayOrderHandler({
  env: (name) => Deno.env.get(name),
  createClient,
  fetchImpl: fetch,
  corsHeaders,
  jsonResponse,
  errorResponse,
  logError: console.error,
}));

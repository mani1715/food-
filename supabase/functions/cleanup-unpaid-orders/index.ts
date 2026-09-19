import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Run cleanup of unpaid orders older than 30 minutes
    const { data, error } = await supabase.rpc('cleanup_expired_unpaid_orders', {
      p_timeout_minutes: 30,
    });

    if (error) {
      console.error('Cleanup RPC error:', error.message);
      return errorResponse('Failed to run unpaid order cleanup.', 500);
    }

    return jsonResponse({
      success: true,
      cancelledCount: data?.cancelled_count || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Cleanup function error:', err.message || err);
    return errorResponse(err.message || 'Internal error', 500);
  }
});

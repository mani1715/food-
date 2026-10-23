import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller authorization: Service-role or authenticated Admin required
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Missing Authorization header.', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== supabaseServiceKey) {
      const { data: userData, error: userErr } = await supabase.auth.getUser(token);
      if (userErr || !userData.user) {
        return errorResponse('Unauthorized: Valid admin session or service-role token required.', 401);
      }

      const { data: staffData } = await supabase
        .from('admin_roles')
        .select('role, status')
        .eq('user_id', userData.user.id)
        .eq('status', 'active')
        .single();

      if (!staffData) {
        return errorResponse('Forbidden: Administrative privileges required.', 403);
      }
    }

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

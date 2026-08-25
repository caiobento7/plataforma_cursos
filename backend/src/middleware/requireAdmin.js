import { supabaseAdmin } from '../supabase.js';

export const requireAdmin = async (request, response, next) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', request.user.id)
    .single();

  if (error || data?.role !== 'admin') {
    return response.status(403).json({ error: 'Esta ação é exclusiva de administradores.' });
  }

  return next();
};

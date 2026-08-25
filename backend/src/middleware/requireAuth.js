import { supabaseAuth } from '../supabase.js';

export const requireAuth = async (request, response, next) => {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return response.status(401).json({ error: 'Token de autenticação não informado.' });
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data.user) {
    return response.status(401).json({ error: 'Token de autenticação inválido ou expirado.' });
  }

  request.user = data.user;
  return next();
};

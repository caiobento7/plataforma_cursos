import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Localmente as variáveis vêm de backend/.env. Na Vercel o arquivo não existe
// e elas são configuradas no painel do projeto.
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });

const requiredVariables = [
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
];
const missingVariables = requiredVariables.filter((variable) => !process.env[variable]);

if (missingVariables.length > 0) {
  throw new Error(`Variáveis de ambiente ausentes (backend/.env ou painel da Vercel): ${missingVariables.join(', ')}`);
}

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Login é feito com a chave pública, como no fluxo recomendado pelo Supabase.
// A chave secreta permanece exclusiva das operações administrativas e de banco.
export const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

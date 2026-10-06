// Função serverless da Vercel. Todas as requisições para /api/* são
// redirecionadas para cá (ver vercel.json) e tratadas pelo mesmo app Express
// usado no desenvolvimento local.
import app from '../backend/src/app.js';

export default app;

import app from './app.js';

// Ponto de entrada para desenvolvimento local. Na Vercel, a API é executada
// como função serverless a partir de api/index.js, sem app.listen.
const port = Number(process.env.PORT) || 3001;

app.listen(port, () => {
  console.log(`CursoLab API disponível em http://localhost:${port}`);
});

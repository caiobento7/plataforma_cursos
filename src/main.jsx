import React from 'react';
import ReactDOM from 'react-dom/client';
// --- CORREÇÃO: Usando caminhos relativos ---
import './index.css'; // Importa seu CSS global
import './styles/ui.css'; // Linguagem visual (tokens e componentes); vem depois do CSS legado
import App from './App.jsx'; // Importa seu "Cérebro"
// --- FIM DA CORREÇÃO ---

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// Executa todos os testes de integração da API, um por vez.
//
// Uso:
//   npm run test:api                                   (API local em http://localhost:3001)
//   npm run test:api -- https://seu-projeto.vercel.app (API publicada)
//
// Os testes chamam a API de verdade e usam o banco configurado em backend/.env:
// criam usuários, cursos e arquivos temporários (e-mails @cursolab.test, cursos
// "[TESTE] ...") e removem tudo ao final de cada suíte.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const directory = path.dirname(fileURLToPath(import.meta.url));
const apiUrl = process.argv[2] || process.env.API_URL || 'http://localhost:3001';
const suites = readdirSync(directory).filter((file) => file.endsWith('.test.mjs')).sort();

console.log(`Testando a API em ${apiUrl}\n`);

const results = suites.map((suite) => {
  console.log(`=== ${suite}`);
  const { status } = spawnSync(process.execPath, [path.join(directory, suite)], {
    stdio: 'inherit',
    env: { ...process.env, API_URL: apiUrl },
  });
  console.log('');
  return { suite, passed: status === 0 };
});

const failed = results.filter((result) => !result.passed);
console.log('Resumo:');
results.forEach(({ suite, passed }) => console.log(`  ${passed ? 'OK  ' : 'FAIL'} ${suite}`));
console.log(failed.length === 0 ? '\nTodas as suítes passaram.' : `\n${failed.length} suíte(s) com falha.`);
process.exit(failed.length === 0 ? 0 : 1);

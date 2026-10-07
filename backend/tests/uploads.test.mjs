// Teste do envio de material: URL assinada pela API -> PUT direto no Storage -> link público.
// Uso: npm run test:api [-- <url-da-api>]  (padrão: http://localhost:3001)
import { supabaseAdmin } from '../src/supabase.js';

const base = process.env.API_URL || 'http://localhost:3001';

const stamp = Date.now();
const email = `teste-upload-${stamp}@cursolab.test`;
const password = `Teste-${stamp}`;
let userId;
let courseId;
let uploadedPath;
let uploadedVideoPath;
let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}${!ok && detail ? ` -> ${detail}` : ''}`);
  if (!ok) failures += 1;
};
const api = async (method, url, token, body) => {
  const r = await fetch(`${base}${url}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  return { status: r.status, body: text ? JSON.parse(text) : null };
};

try {
  const { data: bucket } = await supabaseAdmin.storage.getBucket('course-materials');
  check('bucket course-materials existe e é público', bucket?.public === true, JSON.stringify(bucket));

  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: 'Teste Upload' } });
  if (error) throw error;
  userId = created.user.id;
  await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', userId);
  const token = (await api('POST', '/api/auth/login', null, { email, password })).body.accessToken;
  const course = await api('POST', '/api/courses', token, { title: `[TESTE] Upload ${stamp}`, price: 0, level: 'Iniciante' });
  courseId = course.body.id;

  const pdf = new Blob(['%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF'], { type: 'application/pdf' });
  const signed = await api('POST', `/api/courses/${courseId}/uploads`, token, { kind: 'material', fileName: 'Apostila Módulo 1.pdf', contentType: 'application/pdf', size: pdf.size });
  check('API gera URL assinada', signed.status === 200 && signed.body.signedUrl && signed.body.publicUrl, JSON.stringify(signed.body));
  uploadedPath = decodeURIComponent(new URL(signed.body.publicUrl).pathname.split('/course-materials/')[1]);
  check('nome do arquivo sanitizado', /Apostila-Modulo-1\.pdf$/.test(uploadedPath), uploadedPath);

  // Mesmo formato de requisição que o navegador usa (sem apikey, só a URL assinada).
  const put = await fetch(signed.body.signedUrl, { method: 'PUT', headers: { 'Content-Type': 'application/pdf', 'x-upsert': 'false' }, body: pdf });
  check('PUT direto no Storage', put.ok, `${put.status} ${await put.text()}`);

  const download = await fetch(signed.body.publicUrl);
  const content = await download.text();
  check('link público baixa o arquivo', download.ok && content.startsWith('%PDF'), `${download.status}`);
  check('content-type preservado', download.headers.get('content-type')?.includes('application/pdf'), download.headers.get('content-type'));

  const badType = await api('POST', `/api/courses/${courseId}/uploads`, token, { kind: 'material', fileName: 'virus.exe', contentType: 'application/x-msdownload', size: 100 });
  check('rejeita .exe (400)', badType.status === 400, JSON.stringify(badType.body));
  const tooBig = await api('POST', `/api/courses/${courseId}/uploads`, token, { kind: 'material', fileName: 'grande.pdf', contentType: 'application/pdf', size: 25 * 1024 * 1024 });
  check('rejeita > 20 MB (400)', tooBig.status === 400, JSON.stringify(tooBig.body));
  const noAuth = await api('POST', `/api/courses/${courseId}/uploads`, null, { kind: 'material', fileName: 'a.pdf', contentType: 'application/pdf', size: 10 });
  check('sem token (401)', noAuth.status === 401);
  const noCourse = await api('POST', '/api/courses/999999999/uploads', token, { kind: 'material', fileName: 'a.pdf', contentType: 'application/pdf', size: 10 });
  check('curso inexistente (404)', noCourse.status === 404);

  // Vídeo
  const { data: videoBucket } = await supabaseAdmin.storage.getBucket('course-videos');
  check('bucket course-videos existe e é público', videoBucket?.public === true, JSON.stringify(videoBucket));
  const mp4 = new Blob([new Uint8Array(2048)], { type: 'video/mp4' });
  const signedVideo = await api('POST', `/api/courses/${courseId}/uploads`, token, { kind: 'video', fileName: 'Aula 1.mp4', contentType: 'video/mp4', size: mp4.size });
  check('API gera URL assinada de vídeo', signedVideo.status === 200 && signedVideo.body.publicUrl.includes('/course-videos/'), JSON.stringify(signedVideo.body));
  uploadedVideoPath = decodeURIComponent(new URL(signedVideo.body.publicUrl).pathname.split('/course-videos/')[1]);
  const putVideo = await fetch(signedVideo.body.signedUrl, { method: 'PUT', headers: { 'Content-Type': 'video/mp4', 'x-upsert': 'false' }, body: mp4 });
  check('PUT do vídeo no Storage', putVideo.ok, `${putVideo.status} ${await putVideo.text()}`);
  const getVideo = await fetch(signedVideo.body.publicUrl);
  check('link público do vídeo responde como video/mp4', getVideo.ok && getVideo.headers.get('content-type')?.includes('video/mp4'), `${getVideo.status} ${getVideo.headers.get('content-type')}`);
  const bigVideo = await api('POST', `/api/courses/${courseId}/uploads`, token, { kind: 'video', fileName: 'grande.mp4', contentType: 'video/mp4', size: 60 * 1024 * 1024 });
  check('rejeita vídeo > 50 MB (400)', bigVideo.status === 400, JSON.stringify(bigVideo.body));
  const pdfAsVideo = await api('POST', `/api/courses/${courseId}/uploads`, token, { kind: 'video', fileName: 'a.pdf', contentType: 'application/pdf', size: 10 });
  check('rejeita PDF como vídeo (400)', pdfAsVideo.status === 400, JSON.stringify(pdfAsVideo.body));
  const badKind = await api('POST', `/api/courses/${courseId}/uploads`, token, { kind: 'outro', fileName: 'a.pdf', contentType: 'application/pdf', size: 10 });
  check('rejeita tipo de envio desconhecido (400)', badKind.status === 400, JSON.stringify(badKind.body));
} catch (error) {
  failures += 1;
  console.error('ERRO', error);
} finally {
  if (uploadedVideoPath) await supabaseAdmin.storage.from('course-videos').remove([uploadedVideoPath]);
  if (uploadedPath) await supabaseAdmin.storage.from('course-materials').remove([uploadedPath]);
  if (courseId) await supabaseAdmin.from('courses').delete().eq('id', courseId);
  if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
  console.log(`\nLimpeza feita. ${failures === 0 ? 'Todos os testes passaram.' : `${failures} falha(s).`}`);
  process.exit(failures === 0 ? 0 : 1);
}

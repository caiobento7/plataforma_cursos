// Nota com uma casa decimal e vírgula: 4,7
export const formatRating = (value) => (Number(value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const formatDate = (value) => (value ? new Date(value).toLocaleDateString('pt-BR') : '');

const dayInMs = 24 * 60 * 60 * 1000;

// Situação do acesso a um curso a partir da data de expiração da matrícula.
export const getAccessInfo = (expiresAt) => {
  if (!expiresAt) return { expired: false, expiresSoon: false, daysLeft: null };
  const daysLeft = Math.ceil((new Date(expiresAt) - Date.now()) / dayInMs);
  return { expired: daysLeft <= 0, expiresSoon: daysLeft > 0 && daysLeft <= 30, daysLeft };
};

// Data em que o acesso de uma compra feita hoje vai expirar.
export const accessEndDate = (accessMonths = 6) => {
  const date = new Date();
  date.setMonth(date.getMonth() + accessMonths);
  return date;
};

export const formatPrice = (price) => (price === 0
  ? 'Gratuito'
  : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price));

// Percentual de aulas concluídas (vídeos e quizzes), o mesmo cálculo feito
// pela API em GET /api/enrollments/me.
export const calculateProgress = (courseId, courseProgress, content) => {
  const completed = courseProgress[courseId]?.completed;
  const lessons = (content || []).flatMap((module) => module.lessons);
  if (!completed || lessons.length === 0) return 0;

  const completedCount = lessons.filter((lesson) => completed.has(lesson.id)).length;
  return Math.round((completedCount / lessons.length) * 100);
};

// Converte links do YouTube e do Vimeo para o endereço de incorporação
// (iframe). Para outros links, como um .mp4 do Storage, devolve null e o
// player usa a tag <video>.
export const getVideoEmbedUrl = (url) => {
  if (!url) return null;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\.|^m\./, '');
  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1);
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, section, pathId] = parsed.pathname.split('/');
    const id = parsed.searchParams.get('v') || (['embed', 'shorts', 'live'].includes(section) ? pathId : null);
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = parsed.pathname.split('/').find((part) => /^\d+$/.test(part));
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
};

export const calculateProgress = (courseId, courseProgress, content) => {
  const progressData = courseProgress[courseId];
  const courseContent = content || [];

  const totalVideoLessons = courseContent.reduce(
    (total, module) => total + module.lessons.filter(l => l.type === 'video').length,
    0
  );

  if (!progressData || totalVideoLessons === 0) {
    return 0;
  }

  const completedVideoLessons = Array.from(progressData.completed).filter(lessonId => {
    for (const module of courseContent) {
      if (module.lessons.find(l => l.id === lessonId && l.type === 'video')) {
        return true;
      }
    }
    return false;
  }).length;

  return Math.round((completedVideoLessons / totalVideoLessons) * 100);
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
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, section, pathId] = parsed.pathname.split('/');
    const id = parsed.searchParams.get('v') || (['embed', 'shorts', 'live'].includes(section) ? pathId : null);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = parsed.pathname.split('/').find((part) => /^\d+$/.test(part));
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
};

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

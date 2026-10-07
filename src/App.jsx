import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import CartPage from './pages/CartPage.jsx';
import CourseDetailsPage from './pages/CourseDetailsPage.jsx';
import CourseEditorPage from './pages/CourseEditorPage.jsx';
import EditCourseMetadataPage from './pages/EditCourseMetadataPage.jsx';
import EnrollmentSuccessPage from './pages/EnrollmentSuccessPage.jsx';
import HomePage from './pages/HomePage.jsx';
import InfoPage from './pages/InfoPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LessonPlayerPage from './pages/LessonPlayerPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProfessorDashboardPage from './pages/ProfessorDashboardPage.jsx';
import StudentDashboardPage from './pages/StudentDashboardPage.jsx';
import { courseImages } from './data/courseImages.js';
import { api, hasStoredSession, setAccessToken } from './services/api.js';

const toCourse = (course) => ({
  id: course.id,
  title: course.title,
  instructorId: course.instructor_id || course.instructorId || null,
  instructor: course.instructor?.full_name || 'Equipe CursoLab',
  price: Number(course.price),
  level: course.level,
  rating: Number.isFinite(Number(course.rating)) ? Number(course.rating) : 0,
  reviewCount: Number(course.review_count || course.reviewCount) || 0,
  enrollmentCount: Number(course.enrollment_count || course.enrollmentCount) || 0,
  imageUrl: courseImages[course.title] || course.imageUrl || course.image_url || 'https://placehold.co/600x400/1e293b/ffffff?text=Curso',
});

// Telas abertas a visitantes. As demais exigem login (ver renderização no App).
const publicPages = ['landing', 'login'];

const isPasswordRecoveryLink = () => {
  const query = new URLSearchParams(window.location.search);
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  return query.get('mode') === 'recovery' || query.has('code') || fragment.get('type') === 'recovery';
};

const App = () => {
  const [currentPage, setCurrentPage] = useState(() => (isPasswordRecoveryLink() ? 'login' : 'landing'));
  const [currentPageData, setCurrentPageData] = useState(() => (isPasswordRecoveryLink() ? 'recovery' : null));
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [cart, setCart] = useState([]);
  const [recentlyPurchasedCourses, setRecentlyPurchasedCourses] = useState([]);
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [coursesContentDB, setCoursesContentDB] = useState({});
  const [courseProgress, setCourseProgress] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  // Com uma sessão salva, espera o perfil chegar antes de decidir a tela, para
  // quem já está logado não ver a landing piscar.
  const [isRestoringSession, setIsRestoringSession] = useState(() => hasStoredSession());
  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [pendingCheckoutCourseId, setPendingCheckoutCourseId] = useState(null);
  const [activeInfoPage, setActiveInfoPage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ level: 'all', price: 'all', rating: 'all' });

  const loadCourses = useCallback(async () => {
    try {
      const courses = await api.getCourses();
      setAllCourses(courses.map(toCourse));
    } catch (error) {
      console.error('Não foi possível carregar os cursos:', error.message);
    }
  }, []);

  const loadEnrollments = useCallback(async () => {
    try {
      const enrollments = await api.getEnrollments();
      setPurchasedCourses(enrollments.map((enrollment) => ({
        ...toCourse(enrollment.course),
        enrolledAt: enrollment.enrolled_at,
        progress: enrollment.progress,
      })));
    } catch (error) {
      console.error('Não foi possível carregar as matrículas:', error.message);
    }
  }, []);

  // undefined = carregando, null = falha ao carregar. O editor de conteúdo usa
  // essa diferença para não salvar uma lista vazia por cima do curso.
  const loadCourseContent = useCallback(async (courseId) => {
    try {
      const content = await api.getCourseContent(courseId);
      setCoursesContentDB((previous) => ({ ...previous, [courseId]: content }));
    } catch (error) {
      console.error('Não foi possível carregar o conteúdo:', error.message);
      setCoursesContentDB((previous) => ({ ...previous, [courseId]: null }));
    }
  }, []);

  // O progresso vem do banco com as aulas já concluídas. Os módulos liberados
  // não são persistidos: são derivados desse conjunto pelo LessonPlayerPage.
  const loadCourseProgress = useCallback(async (courseId) => {
    try {
      const { completedLessonIds, nextLessonId } = await api.getCourseProgress(courseId);
      setCourseProgress((previous) => ({
        ...previous,
        [courseId]: { completed: new Set(completedLessonIds), nextLessonId },
      }));
    } catch {
      // Visitante ou aluno sem matrícula no curso: a API responde 403 e a
      // aplicação segue com o progresso vazio, sem interromper a navegação.
    }
  }, []);

  const loadAdminAnalytics = useCallback(async () => {
    try {
      setAdminAnalytics(await api.getAdminAnalytics());
    } catch (error) {
      console.error('Não foi possível carregar os indicadores:', error.message);
      setAdminAnalytics(null);
    }
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  useEffect(() => {
    const restoreSession = async () => {
      if (!hasStoredSession()) return;
      try {
        const profile = await api.getProfile();
        setCurrentUser(profile);
        setCurrentPage((page) => (page === 'landing' ? (profile.role === 'admin' ? 'dashboard' : 'studentDashboard') : page));
        await loadEnrollments();
        if (profile.role === 'admin') await loadAdminAnalytics();
      } catch {
        setAccessToken(null);
      } finally {
        setIsRestoringSession(false);
      }
    };
    restoreSession();
  }, [loadAdminAnalytics, loadEnrollments]);

  const navigateTo = (page, data = null) => {
    if (page === 'cart' && currentUser?.role !== 'student') {
      setCurrentPage('login');
      setCurrentPageData('login');
      window.scrollTo(0, 0);
      return;
    }

    setCurrentPage(page);
    if (['details', 'player', 'courseEditor', 'editCourseMetadata'].includes(page)) {
      setSelectedCourseId(data);
      loadCourseContent(data);
      if (page === 'player') {
        // Descarta o progresso de uma visita anterior: o player só se posiciona
        // quando chega a aula atualizada em que o aluno deve continuar.
        setCourseProgress((previous) => ({ ...previous, [data]: undefined }));
        loadCourseProgress(data);
      }
    }
    if (page === 'login') {
      setPendingCheckoutCourseId(Number.isInteger(data?.checkoutCourseId) ? data.checkoutCourseId : null);
      setCurrentPageData(typeof data === 'string' ? data : 'login');
    }
    if (page === 'dashboard') setCurrentPageData(data);
    // Atualiza o progresso dos cursos ao voltar para o painel do aluno.
    if (page === 'studentDashboard' && currentUser?.role === 'student') loadEnrollments();
    window.scrollTo(0, 0);
  };

  const handleAuthenticated = async ({ accessToken, refreshToken }) => {
    setAccessToken(accessToken, refreshToken);
    const profile = await api.getProfile();
    setCurrentUser(profile);
    await loadEnrollments();
    if (profile.role === 'admin') await loadAdminAnalytics();
    return profile;
  };

  const handleLoginComplete = (profile) => {
    const checkoutCourse = allCourses.find((course) => course.id === pendingCheckoutCourseId);

    if (profile.role === 'student' && checkoutCourse) {
      setPendingCheckoutCourseId(null);
      setCart((previous) => previous.some((course) => course.id === checkoutCourse.id) || purchasedCourses.some((course) => course.id === checkoutCourse.id)
        ? previous
        : [...previous, checkoutCourse]);
      setCurrentPage('cart');
      setCurrentPageData(null);
      window.scrollTo(0, 0);
      return;
    }

    if (profile.role === 'student' && cart.length > 0) {
      setCurrentPage('cart');
      setCurrentPageData(null);
      window.scrollTo(0, 0);
      return;
    }

    setPendingCheckoutCourseId(null);
    navigateTo(profile.role === 'admin' ? 'dashboard' : 'studentDashboard');
  };

  const handleSignOut = () => {
    setAccessToken(null);
    setCurrentUser(null);
    setAdminAnalytics(null);
    setPurchasedCourses([]);
    setCourseProgress({});
    setCart([]);
    navigateTo('landing');
  };

  const addToCart = (course) => {
    if (currentUser?.role !== 'student') {
      navigateTo('login');
      return false;
    }

    if (!cart.some((item) => item.id === course.id) && !purchasedCourses.some((item) => item.id === course.id)) {
      setCart((previous) => [...previous, course]);
    }
    return true;
  };

  const handlePurchase = async () => {
    if (!currentUser) {
      alert('Entre na sua conta para se matricular.');
      navigateTo('login');
      return;
    }
    try {
      const purchasedNow = [...cart];
      await Promise.all(purchasedNow.map((course) => api.enroll(course.id)));
      setCart([]);
      setRecentlyPurchasedCourses(purchasedNow);
      await loadEnrollments();
      navigateTo('enrollmentSuccess');
    } catch (error) {
      if (error.status === 401) {
        setAccessToken(null);
        setCurrentUser(null);
        navigateTo('login');
        return;
      }
      alert(error.message);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Tem certeza que deseja excluir este curso?')) return;
    try {
      await api.deleteCourse(courseId);
      await loadCourses();
      await loadAdminAnalytics();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCreateCourse = async (course) => {
    try {
      const created = await api.createCourse(course);
      await loadCourses();
      await loadAdminAnalytics();
      navigateTo('courseEditor', created.id);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleUpdateCourseMetadata = async (courseId, course) => {
    try {
      await api.updateCourse(courseId, course);
      await loadCourses();
      await loadAdminAnalytics();
      navigateTo('dashboard', 'manage-courses');
    } catch (error) {
      alert(error.message);
    }
  };

  // Erros sobem para o editor, que os exibe sem sair da página.
  const handleSaveCourseContent = async (courseId, modules) => {
    const content = await api.saveCourseContent(courseId, modules);
    setCoursesContentDB((previous) => ({ ...previous, [courseId]: content }));
  };

  const handleProgressUpdate = useCallback((courseId, data) => {
    setCourseProgress((previous) => ({ ...previous, [courseId]: { completed: data.completed } }));

    // Apenas a conclusão de aula é gravada. Os módulos liberados são derivados
    // do conjunto de aulas concluídas, então não precisam ir ao banco.
    if (!data.changedLesson) return;

    const { id: lessonId, completed } = data.changedLesson;
    api.setLessonProgress(lessonId, completed).catch(() => {
      // A gravação falhou: desfaz a marca local para a interface não exibir um
      // progresso que o banco não registrou.
      setCourseProgress((previous) => {
        const current = previous[courseId];
        if (!current) return previous;
        const revertido = new Set(current.completed);
        if (completed) revertido.delete(lessonId);
        else revertido.add(lessonId);
        return { ...previous, [courseId]: { ...current, completed: revertido } };
      });
      alert('Não foi possível salvar seu progresso. Verifique sua conexão e tente novamente.');
    });
  }, []);

  const filteredCourses = useMemo(() => allCourses.filter((course) => {
    const term = searchTerm.toLowerCase();
    if (term && !course.title.toLowerCase().includes(term) && !course.instructor.toLowerCase().includes(term)) return false;
    if (filters.level !== 'all' && course.level !== filters.level) return false;
    if (filters.price === 'gratuito' && course.price !== 0) return false;
    if (filters.price === 'ate50' && (course.price === 0 || course.price > 50)) return false;
    if (filters.price === '50a100' && (course.price <= 50 || course.price > 100)) return false;
    if (filters.price === 'acima100' && course.price <= 100) return false;
    return filters.rating === 'all' || course.rating >= Number(filters.rating);
  }), [allCourses, filters, searchTerm]);

  const enrolledCourseIds = purchasedCourses.map((course) => course.id);
  const selectedCourse = allCourses.find((course) => course.id === selectedCourseId);
  const selectedContent = coursesContentDB[selectedCourseId];
  const renderAdminDashboard = () => <ProfessorDashboardPage navigateTo={navigateTo} handleCreateCourse={handleCreateCourse} allCourses={allCourses} analytics={adminAnalytics} handleDeleteCourse={handleDeleteCourse} activeTab={currentPageData} />;

  // Visitante tentando abrir uma tela interna vai para o login.
  const page = !currentUser && !publicPages.includes(currentPage) ? 'login' : currentPage;

  const renderPage = () => {
    switch (page) {
      case 'landing': return <LandingPage courses={allCourses} onLogin={() => navigateTo('login')} onRegister={() => navigateTo('login', 'register')} onInfoOpen={setActiveInfoPage} />;
      case 'home': return currentUser?.role === 'admin'
        ? renderAdminDashboard()
        : <HomePage navigateTo={navigateTo} courses={filteredCourses} filters={filters} setFilters={setFilters} searchTerm={searchTerm} setSearchTerm={setSearchTerm} enrolledCourseIds={enrolledCourseIds} />;
      case 'details': return <CourseDetailsPage navigateTo={navigateTo} course={selectedCourse} content={selectedContent} addToCart={addToCart} isEnrolled={enrolledCourseIds.includes(selectedCourseId)} isInCart={cart.some((course) => course.id === selectedCourseId)} />;
      case 'player': return <LessonPlayerPage navigateTo={navigateTo} course={selectedCourse} courseId={selectedCourseId} content={selectedContent} progress={courseProgress[selectedCourseId]} onProgressUpdate={handleProgressUpdate} />;
      case 'dashboard': return currentUser?.role === 'admin'
        ? renderAdminDashboard()
        : <HomePage navigateTo={navigateTo} courses={filteredCourses} filters={filters} setFilters={setFilters} searchTerm={searchTerm} setSearchTerm={setSearchTerm} enrolledCourseIds={enrolledCourseIds} />;
      case 'courseEditor': return <CourseEditorPage navigateTo={navigateTo} course={selectedCourse} content={selectedContent} onSaveContent={handleSaveCourseContent} />;
      case 'editCourseMetadata': return <EditCourseMetadataPage navigateTo={navigateTo} course={selectedCourse} onUpdateCourse={handleUpdateCourseMetadata} />;
      case 'login': return <LoginPage key={currentPageData || 'login'} navigateTo={navigateTo} initialTab={currentPageData || 'login'} onAuthenticated={handleAuthenticated} onLoginComplete={handleLoginComplete} />;
      case 'cart': return <CartPage cart={cart} navigateTo={navigateTo} removeFromCart={(id) => setCart((previous) => previous.filter((course) => course.id !== id))} handlePurchase={handlePurchase} />;
      case 'enrollmentSuccess': return currentUser?.role === 'student'
        ? <EnrollmentSuccessPage courses={recentlyPurchasedCourses} navigateTo={navigateTo} />
        : <HomePage navigateTo={navigateTo} courses={filteredCourses} filters={filters} setFilters={setFilters} searchTerm={searchTerm} setSearchTerm={setSearchTerm} enrolledCourseIds={enrolledCourseIds} />;
      case 'studentDashboard': return currentUser?.role === 'student'
        ? <StudentDashboardPage navigateTo={navigateTo} purchasedCourses={purchasedCourses} currentUser={currentUser} onProfileUpdated={setCurrentUser} />
        : <HomePage navigateTo={navigateTo} courses={filteredCourses} filters={filters} setFilters={setFilters} searchTerm={searchTerm} setSearchTerm={setSearchTerm} enrolledCourseIds={enrolledCourseIds} />;
      default: return <HomePage navigateTo={navigateTo} courses={filteredCourses} filters={filters} setFilters={setFilters} searchTerm={searchTerm} setSearchTerm={setSearchTerm} enrolledCourseIds={enrolledCourseIds} />;
    }
  };

  if (isRestoringSession) {
    return <div className="ui-boot" role="status" aria-label="Carregando"><span /></div>;
  }

  const showAppHeader = Boolean(currentUser) && !publicPages.includes(page);

  return (
    <>
      {showAppHeader && <Header navigateTo={navigateTo} currentPage={page} cartItemCount={cart.length} currentUser={currentUser} onSignOut={handleSignOut} />}
      <main>{renderPage()}</main>
      {activeInfoPage && <InfoPage page={activeInfoPage} onClose={() => setActiveInfoPage(null)} />}
    </>
  );
};

export default App;

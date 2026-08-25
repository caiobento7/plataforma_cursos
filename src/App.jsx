import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import CartPage from './pages/CartPage.jsx';
import CourseDetailsPage from './pages/CourseDetailsPage.jsx';
import CourseEditorPage from './pages/CourseEditorPage.jsx';
import EditCourseMetadataPage from './pages/EditCourseMetadataPage.jsx';
import EnrollmentSuccessPage from './pages/EnrollmentSuccessPage.jsx';
import HomePage from './pages/HomePage.jsx';
import InfoPage from './pages/InfoPage.jsx';
import LessonPlayerPage from './pages/LessonPlayerPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProfessorDashboardPage from './pages/ProfessorDashboardPage.jsx';
import StudentDashboardPage from './pages/StudentDashboardPage.jsx';
import { courseImages } from './data/courseImages.js';
import { api, setAccessToken } from './services/api.js';

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

const isPasswordRecoveryLink = () => {
  const query = new URLSearchParams(window.location.search);
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  return query.get('mode') === 'recovery' || query.has('code') || fragment.get('type') === 'recovery';
};

const App = () => {
  const [currentPage, setCurrentPage] = useState(() => (isPasswordRecoveryLink() ? 'login' : 'home'));
  const [currentPageData, setCurrentPageData] = useState(() => (isPasswordRecoveryLink() ? 'recovery' : null));
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [cart, setCart] = useState([]);
  const [recentlyPurchasedCourses, setRecentlyPurchasedCourses] = useState([]);
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [coursesContentDB, setCoursesContentDB] = useState({});
  const [courseProgress, setCourseProgress] = useState({});
  const [questionsDB] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
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
      setPurchasedCourses(enrollments.map((enrollment) => toCourse(enrollment.course)));
    } catch (error) {
      console.error('Não foi possível carregar as matrículas:', error.message);
    }
  }, []);

  const loadCourseContent = useCallback(async (courseId) => {
    try {
      const content = await api.getCourseContent(courseId);
      setCoursesContentDB((previous) => ({ ...previous, [courseId]: content }));
    } catch (error) {
      console.error('Não foi possível carregar o conteúdo:', error.message);
      setCoursesContentDB((previous) => ({ ...previous, [courseId]: [] }));
    }
  }, []);

  // O progresso vem do banco com as aulas já concluídas. Os módulos liberados
  // não são persistidos: são derivados desse conjunto pelo LessonPlayerPage.
  const loadCourseProgress = useCallback(async (courseId) => {
    try {
      const { completedLessonIds } = await api.getCourseProgress(courseId);
      setCourseProgress((previous) => ({
        ...previous,
        [courseId]: {
          completed: new Set(completedLessonIds),
          unlocked: previous[courseId]?.unlocked || new Set([0]),
        },
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
      try {
        const profile = await api.getProfile();
        setCurrentUser(profile);
        await loadEnrollments();
        if (profile.role === 'admin') await loadAdminAnalytics();
      } catch {
        setAccessToken(null);
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
      if (page === 'player') loadCourseProgress(data);
    }
    if (page === 'login') {
      setPendingCheckoutCourseId(Number.isInteger(data?.checkoutCourseId) ? data.checkoutCourseId : null);
      setCurrentPageData(typeof data === 'string' ? data : 'login');
    }
    if (page === 'dashboard') setCurrentPageData(data);
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
    setCart([]);
    navigateTo('home');
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

  // useCallback para manter a referência estável: o LessonPlayerPage usa esta
  // função como dependência de um efeito, que sem isso rodaria a cada render.
  const handleProgressUpdate = useCallback((courseId, data) => {
    setCourseProgress((previous) => {
      const current = previous[courseId] || { completed: new Set(), unlocked: new Set([0]) };
      return { ...previous, [courseId]: { completed: data.completed || current.completed, unlocked: data.unlocked || current.unlocked } };
    });

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

  const suggestions = useMemo(() => searchTerm
    ? allCourses.filter((course) => course.title.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5)
    : [], [allCourses, searchTerm]);

  const selectedCourse = allCourses.find((course) => course.id === selectedCourseId);
  const selectedContent = coursesContentDB[selectedCourseId];
  const renderAdminDashboard = () => <ProfessorDashboardPage navigateTo={navigateTo} handleCreateCourse={handleCreateCourse} allCourses={allCourses} analytics={adminAnalytics} handleDeleteCourse={handleDeleteCourse} activeTab={currentPageData} />;

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return currentUser?.role === 'admin'
        ? renderAdminDashboard()
        : <HomePage navigateTo={navigateTo} courses={filteredCourses} filters={filters} setFilters={setFilters} />;
      case 'details': return <CourseDetailsPage navigateTo={navigateTo} course={selectedCourse} content={selectedContent} addToCart={addToCart} isAuthenticated={currentUser?.role === 'student'} />;
      case 'player': return <LessonPlayerPage navigateTo={navigateTo} courseId={selectedCourseId} content={selectedContent} progress={courseProgress[selectedCourseId]} onProgressUpdate={handleProgressUpdate} questions={questionsDB} onAskQuestion={() => {}} />;
      case 'dashboard': return currentUser?.role === 'admin'
        ? renderAdminDashboard()
        : <HomePage navigateTo={navigateTo} courses={filteredCourses} filters={filters} setFilters={setFilters} />;
      case 'courseEditor': return <CourseEditorPage navigateTo={navigateTo} course={selectedCourse} content={selectedContent} onUpdateContent={(courseId, content) => setCoursesContentDB((previous) => ({ ...previous, [courseId]: content }))} />;
      case 'editCourseMetadata': return <EditCourseMetadataPage navigateTo={navigateTo} course={selectedCourse} onUpdateCourse={handleUpdateCourseMetadata} />;
      case 'login': return <LoginPage navigateTo={navigateTo} initialTab={currentPageData || 'login'} onAuthenticated={handleAuthenticated} onLoginComplete={handleLoginComplete} />;
      case 'cart': return <CartPage cart={cart} navigateTo={navigateTo} removeFromCart={(id) => setCart((previous) => previous.filter((course) => course.id !== id))} handlePurchase={handlePurchase} />;
      case 'enrollmentSuccess': return currentUser?.role === 'student'
        ? <EnrollmentSuccessPage courses={recentlyPurchasedCourses} navigateTo={navigateTo} />
        : <HomePage navigateTo={navigateTo} courses={filteredCourses} filters={filters} setFilters={setFilters} />;
      case 'studentDashboard': return currentUser?.role === 'student'
        ? <StudentDashboardPage navigateTo={navigateTo} purchasedCourses={purchasedCourses} courseProgress={courseProgress} coursesContentDB={coursesContentDB} />
        : <HomePage navigateTo={navigateTo} courses={filteredCourses} filters={filters} setFilters={setFilters} />;
      default: return <HomePage navigateTo={navigateTo} courses={filteredCourses} filters={filters} setFilters={setFilters} />;
    }
  };

  const isAuthenticationPage = currentPage === 'login';

  return <>{!isAuthenticationPage && <Header navigateTo={navigateTo} cartItemCount={cart.length} searchTerm={searchTerm} setSearchTerm={setSearchTerm} suggestions={suggestions} onSuggestionClick={(course) => { setSearchTerm(''); navigateTo('details', course.id); }} currentUser={currentUser} onSignOut={handleSignOut} />}<main>{renderPage()}</main>{!isAuthenticationPage && currentUser?.role !== 'admin' && <Footer onInfoOpen={setActiveInfoPage} />}{activeInfoPage && <InfoPage page={activeInfoPage} onClose={() => setActiveInfoPage(null)} />}</>;
};

export default App;

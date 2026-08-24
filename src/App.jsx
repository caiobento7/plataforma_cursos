import React, { useState, useMemo, useCallback } from 'react';

// Importar Dados
import { initialCourses, initializeContentDB, initialQuestions } from './data/initialData.js';

// Importar Hooks
import usePersistedState from './hooks/usePersistedState.js';

// Importar Componentes
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';

// Importar Páginas
import HomePage from './pages/HomePage.jsx';
import CourseDetailsPage from './pages/CourseDetailsPage.jsx';
import LessonPlayerPage from './pages/LessonPlayerPage.jsx';
import ProfessorDashboardPage from './pages/ProfessorDashboardPage.jsx';
import CourseEditorPage from './pages/CourseEditorPage.jsx';
import EditCourseMetadataPage from './pages/EditCourseMetadataPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import CartPage from './pages/CartPage.jsx';
import StudentDashboardPage from './pages/StudentDashboardPage.jsx';


// --- PERSISTÊNCIA DO PROGRESSO ---
// O progresso guarda as aulas concluídas e liberadas em Sets, que o JSON não
// representa (JSON.stringify(new Set([1])) devolve "{}"). Por isso a conversão
// para array na gravação e a reconstrução dos Sets na leitura.

const serializeProgress = (progress) =>
  Object.fromEntries(
    Object.entries(progress).map(([courseId, { completed, unlocked }]) => [
      courseId,
      { completed: [...completed], unlocked: [...unlocked] }
    ])
  );

const deserializeProgress = (stored) =>
  Object.fromEntries(
    Object.entries(stored).map(([courseId, { completed, unlocked }]) => [
      courseId,
      { completed: new Set(completed), unlocked: new Set(unlocked) }
    ])
  );

const progressStorageOptions = {
  serialize: serializeProgress,
  deserialize: deserializeProgress
};

// --- COMPONENTE PRINCIPAL (APP) ---

const App = () => {
  // Estado de navegação e de interface: intencionalmente NÃO persistido, para
  // que a aplicação sempre reabra na home, sem filtros ou buscas residuais.
  const [currentPage, setCurrentPage] = useState('home');
  const [currentPageData, setCurrentPageData] = useState(null); 
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  // Dados da aplicação: persistidos no navegador para sobreviver ao F5.
  const [cart, setCart] = usePersistedState('cart', []);
  const [allCourses, setAllCourses] = usePersistedState('allCourses', initialCourses);
  const [purchasedCourses, setPurchasedCourses] = usePersistedState('purchasedCourses', []);
  const [courseProgress, setCourseProgress] = usePersistedState('courseProgress', {}, progressStorageOptions);
  const [questionsDB, setQuestionsDB] = usePersistedState('questionsDB', initialQuestions);
  const [coursesContentDB, setCoursesContentDB] = usePersistedState('coursesContentDB', initializeContentDB);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    level: 'all',
    price: 'all',
    rating: 'all'
  });

  const navigateTo = (page, data = null) => {
    setCurrentPage(page);
    
    if (page === 'details' || page === 'player' || page === 'courseEditor' || page === 'editCourseMetadata') {
      setSelectedCourseId(data); 
    }
    if (page === 'login') {
      setCurrentPageData(data); 
    }
     if (page === 'dashboard') {
      setCurrentPageData(data); 
    }
    
    window.scrollTo(0, 0);
  };

  const addToCart = (courseToAdd) => {
    if (purchasedCourses.find(c => c.id === courseToAdd.id)) {
      alert("Você já possui este curso!");
      return;
    }
    if (!cart.find(course => course.id === courseToAdd.id)) {
      setCart(prevCart => [...prevCart, courseToAdd]);
    }
  };

  const removeFromCart = (courseId) => {
    setCart(prevCart => prevCart.filter(course => course.id !== courseId));
  };

  const handlePurchase = () => {
    setPurchasedCourses(prevPurchased => {
      const newCourses = cart.filter(cartItem => 
        !prevPurchased.find(purchasedItem => purchasedItem.id === cartItem.id)
      );
      return [...prevPurchased, ...newCourses];
    });
    setCart([]); 
    alert('Compra realizada com sucesso! Seus cursos estão em "Meus Cursos".');
    navigateTo('studentDashboard'); 
  };

  const handleDeleteCourse = (courseId) => {
    const isConfirmed = window.confirm('Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.');
    if (isConfirmed) {
      setAllCourses(prev => prev.filter(c => c.id !== courseId));
    }
  };

  // useCallback para manter a referência estável: o LessonPlayerPage usa esta
  // função como dependência de um useEffect, que sem isso rodaria a cada render.
  const handleProgressUpdate = useCallback((courseId, newProgressData) => {
    setCourseProgress(prev => {
      const current = prev[courseId] || { completed: new Set(), unlocked: new Set([0]) };
      return {
        ...prev,
        [courseId]: {
          completed: newProgressData.completed || current.completed,
          unlocked: newProgressData.unlocked || current.unlocked
        }
      };
    });
  }, [setCourseProgress]);

  const handleAskQuestion = ({ courseId, lessonId, text }) => {
    const newQuestion = {
      id: Date.now(),
      courseId,
      lessonId,
      author: 'Aluno (Simulado)', 
      date: new Date().toLocaleDateString(),
      text,
      answer: null
    };
    setQuestionsDB(prev => [newQuestion, ...prev]);
  };

  const handleAnswerQuestion = (questionId, answerText) => {
    setQuestionsDB(prevDB => prevDB.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          answer: {
            author: 'Professor (Logado)', 
            date: new Date().toLocaleDateString(),
            text: answerText
          }
        };
      }
      return q;
    }));
  };

  const autocompleteSuggestions = useMemo(() => {
    if (!searchTerm) return [];
    const searchTermLower = searchTerm.toLowerCase();
    return allCourses.filter(course => 
      course.title.toLowerCase().includes(searchTermLower) ||
      course.instructor.toLowerCase().includes(searchTermLower)
    ).slice(0, 5); 
  }, [searchTerm, allCourses]);

  const handleSuggestionClick = (course) => {
    setSearchTerm(''); 
    navigateTo('details', course.id);
  };

  const handleCreateCourse = (newCourse) => {
    setAllCourses(prevCourses => [newCourse, ...prevCourses]);
    setCoursesContentDB(prev => ({
      ...prev,
      [newCourse.id]: [] 
    }));
    navigateTo('courseEditor', newCourse.id);
  };
  
  const handleUpdateCourseContent = (courseId, newContent) => {
    setCoursesContentDB(prev => ({
      ...prev,
      [courseId]: newContent
    }));
  };

  const handleUpdateCourseMetadata = (courseId, updatedData) => {
    setAllCourses(prev => prev.map(course => 
      course.id === courseId ? updatedData : course
    ));
  };


  const filteredCourses = useMemo(() => {
    return allCourses.filter(course => {
      const searchTermLower = searchTerm.toLowerCase();
      if (searchTerm && !(
        course.title.toLowerCase().includes(searchTermLower) ||
        course.instructor.toLowerCase().includes(searchTermLower)
      )) {
        return false;
      }

      if (filters.level !== 'all' && course.level !== filters.level) return false;
      if (filters.price !== 'all') { 
        const price = course.price;
        if (filters.price === 'gratuito' && price !== 0) return false;
        if (filters.price === 'ate50' && (price === 0 || price > 50)) return false;
        if (filters.price === '50a100' && (price <= 50 || price > 100)) return false;
        if (filters.price === 'acima100' && price <= 100) return false;
      }
      if (filters.rating !== 'all' && course.rating < parseFloat(filters.rating)) return false;

      return true;
    });
  }, [allCourses, searchTerm, filters]);
  
  
  const renderPage = () => {
    const selectedCourse = allCourses.find(c => c.id === selectedCourseId);
    const selectedContent = coursesContentDB[selectedCourseId];

    switch (currentPage) {
      case 'home':
        return <HomePage
          navigateTo={navigateTo}
          courses={filteredCourses}
          filters={filters}
          setFilters={setFilters}
        />;
      case 'details':
        return <CourseDetailsPage 
          navigateTo={navigateTo} 
          course={selectedCourse} 
          content={selectedContent} 
          addToCart={addToCart}
        />;
      case 'player':
        return <LessonPlayerPage 
          navigateTo={navigateTo}
          courseId={selectedCourseId}
          content={selectedContent} 
          progress={courseProgress[selectedCourseId]}
          onProgressUpdate={handleProgressUpdate}
          questions={questionsDB}
          onAskQuestion={handleAskQuestion}
        />;
      case 'dashboard':
        return <ProfessorDashboardPage 
          navigateTo={navigateTo} 
          handleCreateCourse={handleCreateCourse}
          allCourses={allCourses} 
          handleDeleteCourse={handleDeleteCourse}
          questions={questionsDB}
          onAnswerQuestion={handleAnswerQuestion}
          activeTab={currentPageData} 
          coursesContentDB={coursesContentDB} 
        />;
      case 'courseEditor':
        return <CourseEditorPage
          navigateTo={navigateTo}
          course={selectedCourse}
          content={selectedContent}
          onUpdateContent={handleUpdateCourseContent}
        />;
      case 'editCourseMetadata':
        return <EditCourseMetadataPage
          navigateTo={navigateTo}
          course={selectedCourse}
          onUpdateCourse={handleUpdateCourseMetadata}
        />;
      case 'login':
        return <LoginPage navigateTo={navigateTo} initialTab={currentPageData || 'login'} />;
      case 'cart':
        return <CartPage 
          cart={cart} 
          navigateTo={navigateTo} 
          removeFromCart={removeFromCart} 
          handlePurchase={handlePurchase}
        />;
      case 'studentDashboard':
        return <StudentDashboardPage 
          navigateTo={navigateTo} 
          purchasedCourses={purchasedCourses}
          courseProgress={courseProgress}
          coursesContentDB={coursesContentDB} 
        />;
      default:
        return <HomePage
          navigateTo={navigateTo}
          courses={filteredCourses}
          filters={filters}
          setFilters={setFilters}
        />;
    }
  };

  return (
    <>
      {/* O <CssStyles /> foi removido, pois agora está no index.css */}
      <Header 
        navigateTo={navigateTo} 
        cartItemCount={cart.length}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        suggestions={autocompleteSuggestions}
        onSuggestionClick={handleSuggestionClick}
      />
      <main>
        {renderPage()}
      </main>
      <Footer />
    </>
  );
};

export default App;
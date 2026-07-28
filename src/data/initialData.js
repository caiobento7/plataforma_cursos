// --- "BANCO DE DADOS" DE CURSOS ---
export const initialCourses = [
    { id: 1, title: 'Introdução à Programação', instructor: 'João Silva', price: 99.90, level: 'Iniciante', rating: 4.7, imageUrl: 'https://placehold.co/600x400/2c3e50/ffffff?text=Programação' },
    { id: 2, title: 'Design UX/UI Avançado', instructor: 'Maria Santos', price: 149.90, level: 'Avançado', rating: 4.8, imageUrl: 'https://placehold.co/600x400/3498db/ffffff?text=UX/UI' },
    { id: 3, title: 'Marketing Digital', instructor: 'Carlos Oliveira', price: 0, level: 'Intermediário', rating: 4.5, imageUrl: 'https://placehold.co/600x400/e67e22/ffffff?text=Marketing' },
    { id: 4, title: 'Gestão de Projetos', instructor: 'Ana Costa', price: 199.90, level: 'Iniciante', rating: 4.6, imageUrl: 'https://placehold.co/600x400/1abc9c/ffffff?text=Gestão' },
    { id: 5, title: 'Python para Análise de Dados', instructor: 'João Silva', price: 129.90, level: 'Intermediário', rating: 4.9, imageUrl: 'https://placehold.co/600x400/9b59b6/ffffff?text=Python' },
    { id: 6, title: 'React: O Guia Completo', instructor: 'Maria Santos', price: 0, level: 'Avançado', rating: 4.7, imageUrl: 'https://placehold.co/600x400/34495e/ffffff?text=React' }
  ];
  
  // --- "BANCO DE DADOS" DE CONTEÚDO DO CURSO (Estático/Inicial) ---
  export const staticCourseContent = [
    {
      id: 'm1', // ID do Módulo
      title: 'Módulo 1: Introdução',
      lessons: [
        { id: '1-1', title: 'O que é programação?', duration: '15 min', type: 'video', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
        { id: '1-2', title: 'Primeiros passos', duration: '20 min', type: 'video', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', documentUrl: null },
        { 
          id: '1-3', 
          title: 'Quiz: Conceitos básicos', 
          duration: '10 min', 
          type: 'quiz', 
          quizData: { // O quiz agora está embutido
            passMark: 70, 
            questions: [
              { id: 'q1-1', text: 'O que é uma variável?', options: ['Um valor constante', 'Um contêiner para armazenar dados', 'Uma função', 'Um tipo de loop'], correct: 'Um contêiner para armazenar dados' },
              { id: 'q1-2', text: 'O que "HTML" significa?', options: ['HyperText Markup Language', 'High-Level Text Machine', 'Hyperlink and Text Markup', 'Home Tool Markup Language'], correct: 'HyperText Markup Language' },
              { id: 'q1-3', text: 'Qual símbolo é usado para comentários de linha única em JavaScript?', options: ['//', '/* */', '<!-- -->', '#'], correct: '//' },
              { id: 'q1-4', text: 'O que o CSS faz?', options: ['Estrutura o conteúdo da web', 'Define a estilização da web', 'Controla a lógica do site', 'Gerencia o banco de dados'], correct: 'Define a estilização da web' },
              { id: 'q1-5', text: 'Qual das opções NÂO é um tipo de dado primitivo em JavaScript?', options: ['String', 'Number', 'Boolean', 'Object'], correct: 'Object' },
              { id: 'q1-6', text: 'O que é um "array"?', options: ['Uma coleção ordenada de valores', 'Uma função matemática', 'Um único valor', 'Um loop condicional'], correct: 'Uma coleção ordenada de valores' },
              { id: 'q1-7', text: 'Qual loop continua enquanto a condição for verdadeira?', options: ['while', 'for', 'if', 'switch'], correct: 'while' },
              { id: 'q1-8', text: 'Como você chama uma função chamada "myFunction"?', options: ['call myFunction()', 'myFunction;', 'myFunction()', 'execute myFunction'], correct: 'myFunction()' },
              { id: 'q1-9', text: 'O que "React" é?', options: ['Um framework backend', 'Uma biblioteca JavaScript para UI', 'Um banco de dados', 'Um sistema operacional'], correct: 'Uma biblioteca JavaScript para UI' },
              { id: 'q1-10', text: 'O que `===` faz em JavaScript?', options: ['Define o valor de uma variável', 'Compara valor, mas não tipo', 'Compara valor e tipo', 'Executa uma função'], correct: 'Compara valor e tipo' },
            ]
          }
        },
      ]
    },
    {
      id: 'm2',
      title: 'Módulo 2: Variáveis e Tipos',
      lessons: [
        { id: '2-1', title: 'Declarando variáveis', duration: '25 min', type: 'video', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', documentUrl: null },
        { id: '2-2', title: 'Tipos de dados primitivos', duration: '30 min', type: 'video', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', documentUrl: null },
      ]
    },
    {
      id: 'm3',
      title: 'Módulo 3: Estruturas',
      lessons: [
        { id: '3-1', title: 'Operadores lógicos', duration: '20 min', type: 'video', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', documentUrl: null },
      ]
    }
  ];
  
  // --- "BANCO DE DADOS" DE DÚVIDAS ---
  export const initialQuestions = [
    { 
      id: 1, 
      courseId: 1, 
      lessonId: '1-1', 
      author: 'Maria Silva', 
      date: '2 dias atrás', 
      text: 'Qual a diferença entre compilador e interpretador?',
      answer: {
        author: 'João Silva (Instrutor)',
        date: '1 dia atrás',
        text: 'Um compilador traduz todo o código de uma vez antes da execução, enquanto um interpretador traduz e executa linha por linha.'
      }
    },
    { 
      id: 2, 
      courseId: 1, 
      lessonId: '1-2', 
      author: 'Pedro Almeida', 
      date: '5 horas atrás', 
      text: 'Preciso de conhecimento prévio em alguma área para fazer este curso?',
      answer: null
    }
  ];
  
  // --- NOVO: Inicializador do Banco de Dados de Conteúdo ---
  export const initializeContentDB = () => {
    const db = {};
    initialCourses.forEach(course => {
      db[course.id] = JSON.parse(JSON.stringify(staticCourseContent)); // Deep copy
    });
    return db;
  };
  

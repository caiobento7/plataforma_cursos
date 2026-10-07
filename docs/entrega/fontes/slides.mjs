// Conteúdo da apresentação do CursoLab. Cada slide traz, na tela, os pontos que
// o apresentador fala; em "fala", o texto completo para ensaiar (vai para as
// notas do apresentador e para o roteiro de fala).
//
// Layouts: cover, agenda, columns, image-left, image-top, table, demo, end.

export const meta = {
  "discipline": "Princípios de Engenharia de Software",
  "title": "CursoLab",
  "subtitle": "Plataforma de cursos online, do catálogo ao certificado",
  "student": "Caio Bento",
  "professor": "Dener Santos",
  "place": "Nova Friburgo, 07/10/2026",
  "url": "plataforma-cursos-omega.vercel.app"
};

export const slides = [
  {
    "layout": "cover",
    "fala": "Boa tarde. Eu sou o Caio Bento e vou apresentar o CursoLab, uma plataforma de cursos online que eu desenvolvi sozinho para a disciplina. Ela está no ar, no endereço do slide, e no final eu mostro ela funcionando. Vou passar rápido pelo contexto e dedicar a maior parte do tempo à arquitetura: como o sistema é dividido, como as peças conversam, como os dados são modelados, como funciona a autenticação e quais foram os desafios de integração."
  },
  {
    "layout": "agenda",
    "title": "Roteiro da apresentação",
    "items": [
      "Contexto e solução",
      "Processo e requisitos",
      "Arquitetura geral",
      "Front-end",
      "Back-end e API",
      "Controle de acesso",
      "Modelo de dados e banco",
      "Autenticação",
      "Arquivos e implantação",
      "Regras e desafios de integração",
      "Testes e manutenção",
      "Demonstração e conclusão"
    ],
    "fala": "Esse é o roteiro. Começo com o contexto em um slide, passo pelo processo e pelos requisitos e entro na parte principal, que é a arquitetura: a visão geral, o front-end, o back-end, o controle de acesso, o modelo de dados e o banco, a autenticação, os arquivos e a implantação. Depois falo das regras e dos desafios de integração, dos testes, e fecho com a demonstração."
  },
  {
    "layout": "columns",
    "title": "Contexto e solução",
    "box": {
      "head": "O problema",
      "text": "Uma plataforma de cursos precisa controlar quem pode assistir e até quando, em que ordem o aluno avança, como ele prova que aprendeu e como o instrutor acompanha tudo. Sem isso: conteúdo sem controle, gabarito exposto e certificado sem critério."
    },
    "left": {
      "head": "O que o CursoLab entrega",
      "items": [
        "área pública com landing e catálogo;",
        "área do aluno: compra, player, quiz e certificado;",
        "backoffice do instrutor: conteúdo, dúvidas e chamados;",
        "6 cursos com conteúdo real: vídeos, quizzes e apostilas."
      ]
    },
    "right": {
      "head": "Princípio que guiou a arquitetura",
      "items": [
        "toda regra importante é decidida no servidor;",
        "a tela só apresenta o resultado;",
        "dados e regras protegidos também no banco;",
        "tudo publicado e testado contra a produção."
      ]
    },
    "fala": "Em um slide, o contexto. Uma plataforma de cursos não é só uma página com vídeos: ela precisa controlar quem pode assistir e até quando, a ordem em que o aluno avança, como ele prova que aprendeu e como o instrutor acompanha tudo. O CursoLab entrega isso em três áreas: a pública, a do aluno e o backoffice do instrutor, com seis cursos de conteúdo real. E o princípio que guiou a arquitetura inteira é este da direita: toda regra importante é decidida no servidor, porque a tela pode ser manipulada pelo usuário. É isso que eu vou mostrar daqui para frente."
  },
  {
    "layout": "image-top",
    "title": "Processo de desenvolvimento",
    "image": "diagramas/01-ciclo-de-vida.png",
    "left": {
      "head": "Ciclo adotado",
      "items": [
        "planejamento e escopo;",
        "requisitos em histórias de usuário;",
        "design da arquitetura e do banco;",
        "codificação e testes por funcionalidade;",
        "implantação automática;",
        "manutenção e novas necessidades."
      ]
    },
    "redBox": {
      "head": "Caracterização",
      "text": "Processo iterativo e incremental, com práticas ágeis, mas sem Scrum formal: sou um desenvolvedor só, sem sprints nem papéis definidos. Cada ciclo entregava uma funcionalidade completa e testada."
    },
    "fala": "Sobre o processo: segui as etapas clássicas do ciclo de vida, mas de forma iterativa. Cada volta do ciclo entregava uma funcionalidade inteira: requisito, código, teste e publicação. A seta pontilhada mostra que, depois de publicar, apareciam novas necessidades que voltavam para os requisitos. Eu não digo que usei Scrum, porque trabalhei sozinho e não tive sprints nem papéis formais. A melhor definição é iterativo e incremental, com práticas ágeis."
  },
  {
    "layout": "image-left",
    "title": "Processo na prática: fluxo de Git",
    "image": "diagramas/12-fluxo-git.png",
    "right": {
      "head": "Como cada mudança chegou ao ar",
      "items": [
        "uma branch por funcionalidade (feat/...);",
        "Pull Request com descrição e checklist de testes;",
        "merge na main publica sozinho na Vercel;",
        "mudanças no banco em migrações versionadas."
      ]
    },
    "numbers": [
      [
        "12",
        "Pull Requests"
      ],
      [
        "37",
        "commits"
      ],
      [
        "15",
        "migrações SQL"
      ]
    ],
    "fala": "Esse é o fluxo de trabalho na prática. Nada foi direto para produção. Cada funcionalidade nasceu numa branch, virou um Pull Request com descrição e checklist de testes e, quando eu fazia o merge na main, a Vercel publicava sozinha. As mudanças no banco também foram versionadas, em quinze migrações SQL. No total foram doze Pull Requests e trinta e sete commits, e o histórico do GitHub é a evidência desse processo."
  },
  {
    "layout": "columns",
    "title": "Engenharia de requisitos",
    "left": {
      "head": "Requisitos funcionais (o que faz)",
      "items": [
        "cadastro, login e recuperação de senha;",
        "catálogo com busca e filtros;",
        "carrinho e checkout;",
        "player com progresso e quiz;",
        "certificado em PDF;",
        "dúvidas por aula e chamados;",
        "backoffice com editor e indicadores."
      ]
    },
    "right": {
      "head": "Requisitos não funcionais (como faz)",
      "items": [
        "segurança: senha com hash e tokens;",
        "chave secreta só no servidor;",
        "consistência: transação no banco;",
        "desempenho: upload direto ao Storage;",
        "usabilidade: linguagem visual única;",
        "disponibilidade: hospedado na nuvem."
      ]
    },
    "redBox": {
      "head": "Requisito volátil na prática",
      "text": "O certificado era liberado com 60% das aulas. A regra mudou para 100% das aulas e nota final ≥ 70%. Mudaram juntos: migração do banco, API, telas, testes e documentação."
    },
    "fala": "Os requisitos foram levantados como histórias de usuário, do aluno e do instrutor. À esquerda estão os funcionais, o que o sistema faz, e à direita os não funcionais, como ele faz. Um ponto que vale destacar é o requisito volátil: o certificado era liberado com sessenta por cento das aulas, e hoje a regra mudou para cem por cento das aulas e nota final de pelo menos setenta. Essa mudança não foi só no código: mudaram juntos a migração do banco, a API, as telas, os testes e a documentação. Isso é rastreabilidade na prática."
  },
  {
    "layout": "image-left",
    "title": "Casos de uso",
    "image": "diagramas/03-casos-de-uso-aluno.png",
    "right": {
      "head": "Aluno",
      "items": [
        "comprar, estudar, fazer quiz e continuar de onde parou;",
        "emitir certificado, tirar dúvidas e abrir chamados."
      ]
    },
    "right2": {
      "head": "Administrador (instrutor)",
      "items": [
        "criar cursos e montar módulos, aulas e quizzes;",
        "enviar vídeos e materiais;",
        "responder dúvidas e chamados e ver indicadores."
      ]
    },
    "box": {
      "head": "Relações «include»",
      "text": "Fazer quiz inclui a correção no servidor, que libera o próximo módulo. Emitir certificado inclui conferir a regra."
    },
    "fala": "Os casos de uso têm dois atores. O aluno compra, estuda, faz quiz, continua de onde parou, tira dúvidas e emite o certificado. O administrador, que é o instrutor, monta os cursos, envia arquivos, responde e acompanha indicadores. As relações de include mostram o que é obrigatório: fazer o quiz sempre inclui a correção no servidor, e é essa correção que libera o próximo módulo."
  },
  {
    "layout": "image-top",
    "title": "Arquitetura geral: visão externa",
    "image": "diagramas/05-arquitetura-externa.png",
    "left": {
      "head": "Visão de implantação",
      "items": [
        "o navegador baixa o site estático (React) da Vercel;",
        "chamadas em /api vão para uma função serverless com o Express;",
        "o Express fala com o Supabase: Auth, PostgreSQL e Storage;",
        "arquivos grandes vão direto do navegador ao Storage."
      ]
    },
    "box": {
      "head": "Decisão arquitetural",
      "text": "Monólito modularizado (uma API, um banco) servido como função serverless: simples de implantar e manter, sem servidor para administrar."
    },
    "fala": "Agora a arquitetura, primeiro por fora. O usuário abre o site, e o navegador baixa a interface em React da Vercel. Tudo que começa com barra api vai para uma função serverless, onde roda a minha API em Express. A API conversa com o Supabase, que me dá três serviços: autenticação, o banco PostgreSQL e o Storage para arquivos. Os arquivos grandes não passam pela API: o navegador envia direto para o Storage com uma URL assinada. A decisão foi um monólito modularizado, uma API e um banco, rodando como serverless. Para o tamanho do projeto, microsserviços só trariam complexidade."
  },
  {
    "layout": "image-top",
    "title": "Arquitetura geral: camadas de uma requisição",
    "image": "diagramas/06-arquitetura-interna.png",
    "left": {
      "head": "Responsabilidades",
      "items": [
        "React: apresentação e navegação;",
        "api.js: cliente HTTP, token e renovação;",
        "requireAuth e requireAdmin: quem pode entrar;",
        "rotas: validação e regras de negócio;",
        "PostgreSQL: dados, restrições e transações."
      ]
    },
    "box": {
      "head": "Vantagem",
      "text": "Cada camada tem uma responsabilidade clara. A tela não conhece o banco, e a regra de negócio não depende da tela."
    },
    "fala": "Por dentro, a requisição passa por camadas. A página em React chama o cliente da API, que coloca o token e renova a sessão quando ela expira. Na API, a requisição passa primeiro pelos middlewares: o requireAuth confere quem é o usuário, e o requireAdmin confere se ele é administrador. Só então chega na rota, que valida os dados e aplica a regra de negócio antes de ir ao banco. A vantagem é que cada camada tem uma responsabilidade clara: a tela não conhece o banco, e a regra não depende da tela."
  },
  {
    "layout": "table",
    "title": "Tecnologias principais",
    "head": [
      "Tecnologia",
      "Uso no projeto"
    ],
    "rows": [
      [
        "React 19 + Vite",
        "interface de página única e build do front-end"
      ],
      [
        "Node.js + Express 5",
        "API REST com 36 rotas e middlewares de acesso"
      ],
      [
        "Supabase PostgreSQL",
        "banco relacional: 10 tabelas, restrições e funções"
      ],
      [
        "Supabase Auth",
        "contas, hash de senha e tokens JWT"
      ],
      [
        "Supabase Storage",
        "vídeos, materiais e apostilas em PDF"
      ],
      [
        "jsPDF",
        "certificado e apostilas gerados em PDF"
      ],
      [
        "Vercel",
        "hospedagem, CDN, função serverless e deploy automático"
      ],
      [
        "GitHub",
        "versionamento, branches e Pull Requests"
      ],
      [
        "ESLint + testes de integração",
        "análise estática e 158 verificações automatizadas"
      ]
    ],
    "fala": "Essas são as tecnologias. No front-end, React com Vite. Na API, Node com Express. O Supabase entrega o banco PostgreSQL, a autenticação e o armazenamento de arquivos. O jsPDF gera o certificado e as apostilas. A Vercel hospeda tudo e publica a cada merge, e o GitHub guarda o histórico. Para qualidade, ESLint e uma suíte de testes de integração. A escolha seguiu um critério: usar serviços gerenciados para a infraestrutura e concentrar o meu esforço nas regras do domínio."
  },
  {
    "layout": "image-left",
    "title": "Front-end: React como aplicação de página única",
    "image": "diagramas/13-front-end.png",
    "right": {
      "head": "Como está organizado",
      "items": [
        "App.jsx guarda o estado global e decide qual página mostrar;",
        "13 páginas montadas com componentes reutilizáveis;",
        "services/api.js é a única porta para o back-end;",
        "uma folha de estilos define a linguagem visual de tudo;",
        "o build do Vite gera arquivos estáticos para a CDN."
      ]
    },
    "box": {
      "head": "Decisão",
      "text": "O front-end não contém regra de negócio: ele chama a API e mostra a resposta. Isso permite mudar uma regra sem mexer nas telas e testar a API sem a interface."
    },
    "fala": "Começando pelo front-end. É uma aplicação de página única em React. O App.jsx guarda o estado global, como o usuário logado, a página atual e o carrinho, e decide qual das treze páginas mostrar. As páginas são montadas com componentes reutilizáveis, como o card de curso, o quiz e a área de dúvidas. Toda comunicação com o servidor passa por um único módulo, o api.js, que coloca o token e renova a sessão quando ela expira. E uma única folha de estilos define a linguagem visual de todas as telas. A decisão importante aqui é que o front-end não tem regra de negócio: ele chama a API e mostra o resultado. No build, o Vite gera arquivos estáticos, que a Vercel distribui pela CDN."
  },
  {
    "layout": "image-top",
    "title": "Back-end: API Express em dois ambientes",
    "image": "diagramas/14-back-end.png",
    "left": {
      "head": "Como está organizado",
      "items": [
        "app.js monta a API: CORS, JSON, middlewares e rotas;",
        "server.js roda o app localmente, na porta 3001;",
        "api/index.js reaproveita o mesmo app como função serverless;",
        "supabase.js cria os dois clientes: chave pública e secreta."
      ]
    },
    "box": {
      "head": "Por que isso importa",
      "text": "O código testado localmente é exatamente o que roda em produção. Só muda o ponto de entrada."
    },
    "fala": "No back-end, a API é feita em Express. O ponto principal é que o mesmo aplicativo roda em dois ambientes. O app.js monta a API com CORS, JSON, middlewares e rotas, e é exportado. Localmente, o server.js sobe esse app numa porta. Na Vercel, o api/index.js reaproveita o mesmo app como função serverless. Ou seja, o código que eu testo na minha máquina é exatamente o que roda em produção. O supabase.js cria dois clientes: um com a chave pública, usado só para login, e um com a chave secreta, que acessa o banco e os arquivos e só existe no servidor."
  },
  {
    "layout": "table",
    "title": "API REST: 36 rotas",
    "head": [
      "Área",
      "Rotas",
      "Exemplos",
      "Acesso"
    ],
    "colW": [
      2.6,
      1,
      5.85,
      2.8
    ],
    "rows": [
      [
        "Autenticação e conta",
        "9",
        "POST /api/auth/login · /auth/refresh · /auth/password-recovery",
        "público e aluno"
      ],
      [
        "Catálogo e conteúdo",
        "9",
        "GET /api/courses · PUT /courses/:id/content · POST /courses/:id/uploads",
        "público e admin"
      ],
      [
        "Aprendizado",
        "7",
        "POST /api/enrollments · /lessons/:id/quiz-attempt · GET /enrollments/:id/certificate",
        "aluno"
      ],
      [
        "Dúvidas",
        "4",
        "POST /api/lessons/:id/questions · PATCH /questions/:id/answer",
        "aluno e admin"
      ],
      [
        "Chamados",
        "5",
        "POST /api/support-tickets · PUT /admin/support-tickets/:id",
        "aluno e admin"
      ],
      [
        "Indicadores e saúde",
        "2",
        "GET /api/admin/analytics · GET /api/health",
        "admin e público"
      ],
      [
        "Total",
        "36",
        "8 públicas · 16 exigem login · 12 só para administrador",
        ""
      ]
    ],
    "fala": "A API tem trinta e seis rotas REST, organizadas por área. Autenticação e conta, catálogo e conteúdo, aprendizado, dúvidas, chamados e indicadores. Os verbos seguem o padrão REST: GET para ler, POST para criar, PUT e PATCH para alterar, DELETE para excluir. E o nível de acesso é declarado na própria rota: oito são públicas, dezesseis exigem login e doze são só para administrador. Por exemplo, a rota que salva o conteúdo do curso tem os dois middlewares, requireAuth e requireAdmin, antes de chegar no código."
  },
  {
    "layout": "image-top",
    "title": "Controle de acesso: a mesma rota, três respostas",
    "image": "diagramas/15-conteudo-por-acesso.png",
    "left": {
      "head": "GET /api/courses/:id/content",
      "items": [
        "visitante: só a grade (títulos, tipos e durações);",
        "aluno sem matrícula ou com prazo vencido: só a grade;",
        "aluno matriculado: vídeos, materiais e perguntas, sem gabarito;",
        "administrador: tudo, inclusive o gabarito, para o editor."
      ]
    },
    "redBox": {
      "head": "Por que no servidor",
      "text": "Se a API mandasse tudo e a tela escondesse, bastaria abrir as ferramentas do navegador para ver o vídeo pago ou o gabarito."
    },
    "fala": "Esse slide mostra como o controle de acesso funciona na prática, com uma rota só: a que devolve o conteúdo do curso. A API olha quem está pedindo e devolve três versões diferentes. O visitante, ou o aluno sem matrícula ou com o prazo vencido, recebe só a grade. O aluno matriculado recebe os vídeos, os materiais e as perguntas do quiz, mas sem o gabarito. E o administrador recebe tudo, porque precisa do gabarito para editar. Isso tem que ser no servidor: se a API mandasse tudo e a tela escondesse, qualquer pessoa abriria as ferramentas do navegador e veria o vídeo pago ou a resposta do quiz."
  },
  {
    "layout": "image-left",
    "title": "Modelo de dados",
    "image": "diagramas/07b-modelo-de-dados-resumo.png",
    "right": {
      "head": "10 tabelas em 4 grupos",
      "items": [
        "pessoas: profiles (aluno ou admin);",
        "catálogo: courses → course_modules → lessons → quizzes → quiz_questions;",
        "aprendizado: enrollments e lesson_progress;",
        "comunicação: lesson_questions e support_tickets."
      ]
    },
    "box": {
      "head": "Ponto central",
      "text": "A matrícula liga aluno e curso e guarda o prazo de acesso e a última aula aberta. O progresso guarda cada aula concluída e a melhor nota de cada quiz."
    },
    "fala": "O modelo de dados tem dez tabelas, que eu organizei em quatro grupos. Pessoas: o profiles, que guarda se o usuário é aluno ou admin. Catálogo: curso, módulos, aulas, e uma aula pode ser um quiz com perguntas. Aprendizado: a matrícula e o progresso. Comunicação: dúvidas e chamados. O ponto central é a matrícula: ela liga o aluno ao curso e guarda até quando ele tem acesso e qual foi a última aula aberta. O progresso guarda cada aula concluída e a melhor nota de cada quiz, que é a base do certificado. As chaves estrangeiras usam cascade, então apagar um curso apaga o conteúdo dele sem deixar lixo."
  },
  {
    "layout": "columns",
    "title": "Banco de dados: regras também no PostgreSQL",
    "numbers": [
      [
        "10",
        "tabelas"
      ],
      [
        "15",
        "migrações versionadas"
      ],
      [
        "1",
        "função transacional para o conteúdo"
      ]
    ],
    "left": {
      "head": "Restrições que protegem os dados",
      "items": [
        "chaves estrangeiras com exclusão em cascata;",
        "unique: uma matrícula por aluno e curso;",
        "unique: uma posição por aula no módulo;",
        "check: nota entre 0 e 100, status do chamado;",
        "gatilho cria o perfil quando a conta é criada."
      ]
    },
    "right": {
      "head": "Funções e permissões",
      "items": [
        "save_course_content salva módulos, aulas e quizzes numa transação;",
        "aulas existentes são atualizadas, não recriadas, e o progresso fica;",
        "execução das funções revogada para o acesso público;",
        "migrações podem rodar mais de uma vez sem erro."
      ]
    },
    "fala": "O banco não é só um lugar para guardar dados: ele também protege as regras. São dez tabelas e quinze migrações versionadas junto com o código. As restrições impedem dado inválido mesmo se a API tiver um erro: chaves estrangeiras com cascata, unicidade, como uma matrícula por aluno e curso, e checagens, como nota entre zero e cem. Um gatilho cria o perfil quando a conta é criada. E a gravação do conteúdo do curso é uma função do próprio PostgreSQL, que salva módulos, aulas e quizzes numa transação: ou salva tudo, ou nada. Essa função só pode ser executada pelo back-end, porque a permissão foi revogada para o acesso público."
  },
  {
    "layout": "image-left",
    "title": "Autenticação e autorização",
    "image": "diagramas/08-sequencia-autenticacao.png",
    "right": {
      "head": "Autenticação: quem é você?",
      "items": [
        "login pelo Supabase Auth, com senha guardada só como hash;",
        "a API devolve um token de acesso (JWT) e um de renovação;",
        "todo pedido leva o token no cabeçalho Authorization;",
        "quando o token expira, a sessão é renovada sozinha."
      ]
    },
    "right2": {
      "head": "Autorização: o que você pode fazer?",
      "items": [
        "requireAuth valida o token; requireAdmin confere o papel;",
        "vídeo só para matrícula dentro do prazo;",
        "visitante vê só a grade; gabarito só para o admin."
      ]
    },
    "fala": "Autenticação e autorização são duas perguntas diferentes. Autenticação é quem é você. O login é feito pelo Supabase Auth, e a senha nunca fica em texto: fica só o hash. A API devolve dois tokens, um de acesso, que é um JWT de curta duração, e um de renovação. Todo pedido leva o token de acesso no cabeçalho. Quando ele expira, a resposta é 401, e o front-end renova a sessão e repete o pedido sem o usuário perceber, como mostra a sequência. Autorização é o que você pode fazer: o requireAuth valida o token, o requireAdmin confere o papel no perfil, e cada recurso ainda tem a sua regra. O vídeo só vai para quem tem matrícula dentro do prazo, o visitante vê só a grade, e o gabarito do quiz só vai para o administrador. Outro cuidado: a chave pública só faz login, e a chave secreta, que tem acesso total ao banco, existe só no servidor."
  },
  {
    "layout": "image-left",
    "title": "Arquivos: upload direto com URL assinada",
    "image": "diagramas/16-sequencia-upload.png",
    "right": {
      "head": "Como um vídeo chega ao Storage",
      "numbered": true,
      "items": [
        "o editor pede autorização à API;",
        "a API confere o admin, o tipo e o tamanho;",
        "o Storage gera uma URL assinada;",
        "o navegador envia o arquivo direto, com progresso;",
        "a aula é salva com a URL pública."
      ]
    },
    "box": {
      "head": "Por que assim",
      "text": "A Vercel limita cada requisição a 4,5 MB. O vídeo de até 50 MB nunca passa pela API, que só autoriza o envio."
    },
    "fala": "Os arquivos têm um fluxo próprio. Quando o instrutor escolhe um vídeo, o editor primeiro pede autorização à API. A API confere se ele é administrador e se o tipo e o tamanho são permitidos, e pede ao Storage uma URL assinada, que vale para aquele arquivo. O navegador então envia o vídeo direto para o Storage, com barra de progresso, e no fim a aula é salva com a URL pública. O motivo é que a Vercel limita cada requisição a quatro e meio megabytes, e os vídeos podem ter até cinquenta. Assim, o arquivo nunca passa pela API."
  },
  {
    "layout": "image-top",
    "title": "Implantação: do Pull Request à produção",
    "image": "diagramas/17-implantacao.png",
    "left": {
      "head": "Pipeline",
      "items": [
        "cada mudança passa por Pull Request com lint, build e testes;",
        "o merge na main dispara o build na Vercel;",
        "o site vai para a CDN e a API vira função serverless;",
        "chaves ficam em variáveis de ambiente, fora do código;",
        "migrações SQL são aplicadas no Supabase antes do merge."
      ]
    },
    "box": {
      "head": "Resultado",
      "text": "Publicar é uma consequência do fluxo de trabalho: não existe passo manual de deploy. Depois de cada merge, os testes rodam de novo contra a produção."
    },
    "fala": "Por fim, a implantação. Cada mudança passa por um Pull Request, onde eu rodo lint, build e testes. O merge na main dispara o build na Vercel: o front-end vai para a CDN e a API vira uma função serverless. As chaves do Supabase ficam em variáveis de ambiente, nunca no código. Quando a mudança mexe no banco, a migração SQL é aplicada no Supabase antes do merge. O resultado é que publicar não tem passo manual: é consequência do fluxo. E depois de cada merge eu rodo os testes de novo, contra a produção."
  },
  {
    "layout": "columns",
    "title": "Regras de negócio principais",
    "grid": [
      {
        "head": "Progressão",
        "text": "O próximo módulo só abre quando o anterior está concluído, com o quiz aprovado."
      },
      {
        "head": "Quiz",
        "text": "Corrigido no servidor. Nota mínima de 70%, e vale a melhor tentativa."
      },
      {
        "head": "Prazo de acesso",
        "text": "6 meses por matrícula. Expirou: só a grade. Renovar mantém o progresso."
      },
      {
        "head": "Continue de onde parou",
        "text": "Volta à última aula aberta, ou à próxima pendente, respeitando módulos bloqueados."
      }
    ],
    "table": {
      "head": [
        "Certificado",
        "Regra"
      ],
      "rows": [
        [
          "Aulas concluídas",
          "100%"
        ],
        [
          "Nota final (média da melhor nota de cada quiz)",
          "≥ 70%"
        ],
        [
          "PDF",
          "nome, carga horária, nota, data e código"
        ]
      ]
    },
    "fala": "Essas são as regras de negócio principais. Progressão: o próximo módulo só abre quando o anterior está concluído, com o quiz aprovado. Quiz: corrigido no servidor, com nota mínima de setenta, e vale a melhor tentativa, então refazer pode subir a nota, mas nunca baixar. Prazo: cada matrícula vale seis meses; quando expira, o aluno volta a ver só a grade, e renovar mantém o progresso. O continue de onde parou leva para a última aula aberta ou para a próxima pendente, sem sugerir aula de módulo bloqueado. O certificado exige cem por cento das aulas e nota final de pelo menos setenta, e o PDF traz nome, carga horária, nota, data e um código de verificação."
  },
  {
    "layout": "image-left",
    "title": "Fluxo crítico: correção do quiz",
    "image": "diagramas/09-sequencia-quiz.png",
    "right": {
      "head": "Passos principais",
      "numbered": true,
      "items": [
        "aluno envia só as respostas;",
        "API confere matrícula e prazo;",
        "gabarito é lido no banco, sem sair do servidor;",
        "nota calculada no servidor;",
        "aprovado: grava conclusão e melhor nota;",
        "player libera o próximo módulo."
      ]
    },
    "box": {
      "head": "Por que no servidor?",
      "text": "Se a correção fosse na tela, bastaria abrir as ferramentas do navegador para ver o gabarito ou forjar a aprovação."
    },
    "fala": "Escolhi o quiz como fluxo crítico porque ele concentra várias regras. O aluno envia só as respostas. A API confere se a matrícula está ativa e dentro do prazo, busca o gabarito no banco, que nunca sai do servidor, e calcula a nota. Se passou da nota mínima, grava a conclusão e a melhor nota, e o player libera o próximo módulo. Por que no servidor? Porque, se fosse na tela, qualquer aluno abriria as ferramentas do navegador e veria o gabarito, ou forjaria a aprovação."
  },
  {
    "layout": "table",
    "title": "Desafios de integração",
    "head": [
      "Desafio",
      "Como resolvi"
    ],
    "rows": [
      [
        "A Vercel limita cada requisição a 4,5 MB, e os vídeos têm até 50 MB",
        "a API gera uma URL assinada e o navegador envia direto ao Storage"
      ],
      [
        "O cliente do Supabase não oferece transação, e salvar um curso mexe em 4 tabelas",
        "uma função no PostgreSQL salva tudo de forma atômica"
      ],
      [
        "Reordenar aulas violava a unicidade da ordem",
        "mover a ordem para uma faixa livre antes de reordenar"
      ],
      [
        "Express é um servidor; a Vercel roda funções",
        "o app é exportado e reaproveitado como função serverless"
      ],
      [
        "A sessão expira no meio do uso",
        "renovação automática com refresh token e repetição do pedido"
      ],
      [
        "Links do e-mail de recuperação de senha",
        "URLs de redirecionamento configuradas no Supabase"
      ]
    ],
    "fala": "Essa é a parte que mais me ensinou: os desafios de integração. Primeiro, a Vercel limita cada requisição a quatro e meio megabytes, e eu queria vídeos de até cinquenta. A solução foi a API gerar uma URL assinada e o navegador enviar o arquivo direto para o Storage. Segundo, o cliente do Supabase não tem transação, e salvar um curso mexe em quatro tabelas. Então escrevi uma função no PostgreSQL que salva tudo de forma atômica. Terceiro, reordenar aulas quebrava a regra de ordem única, e resolvi movendo a ordem para uma faixa livre antes de reordenar. Também precisei adaptar o Express para rodar como função serverless, renovar a sessão automaticamente e configurar os links de recuperação de senha no Supabase."
  },
  {
    "layout": "columns",
    "title": "Verificação, validação e testes",
    "numbers": [
      [
        "8",
        "suítes de integração"
      ],
      [
        "158",
        "verificações"
      ],
      [
        "2",
        "ambientes: local e produção"
      ]
    ],
    "left": {
      "head": "O que os testes garantem",
      "items": [
        "visitante não recebe vídeo nem gabarito;",
        "aluno sem matrícula recebe 403;",
        "quiz não pode ser marcado sem ser feito;",
        "nota 50% não libera certificado;",
        "dado inválido não altera o banco;",
        "acesso expirado bloqueia o conteúdo."
      ]
    },
    "right": {
      "head": "Como são executados",
      "items": [
        "chamam a API de verdade, com banco real;",
        "criam usuários e cursos temporários;",
        "apagam tudo ao final;",
        "rodam antes de cada Pull Request;",
        "rodam de novo contra a produção depois do merge."
      ]
    },
    "box": {
      "at": "bottom",
      "head": "Verificação e validação",
      "text": "Verificação: ESLint, build e testes conferem se construí certo. Validação: o sistema publicado e usado de verdade confere se construí a coisa certa."
    },
    "fala": "Nos testes, o projeto tem oito suítes de integração automatizadas, com cento e cinquenta e oito verificações. Elas chamam a API de verdade, com banco real, criam usuários e cursos temporários e apagam tudo no final. Os testes cobrem principalmente o que não pode acontecer: visitante recebendo vídeo, aluno sem matrícula acessando aula, quiz marcado sem ser feito, certificado com nota baixa. Eu rodo antes de cada Pull Request e de novo contra a produção depois do merge. Lembrando a diferença da disciplina: verificação é construir certo, e validação é construir a coisa certa, o sistema publicado e usado."
  },
  {
    "layout": "columns",
    "title": "Manutenção, documentação, padrões e reuso",
    "left": {
      "head": "Manutenção (exemplos reais)",
      "items": [
        "corretiva: retomada de aula devolvia o erro errado;",
        "evolutiva: prazo de acesso e cursos reais;",
        "adaptativa: Express adaptado para serverless;",
        "preventiva: testes de regressão a cada mudança."
      ]
    },
    "left2": {
      "head": "Documentação",
      "items": [
        "README e guia de implantação;",
        "referência das 36 rotas da API;",
        "documento de requisitos e este relatório;",
        "diagramas e migrações comentadas."
      ]
    },
    "right": {
      "head": "Padrões e reuso",
      "items": [
        "camadas como organização arquitetural;",
        "middlewares em cadeia (Chain of Responsibility);",
        "Adapter: um player para YouTube, Vimeo e arquivo;",
        "clientes do Supabase únicos por módulo;",
        "reuso: React, Express, Supabase e jsPDF."
      ]
    },
    "box": {
      "at": "bottom",
      "head": "Ganho",
      "text": "Menos infraestrutura feita do zero, mais tempo nas regras do domínio."
    },
    "fala": "Na manutenção, tenho exemplos reais dos quatro tipos. Corretiva: a retomada de aula devolvia o código de erro errado para quem não era matriculado, e eu corrigi. Evolutiva: o prazo de acesso e os cursos reais. Adaptativa: o Express adaptado para rodar como serverless na Vercel. Preventiva: os testes de regressão. A documentação está no repositório: README, as rotas da API, o documento de requisitos e o relatório. Nos padrões, eu só cito o que existe no código: as camadas, os middlewares em cadeia, que lembram o Chain of Responsibility, e um adaptador que transforma links do YouTube, do Vimeo ou de arquivo no mesmo player. E o reuso de bibliotecas maduras foi o que me deixou focar nas regras do domínio."
  },
  {
    "layout": "demo",
    "title": "Demonstração",
    "steps": [
      "landing page → login como aluno",
      "catálogo → detalhes do curso → checkout",
      "painel: continue de onde parou",
      "player: vídeo, apostila e quiz",
      "certificado em PDF",
      "login como admin: backoffice, editor e chamados"
    ],
    "images": [
      "prints/07-painel-aluno.png",
      "prints/10-player.png",
      "prints/12-backoffice.png"
    ],
    "fala": "Agora vou mostrar o sistema funcionando, no ar. Vou seguir esta ordem: a landing page e o login do aluno; o catálogo, os detalhes de um curso e o checkout; o painel com o continue de onde parou; o player com vídeo, apostila e quiz; o certificado em PDF; e, por fim, o login como administrador, para mostrar o backoffice, o editor de conteúdo e os chamados."
  },
  {
    "layout": "columns",
    "title": "Limitações e trabalhos futuros",
    "left": {
      "head": "Limitações atuais",
      "items": [
        "pagamento simulado, sem gateway real;",
        "avaliação do curso pelo aluno não implementada;",
        "sem notificação por e-mail quando a dúvida é respondida;",
        "um único papel de administrador;",
        "parte dos indicadores mistura dados de demonstração."
      ]
    },
    "right": {
      "head": "Evoluções possíveis",
      "items": [
        "gateway de pagamento (Pix e cartão);",
        "avaliações e comentários dos cursos;",
        "notificações por e-mail;",
        "vários instrutores, cada um com seus cursos;",
        "testes rodando automaticamente em cada Pull Request (CI)."
      ]
    },
    "fala": "Também quero ser transparente sobre as limitações. O pagamento é simulado, não tem gateway real. A avaliação do curso pelo aluno não foi implementada. Não há notificação por e-mail quando a dúvida é respondida. Existe um único papel de administrador. E parte dos indicadores mistura números de demonstração com os reais. As evoluções naturais são um gateway de pagamento, avaliações, notificações, vários instrutores e rodar os testes automaticamente em cada Pull Request."
  },
  {
    "layout": "columns",
    "title": "Conclusão",
    "box": {
      "head": "Resultado",
      "text": "O CursoLab transforma o ciclo de um curso online numa solução web publicada, com requisitos, arquitetura, regras de negócio no servidor, segurança, testes automatizados e documentação."
    },
    "left": {
      "head": "Conceitos aplicados",
      "items": [
        "engenharia de requisitos;",
        "análise e projeto;",
        "modelagem de dados;",
        "verificação, validação e testes;",
        "manutenção e documentação;",
        "padrões e reuso."
      ]
    },
    "right": {
      "head": "Aprendizado principal",
      "items": [
        "software não é só código;",
        "regra importante fica no servidor;",
        "requisito muda, e a mudança precisa ser rastreável;",
        "integrar serviços exige mais do que escrever funções;",
        "teste automatizado dá coragem para mudar."
      ]
    },
    "fala": "Para concluir: o CursoLab saiu do problema e chegou a uma solução publicada, com requisitos, arquitetura, regras no servidor, segurança, testes e documentação. O principal aprendizado é que software não é só código. A regra importante fica no servidor, o requisito muda e a mudança precisa ser rastreável, integrar serviços exige mais do que escrever funções, e ter testes automatizados é o que dá segurança para mudar sem medo."
  },
  {
    "layout": "end",
    "fala": "Obrigado pela atenção. Fico à disposição para perguntas."
  }
];

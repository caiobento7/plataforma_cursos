# Plataforma de Cursos — CursoLab

**Aluno:** Caio Bento
**Professor:** Dener Santos

*(Capa: manter o brasão da UERJ e a marca do Instituto Politécnico, como no modelo original.)*

---

# DEFINIÇÃO DOS REQUISITOS DA PLATAFORMA DE CURSOS

## 1. Introdução

O projeto consiste no desenvolvimento de um sistema integrado de gestão e ensino,
projetado para operar em modalidades online, presencial e híbrida. A solução é composta
por dois módulos principais: uma aplicação de gestão interna e uma plataforma de ensino
(Web).

O objetivo é criar um ecossistema digital completo que centralize a administração de
pessoas (alunos, professores), cursos e turmas em um banco de dados robusto. Este
sistema permitirá o gerenciamento completo das aulas online.

A plataforma web conectará Alunos e Professores permitindo que os alunos comprem e
assistam aos cursos online, façam quizzes e emitam certificados de conclusão, garantindo
uma operação otimizada e uma experiência de aprendizado flexível e de alta qualidade.

Em relação à versão inicial do projeto, que consistia em um protótipo de interface sem
persistência de dados, esta versão adota uma arquitetura cliente-servidor. Foram
incorporados um serviço de back-end responsável pelas regras de negócio, um banco de
dados relacional e um mecanismo de autenticação e autorização de usuários. A Seção 5
detalha essa arquitetura; a Seção 8 delimita o escopo, indicando a situação de cada
requisito e as decisões de projeto adotadas.

## 2. Atores

No universo da engenharia de software e do design de sistemas, o termo "ator" é usado
para descrever qualquer entidade externa que interage com um sistema. É um conceito
fundamental, pois os atores são a razão pela qual um sistema existe: para servir às suas
necessidades. É crucial entender que um ator está sempre fora do sistema; ele não é parte
do sistema em si, mas sim alguém (ou algo) que o utiliza ou com o qual ele se comunica.

### 2.1 Atores da plataforma de cursos

A plataforma de cursos considerará a interação de dois atores principais, com os
seguintes papéis:

- **Aluno:** O ator que consome o conteúdo da plataforma. O seu papel é o de descobrir
  e adquirir cursos (buscar, filtrar, ver detalhes e comprar). Uma vez inscrito, ele deseja
  consumir o material de aprendizagem (assistir aulas em vídeo, marcar aulas como
  concluídas, realizar quizzes e avaliações). O seu perfil é caracterizado também pela
  interação com a comunidade e com o curso, podendo fazer perguntas nas aulas e ter
  contato direto com o professor. Ao final, ele pode gerir o seu percurso, emitindo o
  certificado, avaliando o curso e, ou abrindo tickets de suporte.

- **Professor / Instrutor:** O ator responsável pela criação e gestão do conteúdo
  pedagógico. Este utilizador tem a função de construir o curso (criar novo curso,
  adicionar e organizar módulos, fazer upload de vídeos e materiais, definir o preço).
  Além de criar, ele gerencia ativamente a comunidade de alunos, respondendo a perguntas
  feitas nas aulas. O seu perfil também é focado na gestão, necessitando aceder a
  dashboards de desempenho.

No modelo de dados da implementação, o papel do Professor / Instrutor está materializado
como o perfil `admin`, que concentra as permissões de gestão de catálogo e de conteúdo
descritas acima. O ator permanece sendo o Professor / Instrutor do ponto de vista do
domínio; `admin` é a denominação técnica do papel na tabela de perfis.

## 3. Visão Geral dos Casos de Uso

O processo de identificação de requisitos na engenharia de software utiliza, como uma de
suas principais técnicas, o artefato denominado Caso de Uso (CDU). Os CDUs consistem em
uma sequência de eventos necessários para a concretização de um determinado processo
relacionado ao domínio considerado na solução sistêmica a ser desenhada.

Um dos primeiros passos para obtenção de uma visão geral do escopo do sistema a ser
desenvolvido consiste na criação de Diagramas de CDUs. Estes diagramas ilustram o
conjunto de CDUs para um sistema, os atores e a relação entre os últimos e os primeiros.
Neste tipo de diagrama, os CDUs são ilustrados em elipses e os atores como figuras de
traço simples (palitos), constando também linhas de comunicação entre ambos, indicando
quais atores podem interagir com os CDUs.

**[FIGURA 1 — Diagrama de Casos de Uso da Plataforma de Cursos]**

*Figura 1 - Diagrama de Casos de Uso da Plataforma de Cursos*

Em relação ao diagrama da versão anterior, foram acrescentados os casos de uso
**Criar Conta**, **Autenticar** e **Recuperar Senha**, associados ao ator Aluno, e o caso
de uso **Gerenciar Catálogo**, associado ao ator Professor / Instrutor. O caso de uso
**Realizar Compra** passa a incluir **Autenticar**, uma vez que a matrícula exige um
usuário identificado.

## 4. Histórias de Usuários

Os requisitos do sistema podem ser mais bem detalhados através de Histórias de Usuário
(HU). Uma HU consiste em uma ou mais sentenças escritas na linguagem cotidiana ou de
negócio do usuário, capturando o que ele precisa ou faz como parte de sua função
(VAZQUEZ & SIMÕES, 2016).

Segundo Longo e Silva (2014), uma HU precisa ser simples e objetiva, o que ajuda a reduzir
longas documentações e a facilitar a comunicação entre os desenvolvedores e o cliente. As
HUs devem estar ligadas a critérios de aceitação, que detalham os requisitos específicos do
software, mas esses critérios devem ser breves, contendo poucas sentenças. O critério de
aceitação define o funcionamento e as características que são necessárias para atender às
necessidades dos usuários finais.

É importante notar que as HUs estarão vinculadas aos Casos de Uso (CDUs) mostrados no
diagrama (Figura 1), o que significa que cada CDU no diagrama terá uma HU correspondente.

### 4.1. HUs – Plataforma de Cursos

### Ator: Aluno

#### 4.1.1. HU - Criar Conta e Autenticar

- **Como** aluno, **eu quero** criar uma conta e entrar na plataforma com e-mail e senha,
  **para que** meus cursos, meu progresso e minhas dúvidas fiquem associados a mim e
  permaneçam disponíveis em qualquer acesso.
- **Critérios de Aceitação:**
  - Quero informar nome completo, e-mail e senha para me cadastrar.
  - Quero que a senha exija no mínimo 6 caracteres.
  - Quero receber uma mensagem clara quando o e-mail já estiver cadastrado.
  - Quero permanecer autenticado ao navegar entre as páginas da plataforma.
  - Quero poder solicitar a redefinição da minha senha informando meu e-mail e, a partir
    do link recebido, cadastrar uma nova senha com confirmação.

**[FIGURA 2 — Tela de cadastro e login]**

*Figura 2 - Interface de Cadastro e Autenticação*

#### 4.1.2. HU - Buscar Cursos

- **Como** aluno, **eu quero** buscar cursos por palavra-chave, categoria ou professor,
  **para que** eu possa encontrar facilmente o conteúdo que desejo estudar.
- **Critérios de Aceitação:**
  - Quero um campo de busca visível no topo da página.
  - Quero que, ao digitar, o sistema sugira resultados (autocomplete).
  - Quero que a busca retorne resultados relevantes se eu buscar por título, descrição
    ou professor.

**[FIGURA 3 — Catálogo com a busca preenchida]**

*Figura 3 - Busca no Catálogo*

#### 4.1.3. HU - Filtrar Resultados de Busca

- **Como** aluno, **eu quero** filtrar os resultados de uma busca ou categoria, **para que**
  eu possa refinar a lista e encontrar o curso ideal para mim.
- **Critérios de Aceitação:**
  - Quero poder filtrar por nível (Iniciante, Intermediário, Avançado).
  - Quero poder filtrar por faixa de preço (ou "Gratuitos").
  - Quero poder filtrar por avaliação (ex: "4 estrelas ou mais").
  - Quero ver a quantidade de cursos encontrados após aplicar os filtros.

**[FIGURA 4 — Catálogo com filtros aplicados]**

*Figura 4 - Filtro de Busca*

#### 4.1.4. HU - Visualizar Página de Detalhes do Curso

- **Como** aluno, **eu quero** visualizar a página de detalhes de um curso, **para que** eu
  possa avaliar todas as informações antes de decidir comprá-lo.
- **Critérios de Aceitação:**
  - Quero ver o título, o subtítulo, a descrição completa e o vídeo de apresentação.
  - Quero ver o nome do professor e outros cursos que ele oferece.
  - Quero ver a grade curricular completa (módulos, aulas e duração).
  - Quero ver as avaliações (nota média e comentários) de outros alunos.
  - Quero ver o preço e o botão "Comprar" ou "Adicionar ao Carrinho".

**[FIGURA 5 — Página de detalhes do curso]**

*Figura 5 - Página de Detalhes do Curso*

#### 4.1.5. HU - Adicionar ao Carrinho e Realizar a Matrícula

- **Como** aluno, **eu quero** adicionar um curso ao carrinho, aplicar um cupom e realizar
  a compra, **para que** eu possa me inscrever no curso.
- **Critérios de Aceitação:**
  - Quero um botão "Adicionar ao Carrinho" na página do curso.
  - Quero poder visualizar meu carrinho a qualquer momento.
  - Quero que, no carrinho, exista um campo para "Aplicar cupom de desconto".
  - Quero que o preço seja recalculado automaticamente se o cupom for válido.
  - Quero ser direcionado para a autenticação caso ainda não tenha entrado na minha conta.
  - Quero que a matrícula seja registrada de forma permanente e que o curso apareça
    imediatamente na minha área "Meus Cursos".
  - Quero que o sistema impeça a matrícula duplicada em um curso que eu já possuo.

**[FIGURA 6 — Carrinho e checkout de pagamento]**

*Figura 6 - Página de Compra*

#### 4.1.6. HU - Assistir Aulas e Marcar Conclusão

- **Como** aluno, **eu quero** assistir aulas em vídeo e marcar aulas e módulos como
  concluídos, **para que** eu possa acompanhar meu progresso.
- **Critérios de Aceitação:**
  - Quero um player de vídeo integrado na página da aula.
  - Quero poder navegar facilmente para a "Próxima Aula" e "Aula Anterior".
  - Quero um botão ou checkbox "Marcar como Concluída".
  - Quero poder acessar o material de apoio da aula, quando houver.
  - Quero ver uma barra de progresso do curso (ex: "75% Concluído") sendo atualizada.
  - Quero que os módulos seguintes permaneçam bloqueados até que eu conclua as aulas
    ou o quiz do módulo anterior.
  - Quero que meu progresso seja gravado e recuperado quando eu voltar à plataforma.

**[FIGURA 7 — Player de aula com a barra de progresso e a trilha lateral]**

*Figura 7 - Interface do Player e Progresso do Curso*

#### 4.1.7. HU - Realizar Quizzes e Avaliações

- **Como** aluno, **eu quero** realizar quizzes e avaliações ao final dos módulos,
  **para que** eu possa testar e validar meu conhecimento.
- **Critérios de Aceitação:**
  - Quero poder iniciar o quiz (ex: perguntas de múltipla escolha ou dissertativas).
  - Quero poder submeter minhas respostas ao final.
  - Quero ver minha nota imediatamente (para questões automáticas).
  - Quero saber se atingi a nota mínima de aprovação definida pelo professor.
  - Quero que a aprovação no quiz libere o módulo seguinte.

**[FIGURA 8 — Quiz em andamento e tela de resultado]**

*Figura 8 - Interface do Quiz com Pergunta de Múltipla Escolha*

#### 4.1.8. HU - Emitir Certificado de Conclusão

- **Como** aluno, **eu quero** emitir um certificado de conclusão, **para que** eu possa
  comprovar meu aprendizado.
- **Critérios de Aceitação:**
  - Quero que o botão de emissão seja habilitado apenas quando meu progresso atingir o
    percentual mínimo definido pela plataforma.
  - Quero que o certificado seja gerado em formato PDF.
  - Quero que o certificado contenha meu nome completo, o nome do curso, a carga
    horária e a data de conclusão.

**[FIGURA 9 — Aba "Certificados" no painel do aluno]**

*Figura 9 - Interface de Emissão de Certificado*

#### 4.1.9. HU - Fazer Perguntas na Área de Dúvidas

- **Como** aluno, **eu quero** fazer perguntas na área de dúvidas de uma aula específica,
  **para que** eu possa tirar dúvidas sobre o conteúdo com o professor ou monitor.
- **Critérios de Aceitação:**
  - Quero que, abaixo do vídeo da aula, exista uma seção "Dúvidas".
  - Quero um campo de texto para escrever minha pergunta.
  - Quero poder ver as perguntas de outros alunos (e as respostas) para não perguntar
    em duplicidade.
  - Quero que minha pergunta seja registrada de forma permanente e vinculada à aula.
  - Quero ser notificado (na plataforma ou por e-mail) quando minha pergunta for
    respondida.

**[FIGURA 10 — Área de dúvidas com pergunta e resposta do professor]**

*Figura 10 - Interface da Área de Dúvidas*

#### 4.1.10. HU - Avaliar o Curso

- **Como** aluno, **eu quero** avaliar o curso após a conclusão, **para que** eu possa dar
  feedback sobre minha experiência e ajudar outros alunos.
- **Critérios de Aceitação:**
  - Quero poder dar uma nota (ex: 1 a 5 estrelas) para o curso.
  - Quero poder escrever um comentário/depoimento.
  - Quero que minha avaliação seja publicada na página do curso.

**[FIGURA 11 — Modal de avaliação do curso]**

*Figura 11 - Interface da Área de Avaliação do Curso*

#### 4.1.11. HU - Abrir um Ticket na Central de Suporte

- **Como** aluno, **eu quero** abrir um ticket na central de suporte, **para que** eu possa
  resolver problemas técnicos (ex: vídeo não carrega) ou administrativos (ex: problema no
  pagamento).
- **Critérios de Aceitação:**
  - Quero encontrar facilmente a área de "Ajuda" ou "Suporte".
  - Quero preencher um formulário selecionando o tipo de problema e descrevendo a
    situação.
  - Quero receber um número de protocolo para meu ticket.
  - Quero acompanhar o status do meu ticket (Aberto, Em análise, Resolvido).

**[FIGURA 12 — Aba "Suporte" no painel do aluno]**

*Figura 12 - Área de Suporte*

### Ator: Professor / Instrutor

#### 4.1.12. HU - Criar Novo Curso

- **Como** professor, **eu quero** criar um novo curso, **para que** eu possa cadastrar as
  informações básicas e começar a adicionar conteúdo.
- **Critérios de Aceitação:**
  - Quero um botão "Criar Novo Curso" no meu painel.
  - Quero preencher um formulário inicial (Título, Descrição, Preço, Nível).
  - Quero que o curso seja gravado de forma permanente e passe a constar no catálogo.
  - Quero ser redirecionado para a página de gerenciamento do curso após a criação.

**[FIGURA 13 — Formulário "Criar curso" (Etapa 1/2)]**

*Figura 13 - Área de Criação de Curso*

#### 4.1.13. HU - Adicionar e Organizar Módulos

- **Como** professor, **eu quero** adicionar, editar e organizar módulos e aulas,
  **para que** eu possa estruturar a grade curricular do meu curso.
- **Critérios de Aceitação:**
  - Quero poder criar um "Módulo" (ex: "Módulo 1: Introdução").
  - Quero poder adicionar "Aulas" dentro de cada módulo.
  - Quero poder renomear, reordenar ou excluir módulos e aulas.
  - Quero que a estrutura criada fique gravada e seja exibida ao aluno matriculado.

**[FIGURA 14 — Editor de conteúdo com um módulo criado]**

*Figura 14 - Interface para Adicionar e Organizar Módulos*

#### 4.1.14. HU - Fazer Upload de Vídeos e Materiais de Apoio

- **Como** professor, **eu quero** fazer upload de vídeos e materiais de apoio (PDFs,
  links), **para que** eu possa disponibilizar o conteúdo para os alunos.
- **Critérios de Aceitação:**
  - Quero poder, em cada aula, indicar o vídeo correspondente.
  - Quero poder adicionar arquivos extras (ex: slides da aula em PDF) como
    "Materiais de Apoio".
  - Quero poder definir a duração e o tipo de cada aula (vídeo ou quiz).

**[FIGURA 15 — Formulário de cadastro de aula]**

*Figura 15 - Área de Upload de Vídeos e Materiais de Apoio*

#### 4.1.15. HU - Definir o Preço do Curso

- **Como** professor, **eu quero** definir o preço do curso, **para que** eu possa
  monetizar meu conteúdo.
- **Critérios de Aceitação:**
  - Quero um campo para inserir o valor (ex: R$ 99,90).
  - Quero poder criar promoções (preço original vs. preço promocional).
  - Quero poder definir o curso como "Gratuito".
  - Quero poder alterar o preço de um curso já publicado.

**[FIGURA 16 — Formulário de edição de metadados do curso]**

*Figura 16 - Área de Definição de Preço de Curso*

#### 4.1.16. HU - Responder Perguntas feitas nas Aulas

- **Como** professor, **eu quero** responder às perguntas feitas pelos alunos nas aulas,
  **para que** eu possa manter meus alunos engajados e sem dúvidas.
- **Critérios de Aceitação:**
  - Quero ver uma notificação ou um painel com "Dúvidas Pendentes".
  - Quero poder clicar na dúvida e respondê-la na própria plataforma.
  - Quero que minha resposta seja destacada como "Resposta do Professor".
  - Quero que a resposta fique visível ao aluno na aula correspondente.
  - Quero poder marcar a dúvida como "Resolvida".

**[FIGURA 17 — Painel de dúvidas pendentes]**

*Figura 17 - Interface do Professor Para Responder Dúvidas*

#### 4.1.17. HU - Gerenciar o Catálogo de Cursos

- **Como** professor, **eu quero** editar e excluir cursos já cadastrados, **para que** eu
  possa manter o catálogo atualizado e corrigir informações publicadas.
- **Critérios de Aceitação:**
  - Quero uma lista com todos os cursos cadastrados na plataforma.
  - Quero poder editar as informações de um curso existente.
  - Quero poder excluir um curso, com confirmação antes da exclusão.
  - Quero que apenas usuários com perfil de gestão consigam executar essas ações.

**[FIGURA 18 — Aba "Cursos" do backoffice]**

*Figura 18 - Interface de Gerenciamento do Catálogo*

#### 4.1.18. HU - Acessar Dashboard de Desempenho

- **Como** professor, **eu quero** acessar um dashboard de desempenho, **para que** eu
  possa ver quantas vendas, receita e quantos alunos meu curso tem.
- **Critérios de Aceitação:**
  - Quero ver o faturamento total e mensal (líquido de comissões).
  - Quero ver o número total de alunos inscritos.
  - Quero ver a nota média e a quantidade de avaliações dos cursos.
  - Quero ver um gráfico de novas inscrições ao longo do tempo.

**[FIGURA 19 — Aba "Análises" do painel administrativo]**

*Figura 19 - Dashboard de Desempenho*

## 5. Arquitetura da Solução

A versão inicial do projeto era uma aplicação de página única em React, na qual todo o
estado residia na memória do navegador. Aquela abordagem era adequada para validar a
interface, mas apresentava duas limitações incompatíveis com os requisitos levantados:
os dados eram perdidos a cada recarregamento da página e não havia como distinguir
usuários, o que inviabilizava associar matrículas, progresso e dúvidas a uma pessoa.

Para atender a esses requisitos, a solução foi reestruturada em três camadas:

```text
React + Vite   ->   API REST (Express)   ->   PostgreSQL + Auth + Storage (Supabase)
  (cliente)         (regras de negócio)            (persistência e arquivos)
```

- **Camada de apresentação.** Aplicação React, responsável pela interface e pela
  navegação. Não acessa o banco de dados diretamente; toda comunicação ocorre por
  chamadas HTTP à API.
- **Camada de aplicação.** Servidor Express que concentra as regras de negócio e as
  regras de acesso. É a única camada que detém a chave secreta de acesso ao banco.
- **Camada de dados.** Banco relacional PostgreSQL hospedado no Supabase, que também
  provê o serviço de autenticação e o armazenamento de arquivos (vídeos e materiais).

### 5.1 Autenticação e controle de acesso

A autenticação é feita por e-mail e senha através do serviço de autenticação do Supabase,
que emite um token de acesso e um token de renovação. O token de acesso é enviado pelo
cliente no cabeçalho `Authorization` de cada requisição e validado pelo servidor; quando
expira, o cliente usa o token de renovação para obter um novo sem pedir login outra vez.

O controle de acesso é aplicado no servidor por dois mecanismos encadeados:

- `requireAuth` — rejeita requisições sem token válido, garantindo que apenas usuários
  identificados acessem matrículas, progresso, dúvidas, chamados e certificados.
- `requireAdmin` — além da autenticação, exige que o perfil do usuário tenha papel de
  gestão, protegendo a criação, edição e exclusão de cursos, o envio de arquivos, os
  indicadores e a resposta a dúvidas e chamados.

Além do papel, várias regras dependem do vínculo do aluno com o curso, também
verificado no servidor:

- **Conteúdo do curso por nível de acesso.** Visitantes e alunos sem matrícula recebem
  apenas a grade (títulos e durações das aulas). O aluno matriculado recebe vídeos,
  materiais e as perguntas dos quizzes, mas **sem o gabarito**. Somente o administrador
  recebe as respostas corretas, usadas pelo editor de conteúdo.
- **Quiz corrigido no servidor.** As respostas do aluno são enviadas à API, que calcula a
  nota, compara com a nota mínima e, se aprovado, registra a conclusão. Um quiz não pode
  ser marcado como concluído sem ser feito.
- **Certificado.** A regra dos 60% de conclusão é conferida pela API antes de devolver os
  dados do certificado.

A verificação é feita no servidor, e não na interface. Ocultar um botão no cliente não
constitui controle de acesso: um usuário poderia enviar a requisição diretamente à API.

### 5.2 Separação de segredos

O sistema utiliza duas chaves distintas de acesso ao Supabase. A chave pública é utilizada
nas operações de autenticação em nome do usuário. A chave secreta, que ignora as regras
de segurança em nível de linha do banco, permanece exclusivamente no ambiente do
servidor e nunca é enviada ao navegador. Funções do banco que alteram dados têm a
execução revogada para os papéis públicos e liberada apenas para o servidor.

### 5.3 Navegação e telas

A aplicação é organizada em quatro grandes telas, definidas pelo papel do usuário:

```text
Landing page (pública)  ->  Login / Cadastro  ->  Área do aluno  |  Backoffice (admin)
```

- **Landing page:** apresenta a plataforma, os recursos e os cursos em destaque.
- **Login e cadastro:** inclui a recuperação de senha por e-mail.
- **Área do aluno:** painel de estudos ("Continue de onde parou", cursos, certificados,
  suporte e conta), catálogo, detalhes do curso, carrinho, checkout e player de aulas.
- **Backoffice:** visão geral, cursos e editor de conteúdo, dúvidas, chamados e análises.

Telas internas exigem login: um visitante que tente abri-las é direcionado ao login.
Ao reabrir o site com uma sessão salva, o usuário vai direto para a sua área.

### 5.4 Armazenamento de arquivos

Vídeos (MP4/WebM, até 50 MB) e materiais de apoio (PDF, documentos, planilhas,
apresentações, imagens e ZIP, até 20 MB) ficam em dois buckets do Supabase Storage. O
envio não passa pela API: o administrador pede à API uma **URL de envio assinada**, que
valida o tipo e o tamanho do arquivo, e o navegador envia o arquivo diretamente ao
Storage. Isso contorna o limite de tamanho das requisições da função serverless e evita
que a chave secreta seja necessária no navegador. Links do YouTube e do Vimeo também são
aceitos e reproduzidos no player.

### 5.5 Implantação

O sistema está publicado na Vercel. O frontend é servido como site estático e a API
Express roda como função serverless no mesmo domínio, o que dispensa configuração de
CORS entre origens diferentes. As chaves do Supabase são cadastradas como variáveis de
ambiente do projeto na Vercel.

O desenvolvimento segue um fluxo de branches e Pull Requests: cada funcionalidade é
desenvolvida em uma branch própria, revisada em um Pull Request e integrada à branch
`main`. Cada integração na `main` gera automaticamente uma nova versão publicada.

## 6. Modelo de Dados

O banco relacional é composto por dez tabelas:

| Tabela | Responsabilidade |
|---|---|
| `profiles` | Dados do usuário e seu papel (`student` ou `admin`) |
| `courses` | Catálogo de cursos e seus metadados |
| `enrollments` | Vínculo entre aluno e curso adquirido, com a última aula acessada |
| `course_modules` | Módulos que compõem a grade de um curso |
| `lessons` | Aulas de cada módulo, do tipo vídeo ou quiz |
| `quizzes` | Configuração do quiz, incluindo a nota mínima |
| `quiz_questions` | Perguntas, alternativas e resposta correta |
| `lesson_progress` | Registro de conclusão de cada aula por aluno |
| `lesson_questions` | Dúvidas dos alunos nas aulas e respectivas respostas |
| `support_tickets` | Chamados de suporte, com status e resposta da equipe |

Complementam o modelo:

- A função `save_course_content`, que grava módulos, aulas e quizzes de um curso numa
  **única transação**: se algo falhar no meio, nada é alterado. Aulas existentes são
  atualizadas no lugar, preservando o progresso e as dúvidas dos alunos ligados a elas.
- Os buckets `course-videos` e `course-materials` do Supabase Storage (Seção 5.4).

**[FIGURA 20 — Diagrama Entidade-Relacionamento]**

*Figura 20 - Modelo de Dados da Plataforma*

## 7. Interface de Programação (API REST)

A comunicação entre cliente e servidor ocorre por uma API REST com 36 rotas, agrupadas
por recurso. A coluna "Acesso" indica a proteção aplicada.

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/health` | Público | Verifica se o servidor está ativo |
| POST | `/api/auth/register` | Público | Cadastra um novo aluno |
| POST | `/api/auth/login` | Público | Autentica e devolve os tokens |
| POST | `/api/auth/refresh` | Público | Renova a sessão com o token de renovação |
| POST | `/api/auth/password-recovery` | Público | Envia o e-mail de redefinição de senha |
| POST | `/api/auth/recovery-session` | Público | Valida o link de redefinição |
| POST | `/api/auth/update-password` | Autenticado | Grava a nova senha (redefinição) |
| POST | `/api/auth/change-password` | Autenticado | Troca a senha, confirmando a atual |
| GET | `/api/students/me` | Autenticado | Devolve o perfil do usuário |
| PATCH | `/api/students/me` | Autenticado | Atualiza o nome do usuário |
| GET | `/api/courses` | Público | Lista o catálogo de cursos |
| POST | `/api/courses` | Gestão | Cria um curso |
| PUT | `/api/courses/:id` | Gestão | Atualiza um curso |
| DELETE | `/api/courses/:id` | Gestão | Exclui um curso |
| GET | `/api/courses/:id/content` | Conforme o acesso | Grade, aulas ou conteúdo completo (Seção 5.1) |
| PUT | `/api/courses/:id/content` | Gestão | Salva módulos, aulas e quizzes numa transação |
| POST | `/api/courses/:id/uploads` | Gestão | Gera URL assinada para enviar vídeo ou material |
| POST | `/api/courses/:id/modules` | Gestão | Cria um módulo (rota granular, não usada pela interface) |
| POST | `/api/modules/:id/lessons` | Gestão | Cria uma aula (rota granular, não usada pela interface) |
| GET | `/api/courses/:id/progress` | Autenticado | Aulas concluídas e aula em que o aluno deve continuar |
| PUT | `/api/courses/:id/last-lesson` | Autenticado | Registra a última aula aberta pelo aluno |
| PUT | `/api/lessons/:id/progress` | Autenticado | Marca ou desmarca a conclusão de uma aula de vídeo |
| POST | `/api/lessons/:id/quiz-attempt` | Autenticado | Corrige o quiz no servidor |
| GET | `/api/lessons/:id/questions` | Autenticado | Lista as dúvidas da aula |
| POST | `/api/lessons/:id/questions` | Autenticado | Envia uma dúvida |
| PATCH | `/api/questions/:id/answer` | Gestão | Responde a uma dúvida |
| GET | `/api/admin/lesson-questions` | Gestão | Lista as dúvidas de todos os cursos |
| POST | `/api/enrollments` | Autenticado | Efetiva a matrícula |
| GET | `/api/enrollments/me` | Autenticado | Cursos do aluno com progresso e próxima aula |
| GET | `/api/enrollments/:courseId/certificate` | Autenticado | Dados do certificado (a partir de 60%) |
| POST | `/api/support-tickets` | Autenticado | Abre um chamado |
| GET | `/api/support-tickets/me` | Autenticado | Lista os chamados do aluno |
| PATCH | `/api/support-tickets/:id/close` | Autenticado | O aluno encerra o próprio chamado |
| GET | `/api/admin/support-tickets` | Gestão | Lista todos os chamados |
| PUT | `/api/admin/support-tickets/:id` | Gestão | Responde ou encerra um chamado |
| GET | `/api/admin/analytics` | Gestão | Indicadores consolidados do catálogo |

## 8. Escopo do Sistema

Esta seção delimita o escopo do sistema, relacionando cada requisito levantado nas
Histórias de Usuário à sua situação de implementação. O objetivo é que a documentação
descreva o sistema tal como ele é, e não como se pretendia que fosse: um requisito
levantado e não implementado continua sendo um requisito válido do projeto, desde que
sua ausência esteja registrada de forma explícita.

### 8.1 Delimitação

**Está dentro do escopo:** a plataforma web de ensino, composta pela landing page, pela
área do aluno, pelo backoffice de gestão de catálogo e conteúdo, pela API REST que
concentra as regras de negócio, pelo banco de dados relacional e pelo armazenamento de
vídeos e materiais.

**Está fora do escopo:** o módulo de gestão interna presencial mencionado na Seção 1
(administração de turmas, matrículas presenciais e modalidade híbrida), a cobrança real
por um meio de pagamento (o checkout é demonstrativo, Seção 8.5) e o envio de
notificações por e-mail. O único e-mail enviado é o de redefinição de senha, pelo
serviço de autenticação.

### 8.2 Classificação adotada

Cada requisito é classificado em uma de três situações:

| Situação | Significado |
|---|---|
| **Implementado** | Funciona de ponta a ponta: interface, API e banco de dados. |
| **Parcial** | Funciona, mas sem atender a todos os critérios de aceitação da HU. A observação indica o que falta. |
| **Não implementado** | O requisito não está disponível ao usuário. |

### 8.3 Requisitos funcionais

**Ator Aluno**

| ID | Requisito | HU | Situação | Observação |
|---|---|---|---|---|
| RF01 | Cadastrar-se com nome, e-mail e senha | 4.1.1 | Implementado | |
| RF02 | Autenticar-se e manter a sessão ativa | 4.1.1 | Implementado | Sessão renovada automaticamente |
| RF03 | Solicitar e concluir a redefinição de senha | 4.1.1 | Implementado | |
| RF04 | Consultar o catálogo de cursos | 4.1.2 | Implementado | Catálogo completo na área do aluno; destaques na landing |
| RF05 | Buscar cursos por título ou instrutor | 4.1.2 | Implementado | Resultados atualizados a cada tecla digitada |
| RF06 | Filtrar por nível, faixa de preço e avaliação | 4.1.3 | Implementado | |
| RF07 | Visualizar os detalhes e a grade curricular de um curso | 4.1.4 | Parcial | Sem vídeo de apresentação; descrição gerada da grade |
| RF08 | Adicionar e remover cursos do carrinho | 4.1.5 | Implementado | |
| RF09 | Aplicar cupom de desconto | 4.1.5 | Não implementado | |
| RF10 | Matricular-se, sem duplicar matrícula existente | 4.1.5 | Implementado | Checkout demonstrativo com cartão ou Pix |
| RF11 | Consultar os cursos adquiridos | 4.1.5 | Implementado | |
| RF12 | Assistir às aulas e acessar o material de apoio | 4.1.6 | Implementado | Vídeo enviado, YouTube ou Vimeo |
| RF13 | Marcar e desmarcar a conclusão de uma aula | 4.1.6 | Implementado | |
| RF14 | Ter os módulos liberados conforme a progressão | 4.1.6 | Implementado | |
| RF15 | Responder quizzes e receber a nota imediatamente | 4.1.7 | Implementado | Correção feita no servidor |
| RF16 | Emitir certificado de conclusão em PDF | 4.1.8 | Implementado | Liberado a partir de 60%; nome, carga horária, data e código |
| RF17 | Enviar dúvidas em uma aula | 4.1.9 | Parcial | Sem notificação quando a dúvida é respondida |
| RF18 | Avaliar o curso com nota e comentário | 4.1.10 | Não implementado | |
| RF19 | Abrir e acompanhar tickets de suporte | 4.1.11 | Implementado | Status Aberto, Respondido e Encerrado |

**Ator Professor / Instrutor**

| ID | Requisito | HU | Situação | Observação |
|---|---|---|---|---|
| RF20 | Criar um curso com título, descrição, preço e nível | 4.1.12 | Parcial | A descrição é gerada a partir da grade |
| RF21 | Criar e organizar módulos de um curso | 4.1.13 | Implementado | Renomear, reordenar e excluir; gravação em transação |
| RF22 | Criar aulas, definindo tipo, duração e materiais | 4.1.14 | Implementado | Envio de vídeos e materiais pelo computador |
| RF23 | Cadastrar quizzes com perguntas e nota mínima | 4.1.14 | Implementado | |
| RF24 | Definir e alterar o preço de um curso | 4.1.15 | Parcial | Sem preço promocional |
| RF25 | Responder às dúvidas enviadas pelos alunos | 4.1.16 | Implementado | Painel de dúvidas pendentes no backoffice |
| RF26 | Editar e excluir cursos do catálogo | 4.1.17 | Implementado | |
| RF27 | Consultar indicadores consolidados do catálogo | 4.1.18 | Parcial | Sem gráfico de inscrições ao longo do tempo |

**Requisitos transversais**

| ID | Requisito | Situação |
|---|---|---|
| RF28 | Restringir as operações de gestão a usuários com papel de administração | Implementado |
| RF29 | Restringir matrícula, progresso, dúvidas e conteúdo das aulas a usuários com acesso ao curso | Implementado |
| RF30 | Retomar o curso a partir da última aula acessada ("Continue de onde parou") | Implementado |
| RF31 | Permitir ao aluno atualizar o nome e trocar a senha | Implementado |

### 8.4 Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF01 | A chave secreta de acesso ao banco permanece exclusivamente no servidor e nunca é enviada ao navegador. |
| RNF02 | O controle de acesso é verificado no servidor, não na interface. |
| RNF03 | A API aceita requisições apenas da origem configurada (o próprio domínio em produção). |
| RNF04 | Senhas devem ter no mínimo 6 caracteres. |
| RNF05 | O token de acesso é transmitido no cabeçalho `Authorization` e mantido apenas na sessão do navegador. |
| RNF06 | A interface é responsiva, adaptando-se do celular ao computador. |
| RNF07 | A interface é integralmente em português do Brasil. |
| RNF08 | As camadas de apresentação, aplicação e dados são independentes, comunicando-se apenas por HTTP. |
| RNF09 | Operações que alteram várias tabelas ao mesmo tempo (conteúdo do curso) são atômicas. |
| RNF10 | O gabarito dos quizzes nunca é enviado ao navegador do aluno. |
| RNF11 | Arquivos enviados são validados quanto ao tipo e ao tamanho antes do envio. |

### 8.5 Decisões de projeto

A migração do protótipo em memória para a arquitetura cliente-servidor foi concluída:
todas as funcionalidades da interface leem e gravam pela API. As decisões abaixo
registram como alguns fluxos foram resolvidos.

- **Conteúdo do curso salvo de uma vez, em transação.** O editor permite várias
  alterações (criar, renomear, reordenar e excluir módulos e aulas) e as envia juntas.
  A função `save_course_content` grava tudo numa transação e atualiza as aulas
  existentes no lugar, para não apagar o progresso e as dúvidas dos alunos.
- **Apenas a conclusão de aulas é persistida.** Os módulos liberados são derivados do
  conjunto de aulas concluídas, e não gravados: armazená-los criaria um segundo estado
  capaz de divergir do primeiro.
- **A gravação do progresso é otimista, com reversão.** A interface marca a aula
  imediatamente e desfaz a marca caso a API responda com erro.
- **"Continue de onde parou" baseado em acesso, não só em conclusão.** A matrícula
  guarda a última aula aberta. A próxima aula sugerida é essa aula, se ainda não
  concluída, ou a seguinte não concluída; nunca uma aula de módulo bloqueado. O painel e
  o player usam o mesmo cálculo, feito pela API.
- **Envio de arquivos direto ao armazenamento.** A API apenas autoriza o envio (URL
  assinada); o arquivo não trafega pela função serverless.
- **Certificado gerado no navegador, autorizado no servidor.** A API confere a regra de
  liberação e devolve os dados; o PDF é montado no navegador, sem custo de
  processamento no servidor.
- **Checkout demonstrativo.** O pagamento por cartão ou Pix é simulado: os dados do
  cartão são validados no navegador (incluindo o dígito verificador) e não são enviados
  nem armazenados. A confirmação apenas efetiva as matrículas.

### 8.6 Trabalhos futuros

1. Integrar um gateway de pagamento real e a regra de cupons (RF09).
2. Implementar a avaliação de cursos com nota e comentário (RF18), substituindo as notas
   de demonstração do catálogo.
3. Notificar o aluno quando sua dúvida ou chamado for respondido.
4. Armazenar a descrição e o vídeo de apresentação do curso (RF07 e RF20) e o preço
   promocional (RF24).
5. Exibir a evolução das inscrições ao longo do tempo no painel de análises (RF27).

## 9. REFERÊNCIAS

LONGO, Hugo José; SILVA, Paulo Cesar da. **A utilização de histórias de usuários no
levantamento de requisitos ágeis.** International Journal of Knowledge Engineering and
Management, Florianópolis, v. 3, n. 6, p. 1-30, 2014.

VAZQUEZ, Carlos Eduardo; SIMÕES, Guilherme Siqueira. **Engenharia de Requisitos:
software orientado ao negócio.** Rio de Janeiro: Brasport, 2016.

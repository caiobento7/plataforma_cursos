# Introdução

Este relatório descreve, de forma consolidada, o desenvolvimento do **CursoLab**, uma plataforma web de cursos online criada como projeto individual da disciplina de Princípios de Engenharia de Software. A plataforma cobre o ciclo completo de um curso: o visitante conhece a plataforma e o catálogo, o aluno compra um curso, estuda por vídeos, apostilas e quizzes, acompanha o próprio progresso e emite um certificado; o instrutor, por sua vez, monta o conteúdo, responde dúvidas e chamados e acompanha indicadores em um backoffice.

O sistema está publicado e em funcionamento em `https://plataforma-cursos-omega.vercel.app`, com todos os dados persistidos em banco de dados relacional. O código-fonte, a documentação técnica, as migrações do banco e os testes automatizados estão versionados no repositório do projeto.

Mais do que descrever telas, o objetivo deste documento é relacionar as decisões tomadas durante o desenvolvimento aos conceitos da disciplina: processo e ciclo de vida, métodos de desenvolvimento, engenharia de requisitos, modelagem, arquitetura, verificação, validação e testes, manutenção, documentação, padrões e reuso. Por isso, cada capítulo procura registrar não apenas *o que* foi feito, mas *por que* foi feito daquela forma e *como* isso se relaciona com o conteúdo estudado.

Um cuidado adotado ao longo de todo o texto é separar o que está implementado do que é apenas proposta de evolução. Quando uma funcionalidade é parcial ou não foi implementada, isso é dito explicitamente. Essa distinção é importante para que o relatório represente fielmente o sistema e não uma versão idealizada dele.

## Objetivo geral

Desenvolver uma plataforma web que apoie todo o ciclo de um curso online, desde a matrícula até a certificação e o suporte, com dados persistidos em banco relacional, regras de negócio garantidas no servidor, publicação na nuvem e verificação por testes automatizados.

## Objetivos específicos

Os objetivos específicos decompõem o objetivo geral em metas verificáveis. Cada um deles pode ser associado a requisitos, a trechos do código e a testes, o que facilita tanto a implementação quanto a avaliação do sistema.

- permitir cadastro, login, renovação de sessão e recuperação de senha;
- oferecer um catálogo com busca e filtros e uma página de detalhes de cada curso;
- realizar a matrícula por meio de carrinho e checkout, com prazo de acesso de seis meses e renovação;
- disponibilizar o conteúdo em módulos, com vídeos, apostilas em PDF e quizzes;
- liberar os módulos conforme a progressão do aluno e corrigir os quizzes no servidor;
- retomar o estudo a partir da última aula acessada;
- emitir certificado em PDF quando o aluno concluir todas as aulas com nota final de pelo menos 70%;
- oferecer dúvidas por aula e chamados de suporte;
- disponibilizar ao instrutor um backoffice para criar cursos, montar o conteúdo e acompanhar indicadores;
- publicar o sistema na nuvem, com implantação automática a cada mudança aprovada;
- garantir o comportamento das regras críticas por meio de testes automatizados.

## Organização do relatório

O Capítulo 2 apresenta o contexto, o problema e a solução proposta. Os Capítulos 3 e 4 tratam do processo de desenvolvimento e das metodologias. O Capítulo 5 aborda a engenharia de requisitos, e o Capítulo 6, os casos de uso. Os Capítulos 7 a 9 descrevem a arquitetura, as tecnologias, os módulos e as regras de negócio. O Capítulo 10 trata de segurança e consistência, e o Capítulo 11, de verificação, validação e testes. Os Capítulos 12 a 15 discutem manutenção, documentação, padrões e reuso. Os Capítulos 16 e 17 tratam da implantação e da interface. Por fim, os Capítulos 18 a 21 registram as dificuldades, as limitações, a avaliação global e a conclusão do trabalho.

# Contexto, problema e solução proposta

## Contexto do problema

Cursos online tornaram-se uma das formas mais comuns de estudar. Do ponto de vista de quem oferece um curso, porém, uma plataforma de ensino precisa resolver muito mais do que a exibição de vídeos. É preciso saber quem comprou o curso e até quando pode assistir, em que ordem o aluno deve avançar, como ele demonstra que aprendeu, que critério dá direito a um certificado e como o instrutor acompanha e atende os alunos.

Quando essas necessidades são resolvidas de forma improvisada, surgem problemas conhecidos. Vídeos publicados em uma página simples não registram o progresso, então o aluno não sabe onde parou e o instrutor não sabe quem está estudando. Sem controle de matrícula, o conteúdo pode ser acessado sem pagamento. Uma avaliação corrigida no próprio navegador expõe o gabarito a qualquer pessoa que abra as ferramentas de desenvolvedor. Um certificado sem regra clara perde valor. E dúvidas e pedidos de suporte espalhados por e-mail e aplicativos de mensagem geram retrabalho e respostas perdidas.

Esses problemas têm uma característica em comum: todos dependem de regras que precisam ser aplicadas de forma confiável. Não basta esconder um botão na tela; a regra precisa ser verificada no servidor, porque a interface pode ser manipulada pelo usuário. Esse ponto orientou boa parte das decisões de arquitetura do projeto.

## Solução proposta

O CursoLab é uma aplicação web acessível pelo navegador, organizada em três frentes:

- **aprender:** catálogo com busca e filtros, compra de cursos, player com vídeo, apostila em PDF e quiz por módulo;
- **comprovar:** progresso registrado aula a aula, nota final calculada a partir dos quizzes e certificado em PDF com código de verificação;
- **gerenciar:** backoffice do instrutor para criar cursos, montar módulos, aulas e quizzes, enviar arquivos, responder dúvidas e chamados e acompanhar indicadores.

A ideia central da solução é que **toda regra importante é decidida no servidor**. Quem pode assistir a uma aula, qual é a nota de um quiz e quem tem direito a um certificado são decisões tomadas pela API, que consulta o banco de dados. A interface apenas apresenta o resultado.

Os seis cursos do catálogo possuem conteúdo real: cada curso tem três módulos, e cada módulo reúne três vídeos de canais educacionais do YouTube, incorporados com crédito ao canal, um quiz de cinco perguntas e uma apostila em PDF escrita para a plataforma.

## Escopo

O escopo foi delimitado para que o projeto pudesse ser entregue completo e funcionando dentro do prazo da disciplina. Fazem parte do escopo a área pública, a área do aluno e o backoffice, com todos os fluxos persistidos em banco. Ficaram fora do escopo, e são tratados como trabalhos futuros no Capítulo 19, a integração com um gateway de pagamento real (o checkout é demonstrativo), a avaliação dos cursos pelos alunos, notificações por e-mail e o suporte a vários instrutores com cursos próprios.

# Processo de engenharia de software e ciclo de vida

Um processo de engenharia de software é um conjunto organizado de atividades que orienta o desenvolvimento e a evolução de um sistema, envolvendo especificação, projeto, implementação, validação e evolução. No CursoLab, o desenvolvimento pode ser representado pelas seis etapas gerais do ciclo de vida: planejamento, requisitos, design, codificação e testes, implantação e manutenção.

[[fig: diagramas/01-ciclo-de-vida.png | Ciclo de vida de desenvolvimento aplicado ao CursoLab.]]

A representação por etapas não significa que o projeto tenha seguido um fluxo linear. Cada funcionalidade percorreu o ciclo inteiro e, depois de publicada, gerou novas necessidades que voltaram para a etapa de requisitos, como indica a seta tracejada da figura. A regra do certificado é um exemplo: ela foi implementada, publicada, revista e alterada, com impacto controlado sobre o banco, a API, as telas, os testes e a documentação.

## Planejamento

No planejamento, a ideia ampla de uma "plataforma de cursos" foi transformada em um escopo realizável. O critério foi priorizar o fluxo central de valor: conhecer um curso, comprá-lo, estudar, ser avaliado e receber o certificado, além das ferramentas mínimas para o instrutor manter o conteúdo. Funcionalidades como pagamento real e avaliações de cursos foram adiadas, pois aumentariam o escopo sem alterar a demonstração do fluxo principal.

O planejamento também definiu a estratégia de infraestrutura: usar serviços gerenciados (Supabase para banco, autenticação e arquivos, e Vercel para hospedagem) para reduzir o esforço com servidores e concentrar o trabalho nas regras do domínio.

## Requisitos

Os requisitos foram levantados como histórias de usuário dos dois atores principais, aluno e instrutor, e depois detalhados em requisitos funcionais e não funcionais com identificação, situação e rastreabilidade. O processo é detalhado no Capítulo 5.

## Design

No design, as necessidades foram traduzidas em estrutura de software: a divisão entre front-end, API e banco de dados; o modelo de dados com suas tabelas, relacionamentos e restrições; e a definição de onde cada regra seria verificada. A opção foi por uma aplicação monolítica modularizada, com uma única API e um único banco, publicada como função serverless. O Capítulo 7 descreve essa arquitetura.

## Codificação e testes

A codificação foi incremental: cada funcionalidade foi construída, testada e publicada antes da próxima. Para as regras críticas, foram escritos testes automatizados de integração, que chamam a API real e conferem o comportamento esperado, inclusive os casos que não podem acontecer, como um visitante recebendo o gabarito de um quiz. Antes de cada publicação eram executados a análise estática (ESLint), o build e a suíte de testes.

## Implantação

A implantação foi tratada desde o início do projeto. O repositório está conectado à Vercel, de modo que cada merge na branch principal publica automaticamente uma nova versão do site e da API. As mudanças no banco de dados são feitas por migrações SQL numeradas e versionadas junto com o código. Depois de cada publicação, a suíte de testes era executada novamente contra o endereço de produção.

## Manutenção e evolução

Como o sistema esteve publicado durante o desenvolvimento, a manutenção ocorreu em paralelo à construção: correções, novas funcionalidades e adaptações ao ambiente de execução. O Capítulo 12 apresenta exemplos reais de cada tipo de manutenção.

## Fluxo de trabalho com Git

O controle de versão foi a principal evidência do processo. Nenhuma mudança foi feita diretamente na branch principal. Cada funcionalidade foi desenvolvida em uma branch própria (por exemplo, `feat/prazo-de-acesso`), enviada como Pull Request com descrição e checklist de verificação e, depois de aprovada, incorporada à branch `main`, o que disparava a publicação automática.

[[fig: diagramas/12-fluxo-git.png | Fluxo de branches e Pull Requests: cada funcionalidade chega à produção por um merge na main.]]

Ao final do projeto, o histórico registrava 12 Pull Requests, 37 commits na branch principal e 15 migrações de banco de dados. Esse histórico permite responder, para qualquer mudança, quando ela ocorreu, o que foi alterado e qual era a justificativa.

# Metodologias e métodos de desenvolvimento

## Abordagens de análise e projeto

Entre as abordagens estudadas estão a Análise e Projeto Orientados a Objetos (APOO) e a Análise e Projeto Estruturados (AEPE). O CursoLab se aproxima mais da modelagem orientada ao domínio: o sistema foi pensado a partir de entidades como curso, módulo, aula, quiz, matrícula, progresso, dúvida e chamado, com responsabilidades e relacionamentos bem definidos. Ao mesmo tempo, como a implementação usa JavaScript com funções e um banco relacional, a modelagem foi documentada principalmente por diagramas de casos de uso, de sequência, de estados e entidade-relacionamento.

## Desenvolvimento iterativo

O processo pode ser caracterizado como **iterativo e incremental, com práticas ágeis**. Cada iteração entregava uma funcionalidade completa (requisito, código, testes e publicação) e permitia rever requisitos a partir do uso do sistema publicado.

Não se afirma, porém, a adoção formal de Scrum. O projeto foi desenvolvido por uma única pessoa, sem papéis de Product Owner e Scrum Master, sem sprints de duração fixa e sem cerimônias formais. Dizer que o projeto usou Scrum seria confundir o uso de iterações com a adoção de uma metodologia completa.

## Metodologias estudadas e relação com o projeto

A Tabela 1 relaciona as principais metodologias estudadas na disciplina ao CursoLab.

Tabela: Metodologias estudadas e relação com o CursoLab.

| Metodologia | Ideia central | Relação com o CursoLab |
|---|---|---|
| Ágil | Iterações curtas, colaboração e adaptação a mudanças. | Relação direta: entregas incrementais e requisitos revistos a partir do uso. |
| Lean | Reduzir desperdício e focar em valor. | Escopo limitado ao fluxo central; serviços gerenciados evitaram trabalho com infraestrutura. |
| Scrum | Sprints, papéis definidos e inspeção frequente. | Não adotado formalmente; apenas as iterações são compatíveis. |
| Kanban | Gestão visual do fluxo de trabalho. | Os Pull Requests funcionaram como fluxo de trabalho, sem quadro formal. |
| DevOps | Integração entre desenvolvimento e operação. | Relação forte: publicação automática a cada merge e testes contra a produção. |
| FDD | Desenvolvimento orientado a funcionalidades. | Cada branch correspondeu a uma funcionalidade completa. |
| XP | Ciclos curtos, simplicidade e testes. | Testes automatizados e simplicidade de design; sem programação em par. |
| Cascata | Fases sequenciais fortemente documentadas. | Não representa o processo, pois houve revisões durante o desenvolvimento. |
| Prototipação | Protótipos para validar o entendimento. | Telas novas foram prototipadas e aprovadas antes da implementação final. |
| Espiral | Iterações guiadas por análise de riscos. | Não adotado formalmente; riscos de integração foram tratados primeiro. |

# Engenharia de requisitos

A engenharia de requisitos compreende a descoberta, a análise, a documentação, a verificação e a validação das funções e restrições do sistema. Erros nessa etapa tendem a ser os mais caros, porque se propagam para o projeto, o código e os testes.

No CursoLab, grande parte da complexidade está nas regras do domínio e não nas telas. Requisitos como "assistir à aula", "fazer o quiz" ou "emitir o certificado" são insuficientes se descritos superficialmente: é preciso definir quem pode assistir, como a nota é calculada, o que acontece quando o prazo de acesso vence e qual critério libera o certificado.

## Processo de requisitos no CursoLab

[[fig: diagramas/02-requisitos.png | Fluxo de engenharia de requisitos adotado no projeto.]]

### Elicitação

Como projeto acadêmico, não houve um cliente externo formal. A elicitação foi feita por análise do domínio de ensino online, estudo de plataformas de cursos conhecidas e escrita de **histórias de usuário** no formato "Como [ator], eu quero [ação], para que [benefício]", cada uma com critérios de aceitação. Foram escritas 18 histórias: 11 do aluno e 7 do instrutor. Um exemplo:

> **HU – Emitir certificado de conclusão.** Como aluno, eu quero emitir um certificado de conclusão, para que eu possa comprovar meu aprendizado. Critérios de aceitação: o botão só é habilitado quando a regra de conclusão é atendida; o certificado é gerado em PDF; contém nome, curso, carga horária e data de conclusão.

### Análise e negociação

Os requisitos foram priorizados pelo valor para o fluxo central e pela viabilidade dentro do prazo. A análise também identificou dependências: não há matrícula sem curso, não há progresso sem matrícula, e o certificado depende do progresso e das notas. Essas dependências definiram a ordem de implementação. Requisitos de menor prioridade, como cupons de desconto e avaliação de cursos, foram registrados como não implementados.

### Documentação

Os requisitos foram documentados no repositório em `docs/documentacao-requisitos.md`, com histórias de usuário, requisitos funcionais e não funcionais numerados e a situação de cada um. Tabelas favorecem a rastreabilidade; o texto explica o contexto e as decisões; os diagramas dão a visão estrutural.

### Verificação

A verificação conferiu se os requisitos eram claros, consistentes e testáveis. Um requisito como "o quiz deve ser seguro" é vago; já "o gabarito dos quizzes nunca é enviado ao navegador do aluno" pode ser verificado por um teste automatizado, e de fato é. Sempre que possível, os requisitos foram escritos de forma a originar um teste.

### Validação

A validação procurou confirmar se o sistema construído resolve o problema. Ela foi feita com o sistema publicado: navegando como visitante, aluno e administrador, com cursos de conteúdo real, e ajustando os requisitos quando o uso mostrava uma regra inadequada. A mudança da regra do certificado, descrita na Seção 5.2.3, surgiu justamente dessa validação.

## Tipos de requisitos

### Requisitos funcionais

Os requisitos funcionais descrevem o que o sistema deve fazer. A Tabela 2 apresenta os requisitos do aluno, a Tabela 3 os do instrutor e a Tabela 4 os transversais.

Tabela: Requisitos funcionais do ator aluno.

| ID | Requisito | Situação | Observação |
|---|---|---|---|
| RF01 | Cadastrar-se com nome, e-mail e senha | Implementado | |
| RF02 | Autenticar-se e manter a sessão ativa | Implementado | Sessão renovada automaticamente |
| RF03 | Solicitar e concluir a redefinição de senha | Implementado | Link enviado por e-mail |
| RF04 | Consultar o catálogo de cursos | Implementado | |
| RF05 | Buscar cursos pelo título | Implementado | Resultados a cada tecla digitada |
| RF06 | Filtrar por nível, faixa de preço e avaliação | Implementado | |
| RF07 | Visualizar os detalhes e a grade de um curso | Implementado | Sem vídeo de apresentação |
| RF08 | Adicionar e remover cursos do carrinho | Implementado | |
| RF09 | Aplicar cupom de desconto | Não implementado | |
| RF10 | Matricular-se, sem duplicar matrícula ativa | Implementado | Checkout demonstrativo (cartão ou Pix) |
| RF11 | Consultar os cursos adquiridos e o prazo de acesso | Implementado | |
| RF12 | Assistir às aulas e acessar o material de apoio | Implementado | Arquivo, YouTube ou Vimeo |
| RF13 | Marcar e desmarcar a conclusão de uma aula | Implementado | |
| RF14 | Ter os módulos liberados conforme a progressão | Implementado | |
| RF15 | Responder quizzes e receber a nota | Implementado | Correção no servidor |
| RF16 | Emitir certificado de conclusão em PDF | Implementado | 100% das aulas e nota final ≥ 70% |
| RF17 | Enviar dúvidas em uma aula | Parcial | Sem notificação da resposta |
| RF18 | Avaliar o curso com nota e comentário | Não implementado | |
| RF19 | Abrir e acompanhar chamados de suporte | Implementado | Aberto, respondido e encerrado |

Tabela: Requisitos funcionais do ator instrutor (administrador).

| ID | Requisito | Situação | Observação |
|---|---|---|---|
| RF20 | Criar um curso com título, preço, nível e prazo de acesso | Implementado | |
| RF21 | Criar e organizar módulos | Implementado | Renomear, reordenar e excluir, em transação |
| RF22 | Criar aulas com tipo, duração, descrição e materiais | Implementado | Envio de vídeos e PDFs pelo computador |
| RF23 | Cadastrar quizzes com perguntas e nota mínima | Implementado | |
| RF24 | Definir e alterar o preço de um curso | Parcial | Sem preço promocional |
| RF25 | Responder às dúvidas dos alunos | Implementado | |
| RF26 | Editar e excluir cursos do catálogo | Implementado | |
| RF27 | Consultar indicadores do catálogo | Parcial | Sem série histórica de inscrições |

Tabela: Requisitos funcionais transversais.

| ID | Requisito | Situação |
|---|---|---|
| RF28 | Restringir as operações de gestão ao papel de administrador | Implementado |
| RF29 | Restringir conteúdo, progresso e dúvidas a quem tem matrícula dentro do prazo | Implementado |
| RF30 | Retomar o curso a partir da última aula acessada | Implementado |
| RF31 | Permitir ao aluno atualizar o nome e trocar a senha | Implementado |
| RF32 | Renovar o acesso a um curso expirado, mantendo o progresso | Implementado |

### Requisitos não funcionais

Os requisitos não funcionais definem qualidades e restrições que atravessam todo o sistema.

Tabela: Requisitos não funcionais.

| ID | Categoria | Requisito |
|---|---|---|
| RNF01 | Segurança | A chave secreta do banco permanece exclusivamente no servidor. |
| RNF02 | Segurança | O controle de acesso é verificado no servidor, não na interface. |
| RNF03 | Segurança | A API aceita requisições apenas da origem configurada. |
| RNF04 | Segurança | Senhas têm no mínimo 6 caracteres e são armazenadas apenas como hash. |
| RNF05 | Segurança | O token de acesso é enviado no cabeçalho Authorization e mantido só na sessão do navegador. |
| RNF06 | Segurança | O gabarito dos quizzes nunca é enviado ao navegador do aluno. |
| RNF07 | Consistência | Operações que alteram várias tabelas ao mesmo tempo são atômicas. |
| RNF08 | Desempenho | Arquivos são enviados direto ao armazenamento, sem passar pela API. |
| RNF09 | Usabilidade | A interface é responsiva e integralmente em português do Brasil. |
| RNF10 | Manutenibilidade | As camadas de apresentação, aplicação e dados comunicam-se apenas por HTTP. |
| RNF11 | Disponibilidade | O sistema é hospedado na nuvem e publicado automaticamente a cada mudança aprovada. |

### Requisitos estáveis e voláteis

Requisitos estáveis tendem a permanecer válidos ao longo do projeto, como a existência de cursos, módulos, aulas e matrículas. Requisitos voláteis têm maior probabilidade de mudar, geralmente porque dependem de decisões de negócio. O CursoLab teve três mudanças relevantes de requisito durante o desenvolvimento, registradas na Tabela 6.

Tabela: Mudanças de requisito registradas durante o projeto.

| Requisito | Antes | Depois | Artefatos alterados juntos |
|---|---|---|---|
| Liberação do certificado | 60% das aulas concluídas | 100% das aulas e nota final ≥ 70% (média da melhor nota de cada quiz) | migração 015, API, painel, player, landing, PDF, testes e documentação |
| Acesso ao curso | sem prazo | 6 meses por matrícula, com renovação | migração 013, API, painel, checkout e testes |
| Conteúdo dos cursos | aulas de demonstração | vídeos reais com crédito, quizzes e apostilas | migração 014, editor, player e script de carga |

A mudança do certificado ilustra bem por que o gerenciamento de requisitos precisa de rastreabilidade. Se apenas o texto da página inicial tivesse sido atualizado, a API continuaria liberando o certificado com 60%. Se apenas a API mudasse, a interface prometeria uma regra que não vale mais. A alteração foi feita em um único Pull Request que atualizou o banco, a API, as telas, os testes e a documentação.

### Requisitos inversos

Requisitos inversos definem o que **não pode** acontecer. No CursoLab, eles foram formalizados e, em sua maioria, transformados em testes automatizados:

- RI01: o sistema não deve enviar o gabarito de um quiz ao navegador do aluno;
- RI02: o sistema não deve marcar um quiz como concluído sem que o aluno o tenha feito;
- RI03: o sistema não deve entregar vídeos e materiais a quem não tem matrícula dentro do prazo;
- RI04: o sistema não deve liberar o certificado com aulas pendentes ou nota final abaixo de 70%;
- RI05: o sistema não deve deixar o conteúdo de um curso salvo pela metade quando uma gravação falhar;
- RI06: o sistema não deve permitir operações de gestão a usuários que não sejam administradores;
- RI07: o sistema não deve expor a chave secreta do banco ao navegador.

## Gerenciamento e rastreabilidade de requisitos

A rastreabilidade associa cada requisito à sua implementação e ao teste que confirma seu funcionamento. Assim, quando um requisito muda, é possível saber quais artefatos precisam ser revisados. A Tabela 7 apresenta a rastreabilidade das regras mais críticas.

Tabela: Rastreabilidade entre requisito, implementação e teste automatizado.

| Requisito | Implementação | Teste automatizado |
|---|---|---|
| RF15 / RI01 | rota `quiz-attempt`; conteúdo sem gabarito para o aluno | seguranca-do-quiz: "aluno matriculado não recebe o gabarito" |
| RI02 | rota de progresso recusa quiz | seguranca-do-quiz: "não marca quiz como concluído sem fazer (400)" |
| RF16 / RI04 | `toProgressResponse` e rota do certificado | painel-aluno: "certificado bloqueado com aulas pendentes (403)"; seguranca-do-quiz: "certificado bloqueado pela nota (403)" |
| RF29 / RI03 | `hasCourseAccess` e prazo de acesso | prazo-de-acesso: "acesso expirado: conteúdo volta a ser só a grade" |
| RF21 / RI05 | função `save_course_content` | conteudo: "conteúdo intacto após payloads inválidos" |
| RF28 / RI06 | middleware `requireAdmin` | duvidas: "aluno não acessa a lista do backoffice (403)"; chamados: "aluno não acessa lista do admin (403)" |
| RF30 | `findNextLesson` e `last-lesson` | continuar-de-onde-parou (16 verificações) |
| RNF08 | rota de upload com URL assinada | uploads: "PUT direto no Storage" |

# Casos de uso

A modelagem por casos de uso representa as funcionalidades do ponto de vista dos atores. Diferentemente do modelo de dados, que descreve a estrutura interna, o caso de uso descreve objetivos observáveis: "emitir certificado" é um objetivo do aluno; "consultar a tabela lesson_progress" é um detalhe de implementação.

O CursoLab tem dois atores principais. O **aluno** compra cursos, estuda e é avaliado. O **administrador** (instrutor) mantém o catálogo e atende os alunos. Há também o **visitante**, que acessa a página inicial, o catálogo em destaque e a grade dos cursos, mas não o conteúdo das aulas.

[[fig: diagramas/03-casos-de-uso-aluno.png | Casos de uso do aluno.]]

As relações de inclusão (`«include»`) destacam comportamentos obrigatórios: fazer um quiz sempre inclui a correção no servidor, e a aprovação é o que libera o módulo seguinte; emitir o certificado sempre inclui a conferência da regra de conclusão.

[[fig: diagramas/04-casos-de-uso-admin.png | Casos de uso do administrador.]]

## Caso de uso: Realizar quiz

O caso de uso "Realizar quiz" é representativo porque reúne autenticação, controle de acesso, regra de negócio e persistência. A Tabela 8 apresenta sua especificação resumida. Cada fluxo alternativo originou um teste automatizado.

Tabela: Especificação resumida do caso de uso Realizar quiz.

| Campo | Descrição |
|---|---|
| Ator principal | Aluno. |
| Pré-condições | Aluno autenticado, com matrícula ativa e dentro do prazo; módulo do quiz liberado. |
| Fluxo principal | O aluno responde às perguntas e envia; o sistema confere o acesso, busca o gabarito no banco, calcula a nota, grava a conclusão e a melhor nota e libera o módulo seguinte. |
| Pós-condições | Quiz concluído, melhor nota registrada e progresso atualizado. |
| Fluxos alternativos | Nota abaixo da mínima (pode refazer); matrícula expirada (403); sem matrícula (403); respostas ausentes (400); sessão inválida (401). |

# Arquitetura e projeto do sistema

## Visão geral

O CursoLab é uma aplicação web **monolítica modularizada**: há um único front-end, uma única API e um único banco de dados, organizados internamente em responsabilidades separadas. A figura a seguir mostra a visão de implantação.

[[fig: diagramas/05-arquitetura-externa.png | Arquitetura: visão externa e de implantação.]]

O navegador carrega a interface, um site estático construído com React e Vite e servido pela CDN da Vercel. Todas as chamadas para endereços que começam com `/api` são direcionadas a uma função serverless, que executa a API escrita em Express. A API se comunica com o Supabase, que fornece três serviços: **Auth** (contas e tokens), **PostgreSQL** (dados) e **Storage** (vídeos e documentos). Arquivos grandes não passam pela API: ela apenas gera uma URL assinada, e o navegador envia o arquivo direto ao Storage. Os vídeos de terceiros são incorporados com o player oficial do YouTube.

A decisão por um monólito foi coerente com o porte do projeto. Separar o sistema em microsserviços traria custos de comunicação entre serviços, autenticação distribuída, implantação e observabilidade que não se justificam para uma aplicação desenvolvida por uma pessoa. Ao mesmo tempo, publicar a API como função serverless eliminou a necessidade de administrar um servidor.

## Camadas da aplicação

[[fig: diagramas/06-arquitetura-interna.png | Arquitetura: fluxo interno de uma requisição.]]

Internamente, uma requisição atravessa camadas com responsabilidades distintas:

- **Apresentação:** páginas e componentes React. Exibem dados e capturam ações, sem conhecer o banco de dados.
- **Cliente da API:** o módulo `services/api.js` concentra as chamadas HTTP, anexa o token de acesso e renova a sessão automaticamente quando ela expira.
- **Controle de acesso:** os middlewares `requireAuth` (valida o token no Supabase Auth) e `requireAdmin` (confere o papel no perfil) são aplicados às rotas antes de qualquer regra.
- **Rotas e regras de negócio:** validam a entrada, verificam o acesso ao recurso (por exemplo, matrícula dentro do prazo) e aplicam as regras do domínio.
- **Dados:** o PostgreSQL guarda os dados e aplica restrições de integridade; operações compostas são executadas em funções do banco, dentro de transações.

Essa separação reduz o acoplamento. Uma mudança na regra do certificado alterou a API e os textos das telas, mas não exigiu mudar o modo como as telas obtêm os dados. Do mesmo modo, os testes de integração verificam a API sem depender da interface.

## Modelo de dados

O banco possui 10 tabelas, que podem ser agrupadas em quatro áreas: pessoas, catálogo, aprendizado e comunicação.

[[fig: diagramas/07-modelo-de-dados.png | Modelo entidade-relacionamento do CursoLab.]]

Tabela: Tabelas do banco de dados.

| Tabela | Área | Papel |
|---|---|---|
| profiles | Pessoas | Perfil de cada conta: nome e papel (aluno ou administrador). Criado por um gatilho no cadastro. |
| courses | Catálogo | Curso: título, preço, nível, capa e prazo de acesso em meses. |
| course_modules | Catálogo | Módulos de um curso, com ordem única por curso. |
| lessons | Catálogo | Aulas de um módulo: tipo (vídeo ou quiz), vídeo, material, descrição e crédito. |
| quizzes | Catálogo | Nota mínima de uma aula do tipo quiz. |
| quiz_questions | Catálogo | Perguntas, opções e resposta correta. |
| enrollments | Aprendizado | Matrícula: aluno, curso, data, prazo de acesso e última aula aberta. |
| lesson_progress | Aprendizado | Conclusão de cada aula por aluno e melhor nota de cada quiz. |
| lesson_questions | Comunicação | Dúvidas enviadas nas aulas e respostas do instrutor. |
| support_tickets | Comunicação | Chamados de suporte com assunto, mensagem, status e resposta. |

Algumas decisões de modelagem merecem destaque:

- **A matrícula é a entidade central do aprendizado.** Ela liga aluno e curso e guarda a data de expiração do acesso e a última aula aberta, usadas pelo prazo de acesso e pelo "continue de onde parou".
- **Os módulos liberados não são armazenados.** Eles são derivados do conjunto de aulas concluídas. Guardá-los criaria um segundo estado capaz de divergir do primeiro.
- **O quiz é um tipo de aula.** Isso permite ordená-lo junto com os vídeos dentro do módulo e tratar a conclusão de forma uniforme na tabela de progresso.
- **Restrições ficam no próprio banco.** Chaves estrangeiras com exclusão em cascata, restrições de unicidade (por exemplo, um aluno só tem uma matrícula por curso e uma linha de progresso por aula) e checagens de valores (nota entre 0 e 100, status do chamado) protegem os dados mesmo que a API tenha um erro.

## Diagramas de sequência

Os diagramas de sequência mostram a ordem temporal das interações. A figura a seguir apresenta o fluxo de autenticação, incluindo a renovação automática da sessão.

[[fig: diagramas/08-sequencia-autenticacao.png | Sequência de autenticação, acesso a uma rota protegida e renovação da sessão.]]

A figura seguinte apresenta o fluxo crítico de correção de um quiz. O ponto principal é que o gabarito é lido no banco e comparado no servidor; o navegador envia apenas as respostas e recebe apenas o resultado.

[[fig: diagramas/09-sequencia-quiz.png | Sequência da correção de um quiz.]]

## Diagramas de estados

Duas entidades possuem ciclo de vida relevante: a matrícula e o chamado de suporte.

[[fig: diagramas/10-estados.png | Estados da matrícula e do chamado de suporte.]]

A matrícula começa ativa na compra, torna-se expirada quando o prazo de acesso vence e volta a ser ativa quando o aluno renova, sem perder o progresso. O certificado conquistado continua disponível mesmo depois da expiração. O chamado começa aberto, pode ser respondido pelo administrador e é encerrado pelo aluno ou pelo administrador.

# Tecnologias utilizadas

Tabela: Tecnologias empregadas no projeto.

| Tecnologia | Versão | Finalidade |
|---|---|---|
| React | 19 | Construção da interface em componentes. |
| Vite | 7 | Servidor de desenvolvimento e build do front-end. |
| Node.js | 20+ | Execução da API e dos scripts. |
| Express | 5 | API REST: 36 rotas e middlewares de acesso. |
| Supabase PostgreSQL | 15+ | Banco relacional: tabelas, restrições e funções. |
| Supabase Auth | – | Contas, hash de senha e tokens JWT. |
| Supabase Storage | – | Armazenamento de vídeos, materiais e apostilas. |
| supabase-js | 2 | Cliente de acesso ao Supabase a partir da API. |
| jsPDF | 4 | Geração do certificado e das apostilas em PDF. |
| lucide-react | 1 | Ícones da interface. |
| Vercel | – | Hospedagem, CDN, função serverless e publicação automática. |
| GitHub | – | Versionamento, branches e Pull Requests. |
| ESLint | 9 | Análise estática do código. |

## Justificativa das escolhas

### React e Vite

O React permite construir a interface como composição de componentes reutilizáveis, o que favorece a consistência visual: botões, campos, quadros e listas seguem a mesma linguagem em todas as telas. O Vite oferece um servidor de desenvolvimento rápido e, no build, gera arquivos estáticos que a Vercel distribui pela CDN.

### Node.js e Express

O Express é um framework simples e maduro para APIs HTTP, com o conceito de middleware, que encaixou bem no controle de acesso em camadas. Manter front-end e API na mesma linguagem (JavaScript) reduziu a quantidade de tecnologias diferentes a gerenciar.

### Supabase

O Supabase fornece um PostgreSQL gerenciado, autenticação e armazenamento de arquivos em um único serviço. A escolha de um banco relacional foi motivada pelo domínio: cursos têm módulos, módulos têm aulas, matrículas e progresso referenciam alunos e aulas. Essas relações e suas restrições são naturalmente expressas em SQL. O Supabase Auth evitou implementar do zero o armazenamento seguro de senhas e a emissão de tokens.

### Vercel

A Vercel hospeda o site estático e executa a API como função serverless, com publicação automática a partir do GitHub. Essa combinação tornou o deploy contínuo uma consequência natural do fluxo de Pull Requests.

### jsPDF

A geração de PDF no navegador evita processamento no servidor. O certificado é autorizado pela API, que confere a regra e devolve os dados, e montado no navegador. A mesma biblioteca, executada no Node.js, gera as apostilas dos cursos.

# Roteiro de fala: CursoLab

Princípios de Engenharia de Software · Caio Bento · Nova Friburgo, 07/10/2026

## Slide 1: Capa

Boa tarde. Eu sou o Caio Bento e vou apresentar o CursoLab, uma plataforma de cursos online que eu desenvolvi sozinho para a disciplina. Ela está no ar, no endereço do slide, e no final eu mostro ela funcionando. Vou passar rápido pelo contexto e dedicar a maior parte do tempo à arquitetura: como o sistema é dividido, como as peças conversam, como os dados são modelados, como funciona a autenticação e quais foram os desafios de integração.

## Slide 2: Roteiro da apresentação

Esse é o roteiro. Começo com o contexto em um slide, passo pelo processo e pelos requisitos e entro na parte principal, que é a arquitetura: a visão geral, o front-end, o back-end, o controle de acesso, o modelo de dados e o banco, a autenticação, os arquivos e a implantação. Depois falo das regras e dos desafios de integração, dos testes, e fecho com a demonstração.

## Slide 3: Contexto e solução

Em um slide, o contexto. Uma plataforma de cursos não é só uma página com vídeos: ela precisa controlar quem pode assistir e até quando, a ordem em que o aluno avança, como ele prova que aprendeu e como o instrutor acompanha tudo. O CursoLab entrega isso em três áreas: a pública, a do aluno e o backoffice do instrutor, com seis cursos de conteúdo real. E o princípio que guiou a arquitetura inteira é este da direita: toda regra importante é decidida no servidor, porque a tela pode ser manipulada pelo usuário. É isso que eu vou mostrar daqui para frente.

## Slide 4: Processo de desenvolvimento

Sobre o processo: segui as etapas clássicas do ciclo de vida, mas de forma iterativa. Cada volta do ciclo entregava uma funcionalidade inteira: requisito, código, teste e publicação. A seta pontilhada mostra que, depois de publicar, apareciam novas necessidades que voltavam para os requisitos. Eu não digo que usei Scrum, porque trabalhei sozinho e não tive sprints nem papéis formais. A melhor definição é iterativo e incremental, com práticas ágeis.

## Slide 5: Processo na prática: fluxo de Git

Esse é o fluxo de trabalho na prática. Nada foi direto para produção. Cada funcionalidade nasceu numa branch, virou um Pull Request com descrição e checklist de testes e, quando eu fazia o merge na main, a Vercel publicava sozinha. As mudanças no banco também foram versionadas, em quinze migrações SQL. No total foram doze Pull Requests e trinta e sete commits, e o histórico do GitHub é a evidência desse processo.

## Slide 6: Engenharia de requisitos

Os requisitos foram levantados como histórias de usuário, do aluno e do instrutor. À esquerda estão os funcionais, o que o sistema faz, e à direita os não funcionais, como ele faz. Um ponto que vale destacar é o requisito volátil: o certificado era liberado com sessenta por cento das aulas, e hoje a regra mudou para cem por cento das aulas e nota final de pelo menos setenta. Essa mudança não foi só no código: mudaram juntos a migração do banco, a API, as telas, os testes e a documentação. Isso é rastreabilidade na prática.

## Slide 7: Casos de uso

Os casos de uso têm dois atores. O aluno compra, estuda, faz quiz, continua de onde parou, tira dúvidas e emite o certificado. O administrador, que é o instrutor, monta os cursos, envia arquivos, responde e acompanha indicadores. As relações de include mostram o que é obrigatório: fazer o quiz sempre inclui a correção no servidor, e é essa correção que libera o próximo módulo.

## Slide 8: Arquitetura geral: visão externa

Agora a arquitetura, primeiro por fora. O usuário abre o site, e o navegador baixa a interface em React da Vercel. Tudo que começa com barra api vai para uma função serverless, onde roda a minha API em Express. A API conversa com o Supabase, que me dá três serviços: autenticação, o banco PostgreSQL e o Storage para arquivos. Os arquivos grandes não passam pela API: o navegador envia direto para o Storage com uma URL assinada. A decisão foi um monólito modularizado, uma API e um banco, rodando como serverless. Para o tamanho do projeto, microsserviços só trariam complexidade.

## Slide 9: Arquitetura geral: camadas de uma requisição

Por dentro, a requisição passa por camadas. A página em React chama o cliente da API, que coloca o token e renova a sessão quando ela expira. Na API, a requisição passa primeiro pelos middlewares: o requireAuth confere quem é o usuário, e o requireAdmin confere se ele é administrador. Só então chega na rota, que valida os dados e aplica a regra de negócio antes de ir ao banco. A vantagem é que cada camada tem uma responsabilidade clara: a tela não conhece o banco, e a regra não depende da tela.

## Slide 10: Tecnologias principais

Essas são as tecnologias. No front-end, React com Vite. Na API, Node com Express. O Supabase entrega o banco PostgreSQL, a autenticação e o armazenamento de arquivos. O jsPDF gera o certificado e as apostilas. A Vercel hospeda tudo e publica a cada merge, e o GitHub guarda o histórico. Para qualidade, ESLint e uma suíte de testes de integração. A escolha seguiu um critério: usar serviços gerenciados para a infraestrutura e concentrar o meu esforço nas regras do domínio.

## Slide 11: Front-end: React como aplicação de página única

Começando pelo front-end. É uma aplicação de página única em React. O App.jsx guarda o estado global, como o usuário logado, a página atual e o carrinho, e decide qual das treze páginas mostrar. As páginas são montadas com componentes reutilizáveis, como o card de curso, o quiz e a área de dúvidas. Toda comunicação com o servidor passa por um único módulo, o api.js, que coloca o token e renova a sessão quando ela expira. E uma única folha de estilos define a linguagem visual de todas as telas. A decisão importante aqui é que o front-end não tem regra de negócio: ele chama a API e mostra o resultado. No build, o Vite gera arquivos estáticos, que a Vercel distribui pela CDN.

## Slide 12: Back-end: API Express em dois ambientes

No back-end, a API é feita em Express. O ponto principal é que o mesmo aplicativo roda em dois ambientes. O app.js monta a API com CORS, JSON, middlewares e rotas, e é exportado. Localmente, o server.js sobe esse app numa porta. Na Vercel, o api/index.js reaproveita o mesmo app como função serverless. Ou seja, o código que eu testo na minha máquina é exatamente o que roda em produção. O supabase.js cria dois clientes: um com a chave pública, usado só para login, e um com a chave secreta, que acessa o banco e os arquivos e só existe no servidor.

## Slide 13: API REST: 36 rotas

A API tem trinta e seis rotas REST, organizadas por área. Autenticação e conta, catálogo e conteúdo, aprendizado, dúvidas, chamados e indicadores. Os verbos seguem o padrão REST: GET para ler, POST para criar, PUT e PATCH para alterar, DELETE para excluir. E o nível de acesso é declarado na própria rota: oito são públicas, dezesseis exigem login e doze são só para administrador. Por exemplo, a rota que salva o conteúdo do curso tem os dois middlewares, requireAuth e requireAdmin, antes de chegar no código.

## Slide 14: Controle de acesso: a mesma rota, três respostas

Esse slide mostra como o controle de acesso funciona na prática, com uma rota só: a que devolve o conteúdo do curso. A API olha quem está pedindo e devolve três versões diferentes. O visitante, ou o aluno sem matrícula ou com o prazo vencido, recebe só a grade. O aluno matriculado recebe os vídeos, os materiais e as perguntas do quiz, mas sem o gabarito. E o administrador recebe tudo, porque precisa do gabarito para editar. Isso tem que ser no servidor: se a API mandasse tudo e a tela escondesse, qualquer pessoa abriria as ferramentas do navegador e veria o vídeo pago ou a resposta do quiz.

## Slide 15: Modelo de dados

O modelo de dados tem dez tabelas, que eu organizei em quatro grupos. Pessoas: o profiles, que guarda se o usuário é aluno ou admin. Catálogo: curso, módulos, aulas, e uma aula pode ser um quiz com perguntas. Aprendizado: a matrícula e o progresso. Comunicação: dúvidas e chamados. O ponto central é a matrícula: ela liga o aluno ao curso e guarda até quando ele tem acesso e qual foi a última aula aberta. O progresso guarda cada aula concluída e a melhor nota de cada quiz, que é a base do certificado. As chaves estrangeiras usam cascade, então apagar um curso apaga o conteúdo dele sem deixar lixo.

## Slide 16: Banco de dados: regras também no PostgreSQL

O banco não é só um lugar para guardar dados: ele também protege as regras. São dez tabelas e quinze migrações versionadas junto com o código. As restrições impedem dado inválido mesmo se a API tiver um erro: chaves estrangeiras com cascata, unicidade, como uma matrícula por aluno e curso, e checagens, como nota entre zero e cem. Um gatilho cria o perfil quando a conta é criada. E a gravação do conteúdo do curso é uma função do próprio PostgreSQL, que salva módulos, aulas e quizzes numa transação: ou salva tudo, ou nada. Essa função só pode ser executada pelo back-end, porque a permissão foi revogada para o acesso público.

## Slide 17: Autenticação e autorização

Autenticação e autorização são duas perguntas diferentes. Autenticação é quem é você. O login é feito pelo Supabase Auth, e a senha nunca fica em texto: fica só o hash. A API devolve dois tokens, um de acesso, que é um JWT de curta duração, e um de renovação. Todo pedido leva o token de acesso no cabeçalho. Quando ele expira, a resposta é 401, e o front-end renova a sessão e repete o pedido sem o usuário perceber, como mostra a sequência. Autorização é o que você pode fazer: o requireAuth valida o token, o requireAdmin confere o papel no perfil, e cada recurso ainda tem a sua regra. O vídeo só vai para quem tem matrícula dentro do prazo, o visitante vê só a grade, e o gabarito do quiz só vai para o administrador. Outro cuidado: a chave pública só faz login, e a chave secreta, que tem acesso total ao banco, existe só no servidor.

## Slide 18: Arquivos: upload direto com URL assinada

Os arquivos têm um fluxo próprio. Quando o instrutor escolhe um vídeo, o editor primeiro pede autorização à API. A API confere se ele é administrador e se o tipo e o tamanho são permitidos, e pede ao Storage uma URL assinada, que vale para aquele arquivo. O navegador então envia o vídeo direto para o Storage, com barra de progresso, e no fim a aula é salva com a URL pública. O motivo é que a Vercel limita cada requisição a quatro e meio megabytes, e os vídeos podem ter até cinquenta. Assim, o arquivo nunca passa pela API.

## Slide 19: Implantação: do Pull Request à produção

Por fim, a implantação. Cada mudança passa por um Pull Request, onde eu rodo lint, build e testes. O merge na main dispara o build na Vercel: o front-end vai para a CDN e a API vira uma função serverless. As chaves do Supabase ficam em variáveis de ambiente, nunca no código. Quando a mudança mexe no banco, a migração SQL é aplicada no Supabase antes do merge. O resultado é que publicar não tem passo manual: é consequência do fluxo. E depois de cada merge eu rodo os testes de novo, contra a produção.

## Slide 20: Regras de negócio principais

Essas são as regras de negócio principais. Progressão: o próximo módulo só abre quando o anterior está concluído, com o quiz aprovado. Quiz: corrigido no servidor, com nota mínima de setenta, e vale a melhor tentativa, então refazer pode subir a nota, mas nunca baixar. Prazo: cada matrícula vale seis meses; quando expira, o aluno volta a ver só a grade, e renovar mantém o progresso. O continue de onde parou leva para a última aula aberta ou para a próxima pendente, sem sugerir aula de módulo bloqueado. O certificado exige cem por cento das aulas e nota final de pelo menos setenta, e o PDF traz nome, carga horária, nota, data e um código de verificação.

## Slide 21: Fluxo crítico: correção do quiz

Escolhi o quiz como fluxo crítico porque ele concentra várias regras. O aluno envia só as respostas. A API confere se a matrícula está ativa e dentro do prazo, busca o gabarito no banco, que nunca sai do servidor, e calcula a nota. Se passou da nota mínima, grava a conclusão e a melhor nota, e o player libera o próximo módulo. Por que no servidor? Porque, se fosse na tela, qualquer aluno abriria as ferramentas do navegador e veria o gabarito, ou forjaria a aprovação.

## Slide 22: Desafios de integração

Essa é a parte que mais me ensinou: os desafios de integração. Primeiro, a Vercel limita cada requisição a quatro e meio megabytes, e eu queria vídeos de até cinquenta. A solução foi a API gerar uma URL assinada e o navegador enviar o arquivo direto para o Storage. Segundo, o cliente do Supabase não tem transação, e salvar um curso mexe em quatro tabelas. Então escrevi uma função no PostgreSQL que salva tudo de forma atômica. Terceiro, reordenar aulas quebrava a regra de ordem única, e resolvi movendo a ordem para uma faixa livre antes de reordenar. Também precisei adaptar o Express para rodar como função serverless, renovar a sessão automaticamente e configurar os links de recuperação de senha no Supabase.

## Slide 23: Verificação, validação e testes

Nos testes, o projeto tem oito suítes de integração automatizadas, com cento e cinquenta e oito verificações. Elas chamam a API de verdade, com banco real, criam usuários e cursos temporários e apagam tudo no final. Os testes cobrem principalmente o que não pode acontecer: visitante recebendo vídeo, aluno sem matrícula acessando aula, quiz marcado sem ser feito, certificado com nota baixa. Eu rodo antes de cada Pull Request e de novo contra a produção depois do merge. Lembrando a diferença da disciplina: verificação é construir certo, e validação é construir a coisa certa, o sistema publicado e usado.

## Slide 24: Manutenção, documentação, padrões e reuso

Na manutenção, tenho exemplos reais dos quatro tipos. Corretiva: a retomada de aula devolvia o código de erro errado para quem não era matriculado, e eu corrigi. Evolutiva: o prazo de acesso e os cursos reais. Adaptativa: o Express adaptado para rodar como serverless na Vercel. Preventiva: os testes de regressão. A documentação está no repositório: README, as rotas da API, o documento de requisitos e o relatório. Nos padrões, eu só cito o que existe no código: as camadas, os middlewares em cadeia, que lembram o Chain of Responsibility, e um adaptador que transforma links do YouTube, do Vimeo ou de arquivo no mesmo player. E o reuso de bibliotecas maduras foi o que me deixou focar nas regras do domínio.

## Slide 25: Demonstração

Agora vou mostrar o sistema funcionando, no ar. Vou seguir esta ordem: a landing page e o login do aluno; o catálogo, os detalhes de um curso e o checkout; o painel com o continue de onde parou; o player com vídeo, apostila e quiz; o certificado em PDF; e, por fim, o login como administrador, para mostrar o backoffice, o editor de conteúdo e os chamados.

## Slide 26: Limitações e trabalhos futuros

Também quero ser transparente sobre as limitações. O pagamento é simulado, não tem gateway real. A avaliação do curso pelo aluno não foi implementada. Não há notificação por e-mail quando a dúvida é respondida. Existe um único papel de administrador. E parte dos indicadores mistura números de demonstração com os reais. As evoluções naturais são um gateway de pagamento, avaliações, notificações, vários instrutores e rodar os testes automaticamente em cada Pull Request.

## Slide 27: Conclusão

Para concluir: o CursoLab saiu do problema e chegou a uma solução publicada, com requisitos, arquitetura, regras no servidor, segurança, testes e documentação. O principal aprendizado é que software não é só código. A regra importante fica no servidor, o requisito muda e a mudança precisa ser rastreável, integrar serviços exige mais do que escrever funções, e ter testes automatizados é o que dá segurança para mudar sem medo.

## Slide 28: Encerramento

Obrigado pela atenção. Fico à disposição para perguntas.

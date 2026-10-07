# Roteiro de fala: CursoLab

Princípios de Engenharia de Software · Caio Bento · Nova Friburgo, 07/10/2026

## Slide 1: Capa

Boa tarde. Eu sou o Caio Bento e vou apresentar o CursoLab, uma plataforma de cursos online que eu desenvolvi sozinho para a disciplina. Ela está no ar, no endereço que aparece no slide, e no final eu vou mostrar ela funcionando. A ideia da apresentação é seguir o caminho do projeto: o problema, como eu organizei o desenvolvimento, os requisitos, a arquitetura, o modelo de dados, a autenticação, os desafios de integração e os testes.

## Slide 2: Roteiro da apresentação

Esse é o roteiro. Eu começo pelo problema e pela solução, passo pelo processo e pelos requisitos, depois entro na parte técnica, que é arquitetura, modelo de dados e autenticação, e fecho com os desafios de integração, os testes, uma demonstração ao vivo e a conclusão.

## Slide 3: Problema observado

O problema que eu quis resolver é o de quem vende e de quem faz curso online. Não basta colocar vídeos numa página. É preciso saber quem comprou e até quando pode assistir, em que ordem o aluno avança, como ele prova que aprendeu e como o instrutor acompanha isso. Sem isso, o aluno se perde, o conteúdo pode ser acessado sem pagamento, o certificado não tem critério e o suporte fica espalhado em e-mail e WhatsApp.

## Slide 4: Solução proposta

A solução é o CursoLab. Ele tem três frentes: aprender, com catálogo, compra e um player com vídeo, apostila e quiz; comprovar, com progresso real, nota e certificado em PDF; e gerenciar, com um backoffice onde o instrutor monta os cursos e responde os alunos. A ideia que guiou o projeto todo é que as regras importantes, como quem pode assistir, qual a nota e quem recebe certificado, são decididas no servidor e não na tela, porque a tela o usuário consegue manipular.

## Slide 5: Objetivos do sistema

O objetivo geral foi apoiar o ciclo inteiro de um curso online, da matrícula ao suporte. Os objetivos específicos aparecem na direita, e cada um vai voltar mais adiante: o prazo de acesso de seis meses, a liberação de módulos, a correção do quiz no servidor, a regra do certificado, as dúvidas e os chamados, o deploy na nuvem e os testes automatizados.

## Slide 6: Processo de desenvolvimento

Sobre o processo: segui as etapas clássicas do ciclo de vida, mas de forma iterativa. Cada volta do ciclo entregava uma funcionalidade inteira: requisito, código, teste e publicação. A seta pontilhada mostra que, depois de publicar, apareciam novas necessidades que voltavam para os requisitos. Eu não digo que usei Scrum, porque trabalhei sozinho e não tive sprints nem papéis formais. A melhor definição é iterativo e incremental, com práticas ágeis.

## Slide 7: Processo na prática: fluxo de Git

Esse é o fluxo de trabalho na prática. Nada foi direto para produção. Cada funcionalidade nasceu numa branch, virou um Pull Request com descrição e checklist de testes e, quando eu fazia o merge na main, a Vercel publicava sozinha. As mudanças no banco também foram versionadas, em quinze migrações SQL. No total foram doze Pull Requests e trinta e sete commits, e o histórico do GitHub é a evidência desse processo.

## Slide 8: Engenharia de requisitos

Os requisitos foram levantados como histórias de usuário, do aluno e do instrutor. À esquerda estão os funcionais, o que o sistema faz, e à direita os não funcionais, como ele faz. Um ponto que vale destacar é o requisito volátil: o certificado era liberado com sessenta por cento das aulas, e hoje a regra mudou para cem por cento das aulas e nota final de pelo menos setenta. Essa mudança não foi só no código: mudaram juntos a migração do banco, a API, as telas, os testes e a documentação. Isso é rastreabilidade na prática.

## Slide 9: Casos de uso I: aluno

Esses são os casos de uso do aluno. Ele cria conta, busca, compra, estuda, faz quiz, continua de onde parou, tira dúvidas e emite o certificado. As setas tracejadas são relações de include: fazer o quiz sempre inclui a correção no servidor, e essa correção é o que libera o próximo módulo. Emitir o certificado sempre inclui conferir a regra de cem por cento e nota setenta.

## Slide 10: Casos de uso II: administrador

Do lado do administrador, que é o instrutor, os casos de uso são de gestão: criar e editar cursos, montar módulos, aulas e quizzes, enviar vídeos e materiais, definir preço e prazo de acesso, responder dúvidas e chamados e acompanhar os indicadores. Salvar o conteúdo inclui uma transação no banco, e enviar arquivo inclui o upload direto ao Storage. Os dois aparecem de novo nos desafios de integração.

## Slide 11: Arquitetura I: visão externa

Agora a arquitetura, primeiro por fora. O usuário abre o site, e o navegador baixa a interface em React da Vercel. Tudo que começa com barra api vai para uma função serverless, onde roda a minha API em Express. A API conversa com o Supabase, que me dá três serviços: autenticação, o banco PostgreSQL e o Storage para arquivos. Os arquivos grandes não passam pela API: o navegador envia direto para o Storage com uma URL assinada. A decisão foi um monólito modularizado, uma API e um banco, rodando como serverless. Para o tamanho do projeto, microsserviços só trariam complexidade.

## Slide 12: Arquitetura II: fluxo interno da aplicação

Por dentro, a requisição passa por camadas. A página em React chama o cliente da API, que coloca o token e renova a sessão quando ela expira. Na API, a requisição passa primeiro pelos middlewares: o requireAuth confere quem é o usuário, e o requireAdmin confere se ele é administrador. Só então chega na rota, que valida os dados e aplica a regra de negócio antes de ir ao banco. A vantagem é que cada camada tem uma responsabilidade clara: a tela não conhece o banco, e a regra não depende da tela.

## Slide 13: Tecnologias principais

Essas são as tecnologias. No front-end, React com Vite. Na API, Node com Express. O Supabase entrega o banco PostgreSQL, a autenticação e o armazenamento de arquivos. O jsPDF gera o certificado e as apostilas. A Vercel hospeda tudo e publica a cada merge, e o GitHub guarda o histórico. Para qualidade, ESLint e uma suíte de testes de integração. A escolha seguiu um critério: usar serviços gerenciados para a infraestrutura e concentrar o meu esforço nas regras do domínio.

## Slide 14: Modelo de dados

O modelo de dados tem dez tabelas, que eu organizei em quatro grupos. Pessoas: o profiles, que guarda se o usuário é aluno ou admin. Catálogo: curso, módulos, aulas, e uma aula pode ser um quiz com perguntas. Aprendizado: a matrícula e o progresso. Comunicação: dúvidas e chamados. O ponto central é a matrícula: ela liga o aluno ao curso e guarda até quando ele tem acesso e qual foi a última aula aberta. O progresso guarda cada aula concluída e a melhor nota de cada quiz, que é a base do certificado. As chaves estrangeiras usam cascade, então apagar um curso apaga o conteúdo dele sem deixar lixo.

## Slide 15: Autenticação e autorização

Autenticação e autorização são duas perguntas diferentes. Autenticação é quem é você. O login é feito pelo Supabase Auth, e a senha nunca fica em texto: fica só o hash. A API devolve dois tokens, um de acesso, que é um JWT de curta duração, e um de renovação. Todo pedido leva o token de acesso no cabeçalho. Quando ele expira, a resposta é 401, e o front-end renova a sessão e repete o pedido sem o usuário perceber, como mostra a sequência. Autorização é o que você pode fazer: o requireAuth valida o token, o requireAdmin confere o papel no perfil, e cada recurso ainda tem a sua regra. O vídeo só vai para quem tem matrícula dentro do prazo, o visitante vê só a grade, e o gabarito do quiz só vai para o administrador. Outro cuidado: a chave pública só faz login, e a chave secreta, que tem acesso total ao banco, existe só no servidor.

## Slide 16: Regras de negócio principais

Essas são as regras de negócio principais. Progressão: o próximo módulo só abre quando o anterior está concluído, com o quiz aprovado. Quiz: corrigido no servidor, com nota mínima de setenta, e vale a melhor tentativa, então refazer pode subir a nota, mas nunca baixar. Prazo: cada matrícula vale seis meses; quando expira, o aluno volta a ver só a grade, e renovar mantém o progresso. O continue de onde parou leva para a última aula aberta ou para a próxima pendente, sem sugerir aula de módulo bloqueado. O certificado exige cem por cento das aulas e nota final de pelo menos setenta, e o PDF traz nome, carga horária, nota, data e um código de verificação.

## Slide 17: Fluxo crítico: correção do quiz

Escolhi o quiz como fluxo crítico porque ele concentra várias regras. O aluno envia só as respostas. A API confere se a matrícula está ativa e dentro do prazo, busca o gabarito no banco, que nunca sai do servidor, e calcula a nota. Se passou da nota mínima, grava a conclusão e a melhor nota, e o player libera o próximo módulo. Por que no servidor? Porque, se fosse na tela, qualquer aluno abriria as ferramentas do navegador e veria o gabarito, ou forjaria a aprovação.

## Slide 18: Segurança e consistência

Resumindo segurança e consistência. Na segurança: hash de senha, tokens com expiração, chave secreta só em variável de ambiente, funções do banco bloqueadas para acesso público, gabarito que nunca vai ao navegador e validação de toda entrada. Na consistência: restrições no próprio banco, como check e unique; o conteúdo do curso é salvo numa transação, então ou salva tudo ou nada; e as migrações podem ser executadas mais de uma vez sem quebrar. A meta é não ter estado parcial, dado inválido nem operação sem autorização.

## Slide 19: Desafios de integração

Essa é a parte que mais me ensinou: os desafios de integração. Primeiro, a Vercel limita cada requisição a quatro e meio megabytes, e eu queria vídeos de até cinquenta. A solução foi a API gerar uma URL assinada e o navegador enviar o arquivo direto para o Storage. Segundo, o cliente do Supabase não tem transação, e salvar um curso mexe em quatro tabelas. Então escrevi uma função no PostgreSQL que salva tudo de forma atômica. Terceiro, reordenar aulas quebrava a regra de ordem única, e resolvi movendo a ordem para uma faixa livre antes de reordenar. Também precisei adaptar o Express para rodar como função serverless, renovar a sessão automaticamente e configurar os links de recuperação de senha no Supabase.

## Slide 20: Verificação, validação e testes

Nos testes, o projeto tem oito suítes de integração automatizadas, com cento e cinquenta e oito verificações. Elas chamam a API de verdade, com banco real, criam usuários e cursos temporários e apagam tudo no final. Os testes cobrem principalmente o que não pode acontecer: visitante recebendo vídeo, aluno sem matrícula acessando aula, quiz marcado sem ser feito, certificado com nota baixa. Eu rodo antes de cada Pull Request e de novo contra a produção depois do merge. Lembrando a diferença da disciplina: verificação é construir certo, e validação é construir a coisa certa, o sistema publicado e usado.

## Slide 21: Manutenção, documentação, padrões e reuso

Na manutenção, tenho exemplos reais dos quatro tipos. Corretiva: a retomada de aula devolvia o código de erro errado para quem não era matriculado, e eu corrigi. Evolutiva: o prazo de acesso e os cursos reais. Adaptativa: o Express adaptado para rodar como serverless na Vercel. Preventiva: os testes de regressão. A documentação está no repositório: README, as rotas da API, o documento de requisitos e o relatório. Nos padrões, eu só cito o que existe no código: as camadas, os middlewares em cadeia, que lembram o Chain of Responsibility, e um adaptador que transforma links do YouTube, do Vimeo ou de arquivo no mesmo player. E o reuso de bibliotecas maduras foi o que me deixou focar nas regras do domínio.

## Slide 22: Demonstração

Agora vou mostrar o sistema funcionando, no ar. Vou seguir esta ordem: a landing page e o login do aluno; o catálogo, os detalhes de um curso e o checkout; o painel com o continue de onde parou; o player com vídeo, apostila e quiz; o certificado em PDF; e, por fim, o login como administrador, para mostrar o backoffice, o editor de conteúdo e os chamados.

## Slide 23: Limitações e trabalhos futuros

Também quero ser transparente sobre as limitações. O pagamento é simulado, não tem gateway real. A avaliação do curso pelo aluno não foi implementada. Não há notificação por e-mail quando a dúvida é respondida. Existe um único papel de administrador. E parte dos indicadores mistura números de demonstração com os reais. As evoluções naturais são um gateway de pagamento, avaliações, notificações, vários instrutores e rodar os testes automaticamente em cada Pull Request.

## Slide 24: Conclusão

Para concluir: o CursoLab saiu do problema e chegou a uma solução publicada, com requisitos, arquitetura, regras no servidor, segurança, testes e documentação. O principal aprendizado é que software não é só código. A regra importante fica no servidor, o requisito muda e a mudança precisa ser rastreável, integrar serviços exige mais do que escrever funções, e ter testes automatizados é o que dá segurança para mudar sem medo.

## Slide 25: Encerramento

Obrigado pela atenção. Fico à disposição para perguntas.

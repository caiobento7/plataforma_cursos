# Descrição dos módulos e regras de negócio

Este capítulo descreve os módulos do sistema e as regras de negócio que cada um aplica. As figuras são capturas da versão publicada.

## Área pública e autenticação

A página inicial apresenta a plataforma, os cursos em destaque e as perguntas frequentes, e leva ao login. Na tela de login, o usuário entra com e-mail e senha ou cria uma conta. Contas criadas pelo cadastro recebem o papel de aluno; o papel de administrador é atribuído diretamente no banco.

[[fig: prints/01-landing.png | Página inicial da plataforma.]]

[[fig: prints/02-login.png | Tela de login e cadastro.]]

O login é feito pela API, que consulta o Supabase Auth com a chave pública. Em caso de sucesso, a API devolve um token de acesso (JWT de curta duração) e um token de renovação. O front-end guarda os dois apenas na sessão do navegador e envia o token de acesso no cabeçalho `Authorization` de cada requisição. Quando a API responde com 401 porque o token expirou, o cliente da API solicita novos tokens com o token de renovação e repete a requisição original, sem que o usuário perceba. A recuperação de senha envia ao e-mail do usuário um link que abre a própria plataforma na tela de nova senha.

## Catálogo e detalhes do curso

O catálogo lista os cursos com busca pelo título e filtros por nível, preço e avaliação. Cursos em que o aluno já está matriculado aparecem como "Matriculado". A página de detalhes mostra a grade do curso: módulos, aulas, durações e descrições. Para quem não está matriculado, a API devolve somente a grade, sem os links dos vídeos, dos materiais nem as perguntas dos quizzes.

[[fig: prints/03-catalogo.png | Catálogo de cursos com busca e filtros.]]

## Carrinho, checkout e matrícula

O aluno adiciona cursos ao carrinho e conclui a compra no checkout, que é demonstrativo: aceita cartão (com validação do número no navegador) ou Pix, mas nenhum valor é cobrado e os dados do cartão não são enviados nem armazenados. A confirmação cria as matrículas.

[[fig: prints/06-checkout.png | Checkout demonstrativo.]]

**Regra do prazo de acesso.** Cada curso define um prazo de acesso em meses (seis por padrão). Na matrícula, a API calcula a data de expiração. Uma matrícula ativa não pode ser duplicada. Quando o prazo vence, o curso continua na lista do aluno, mas o conteúdo volta a ser apenas a grade, e progresso, dúvidas e registro de acesso são bloqueados. Comprar o curso novamente renova o prazo a partir da data atual, preservando o progresso. O certificado já conquistado continua disponível.

## Painel do aluno e "continue de onde parou"

O painel reúne os cursos do aluno, o progresso de cada um, os certificados, os chamados de suporte e os dados da conta. O destaque do painel é o "continue de onde parou".

[[fig: prints/07-painel-aluno.png | Painel do aluno com o "continue de onde parou".]]

**Regra da próxima aula.** A matrícula guarda a última aula aberta pelo aluno. A próxima aula sugerida é: essa aula, se ainda não foi concluída; caso contrário, a próxima aula não concluída depois dela; e, sem acesso registrado, a primeira aula não concluída. Aulas de módulos bloqueados nunca são sugeridas: nesse caso vale a primeira pendente dos módulos liberados, que é justamente a que libera o próximo módulo. O cálculo é feito pela API e usado tanto pelo painel quanto pelo player.

## Player e progressão por módulos

O player exibe o vídeo, o crédito ao canal de origem, a descrição da aula, o material de apoio (a apostila em PDF do módulo), a barra de progresso e a grade do curso, com os módulos bloqueados indicados por um cadeado. Também é no player que o aluno envia dúvidas sobre a aula.

[[fig: prints/10-player.png | Player de aulas com vídeo, crédito, descrição, material e grade do curso.]]

**Regra de progressão.** O primeiro módulo está sempre liberado. Um módulo só é liberado quando o anterior está concluído: se o módulo anterior tem quiz, o quiz precisa estar aprovado; se não tem, todas as aulas de vídeo precisam estar concluídas. Os módulos liberados não são gravados no banco: são derivados das aulas concluídas a cada consulta. A marcação de conclusão é otimista: a interface marca a aula na hora e desfaz a marcação se a API responder com erro.

## Quizzes

Cada módulo dos cursos reais termina com um quiz de cinco perguntas e nota mínima de 70%.

[[fig: prints/11-quiz.png | Quiz no player.]]

**Regra do quiz.** O aluno envia apenas as respostas. A API confere a matrícula e o prazo, lê o gabarito no banco, calcula a nota como a proporção de acertos e compara com a nota mínima. Se aprovado, a API grava a conclusão do quiz e a melhor nota obtida; refazer o quiz pode aumentar a nota, nunca diminuí-la. A resposta da API traz a nota e o resultado, mas nunca o gabarito. Um quiz não pode ser marcado como concluído pela rota comum de progresso; só a aprovação o conclui.

## Certificado

[[fig: prints/08-certificados.png | Aba de certificados do painel do aluno.]]

**Regra do certificado.** O certificado é liberado quando o aluno conclui **todas as aulas do curso** e tem **nota final de pelo menos 70%**, sendo a nota final a média da melhor nota de cada quiz. A API confere a regra antes de devolver os dados e, quando o certificado não está disponível, explica o motivo (aulas pendentes ou nota insuficiente). O PDF é montado no navegador com o nome do aluno, o curso, a carga horária (soma das durações das aulas), a nota final, a data de conclusão, a assinatura do coordenador e um código de verificação derivado da matrícula.

## Dúvidas por aula

O aluno com acesso ao curso pode enviar dúvidas em qualquer aula. As dúvidas aparecem para os demais alunos da aula com o nome do autor e, no backoffice, em uma fila de "sem resposta" para o instrutor. A resposta do instrutor fica visível na aula.

## Chamados de suporte

O aluno abre chamados gerais ou sobre um curso em que está matriculado e acompanha o status: aberto, respondido ou encerrado. O administrador responde ou encerra pelo backoffice. Um aluno com acesso expirado ainda pode abrir chamado sobre o curso, pois o suporte é justamente o canal para resolver esse tipo de situação.

[[fig: prints/09-suporte.png | Chamados de suporte na área do aluno.]]

[[fig: prints/15-chamados.png | Fila de chamados no backoffice.]]

## Backoffice e editor de conteúdo

O backoffice é restrito ao papel de administrador. A visão geral mostra indicadores e pendências (dúvidas sem resposta e chamados abertos). O instrutor cria cursos informando título, preço, nível e prazo de acesso, e monta o conteúdo no editor: módulos, aulas de vídeo (com envio de arquivo ou link do YouTube ou Vimeo), descrição, crédito do vídeo, material de apoio e quizzes com perguntas e nota mínima.

[[fig: prints/12-backoffice.png | Visão geral do backoffice.]]

[[fig: prints/17-editor-conteudo.png | Editor de conteúdo do curso.]]

**Regra de gravação do conteúdo.** O editor permite várias alterações (criar, renomear, reordenar e excluir módulos e aulas) e as envia de uma vez. A API valida todo o conteúdo e chama a função `save_course_content` do banco, que grava tudo numa única transação. Aulas existentes são atualizadas no lugar, e não recriadas, para não apagar o progresso e as dúvidas dos alunos. Se qualquer parte falhar, nada é alterado.

## Indicadores

A aba de análises apresenta, por curso, matrículas, novos alunos e faturamento dos últimos 30 dias e avaliação. Os indicadores somam números de demonstração, gravados no catálogo para dar volume à apresentação, às matrículas reais calculadas a partir da tabela de matrículas. Essa mistura é uma limitação conhecida, registrada no Capítulo 19.

[[fig: prints/13-analises.png | Indicadores por curso no backoffice.]]

## Conteúdo real dos cursos

Os seis cursos do catálogo têm conteúdo real, cadastrado por um script versionado (`npm run seed:cursos`). Cada curso tem três módulos, e cada módulo tem três vídeos de canais educacionais do YouTube, verificados como públicos e incorporáveis, um quiz de cinco perguntas e uma apostila em PDF escrita para a plataforma e enviada ao Storage. Os vídeos são exibidos com o player oficial do YouTube, no modo de privacidade aprimorada, e com o crédito ao canal na aula e na apostila. O script pode ser executado novamente sem perda de dados: aulas com o mesmo título mantêm o identificador e, portanto, o progresso dos alunos.

# Segurança e consistência

## Autenticação e sessão

As senhas são armazenadas pelo Supabase Auth apenas como hash; o código do projeto nunca grava nem lê senhas. A sessão é representada por um token JWT assinado e de curta duração, renovado com um token de renovação. Os tokens ficam na sessão do navegador (`sessionStorage`) e são descartados ao fechar a aba ou sair. Cada rota protegida valida o token no Supabase Auth por meio do middleware `requireAuth`.

## Autorização

Autenticar diz quem é o usuário; autorizar diz o que ele pode fazer. O CursoLab aplica a autorização em três níveis:

- **por papel:** o middleware `requireAdmin` libera as operações de gestão apenas para perfis com papel de administrador;
- **por recurso:** vídeos, materiais, perguntas dos quizzes, progresso e dúvidas exigem matrícula dentro do prazo; chamados exigem que o aluno seja o autor;
- **por campo:** o mesmo conteúdo de curso é entregue em três versões. O visitante recebe só a grade, o aluno matriculado recebe o conteúdo sem o gabarito e o administrador recebe tudo, para poder editar.

Toda essa verificação acontece no servidor. Esconder um botão na interface não é controle de acesso, pois qualquer requisição pode ser enviada diretamente à API.

## Separação de segredos

O Supabase fornece duas chaves. A **chave pública** é usada apenas para o login. A **chave secreta**, que tem acesso total ao banco, existe apenas no servidor, como variável de ambiente local (fora do repositório) e na Vercel; ela nunca é enviada ao navegador. Além disso, as funções do banco que fazem operações administrativas tiveram a permissão de execução revogada para os papéis públicos do Supabase, de modo que só o backend consegue executá-las.

## Validação de entrada

Toda entrada é validada na API antes de chegar ao banco: campos obrigatórios, tamanhos máximos (por exemplo, descrição da aula com até 1000 caracteres), URLs que precisam começar com `http://` ou `https://`, notas entre 0 e 100, respostas de quiz que precisam estar entre as opções, tipos e tamanhos de arquivo permitidos. Mensagens de erro claras são devolvidas com o código HTTP adequado (400, 401, 403, 404 ou 409). A API também aceita requisições apenas da origem configurada (CORS).

## Transações e restrições

A consistência é garantida em duas camadas. Na API, operações compostas são delegadas a funções do banco que executam numa única transação, como a gravação do conteúdo do curso. No banco, restrições de integridade impedem dados inválidos mesmo em caso de erro na aplicação: chaves estrangeiras, unicidade (uma matrícula por aluno e curso, uma ordem por módulo), checagens de valores e exclusão em cascata. As migrações foram escritas para poder ser executadas mais de uma vez sem erro.

# Verificação, validação e testes

## Verificação e validação

**Verificação** avalia se o produto foi construído corretamente, isto é, conforme a especificação. **Validação** avalia se o produto correto foi construído, isto é, se ele atende à necessidade. No CursoLab, a verificação foi feita por análise estática, build e testes automatizados; a validação, pelo uso do sistema publicado como visitante, aluno e administrador, com conteúdo real. A mudança da regra do certificado mostra a diferença: a regra de 60% estava corretamente implementada (verificação), mas não era a regra adequada (validação).

## Análise estática e dinâmica

A análise estática é feita pelo ESLint, executado antes de cada Pull Request, e pelo build do Vite, que falha diante de erros de sintaxe ou importações inválidas. A revisão do próprio diff de cada Pull Request também é uma forma de análise estática. A análise dinâmica é feita pela suíte de testes de integração, que executa a API de verdade, e pela navegação no sistema publicado.

## Testes automatizados

O projeto possui uma suíte de **testes de integração automatizados** em `backend/tests`, executada com `npm run test:api`. Os testes chamam a API real e usam o banco configurado. Cada suíte cria seus próprios usuários, com e-mails `@cursolab.test`, e cursos temporários, e apaga tudo ao final. A mesma suíte pode ser executada contra a API local ou contra a produção, passando o endereço como parâmetro.

Tabela: Suítes de testes automatizados.

| Suíte | Verificações | O que cobre |
|---|---|---|
| conteudo | 23 | gravação do conteúdo em transação, reordenação, validações e payloads inválidos |
| seguranca-do-quiz | 22 | grade sem gabarito, correção no servidor, melhor nota e regra do certificado |
| painel-aluno | 25 | progresso, próxima aula, certificado, carga horária, nome e troca de senha |
| prazo-de-acesso | 18 | expiração, bloqueio do conteúdo, renovação e manutenção do progresso |
| continuar-de-onde-parou | 16 | cálculo da próxima aula com módulos bloqueados e acesso registrado |
| chamados | 22 | abertura, resposta, encerramento e permissões dos chamados |
| duvidas | 15 | envio, resposta e permissões das dúvidas por aula |
| uploads | 17 | URL assinada, envio ao Storage, tipos e tamanhos permitidos |
| **Total** | **158** | |

Os testes priorizam os requisitos inversos, isto é, o que não pode acontecer: visitante recebendo vídeo ou gabarito, aluno sem matrícula acessando aula, quiz marcado sem ser feito, certificado com nota insuficiente, dado inválido alterando o banco e acesso expirado liberando conteúdo. Todas as suítes passaram localmente e contra a produção após o último merge.

## Níveis de teste

Tabela: Níveis de teste e aplicação ao CursoLab.

| Nível | Objetivo | Aplicação no projeto |
|---|---|---|
| Unitário | Verificar pequenas unidades isoladamente. | Não há testes unitários formais; as regras são cobertas pela integração. Evolução futura. |
| Integração | Verificar a interação entre componentes. | 8 suítes que exercitam API, Supabase Auth, PostgreSQL e Storage juntos. |
| Sistema | Verificar a aplicação completa. | Suítes executadas contra a produção e navegação no sistema publicado. |
| Aceitação | Confirmar a adequação ao uso. | Roteiro de demonstração com os fluxos do aluno e do administrador. |
| Regressão | Garantir que mudanças não quebrem o que existia. | A suíte completa é executada antes de cada Pull Request e depois de cada merge. |

## Testes funcionais e não funcionais

Os testes automatizados são testes funcionais de **caixa-preta** e de **API**: enviam requisições e verificam o código de resposta e o conteúdo, sem depender da implementação interna. Também funcionam como testes de **regressão** e de **fumaça** após cada publicação.

Os testes não funcionais não foram todos formalizados. Há verificações de segurança, como acesso sem token, acesso de outro usuário e exposição do gabarito, mas não foram executados testes de carga, de estresse ou de desempenho com métricas definidas. Esses testes são registrados como evolução.

## Modelo V

O Modelo V relaciona cada etapa de construção à atividade de verificação ou validação correspondente.

[[fig: diagramas/11-modelo-v.png | Relação entre etapas de construção e níveis de teste no Modelo V.]]

# Manutenção e evolução

A manutenção de software reúne as atividades que mantêm o sistema funcional, seguro e adequado depois de entregue. Como o CursoLab esteve publicado durante todo o desenvolvimento, houve exemplos reais dos quatro tipos de manutenção.

## Manutenção corretiva

A rota que registra a última aula aberta devolvia "acesso expirado" (403) para um aluno que nem sequer era matriculado no curso. A correção passou a verificar primeiro a matrícula (404) e depois o prazo (403), e foi acompanhada de testes que impedem a volta do erro. Toda correção seguiu o mesmo princípio: reproduzir o defeito, corrigir e acrescentar uma verificação de regressão à suíte.

## Manutenção evolutiva

O prazo de acesso de seis meses, o conteúdo real dos cursos (vídeos, quizzes e apostilas), a descrição e o crédito das aulas e a nova regra do certificado foram evoluções introduzidas depois que o sistema já estava publicado, cada uma com migração, código, testes e documentação.

## Manutenção adaptativa

Para publicar na Vercel, a API em Express, originalmente um servidor que escuta uma porta, foi adaptada: o aplicativo passou a ser exportado por um módulo e reaproveitado tanto pelo servidor local quanto pela função serverless. Também foi necessário configurar as URLs de redirecionamento do Supabase para o domínio de produção, para que os links de recuperação de senha funcionassem.

## Manutenção preventiva

A suíte de testes de regressão, executada a cada mudança, é a principal medida preventiva. As migrações idempotentes, a revisão de dependências e a atualização da documentação a cada Pull Request também reduzem a chance de falhas futuras.

## Refatoração e dívida técnica

Refatorar é reestruturar o código sem alterar o comportamento externo, e os testes automatizados foram o que tornou as refatorações seguras: depois de cada mudança interna, a suíte confirmava que o comportamento continuava o mesmo. A dívida técnica conhecida está registrada de forma explícita:

- a API está concentrada em um único arquivo, que cresceu com o projeto e poderia ser dividido por módulo (cursos, aprendizado, suporte);
- não há testes unitários nem testes automatizados da interface;
- os indicadores misturam números de demonstração com dados reais;
- os testes ainda são executados manualmente, e não automaticamente em cada Pull Request.

## Versionamento

Todo o código, as migrações do banco, o script de carga dos cursos, a documentação e as fontes deste relatório estão versionados no Git. Cada mudança pode ser associada a um Pull Request com a justificativa, o que complementa a rastreabilidade dos requisitos com a rastreabilidade técnica.

# Documentação de software

A documentação acompanhou o código ao longo do projeto, e não foi produzida apenas no final. Cada Pull Request que alterava uma regra também atualizava os documentos afetados.

## Documentação técnica

- `README.md`: visão geral, arquitetura, funcionalidades, ordem de execução das migrações, variáveis de ambiente, testes, implantação e fluxo de desenvolvimento;
- `backend/README.md`: estrutura da API e referência das 36 rotas, com método, caminho e nível de acesso;
- `backend/database/*.sql`: migrações numeradas e comentadas, explicando o motivo de cada mudança;
- `docs/documentacao-requisitos.md`: histórias de usuário, requisitos, arquitetura, modelo de dados e decisões de projeto;
- comentários no código apenas onde a decisão não é evidente, como a regra da próxima aula, a faixa temporária de ordenação e a correção do quiz no servidor;
- este relatório e os diagramas, cujas fontes estão em `docs/entrega`.

## Documentação de API

As rotas estão documentadas em tabela no `backend/README.md`, com método, caminho e acesso exigido. Em uma evolução, essa documentação poderia ser formalizada em OpenAPI, o que permitiria gerar uma interface de consulta e validar contratos automaticamente.

## Guia de implantação e instalação

O README descreve a preparação completa do ambiente: execução das migrações no Supabase, criação do arquivo de variáveis de ambiente, instalação das dependências, execução local da API e do front-end, carga dos cursos reais, execução dos testes e publicação na Vercel.

## Documentação do usuário

A interface foi escrita para dispensar manual: as telas explicam as regras no próprio contexto. O painel informa quantas aulas faltam ou qual nota falta para o certificado, o player indica módulos bloqueados e a página inicial tem uma seção de perguntas frequentes. Um manual do usuário formal é uma possibilidade de evolução.

# Padrões de desenvolvimento

Padrões de projeto são soluções conhecidas para problemas recorrentes. Este capítulo distingue os padrões que existem de fato no código das possibilidades de evolução, sem afirmar implementações que não existem.

## Padrões criacionais

**Singleton (por módulo).** Os clientes do Supabase (`supabaseAdmin` e `supabaseAuth`) são criados uma única vez no módulo `backend/src/supabase.js` e importados por toda a API. Como o sistema de módulos do JavaScript executa cada módulo uma única vez, há na prática uma instância única de cada cliente, sem a implementação clássica com construtor privado.

**Factory Method.** Não foi necessário. Seria útil, por exemplo, para criar diferentes tipos de notificação em uma evolução.

## Padrões estruturais

**Adapter.** A função `getVideoEmbedUrl` adapta formatos de vídeo incompatíveis (links do YouTube em diferentes formatos, links do Vimeo e arquivos enviados) a uma única interface usada pelo player. O player não precisa saber de onde o vídeo vem.

**Facade.** O módulo `services/api.js` funciona como uma fachada para a comunicação com o backend: as telas chamam funções como `getCertificate(courseId)` sem conhecer cabeçalhos, tokens, renovação de sessão ou tratamento de erros.

## Padrões comportamentais

**Chain of Responsibility.** Os middlewares do Express formam uma cadeia: a requisição passa por `requireAuth` e depois por `requireAdmin`, e cada elo pode interrompê-la (401 ou 403) ou passá-la adiante com `next()`.

**Strategy.** Não implementado. A forma de calcular a nota final ou a regra de liberação do certificado poderiam ser encapsuladas como estratégias, caso a plataforma passasse a ter regras diferentes por curso.

## Padrão arquitetural

O CursoLab não segue um MVC clássico com pastas separadas para model, view e controller, mas tem uma separação equivalente: o banco e as funções SQL fazem o papel do modelo, os componentes React o da visão e as rotas da API o do controlador. A definição mais precisa para o projeto é **aplicação monolítica modularizada organizada em camadas**.

## DevSecOps

O projeto tem práticas compatíveis com DevSecOps: segredos fora do repositório, publicação automática a cada merge, testes de segurança na suíte de integração e execução dos testes contra a produção. Ainda não há um pipeline de integração contínua que execute os testes e a análise de dependências automaticamente em cada Pull Request; esse é o próximo passo natural.

# Reuso de software

Reuso é aproveitar conhecimento, componentes ou serviços existentes em vez de reconstruí-los. No CursoLab, o reuso foi principalmente **sistemático** e **horizontal**: componentes genéricos, úteis em qualquer domínio, foram escolhidos de forma planejada.

- **React** e **Vite**: estrutura da interface e build;
- **Express**: servidor HTTP e cadeia de middlewares;
- **Supabase**: banco, autenticação e armazenamento como serviço, o que evitou implementar hash de senha, emissão de tokens e armazenamento de arquivos;
- **jsPDF**: geração de PDF do certificado e das apostilas;
- **lucide-react**: ícones;
- **vídeos do YouTube**: conteúdo educacional de terceiros reutilizado com o player oficial e crédito aos autores.

Também houve **reuso interno**: uma linguagem visual única, definida em um arquivo de estilos compartilhado, é usada por todas as telas, e o mesmo aplicativo Express é reaproveitado pelo servidor local e pela função serverless.

O reuso trouxe produtividade e confiabilidade, mas também dependências. Mudanças nas bibliotecas ou nos serviços externos podem exigir manutenção adaptativa, e a plataforma depende da disponibilidade do Supabase, da Vercel e do YouTube. Esses riscos foram aceitos conscientemente em troca de concentrar o esforço nas regras do domínio.

# Implantação e ambiente de execução

## Produção

O sistema está publicado na Vercel. O front-end é um site estático servido pela CDN, e a API roda como função serverless no mesmo domínio, o que dispensa configuração de CORS entre domínios diferentes. O arquivo `vercel.json` redireciona as rotas `/api/*` para a função. As variáveis de ambiente (URL do Supabase, chave pública e chave secreta) são configuradas no painel da Vercel. Cada merge na branch `main` gera uma nova publicação automaticamente.

## Execução local

Para executar localmente, são necessários Node.js 20 ou superior e um projeto no Supabase. O fluxo é:

1. executar as migrações de `backend/database` no editor SQL do Supabase, na ordem indicada no README;
2. criar `backend/.env` com a URL do projeto e as chaves;
3. instalar as dependências com `npm install`;
4. iniciar a API com `npm run server` e o front-end com `npm run dev`;
5. opcionalmente, cadastrar os cursos reais com `npm run seed:cursos`;
6. executar os testes com `npm run test:api`.

Em desenvolvimento, o Vite encaminha `/api` para a API local, de modo que o front-end usa os mesmos caminhos relativos que em produção.

## Dados de demonstração

O catálogo traz seis cursos com conteúdo real e indicadores de demonstração (avaliações, matrículas e faturamento) para que painéis e gráficos não apareçam vazios na apresentação. Os testes automatizados não dependem desses dados: cada suíte cria e apaga os próprios registros.

# Interface e usabilidade

A interface segue uma linguagem visual única e simples, definida em um arquivo de estilos compartilhado: tipografia Inter, paleta azul, quinas retas, espaçamentos consistentes e componentes reutilizados (botões, campos, quadros, abas e listas). A consistência reduz o esforço de aprendizado: o que o usuário aprende em uma tela vale para as outras.

A navegação segue o fluxo natural do usuário. O visitante conhece a plataforma pela página inicial e entra pelo login; o aluno chega ao painel, com o "continue de onde parou" em destaque, e dali ao catálogo e ao player; o administrador chega direto ao backoffice. Informações importantes aparecem no contexto em que são necessárias: o player mostra o progresso e os módulos bloqueados; o painel informa o prazo de acesso e o que falta para o certificado; erros de validação aparecem junto ao campo.

[[fig: prints/04-detalhes-curso.png | Página de detalhes do curso com a grade.]]

A interface é responsiva e se adapta do celular ao computador. A acessibilidade foi considerada no uso de rótulos nos campos, textos alternativos nos ícones e contraste adequado, embora não tenha sido feita uma avaliação formal de acessibilidade.

# Dificuldades, decisões e aprendizados

## Envio de arquivos grandes

A Vercel limita o corpo de cada requisição a cerca de 4,5 MB, e o projeto precisava aceitar vídeos de até 50 MB. Enviar o arquivo pela API era inviável. A solução foi inverter o fluxo: a API apenas valida o tipo e o tamanho e gera uma **URL assinada** de envio no Storage; o navegador envia o arquivo diretamente para lá. Além de contornar o limite, isso tirou da função serverless um trabalho pesado.

## Transação sem suporte no cliente

Salvar o conteúdo de um curso altera quatro tabelas: módulos, aulas, quizzes e perguntas. O cliente do Supabase não oferece transações entre várias chamadas, então uma falha no meio deixaria o curso pela metade. A solução foi escrever a função `save_course_content` no próprio PostgreSQL, que executa toda a gravação numa única transação e é chamada pela API como um procedimento remoto. A permissão de execução dessa função foi revogada para os papéis públicos, de modo que só o backend pode chamá-la.

## Reordenação com restrição de unicidade

A ordem dos módulos e das aulas é única dentro de cada curso e de cada módulo. Ao trocar duas aulas de posição, a primeira atualização violava essa restrição, pois as duas passavam a ter a mesma ordem momentaneamente. A solução foi mover todas as posições para uma faixa livre (somando 100000) antes de gravar a nova ordem, dentro da mesma transação.

## Express em ambiente serverless

O Express foi feito para rodar como um servidor que escuta uma porta, enquanto a Vercel executa funções sob demanda. O aplicativo passou a ser exportado por um módulo e reaproveitado em dois pontos de entrada: o servidor local e a função serverless. Assim, o código que roda nos testes locais é o mesmo que roda em produção.

## Sessão que expira durante o uso

O token de acesso tem duração curta por segurança, o que fazia o usuário receber erros depois de algum tempo com a página aberta. A solução foi centralizar as chamadas no cliente da API: diante de um 401, ele renova a sessão com o token de renovação e repete a requisição. Várias requisições simultâneas compartilham a mesma renovação, evitando pedidos duplicados.

## Mudança de requisito com rastreabilidade

A mudança da regra do certificado mostrou, na prática, por que documentação, código e testes precisam evoluir juntos. Como a regra estava espalhada pela API, pelas telas, pela página inicial, pelos testes e pela documentação, a busca pelo valor antigo em todo o repositório foi parte do processo, e todos os pontos foram atualizados no mesmo Pull Request.

## Aprendizados

O principal aprendizado foi que integrar serviços exige mais do que escrever funções: limites de plataforma, permissões, sessões e consistência entre sistemas diferentes foram responsáveis pelos problemas mais difíceis do projeto. Também ficou claro que os testes automatizados não são um custo extra: foram eles que permitiram mudar regras importantes perto da entrega com segurança.

# Limitações e trabalhos futuros

As limitações atuais são registradas explicitamente, para separar o que está pronto do que é possibilidade:

- o pagamento é simulado: não há integração com um gateway real, e cupons de desconto não foram implementados;
- a avaliação dos cursos pelos alunos (nota e comentário) não foi implementada;
- não há notificação por e-mail quando uma dúvida ou um chamado é respondido;
- há um único papel de administrador, sem instrutores com cursos próprios;
- os indicadores misturam números de demonstração com dados reais;
- não há testes unitários nem testes automatizados da interface, e os testes não rodam automaticamente em cada Pull Request.

As evoluções foram priorizadas pelo impacto e pelos pré-requisitos técnicos:

1. executar a suíte de testes automaticamente em cada Pull Request (integração contínua);
2. integrar um gateway de pagamento (Pix e cartão) e cupons;
3. implementar avaliações dos cursos, substituindo as notas de demonstração;
4. enviar notificações por e-mail de respostas a dúvidas e chamados;
5. permitir vários instrutores, cada um gerenciando os próprios cursos;
6. dividir a API em módulos e documentá-la em OpenAPI;
7. adicionar testes unitários das regras e testes de ponta a ponta da interface.

# Avaliação global do projeto

## Atendimento ao problema proposto

O CursoLab atende ao problema apresentado no Capítulo 2. O acesso ao conteúdo é controlado por matrícula e prazo, o aluno avança em ordem e sabe onde parou, a avaliação é corrigida sem expor o gabarito, o certificado tem uma regra clara e verificável e o suporte está centralizado. O instrutor mantém o conteúdo e atende os alunos pelo backoffice, sem mexer em código.

## Coerência entre requisitos e arquitetura

A arquitetura é coerente com o porte do projeto e com seus requisitos não funcionais. O monólito modularizado simplifica a implantação, o banco relacional expressa as relações e restrições do domínio, a função serverless elimina a administração de servidor e a decisão de concentrar as regras no servidor atende diretamente aos requisitos de segurança.

## Pontos fortes

- sistema publicado e funcionando, com dados persistidos e conteúdo real;
- regras críticas garantidas no servidor e cobertas por 158 verificações automatizadas;
- processo com branches, Pull Requests, migrações versionadas e publicação automática;
- rastreabilidade entre requisitos, código, testes e documentação, demonstrada em mudanças reais;
- limitações registradas de forma explícita.

## Pontos que exigem evolução

A principal limitação de engenharia é a ausência de integração contínua: os testes existem e são completos, mas dependem de execução manual. Em seguida vêm a concentração da API em um único arquivo e a ausência de testes unitários e de interface. Do ponto de vista funcional, o pagamento real e as avaliações de cursos são as lacunas mais visíveis.

# Conclusão

O CursoLab permitiu aplicar na prática os conceitos centrais da disciplina. O projeto partiu de um problema concreto e chegou a uma solução publicada, estruturada por requisitos, arquitetura, modelo de dados, regras de negócio, segurança, testes e documentação.

A análise do projeto à luz dos conteúdos estudados mostra que o desenvolvimento não termina na codificação. A engenharia de requisitos reduziu ambiguidades e permitiu tratar mudanças de forma controlada; a análise e o projeto organizaram a solução em camadas com responsabilidades claras; a verificação, a validação e os testes deram confiança para evoluir; a documentação preservou as decisões; a manutenção aconteceu em paralelo ao desenvolvimento; e o reuso permitiu concentrar o esforço no que é específico do domínio.

Alguns conceitos, apresentados de forma abstrata na disciplina, apareceram de forma concreta no projeto. Requisitos voláteis surgiram na mudança da regra do certificado. Transações surgiram da necessidade de salvar um curso inteiro sem deixá-lo pela metade. A diferença entre verificação e validação ficou clara quando uma regra corretamente implementada se mostrou inadequada. E os testes de regressão mostraram seu valor a cada mudança feita perto da entrega.

O projeto também evidenciou que qualidade de software não vem de uma única tecnologia. Ferramentas modernas ajudam, mas a confiabilidade do sistema veio da combinação entre requisitos claros, regras no servidor, restrições no banco, testes automatizados e documentação atualizada.

Como continuidade, o CursoLab tem espaço para amadurecer tanto funcionalmente, com pagamento real, avaliações e vários instrutores, quanto em engenharia, com integração contínua, modularização da API e testes unitários. Essas evoluções devem preservar os princípios aplicados nesta versão: regras no servidor, mudanças rastreáveis e verificação contínua.

# Fluxogramas do CursoLab

Seis diagramas que descrevem o funcionamento do sistema como ele está
implementado. Todos gerados a partir do código em execução, não de uma
especificação idealizada.

## Convenção de cores

A mesma legenda vale para todos os diagramas:

| Cor | Significado |
|---|---|
| **Azul** | Camada de apresentação — o que acontece no navegador |
| **Verde** | Camada de aplicação — regras de negócio na API |
| **Amarelo** | Camada de dados — informação gravada no PostgreSQL |
| **Roxo** | Estado mantido apenas em memória, perdido ao recarregar |
| **Vermelho** | Caminho de erro ou operação recusada |
| **Cinza** | Ponto de decisão |

A distinção entre **amarelo** e **roxo** é a mais importante: ela mostra o que
sobrevive ao recarregamento da página e o que ainda depende de integração.

## Índice

| Arquivo | O que descreve |
|---|---|
| `FL-01-arquitetura.png` | As três camadas e o trajeto completo de uma requisição, do clique ao banco e de volta |
| `FL-02-aluno-aquisicao.png` | Do cadastro até a matrícula, incluindo o bloqueio de matrícula duplicada |
| `FL-03-aluno-aprendizado.png` | Do player ao certificado, com a bifurcação entre aula em vídeo e quiz |
| `FL-04-autenticacao-autorizacao.png` | Como a API decide entre executar, responder 401 ou responder 403 |
| `FL-05-progressao-modulos.png` | A regra que libera o módulo seguinte, e a gravação otimista com reversão |
| `FL-06-fluxo-do-professor.png` | O backoffice: criação de curso, catálogo, análises e suporte |

## Observações sobre o conteúdo

**FL-04** descreve o controle de acesso como ele é aplicado: no servidor, por
dois middlewares encadeados. Ocultar um botão na interface não é controle de
acesso — a verificação precisa acontecer onde o cliente não alcança.

**FL-05** mostra por que os módulos liberados não são gravados no banco: eles
são derivados do conjunto de aulas concluídas. Persistir os dois criaria um
segundo estado capaz de divergir do primeiro.

**FL-06** registra em roxo que o editor de conteúdo ainda mantém módulos e
aulas apenas em memória. As rotas correspondentes já existem e estão protegidas
na API; falta a interface chamá-las.

## Como editar

O código-fonte em Mermaid de todos os diagramas está em
[`fontes-mermaid.md`](fontes-mermaid.md). Para alterar qualquer um, cole o bloco
correspondente em https://mermaid.live, ajuste e exporte em PNG ou SVG.

# Fluxogramas do CursoLab — código-fonte

Os diagramas abaixo estão em Mermaid. Para editar, cole o bloco em
https://mermaid.live, ajuste e exporte de novo em PNG ou SVG.

## Arquitetura em camadas e trajeto de uma requisição

Arquivo: `FL-01-arquitetura.png`

```mermaid
flowchart TD

  classDef cliente fill:#dbeafe,stroke:#2563eb,color:#0f172a
  classDef servidor fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef banco fill:#fef3c7,stroke:#d97706,color:#78350f
  classDef decisao fill:#f1f5f9,stroke:#64748b,color:#0f172a
  classDef erro fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
  classDef memoria fill:#f3e8ff,stroke:#9333ea,color:#4c1d95
  classDef inicio fill:#1d4ed8,stroke:#1d4ed8,color:#ffffff,font-weight:bold

  U([Usuário no navegador]):::inicio
  subgraph C[Camada de apresentação — React + Vite]
    UI["Telas e navegação<br/>estado da aplicação"]:::cliente
    API["services/api.js<br/>envia Authorization: Bearer token"]:::cliente
  end
  subgraph S[Camada de aplicação — API REST Express]
    MW["Middlewares<br/>requireAuth · requireAdmin"]:::servidor
    RN["Regras de negócio<br/>25 rotas"]:::servidor
  end
  subgraph D[Camada de dados — Supabase]
    AUTH["Supabase Auth<br/>emite e valida o token"]:::banco
    PG["PostgreSQL<br/>9 tabelas"]:::banco
  end

  U --> UI
  UI --> API
  API -->|"HTTP + JSON"| MW
  MW -->|"token válido"| RN
  MW -->|"sem token: 401<br/>sem permissão: 403"| API
  MW -.->|"valida o token"| AUTH
  RN -->|"chave secreta<br/>só no servidor"| PG
  PG --> RN
  RN -->|"resposta JSON"| API
  API --> UI
```

---

## Jornada do aluno — descoberta e matrícula

Arquivo: `FL-02-aluno-aquisicao.png`

```mermaid
flowchart TD

  classDef cliente fill:#dbeafe,stroke:#2563eb,color:#0f172a
  classDef servidor fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef banco fill:#fef3c7,stroke:#d97706,color:#78350f
  classDef decisao fill:#f1f5f9,stroke:#64748b,color:#0f172a
  classDef erro fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
  classDef memoria fill:#f3e8ff,stroke:#9333ea,color:#4c1d95
  classDef inicio fill:#1d4ed8,stroke:#1d4ed8,color:#ffffff,font-weight:bold

  I([Início]):::inicio
  CAD["Criar conta<br/>nome, e-mail, senha"]:::cliente
  LOG["Autenticar"]:::cliente
  CAT["Explorar catálogo<br/>busca e filtros"]:::cliente
  DET["Ver detalhes<br/>do curso"]:::cliente
  CAR["Adicionar<br/>ao carrinho"]:::cliente
  AUT{"Está<br/>autenticado?"}:::decisao
  MAT{"Já matriculado<br/>neste curso?"}:::decisao
  BLO["Matrícula recusada<br/>restrição de unicidade"]:::erro
  INS["Matrícula gravada<br/>tabela enrollments"]:::banco
  FIM([Curso disponível<br/>em Meus Cursos]):::inicio

  I --> CAD --> LOG --> CAT
  CAT --> DET --> CAR --> AUT
  AUT -->|não| LOG
  AUT -->|sim| MAT
  MAT -->|sim| BLO
  MAT -->|não| INS --> FIM
```

---

## Jornada do aluno — aprendizado e certificado

Arquivo: `FL-03-aluno-aprendizado.png`

```mermaid
flowchart TD

  classDef cliente fill:#dbeafe,stroke:#2563eb,color:#0f172a
  classDef servidor fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef banco fill:#fef3c7,stroke:#d97706,color:#78350f
  classDef decisao fill:#f1f5f9,stroke:#64748b,color:#0f172a
  classDef erro fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
  classDef memoria fill:#f3e8ff,stroke:#9333ea,color:#4c1d95
  classDef inicio fill:#1d4ed8,stroke:#1d4ed8,color:#ffffff,font-weight:bold

  I([Aluno abre o curso]):::inicio
  CAR["Carrega conteúdo e progresso<br/>GET content · GET progress"]:::banco
  PLA["Player da aula<br/>vídeo e material de apoio"]:::cliente
  QUI{"A aula é<br/>um quiz?"}:::decisao
  CON["Marcar como concluída"]:::cliente
  NOT["Responde o quiz<br/>correção imediata"]:::cliente
  APR{"Atingiu a<br/>nota mínima?"}:::decisao
  GRA["Progresso gravado<br/>tabela lesson_progress"]:::banco
  DES["Recalcula os<br/>módulos liberados"]:::servidor
  RES{"Restam aulas<br/>no curso?"}:::decisao
  CER{"Progresso ≥ 60%?"}:::decisao
  EMI["Certificado disponível"]:::cliente
  FIM([Fim]):::inicio

  I --> CAR --> PLA --> QUI
  QUI -->|não| CON --> GRA
  QUI -->|sim| NOT --> APR
  APR -->|não| NOT
  APR -->|sim| GRA
  GRA --> DES --> RES
  RES -->|sim| PLA
  RES -->|não| CER
  CER -->|não| PLA
  CER -->|sim| EMI --> FIM
```

---

## Autenticação e controle de acesso

Arquivo: `FL-04-autenticacao-autorizacao.png`

```mermaid
flowchart TD

  classDef cliente fill:#dbeafe,stroke:#2563eb,color:#0f172a
  classDef servidor fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef banco fill:#fef3c7,stroke:#d97706,color:#78350f
  classDef decisao fill:#f1f5f9,stroke:#64748b,color:#0f172a
  classDef erro fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
  classDef memoria fill:#f3e8ff,stroke:#9333ea,color:#4c1d95
  classDef inicio fill:#1d4ed8,stroke:#1d4ed8,color:#ffffff,font-weight:bold

  I([Requisição chega à API]):::inicio
  PUB{"Rota é pública?"}:::decisao
  EXE["Executa a regra de negócio"]:::servidor
  TOK{"Tem cabeçalho<br/>Authorization?"}:::decisao
  E401["401<br/>Não autenticado"]:::erro
  VAL{"Token válido<br/>no Supabase Auth?"}:::decisao
  PERF["Carrega o perfil<br/>tabela profiles"]:::banco
  ADM{"Rota exige<br/>papel de gestão?"}:::decisao
  EPAP{"Perfil é admin?"}:::decisao
  E403["403<br/>Sem permissão"]:::erro
  RESP(["Resposta JSON"]):::inicio

  I --> PUB
  PUB -->|sim| EXE
  PUB -->|não| TOK
  TOK -->|não| E401
  TOK -->|sim| VAL
  VAL -->|não| E401
  VAL -->|sim| PERF --> ADM
  ADM -->|não| EXE
  ADM -->|sim| EPAP
  EPAP -->|não| E403
  EPAP -->|sim| EXE
  EXE --> RESP
```

---

## Regra de progressão e desbloqueio de módulos

Arquivo: `FL-05-progressao-modulos.png`

```mermaid
flowchart TD

  classDef cliente fill:#dbeafe,stroke:#2563eb,color:#0f172a
  classDef servidor fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef banco fill:#fef3c7,stroke:#d97706,color:#78350f
  classDef decisao fill:#f1f5f9,stroke:#64748b,color:#0f172a
  classDef erro fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
  classDef memoria fill:#f3e8ff,stroke:#9333ea,color:#4c1d95
  classDef inicio fill:#1d4ed8,stroke:#1d4ed8,color:#ffffff,font-weight:bold

  I([Aluno conclui uma aula]):::inicio
  PUT["PUT /api/lessons/:id/progress<br/>grava no banco"]:::servidor
  OTI["Interface marca de imediato<br/>gravação otimista"]:::cliente
  FAL{"A API respondeu<br/>com erro?"}:::decisao
  REV["Desfaz a marca<br/>e avisa o aluno"]:::erro
  CAR["Recarrega o conjunto<br/>de aulas concluídas"]:::cliente
  TEM{"O módulo atual<br/>tem quiz?"}:::decisao
  QZ{"Quiz aprovado?"}:::decisao
  TODAS{"Todas as aulas<br/>de vídeo concluídas?"}:::decisao
  LIB["Libera o próximo módulo"]:::memoria
  ESP["Módulo seguinte<br/>continua bloqueado"]:::decisao
  FIM([Trilha atualizada]):::inicio

  I --> OTI --> PUT --> FAL
  FAL -->|sim| REV
  FAL -->|não| CAR --> TEM
  TEM -->|sim| QZ
  TEM -->|não| TODAS
  QZ -->|não| ESP
  QZ -->|sim| LIB
  TODAS -->|não| ESP
  TODAS -->|sim| LIB
  LIB --> FIM
  ESP --> FIM
```

---

## Fluxo do professor / administração

Arquivo: `FL-06-fluxo-do-professor.png`

```mermaid
flowchart TD

  classDef cliente fill:#dbeafe,stroke:#2563eb,color:#0f172a
  classDef servidor fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef banco fill:#fef3c7,stroke:#d97706,color:#78350f
  classDef decisao fill:#f1f5f9,stroke:#64748b,color:#0f172a
  classDef erro fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
  classDef memoria fill:#f3e8ff,stroke:#9333ea,color:#4c1d95
  classDef inicio fill:#1d4ed8,stroke:#1d4ed8,color:#ffffff,font-weight:bold

  I([Professor autenticado<br/>perfil admin]):::inicio
  PAI["Backoffice<br/>visão geral"]:::cliente
  CRI["Criar curso<br/>título, descrição, preço, nível"]:::cliente
  PERS["POST /api/courses<br/>gravado no banco"]:::banco
  EDI["Editor de conteúdo<br/>módulos e aulas"]:::cliente
  MEM["Estrutura mantida<br/>apenas em memória"]:::memoria
  GER["Gerenciar catálogo<br/>editar e excluir"]:::cliente
  UPD["PUT / DELETE /api/courses/:id<br/>gravado no banco"]:::banco
  ANA["Análises<br/>GET /api/admin/analytics"]:::banco
  SUP["Central de suporte<br/>responder tickets"]:::banco
  FIM([Catálogo publicado]):::inicio

  I --> PAI
  PAI --> CRI --> PERS --> EDI --> MEM
  PAI --> GER --> UPD
  PAI --> ANA
  PAI --> SUP
  PERS --> FIM
  UPD --> FIM
  MEM -.->|"pendente de integração<br/>rotas já existem na API"| FIM
```

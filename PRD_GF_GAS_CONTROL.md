# PRD — GF Gás Control
## Sistema Inteligente de Controle de Faturamento e Recebimento

**Versão:** 1.0
**Data:** 22/03/2026
**Autor:** Equipe de Produto
**Status:** Aprovado para Desenvolvimento

---

## 1. VISÃO GERAL DO PRODUTO

### 1.1 Problema

A **GF Comércio de Gás LTDA** é uma distribuidora de GLP (gás de cozinha) com 4 unidades operacionais: **Ilhéus**, **Itabuna**, **Itapetinga** e **Conquista**. Cada unidade possui sub-unidades (ex: GF Ilhéus, FM Ilhéus, BS Itabuna, VF Comércio Itabuna, F Carlos Itapetinga, Comercial V&F Conquista).

O dono da empresa enfrenta um problema crítico: **o faturamento é sistematicamente maior que o recebimento**, gerando um gap acumulado de centenas de milhares de reais por mês. Ele não consegue identificar rapidamente qual unidade está causando o problema, pois:

- Os dados de faturamento vêm de PDFs gerados pelo sistema Águia Web ERP
- O recebimento é controlado numa planilha Excel rudimentar com 3 colunas (data, valor, unidade)
- Não existe visão consolidada em tempo real
- Não há alertas automáticos
- A análise depende de cruzamento manual entre múltiplos documentos

### 1.2 Solução

Um sistema web + WhatsApp que:

1. **Centraliza** o lançamento diário de faturamento e recebimento por unidade
2. **Visualiza** em tempo real o gap entre faturamento e recebimento por unidade
3. **Alerta** automaticamente via WhatsApp quando detecta anomalias
4. **Analisa** padrões e gera insights com IA (OpenAI API)
5. **Gera relatórios** impressos profissionais, claros e abrangentes
6. **Extrai dados** automaticamente dos PDFs do Águia Web ERP

### 1.3 Métricas de Sucesso

- Tempo para identificar unidade problemática: de **dias** para **segundos**
- Cobertura de lançamento: 100% dos dias úteis com dados até 21h
- Redução do gap faturamento-recebimento em 30% nos primeiros 3 meses
- Dono recebe resumo diário automatizado sem precisar abrir o sistema

---

## 2. STACK TECNOLÓGICA

### 2.1 Frontend
- **React 18+** com Vite como bundler
- **React Router** para navegação SPA
- **Tailwind CSS 3** para estilização
- **Recharts** para gráficos e visualizações
- **React-to-Print** para geração de relatórios impressos
- **React Query (TanStack Query)** para cache e sincronização de dados
- **Lucide React** para ícones
- **date-fns** para manipulação de datas (locale pt-BR)
- **jsPDF + jsPDF-AutoTable** para geração de PDF de relatórios
- **Deploy: Vercel** (hosting estático com edge functions)

### 2.2 Backend / Banco de Dados
- **Supabase** (PostgreSQL gerenciado)
  - Supabase Auth (autenticação JWT)
  - Supabase Realtime (websockets para updates em tempo real)
  - Supabase Edge Functions (Deno — lógica serverless)
  - Supabase Storage (armazenamento de PDFs originais)
  - Row Level Security (RLS) para controle de acesso por perfil

### 2.3 Serviço Python (VPS Hostinger)
- **FastAPI** — API para parsing de PDFs e integrações
- **pdfplumber** — extração de dados dos PDFs do Águia Web ERP
- **APScheduler** — agendamento de tarefas (alertas, resumos)
- **httpx** — chamadas HTTP para UazAPI e OpenAI API
- **uvicorn** — servidor ASGI

### 2.4 Integrações
- **OpenAI API** — modelo `gpt-4o` para análises, insights, chatbot e geração de relatórios em linguagem natural
- **UazAPI** — envio e recebimento de mensagens WhatsApp (webhooks)

### 2.5 Infraestrutura

```
┌─────────────────────────────────────────────────────────────────┐
│                          VERCEL                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  React App (SPA)                                         │  │
│  │  - Dashboard do Dono                                     │  │
│  │  - Tela de Lançamento (Gerente)                          │  │
│  │  - Relatórios Impressos                                  │  │
│  │  - Chat IA                                               │  │
│  └──────────────────────┬────────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────┼───────────────────────────────────────┐
│                    SUPABASE                                     │
│  ┌──────────┐  ┌────────┴──────┐  ┌──────────┐  ┌───────────┐  │
│  │PostgreSQL│  │  Auth (JWT)   │  │ Realtime  │  │  Storage  │  │
│  │  + RLS   │  │  + RLS        │  │ WebSocket │  │  (PDFs)   │  │
│  └──────────┘  └───────────────┘  └──────────┘  └───────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Edge Functions (Deno)                                     ││
│  │  - Cálculos de métricas                                    ││
│  │  - Triggers de alerta                                      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│              VPS HOSTINGER (Python)                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  FastAPI                                                   ││
│  │  - Parser de PDFs (pdfplumber)                             ││
│  │  - Cron: Resumo diário 20h → UazAPI                       ││
│  │  - Cron: Alertas de gap crítico → UazAPI                  ││
│  │  - Webhook receptor WhatsApp (UazAPI)                     ││
│  │  - Proxy inteligente para OpenAI API                      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
    ┌─────┴─────┐   ┌────┴────┐   ┌──────┴──────┐
    │  UazAPI   │   │ OpenAI GPT  │   │ Águia Web   │
    │ WhatsApp  │   │   API   │   │ ERP (PDFs)  │
    └───────────┘   └─────────┘   └─────────────┘
```

---

## 3. MODELO DE DADOS (SUPABASE / POSTGRESQL)

### 3.1 Tabelas Principais

```sql
-- ============================================
-- TABELA: perfis
-- Perfis de usuário vinculados ao Supabase Auth
-- ============================================
CREATE TABLE perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  papel TEXT NOT NULL CHECK (papel IN ('dono', 'gerente', 'operador')),
  telefone TEXT, -- formato: +5573999999999
  unidade_id UUID REFERENCES unidades(id),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: unidades
-- Unidades operacionais da empresa
-- ============================================
CREATE TABLE unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL, -- ex: 'ILHÉUS', 'ITABUNA', 'ITAPETINGA', 'CONQUISTA'
  codigo TEXT UNIQUE NOT NULL, -- ex: 'ilheus', 'itabuna', 'itapetinga', 'conquista'
  ativo BOOLEAN DEFAULT TRUE,
  meta_recebimento_percentual NUMERIC(5,2) DEFAULT 80.00, -- meta: receber 80% do faturado
  alerta_gap_percentual NUMERIC(5,2) DEFAULT 30.00, -- alerta se gap > 30%
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: sub_unidades
-- Sub-unidades dentro de cada unidade
-- ============================================
CREATE TABLE sub_unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, -- ex: 'GF ILHÉUS', 'FM ILHÉUS', 'BS ITABUNA'
  codigo TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('faturamento', 'ambos')),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: lancamentos
-- Lançamentos diários de faturamento e recebimento
-- ============================================
CREATE TABLE lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  unidade_id UUID NOT NULL REFERENCES unidades(id),
  sub_unidade_id UUID REFERENCES sub_unidades(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('faturamento', 'recebimento')),
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  origem TEXT NOT NULL CHECK (origem IN ('manual', 'pdf_import', 'whatsapp', 'api')),
  observacao TEXT,
  usuario_id UUID REFERENCES perfis(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(data, sub_unidade_id, tipo) -- um lançamento por sub_unidade/tipo/dia
);

-- ============================================
-- TABELA: documentos_recebimento
-- Detalhamento do recebimento por tipo de documento (evolução futura)
-- ============================================
CREATE TABLE documentos_recebimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lancamento_id UUID NOT NULL REFERENCES lancamentos(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL, -- 'PIX', 'GETNET_DEBITO', 'GETNET_CRED_AV', 'GETNET_CRED_2X', etc.
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: pdfs_importados
-- Registro dos PDFs do Águia Web ERP processados
-- ============================================
CREATE TABLE pdfs_importados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arquivo_nome TEXT NOT NULL,
  arquivo_path TEXT NOT NULL, -- path no Supabase Storage
  data_referencia DATE NOT NULL,
  unidade_id UUID NOT NULL REFERENCES unidades(id),
  status TEXT NOT NULL CHECK (status IN ('pendente', 'processado', 'erro')),
  dados_extraidos JSONB, -- dados brutos extraídos pelo parser
  usuario_id UUID REFERENCES perfis(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: alertas
-- Alertas gerados pelo sistema
-- ============================================
CREATE TABLE alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  unidade_id UUID REFERENCES unidades(id),
  tipo TEXT NOT NULL CHECK (tipo IN (
    'gap_critico', 'sem_lancamento', 'anomalia_valor',
    'resumo_diario', 'resumo_semanal', 'insight_ia'
  )),
  severidade TEXT NOT NULL CHECK (severidade IN ('info', 'aviso', 'critico')),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  dados JSONB, -- dados contextuais do alerta
  enviado_whatsapp BOOLEAN DEFAULT FALSE,
  lido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: chat_ia_historico
-- Histórico de conversas com a IA
-- ============================================
CREATE TABLE chat_ia_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES perfis(id),
  canal TEXT NOT NULL CHECK (canal IN ('web', 'whatsapp')),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  conteudo TEXT NOT NULL,
  dados_contexto JSONB, -- dados que foram passados como contexto para a IA
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: configuracoes
-- Configurações globais do sistema
-- ============================================
CREATE TABLE configuracoes (
  chave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  descricao TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Views Materializadas

```sql
-- ============================================
-- VIEW: resumo_diario_unidade
-- Consolidação diária por unidade (base para dashboard)
-- ============================================
CREATE OR REPLACE VIEW vw_resumo_diario AS
SELECT
  l.data,
  u.id AS unidade_id,
  u.nome AS unidade_nome,
  u.codigo AS unidade_codigo,
  COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'faturamento'), 0) AS faturamento,
  COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'recebimento'), 0) AS recebimento,
  COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'faturamento'), 0) -
    COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'recebimento'), 0) AS gap,
  CASE
    WHEN COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'faturamento'), 0) = 0 THEN 0
    ELSE ROUND(
      (COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'recebimento'), 0) /
       COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'faturamento'), 0)) * 100, 2
    )
  END AS percentual_recebimento
FROM lancamentos l
JOIN unidades u ON l.unidade_id = u.id
GROUP BY l.data, u.id, u.nome, u.codigo
ORDER BY l.data DESC, u.nome;

-- ============================================
-- VIEW: resumo_acumulado_mensal
-- Acumulado mensal por unidade (para visão macro)
-- ============================================
CREATE OR REPLACE VIEW vw_resumo_acumulado_mensal AS
SELECT
  DATE_TRUNC('month', l.data)::DATE AS mes,
  u.id AS unidade_id,
  u.nome AS unidade_nome,
  u.codigo AS unidade_codigo,
  COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'faturamento'), 0) AS faturamento_acumulado,
  COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'recebimento'), 0) AS recebimento_acumulado,
  COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'faturamento'), 0) -
    COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'recebimento'), 0) AS gap_acumulado,
  CASE
    WHEN COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'faturamento'), 0) = 0 THEN 0
    ELSE ROUND(
      (COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'recebimento'), 0) /
       COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'faturamento'), 0)) * 100, 2
    )
  END AS percentual_recebimento,
  COUNT(DISTINCT l.data) FILTER (WHERE l.tipo = 'faturamento' AND l.valor > 0) AS dias_com_faturamento,
  COUNT(DISTINCT l.data) FILTER (WHERE l.tipo = 'recebimento' AND l.valor > 0) AS dias_com_recebimento
FROM lancamentos l
JOIN unidades u ON l.unidade_id = u.id
GROUP BY DATE_TRUNC('month', l.data), u.id, u.nome, u.codigo;

-- ============================================
-- VIEW: resumo_sub_unidade
-- Detalhamento por sub-unidade
-- ============================================
CREATE OR REPLACE VIEW vw_resumo_sub_unidade AS
SELECT
  l.data,
  u.id AS unidade_id,
  u.nome AS unidade_nome,
  su.id AS sub_unidade_id,
  su.nome AS sub_unidade_nome,
  l.tipo,
  l.valor,
  l.origem
FROM lancamentos l
JOIN unidades u ON l.unidade_id = u.id
LEFT JOIN sub_unidades su ON l.sub_unidade_id = su.id
ORDER BY l.data DESC, u.nome, su.nome;
```

### 3.3 Functions e Triggers

```sql
-- ============================================
-- FUNCTION: calcular_gap_e_alertar
-- Dispara após insert/update em lancamentos
-- Verifica se gap ultrapassou limite e cria alerta
-- ============================================
CREATE OR REPLACE FUNCTION fn_verificar_gap()
RETURNS TRIGGER AS $$
DECLARE
  v_fat NUMERIC;
  v_rec NUMERIC;
  v_gap_pct NUMERIC;
  v_limite NUMERIC;
  v_unidade_nome TEXT;
BEGIN
  -- Pegar acumulado do mês para a unidade
  SELECT
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'faturamento'), 0),
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'recebimento'), 0)
  INTO v_fat, v_rec
  FROM lancamentos
  WHERE unidade_id = NEW.unidade_id
    AND DATE_TRUNC('month', data) = DATE_TRUNC('month', NEW.data);

  -- Calcular gap percentual
  IF v_fat > 0 THEN
    v_gap_pct := ((v_fat - v_rec) / v_fat) * 100;
  ELSE
    v_gap_pct := 0;
  END IF;

  -- Pegar limite da unidade
  SELECT alerta_gap_percentual, nome INTO v_limite, v_unidade_nome
  FROM unidades WHERE id = NEW.unidade_id;

  -- Criar alerta se gap ultrapassou limite
  IF v_gap_pct > v_limite THEN
    INSERT INTO alertas (data, unidade_id, tipo, severidade, titulo, mensagem, dados)
    VALUES (
      NEW.data,
      NEW.unidade_id,
      'gap_critico',
      CASE WHEN v_gap_pct > 50 THEN 'critico' ELSE 'aviso' END,
      'Gap crítico em ' || v_unidade_nome,
      'O gap entre faturamento e recebimento em ' || v_unidade_nome ||
      ' atingiu ' || ROUND(v_gap_pct, 1) || '%. ' ||
      'Faturado: R$ ' || TO_CHAR(v_fat, 'FM999G999G999D99') ||
      ' | Recebido: R$ ' || TO_CHAR(v_rec, 'FM999G999G999D99'),
      jsonb_build_object(
        'faturamento', v_fat,
        'recebimento', v_rec,
        'gap_percentual', ROUND(v_gap_pct, 2),
        'gap_valor', v_fat - v_rec
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verificar_gap
  AFTER INSERT OR UPDATE ON lancamentos
  FOR EACH ROW
  EXECUTE FUNCTION fn_verificar_gap();
```

### 3.4 Seed Data (Dados Iniciais)

```sql
-- Unidades
INSERT INTO unidades (nome, codigo) VALUES
  ('ILHÉUS', 'ilheus'),
  ('ITABUNA', 'itabuna'),
  ('ITAPETINGA', 'itapetinga'),
  ('CONQUISTA', 'conquista');

-- Sub-unidades
INSERT INTO sub_unidades (unidade_id, nome, codigo, tipo) VALUES
  ((SELECT id FROM unidades WHERE codigo='ilheus'), 'GF ILHÉUS', 'gf_ilheus', 'faturamento'),
  ((SELECT id FROM unidades WHERE codigo='ilheus'), 'FM ILHÉUS', 'fm_ilheus', 'faturamento'),
  ((SELECT id FROM unidades WHERE codigo='itabuna'), 'BS ITABUNA', 'bs_itabuna', 'faturamento'),
  ((SELECT id FROM unidades WHERE codigo='itabuna'), 'VF COMÉRCIO ITABUNA', 'vf_itabuna', 'faturamento'),
  ((SELECT id FROM unidades WHERE codigo='itapetinga'), 'F CARLOS ITAPETINGA', 'f_carlos_itapetinga', 'faturamento'),
  ((SELECT id FROM unidades WHERE codigo='conquista'), 'COMERCIAL V&F CONQUISTA', 'vf_conquista', 'faturamento');

-- Configurações padrão
INSERT INTO configuracoes (chave, valor, descricao) VALUES
  ('horario_resumo_diario', '"20:00"', 'Horário de envio do resumo diário via WhatsApp'),
  ('horario_resumo_semanal', '"08:00"', 'Horário de envio do resumo semanal (segunda-feira)'),
  ('telefone_dono', '"+5573999999999"', 'Telefone WhatsApp do dono para alertas'),
  ('gap_alerta_imediato_percentual', '50', 'Percentual de gap que dispara alerta imediato'),
  ('dias_sem_lancamento_alerta', '1', 'Dias sem lançamento para gerar alerta');
```

---

## 4. PERFIS DE USUÁRIO E PERMISSÕES

### 4.1 Dono (papel: 'dono')

| Ação | Permitido |
|------|-----------|
| Visualizar dashboard consolidado | ✅ |
| Visualizar detalhamento por unidade | ✅ |
| Visualizar e exportar relatórios | ✅ |
| Interagir com IA (web + WhatsApp) | ✅ |
| Receber alertas WhatsApp | ✅ |
| Configurar limites de alerta | ✅ |
| Gerenciar usuários | ✅ |
| Lançar dados | ✅ |
| Editar/excluir lançamentos | ✅ |

### 4.2 Gerente (papel: 'gerente')

| Ação | Permitido |
|------|-----------|
| Lançar faturamento da sua unidade | ✅ |
| Lançar recebimento da sua unidade | ✅ |
| Upload de PDF da sua unidade | ✅ |
| Visualizar dados da sua unidade | ✅ |
| Visualizar dados de outras unidades | ❌ |
| Interagir com IA | ✅ (apenas sobre sua unidade) |
| Editar lançamentos do mesmo dia | ✅ |
| Excluir lançamentos | ❌ |

### 4.3 Operador (papel: 'operador')

| Ação | Permitido |
|------|-----------|
| Lançar dados via WhatsApp | ✅ |
| Visualizar dashboard | ❌ |

---

## 5. FUNCIONALIDADES — FRONTEND REACT

### 5.1 Estrutura de Rotas

```
/                          → Redirect para /dashboard ou /lancamento (conforme perfil)
/login                     → Tela de login (Supabase Auth)
/dashboard                 → Dashboard consolidado (dono)
/dashboard/:unidadeId      → Detalhamento por unidade (dono)
/lancamento                → Tela de lançamento diário (gerente)
/lancamento/pdf            → Upload e processamento de PDF (gerente)
/relatorios                → Central de relatórios (dono)
/relatorios/diario         → Relatório diário imprimível
/relatorios/semanal        → Relatório semanal imprimível
/relatorios/mensal         → Relatório mensal imprimível
/relatorios/unidade/:id    → Relatório detalhado por unidade
/relatorios/comparativo    → Relatório comparativo entre unidades
/chat-ia                   → Chat com IA (dono)
/alertas                   → Central de alertas e notificações
/configuracoes             → Configurações do sistema (dono)
/configuracoes/unidades    → Gerenciar unidades e sub-unidades
/configuracoes/usuarios    → Gerenciar usuários e permissões
/configuracoes/alertas     → Configurar regras de alerta
```

### 5.2 Dashboard Consolidado (`/dashboard`)

Esta é a tela principal do dono. Ao abrir, ele vê tudo de uma vez.

#### 5.2.1 Barra Superior
- Seletor de período: **Mês atual** (padrão), mês anterior, personalizado
- Botão de atualização manual (embora seja realtime)
- Indicador de última atualização
- Botão "Perguntar à IA" (abre chat lateral)
- Botão "Imprimir Relatório" (gera PDF completo do estado atual)

#### 5.2.2 Cards de Resumo Global (topo)
Quatro cards grandes horizontais:

| Card | Conteúdo |
|------|----------|
| **Faturamento Total** | Valor acumulado do mês + variação vs mês anterior (%) + ícone de tendência (↑↓) |
| **Recebimento Total** | Valor acumulado do mês + variação vs mês anterior (%) |
| **Gap Total** | Valor em R$ + percentual do faturamento + cor (verde <20%, amarelo 20-40%, vermelho >40%) |
| **Insight IA** | Frase curta gerada pela IA sobre o estado atual. Ex: "Itabuna precisa de atenção urgente: recebeu apenas 24% do faturado" |

#### 5.2.3 Cards por Unidade (grid 2x2)
Cada card mostra:
- Nome da unidade
- **Faturamento acumulado** do mês (em R$)
- **Recebimento acumulado** do mês (em R$)
- **Gap** em R$ e em %
- **Barra de progresso** colorida (recebimento / faturamento)
- **Sparkline** (mini gráfico) da evolução do gap nos últimos 7 dias
- **Indicador de status**: 🟢 Normal (gap <20%) | 🟡 Atenção (20-40%) | 🔴 Crítico (>40%)
- **Dias sem lançamento** (se houver)
- Botão "Ver detalhes" → navega para `/dashboard/:unidadeId`

#### 5.2.4 Gráfico de Evolução Diária (centro)
- Gráfico de área empilhada com 2 séries: Faturamento (azul) e Recebimento (verde)
- A área entre as duas curvas é o gap (preenchida em vermelho semitransparente)
- Toggle para ver: Consolidado | Por unidade (sobreposição)
- Tooltip com valores exatos ao passar o mouse
- Eixo X: dias do mês | Eixo Y: valor em R$

#### 5.2.5 Tabela Resumo Diário (abaixo do gráfico)
Tabela com scroll, uma linha por dia:

| Dia | Dia Sem. | Fat. Ilhéus | Fat. Itabuna | Fat. Itapet. | Fat. Conquista | **Fat. Total** | Rec. Ilhéus | Rec. Itabuna | Rec. Itapet. | Rec. Conquista | **Rec. Total** | **Gap** | **Gap %** |
|-----|----------|-------------|--------------|-------------|----------------|---------------|-------------|--------------|-------------|----------------|---------------|---------|----------|

- Linhas com gap > 40% destacadas em vermelho claro
- Linha de total/acumulado fixa no rodapé
- Clique na linha abre detalhe do dia

#### 5.2.6 Ranking de Unidades (lateral)
Lista ordenada pela severidade do gap:
1. 🔴 **Itabuna** — Gap: R$ 565.474 (75,5%)
2. 🔴 **Conquista** — Gap: R$ 353.503 (63,0%)
3. 🔴 **Ilhéus** — Gap: R$ 302.731 (63,3%)
4. 🟡 **Itapetinga** — Gap: R$ 73.754 (59,9%)

#### 5.2.7 Painel de Alertas Recentes (lateral inferior)
Últimos 5 alertas com ícone de severidade, horário e resumo.

#### 5.2.8 Análise IA Automática (card expandível no rodapé)
A cada acesso ou atualização de dados, a IA gera automaticamente um parágrafo de análise:
- Qual unidade está pior e por quê
- Tendência: o gap está abrindo ou fechando
- Comparação com semana anterior
- Recomendação de ação
- Previsão de gap no final do mês (baseada na tendência)

### 5.3 Detalhamento por Unidade (`/dashboard/:unidadeId`)

#### 5.3.1 Header
- Nome da unidade + status (🟢🟡🔴)
- Breadcrumb: Dashboard > Ilhéus
- Botão "Gerar Relatório da Unidade" (PDF imprimível)
- Botão "Perguntar à IA sobre esta unidade"

#### 5.3.2 Cards de Métricas da Unidade
| Card | Conteúdo |
|------|----------|
| Faturamento Acumulado | R$ + sparkline 30 dias |
| Recebimento Acumulado | R$ + sparkline 30 dias |
| Gap Acumulado | R$ + % + tendência |
| Média Diária Faturamento | R$ |
| Média Diária Recebimento | R$ |
| Dias sem Lançamento no Mês | Contagem |
| Taxa de Recebimento | % (Rec/Fat) |
| Projeção Gap Final do Mês (IA) | R$ estimado |

#### 5.3.3 Gráfico de Linha Dupla
- Faturamento diário vs Recebimento diário
- Área do gap sombreada
- Linha de meta (ex: 80% de recebimento)

#### 5.3.4 Gráfico de Acumulado
- Faturamento acumulado vs Recebimento acumulado (duas curvas divergentes)
- Mostra visualmente a "tesoura" abrindo

#### 5.3.5 Detalhamento por Sub-unidade
- Se a unidade tem sub-unidades (ex: GF Ilhéus + FM Ilhéus), mostra breakdown:
  - GF Ilhéus: R$ X faturado | R$ Y recebido
  - FM Ilhéus: R$ X faturado | R$ Y recebido

#### 5.3.6 Tabela Diária Completa
| Data | Dia | Fat. Sub1 | Fat. Sub2 | **Fat. Total** | Rec. Sub1 | Rec. Sub2 | **Rec. Total** | **Gap** | **Gap %** | Origem |
|------|-----|-----------|-----------|---------------|-----------|-----------|---------------|---------|----------|--------|

#### 5.3.7 Análise IA da Unidade
Análise detalhada gerada pela IA:
- Padrão de dias da semana (ex: "Segundas-feiras têm faturamento 40% maior que domingos")
- Dias com anomalias (faturou muito acima ou abaixo da média)
- Correlação entre faturamento e recebimento (quanto tempo demora para o recebimento acompanhar)
- Sugestão de ação personalizada para o gerente

### 5.4 Tela de Lançamento (`/lancamento`)

Esta é a tela principal do **gerente**. Simples e rápida.

#### 5.4.1 Formulário de Lançamento

```
┌─────────────────────────────────────────────────┐
│  LANÇAMENTO DIÁRIO                              │
│                                                 │
│  Unidade: [ILHÉUS ▼] (auto-preenchido)         │
│  Data:    [19/03/2026] (padrão: hoje)           │
│                                                 │
│  ── FATURAMENTO ──                              │
│  GF Ilhéus:  [R$ ________]                      │
│  FM Ilhéus:  [R$ ________]                      │
│  Total:       R$ 31.186,03  (calculado)         │
│                                                 │
│  ── RECEBIMENTO ──                              │
│  GF Ilhéus:  [R$ ________]                      │
│  FM Ilhéus:  [R$ ________]                      │
│  Total:       R$ 32.539,24  (calculado)         │
│                                                 │
│  ── RESULTADO ──                                │
│  Gap: R$ -1.353,21 (✅ recebeu mais que faturou)│
│                                                 │
│  Observação: [________________________]         │
│                                                 │
│  [💾 SALVAR LANÇAMENTO]  [📄 IMPORTAR PDF]      │
│                                                 │
│  ── HISTÓRICO RECENTE ──                        │
│  18/03 | Fat: R$ 24.587 | Rec: R$ 22.247 | -9% │
│  17/03 | Fat: R$ 33.751 | Rec: R$ 34.730 | +3%  │
│  16/03 | Fat: R$ 34.997 | Rec: R$ 59.816 | +71% │
└─────────────────────────────────────────────────┘
```

#### 5.4.2 Regras de Negócio
- Gerente só vê sua unidade (RLS)
- Pode editar lançamento do mesmo dia
- Não pode lançar data futura
- Pode lançar até 3 dias retroativos (configurável)
- Ao salvar, exibe confirmação com o gap resultante
- Se o gap for crítico, exibe aviso: "Atenção: o gap desta unidade está em X%. O dono será notificado."

#### 5.4.3 Importação de PDF (`/lancamento/pdf`)
- Upload de arquivo PDF
- Sistema processa com pdfplumber (via FastAPI na VPS)
- Exibe dados extraídos para conferência
- Gerente confirma ou ajusta valores antes de salvar
- PDF original é armazenado no Supabase Storage

### 5.5 Central de Relatórios (`/relatorios`)

O dono gosta de relatórios impressos. Esta seção gera relatórios profissionais, otimizados para impressão A4.

#### 5.5.1 Relatório Diário (`/relatorios/diario`)

**Layout para impressão (A4 retrato):**

```
╔══════════════════════════════════════════════════════════╗
║  GF COMÉRCIO DE GÁS LTDA                               ║
║  RELATÓRIO DIÁRIO DE FATURAMENTO E RECEBIMENTO          ║
║  Data: 19/03/2026 | Emitido: 22/03/2026 às 10:30       ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  RESUMO CONSOLIDADO                                      ║
║  ┌──────────┬────────────┬────────────┬─────────┬──────┐ ║
║  │ Unidade  │ Faturamento│ Recebimento│   Gap   │ Gap% │ ║
║  ├──────────┼────────────┼────────────┼─────────┼──────┤ ║
║  │ Ilhéus   │  31.186,03 │  32.539,24 │-1.353,21│ -4,3%│ ║
║  │ Itabuna  │  12.208,78 │  19.046,47 │-6.837,69│-56,0%│ ║
║  │ Itapeting│     443,74 │     443,74 │    0,00 │  0,0%│ ║
║  │ Conquista│  71.134,47 │  22.410,26 │48.724,21│ 68,5%│ ║
║  ├──────────┼────────────┼────────────┼─────────┼──────┤ ║
║  │ TOTAL    │ 114.972,02 │  74.439,71 │40.533,31│ 35,3%│ ║
║  └──────────┴────────────┴────────────┴─────────┴──────┘ ║
║                                                          ║
║  ACUMULADO DO MÊS (01/03 a 19/03)                        ║
║  ┌──────────┬────────────┬────────────┬──────────┬─────┐ ║
║  │ Unidade  │Fat. Acumul.│Rec. Acumul.│Gap Acumul│ Gap%│ ║
║  ├──────────┼────────────┼────────────┼──────────┼─────┤ ║
║  │ Ilhéus   │ 509.195,20 │ 207.817,13 │301.378,07│59,2%│ ║
║  │ Itabuna  │ 748.540,63 │ 183.066,77 │565.473,86│75,5%│ ║
║  │ Itapeting│  49.260,05 │  49.260,05 │    0,00  │ 0,0%│ ║
║  │ Conquista│ 561.321,41 │ 181.241,76 │380.079,65│67,7%│ ║
║  ├──────────┼────────────┼────────────┼──────────┼─────┤ ║
║  │ TOTAL    │1.868.317   │ 621.385    │1.246.932 │66,7%│ ║
║  └──────────┴────────────┴────────────┴──────────┴─────┘ ║
║                                                          ║
║  ANÁLISE DA IA                                           ║
║  ┌──────────────────────────────────────────────────────┐ ║
║  │ "Itabuna segue como a unidade mais crítica com gap   │ ║
║  │ de 75,5%. Conquista apresentou piora com faturamento │ ║
║  │ alto (R$ 71 mil) e recebimento baixo (R$ 22 mil).   │ ║
║  │ Ilhéus mostrou dia positivo com recebimento acima    │ ║
║  │ do faturado. Recomendo: reunião urgente com gerentes │ ║
║  │ de Itabuna e Conquista sobre plano de recuperação    │ ║
║  │ de recebíveis."                                      │ ║
║  └──────────────────────────────────────────────────────┘ ║
║                                                          ║
║  [Gráfico de barras: Fat vs Rec por unidade no dia]      ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

#### 5.5.2 Relatório Semanal (`/relatorios/semanal`)

- Resumo dos 7 dias da semana
- Tabela dia a dia por unidade
- Gráfico de evolução semanal
- Comparação com semana anterior
- Top 3 dias mais críticos
- Análise IA semanal detalhada
- Ranking de unidades na semana

#### 5.5.3 Relatório Mensal (`/relatorios/mensal`)

- Resumo do mês completo
- Gráfico de evolução do acumulado (curva de faturamento vs recebimento)
- Tabela completa dia a dia
- Análise por semana (semana 1, 2, 3, 4)
- Comparação com meses anteriores (quando houver dados)
- Métricas avançadas: média diária, desvio padrão, dias pico, dias vale
- Análise IA mensal com recomendações estratégicas
- Projeção para o mês seguinte

#### 5.5.4 Relatório por Unidade (`/relatorios/unidade/:id`)

- Foco exclusivo na unidade selecionada
- Detalhamento por sub-unidade
- Evolução diária com gráfico
- Análise IA personalizada
- Histórico dos últimos 3 meses (quando disponível)

#### 5.5.5 Relatório Comparativo (`/relatorios/comparativo`)

- Ranking das unidades por performance de recebimento
- Gráfico de radar comparando métricas das 4 unidades
- Tabela comparativa lado a lado
- Identificação de padrões (ex: qual unidade melhora/piora nos finais de semana)
- Análise IA comparativa

### 5.6 Chat com IA (`/chat-ia`)

Interface de chat estilo conversacional onde o dono pode perguntar qualquer coisa sobre os dados.

#### 5.6.1 Interface
- Chat com balões de mensagem (estilo WhatsApp)
- Input de texto na parte inferior
- Sugestões de perguntas pré-definidas:
  - "Como está o desempenho geral hoje?"
  - "Qual unidade precisa de mais atenção?"
  - "Compare Itabuna com Conquista nesta semana"
  - "Preveja o gap no final do mês"
  - "Gere um resumo para enviar aos gerentes"
  - "Quais dias da semana faturam mais?"
  - "Tem alguma anomalia nos dados recentes?"

#### 5.6.2 Contexto da IA
A cada pergunta, o sistema monta um contexto com:
- Dados do mês atual (faturamento, recebimento, gap por unidade por dia)
- Métricas calculadas (médias, tendências, percentuais)
- Alertas ativos
- Dados de meses anteriores (quando disponíveis)

#### 5.6.3 System Prompt da IA

```
Você é o analista financeiro inteligente da GF Comércio de Gás LTDA,
uma distribuidora de GLP em Ilhéus, Bahia. Sua função é analisar dados
de faturamento e recebimento das 4 unidades (Ilhéus, Itabuna, Itapetinga,
Conquista) e fornecer insights acionáveis ao dono da empresa.

Regras:
- Sempre use valores em Reais (R$) formatados com milhares e decimais
- Identifique problemas e sugira ações concretas
- Compare unidades entre si para contextualizar
- Aponte tendências (melhorando, piorando, estável)
- Seja direto e objetivo, mas completo
- Use porcentagens para facilitar comparação
- Quando relevante, sugira reunião com gerente específico
- Formate respostas longas com seções claras
- Se não tiver dados suficientes, diga claramente

Dados disponíveis no contexto:
{dados_json}
```

### 5.7 Central de Alertas (`/alertas`)

#### 5.7.1 Lista de Alertas
- Filtro por: tipo, severidade, unidade, período, lido/não lido
- Cada alerta mostra: ícone de severidade, título, resumo, data/hora, unidade, status WhatsApp
- Clique expande com detalhes completos e dados
- Botão "Marcar como lido"
- Botão "Reenviar no WhatsApp"

#### 5.7.2 Tipos de Alerta

| Tipo | Severidade | Trigger | Mensagem |
|------|------------|---------|----------|
| `gap_critico` | 🔴 Crítico | Gap > 50% no acumulado | "Gap crítico em [Unidade]: X% (R$ Y)" |
| `gap_critico` | 🟡 Aviso | Gap entre 30-50% | "Atenção ao gap em [Unidade]: X%" |
| `sem_lancamento` | 🟡 Aviso | Unidade sem lançamento em dia útil até 21h | "[Unidade] ainda não lançou dados de hoje" |
| `anomalia_valor` | 🟡 Aviso | Valor faturado >2x ou <0.5x da média | "Faturamento atípico em [Unidade]: R$ X (média: R$ Y)" |
| `resumo_diario` | ℹ️ Info | Todo dia às 20h | Resumo completo do dia |
| `resumo_semanal` | ℹ️ Info | Segunda às 8h | Resumo da semana anterior |
| `insight_ia` | ℹ️ Info | IA detecta padrão relevante | Insight personalizado |

### 5.8 Configurações (`/configuracoes`)

#### 5.8.1 Configurações Gerais
- Horário de envio do resumo diário (padrão: 20:00)
- Horário de envio do resumo semanal (padrão: segunda 08:00)
- Telefone WhatsApp do dono
- Timezone (padrão: America/Bahia)

#### 5.8.2 Configurações de Alerta
- Percentual de gap para alerta de atenção (padrão: 30%)
- Percentual de gap para alerta crítico (padrão: 50%)
- Horário limite para alerta de "sem lançamento" (padrão: 21:00)
- Dias retroativos permitidos para lançamento (padrão: 3)

#### 5.8.3 Gerenciamento de Unidades
- Adicionar/editar/desativar unidades
- Adicionar/editar/desativar sub-unidades
- Definir metas personalizadas por unidade

#### 5.8.4 Gerenciamento de Usuários
- Criar convite por email
- Atribuir papel (dono/gerente/operador)
- Vincular gerente à unidade
- Ativar/desativar acesso

---

## 6. SERVIÇO PYTHON (FastAPI — VPS Hostinger)

### 6.1 Endpoints

```
POST /api/pdf/parse           → Recebe PDF, extrai dados, retorna JSON estruturado
POST /api/whatsapp/webhook    → Recebe mensagens do UazAPI (webhook)
POST /api/whatsapp/send       → Envia mensagem via UazAPI
POST /api/ia/analyze          → Envia dados para OpenAI API e retorna análise
POST /api/ia/chat             → Chat conversacional com OpenAI API
GET  /api/health              → Health check
```

### 6.2 Parser de PDF (`/api/pdf/parse`)

```python
# Pseudocódigo do parser
# 1. Receber arquivo PDF via multipart/form-data
# 2. Usar pdfplumber para extrair texto
# 3. Identificar padrões do relatório Águia Web ERP:
#    - "RESUMO DAS VENDAS DO DIA DD/MM/YYYY a DD/MM/YYYY"
#    - "TOTAL GERAL {quantidade} {valor}"
#    - "TOTAL FINANCEIRO {a_vista} {a_prazo}"
#    - Seção "Resumo das Vendas Por Documento" com tipos de pagamento
#    - Seção "Resumo da Condição Recebida Por Documento"
#    - Seção "Fechamento" com saldo do dia
# 4. Retornar JSON estruturado:
{
  "data_referencia": "2026-03-05",
  "unidade": "001-ILHEUS",
  "faturamento": {
    "total": 31634.89,
    "a_vista": 16956.00,
    "a_prazo": 14678.89,
    "quantidade_unidades": 323
  },
  "recebimento_por_documento": {
    "PIX_SANTANDER": 4669.00,
    "GETNET_DEBITO": 3200.50,
    "GETNET_CRED_AV": 1108.00,
    "GETNET_CRED_2X": 2036.00,
    "GETNET_CRED_3X": 328.33,
    "GETNET_PIX": 1895.00,
    "NOTA_PROMISSORIA": 1200.00,
    "AZUL_GAS_DO_POVO": 211.74
  },
  "recebimento_total": 14648.57,
  "fechamento": {
    "vendas_caixa": 36303.89,
    "vendas_a_prazo": 19347.89,
    "saldo_dia": 4476.00,
    "caixa_atual": 16298.55
  },
  "vendedores": [
    {"nome": "ANTONIO", "quantidade": 75, "valor": 7867.00, "preco_medio": 104.89},
    {"nome": "ANDERSON", "quantidade": 37, "valor": 4151.39, "preco_medio": 112.20}
    // ...
  ]
}
```

### 6.3 Cron Jobs (APScheduler)

| Job | Horário | Ação |
|-----|---------|------|
| `resumo_diario` | 20:00 (Bahia) | Coleta dados do dia do Supabase → Gera análise IA → Envia via UazAPI |
| `resumo_semanal` | Segunda 08:00 | Coleta dados da semana → Gera análise IA → Envia via UazAPI |
| `verificar_lancamentos` | 21:00 | Verifica unidades sem lançamento → Gera alerta → Envia via UazAPI |
| `analise_anomalias` | 22:00 | IA analisa dados do dia buscando anomalias → Cria alertas se necessário |

### 6.4 Integração WhatsApp (UazAPI)

#### 6.4.1 Envio de Mensagens (Resumo Diário)

Formato da mensagem WhatsApp:

```
📊 *GF GÁS — RESUMO DIÁRIO*
📅 19/03/2026 (Quinta-feira)

━━━━━━━━━━━━━━━━━━━━━
*CONSOLIDADO DO DIA*
💰 Faturamento: R$ 114.972,02
💵 Recebimento: R$ 74.439,71
📉 Gap: R$ 40.533,31 (35,3%)
━━━━━━━━━━━━━━━━━━━━━

*POR UNIDADE:*

🟢 *ILHÉUS*
Fat: R$ 31.186 | Rec: R$ 32.539
Gap: -R$ 1.353 ✅ Recebeu mais!

🔴 *ITABUNA*
Fat: R$ 12.208 | Rec: R$ 19.046
Gap: -R$ 6.837 ✅ Recebeu mais!

🟢 *ITAPETINGA*
Fat: R$ 443 | Rec: R$ 443
Gap: R$ 0 ✅ Zerado

🔴 *CONQUISTA*
Fat: R$ 71.134 | Rec: R$ 22.410
Gap: R$ 48.724 (68,5%) ⚠️ ATENÇÃO

━━━━━━━━━━━━━━━━━━━━━
*ACUMULADO DO MÊS*
Fat: R$ 1.868.317 | Rec: R$ 621.385
Gap: R$ 1.246.932 (66,7%) 🔴
━━━━━━━━━━━━━━━━━━━━━

🤖 *ANÁLISE IA:*
Conquista apresentou o pior desempenho do dia
com gap de 68,5%. Itabuna e Ilhéus tiveram
dia positivo com recebimento superior ao
faturado. Recomendo acompanhar Conquista
nos próximos dias.

💬 Responda com uma pergunta para saber mais.
```

#### 6.4.2 Recebimento de Mensagens (Webhook)

O dono pode enviar mensagens de texto e o sistema responde:

| Mensagem do Dono | Ação do Sistema |
|------------------|-----------------|
| "como está hoje?" | Gera resumo do dia atual |
| "e itabuna?" | Detalha situação de Itabuna |
| "compare ilhéus e conquista" | Análise comparativa IA |
| "previsão do mês" | IA projeta gap final do mês |
| "gere relatório semanal" | Gera e envia PDF do relatório |
| Qualquer outra pergunta | OpenAI API responde com contexto dos dados |

#### 6.4.3 Lançamento via WhatsApp (Gerente/Operador)

Formato de lançamento:
```
FAT ILHEUS 31186.03
REC ILHEUS 32539.24
```

Sistema responde:
```
✅ Lançamento registrado!
📅 19/03/2026
🏢 ILHÉUS
💰 Faturamento: R$ 31.186,03
💵 Recebimento: R$ 32.539,24
📊 Gap: -R$ 1.353,21 (✅ Positivo!)
```

### 6.5 Integração OpenAI API

#### 6.5.1 Funções da IA no Sistema

| Função | Trigger | Input | Output |
|--------|---------|-------|--------|
| **Resumo diário** | Cron 20h | Dados do dia + acumulado | Texto analítico 3-5 frases |
| **Resumo semanal** | Cron segunda 8h | Dados da semana | Texto analítico 5-10 frases + recomendações |
| **Análise de unidade** | Acesso à tela de unidade | Dados da unidade 30 dias | Análise detalhada com padrões e ações |
| **Chat conversacional** | Pergunta do dono (web/WhatsApp) | Pergunta + contexto de dados | Resposta inteligente e contextual |
| **Detecção de anomalias** | Cron 22h | Dados do dia vs histórico | Lista de anomalias ou "tudo normal" |
| **Projeção mensal** | Sob demanda | Dados do mês até hoje | Gap projetado para final do mês |
| **Geração de relatório textual** | Geração de relatório | Dados do período | Parágrafos analíticos para inclusão no PDF |
| **Sugestão de ação** | Alerta crítico | Dados da unidade problemática | Ação recomendada ao dono |

#### 6.5.2 Exemplo de Prompt para Análise Diária

```
Analise os seguintes dados da GF Comércio de Gás do dia {data}:

DADOS DO DIA:
{json_dados_dia}

ACUMULADO DO MÊS:
{json_acumulado}

HISTÓRICO DOS ÚLTIMOS 7 DIAS:
{json_historico_7d}

Forneça:
1. Qual unidade teve o pior desempenho hoje e por quê
2. Qual unidade melhorou em relação a ontem
3. O gap acumulado está abrindo ou fechando comparado à tendência
4. Uma ação concreta que o dono deveria tomar amanhã
5. Projeção do gap no final do mês mantida a tendência atual

Responda em português, de forma direta e acionável.
Formate valores em Reais (R$).
Use no máximo 8 frases.
```

---

## 7. MÉTRICAS E KPIs DO DASHBOARD

### 7.1 Métricas Primárias (visíveis imediatamente)

| Métrica | Cálculo | Onde Aparece |
|---------|---------|-------------|
| **Faturamento do Dia** | SUM(faturamento) WHERE data = hoje | Dashboard, Card |
| **Recebimento do Dia** | SUM(recebimento) WHERE data = hoje | Dashboard, Card |
| **Gap do Dia** | Faturamento - Recebimento | Dashboard, Card |
| **Gap % do Dia** | (Gap / Faturamento) × 100 | Dashboard, Card |
| **Faturamento Acumulado Mês** | SUM(faturamento) WHERE mês = atual | Dashboard, Card |
| **Recebimento Acumulado Mês** | SUM(recebimento) WHERE mês = atual | Dashboard, Card |
| **Gap Acumulado Mês** | Fat. Acum. - Rec. Acum. | Dashboard, Card principal |
| **Gap % Acumulado** | (Gap Acum. / Fat. Acum.) × 100 | Dashboard, Card principal |
| **Taxa de Recebimento** | (Rec. Acum. / Fat. Acum.) × 100 | Dashboard, Card |

### 7.2 Métricas Secundárias (detalhamento)

| Métrica | Cálculo | Onde Aparece |
|---------|---------|-------------|
| **Média Diária de Faturamento** | Fat. Acum. / Dias com dados | Detalhe unidade |
| **Média Diária de Recebimento** | Rec. Acum. / Dias com dados | Detalhe unidade |
| **Dias sem Lançamento** | COUNT dias sem registro no mês | Card unidade, Alertas |
| **Maior Gap Diário** | MAX(gap) no mês | Relatório mensal |
| **Menor Gap Diário** | MIN(gap) no mês | Relatório mensal |
| **Dias com Gap Positivo** | COUNT(gap > 0) | Relatório mensal |
| **Dias com Gap Negativo** | COUNT(gap < 0) | Relatório mensal |
| **Variação vs Mês Anterior** | (Fat. atual / Fat. anterior - 1) × 100 | Dashboard, Cards |
| **Tendência Gap (7 dias)** | Regressão linear últimos 7 gaps | Card unidade (↑↓→) |

### 7.3 Métricas Avançadas (IA)

| Métrica | Gerada Por | Onde Aparece |
|---------|-----------|-------------|
| **Projeção Gap Final do Mês** | OpenAI API (regressão + contexto) | Dashboard, Relatório |
| **Score de Saúde da Unidade** | OpenAI API (0-100 baseado em múltiplos fatores) | Card unidade |
| **Ranking de Criticidade** | OpenAI API (priorização ponderada) | Dashboard lateral |
| **Padrão Semanal** | OpenAI API (identifica dias mais/menos produtivos) | Detalhe unidade |
| **Risco de Inadimplência** | OpenAI API (baseado na tendência de gap) | Relatório mensal |
| **Sugestão de Meta** | OpenAI API (baseado no histórico) | Configurações |

### 7.4 Indicadores Visuais

| Indicador | Condição | Visual |
|-----------|----------|--------|
| 🟢 Normal | Gap < 20% | Borda verde, badge verde |
| 🟡 Atenção | Gap entre 20% e 40% | Borda amarela, badge amarelo |
| 🔴 Crítico | Gap > 40% | Borda vermelha, badge vermelho, pulsa |
| ⚫ Sem Dados | Sem lançamento | Borda cinza, ícone de interrogação |
| ↑ Piorando | Gap crescendo vs 7 dias | Seta vermelha para cima |
| ↓ Melhorando | Gap diminuindo vs 7 dias | Seta verde para baixo |
| → Estável | Gap variando <5% vs 7 dias | Seta cinza horizontal |

---

## 8. FLUXOS DE OPERAÇÃO

### 8.1 Fluxo Diário do Gerente

```
1. Gerente recebe PDF do Águia Web ERP (final do dia)
2. Abre o app → /lancamento
3. Opção A: Clica "Importar PDF" → upload → sistema extrai dados → confere → salva
   Opção B: Digita valores manualmente nos campos de faturamento e recebimento
   Opção C: Envia "FAT ILHEUS 31186.03" e "REC ILHEUS 32539.24" no WhatsApp
4. Sistema salva lançamento
5. Se gap > limite, alerta é gerado automaticamente
6. Dashboard do dono atualiza em tempo real (Supabase Realtime)
7. Gerente vê confirmação com resumo do dia
```

### 8.2 Fluxo Diário do Dono

```
1. 20:00 — Recebe resumo automático no WhatsApp com análise IA
2. Lê o resumo e identifica unidades problemáticas
3. Se precisa de mais detalhes:
   Opção A: Responde no WhatsApp "e itabuna?" → recebe detalhamento IA
   Opção B: Abre o app → /dashboard → clica na unidade
   Opção C: Abre o chat IA no app → "compare itabuna com conquista"
4. Se precisa imprimir:
   → /relatorios → seleciona tipo → visualiza → imprime
5. Se precisa agir:
   → Liga para gerente da unidade problemática
   → Pede à IA: "gere uma mensagem para o gerente de itabuna sobre o gap"
```

### 8.3 Fluxo Semanal

```
1. Segunda 08:00 — Dono recebe resumo semanal no WhatsApp
2. Abre /relatorios/semanal → visualiza → imprime para reunião
3. Reunião com gerentes usando relatório impresso
4. Atualiza metas no /configuracoes se necessário
```

### 8.4 Fluxo de Alerta Crítico

```
1. Gerente lança dados → trigger no banco detecta gap > 50%
2. Sistema cria alerta tipo 'gap_critico' severidade 'critico'
3. Cron verifica alertas não enviados → envia via UazAPI imediatamente
4. Dono recebe: "🔴 ALERTA: Gap crítico em ITABUNA - 75,5% (R$ 565.473)"
5. Dono responde "detalhes" → IA gera análise completa
6. Alerta aparece em /alertas com status "enviado via WhatsApp"
```

---

## 9. DESIGN E UX

### 9.1 Identidade Visual

| Elemento | Valor |
|----------|-------|
| Cor primária | `#1E40AF` (azul escuro — confiança) |
| Cor secundária | `#059669` (verde — positivo/recebimento) |
| Cor de alerta | `#DC2626` (vermelho — gap/problema) |
| Cor de aviso | `#D97706` (amarelo/amber — atenção) |
| Cor neutra | `#6B7280` (cinza — textos secundários) |
| Background | `#F9FAFB` (cinza claríssimo) |
| Cards | `#FFFFFF` com shadow-sm e border radius 12px |
| Fonte principal | Inter (sistema) ou Nunito Sans |
| Fonte de dados | JetBrains Mono (números e valores) |

### 9.2 Responsividade

- **Desktop** (>1024px): Layout completo com sidebar
- **Tablet** (768-1024px): Layout sem sidebar, cards empilhados
- **Mobile** (< 768px): Layout simplificado para o dono consultar no celular
  - Cards empilhados verticalmente
  - Gráficos simplificados
  - Swipe entre unidades

### 9.3 Impressão

- Todos os relatórios usam `@media print` com estilos otimizados
- Remoção de sidebar, header, botões na impressão
- Paginação automática
- Cabeçalho e rodapé do relatório em cada página
- Uso de preto e branco nos gráficos impressos para clareza
- Tamanho de fonte adequado para leitura impressa (11pt mínimo)

---

## 10. SEGURANÇA

### 10.1 Autenticação
- Supabase Auth com email/senha
- JWT com refresh token
- Sessão de 24 horas com renovação automática

### 10.2 Autorização (RLS)
- Dono: acesso total a todos os dados
- Gerente: acesso apenas aos dados da sua unidade
- Todas as queries passam pelo RLS do Supabase

### 10.3 API Python
- Autenticação via API Key no header
- Rate limiting (100 req/min)
- CORS configurado apenas para domínio da Vercel
- HTTPS obrigatório

### 10.4 WhatsApp
- Validação de número de telefone cadastrado
- Comandos de lançamento apenas de números autorizados
- Log de todas as mensagens recebidas/enviadas

---

## 11. PLANO DE DESENVOLVIMENTO (FASES)

### Fase 1 — MVP (Semanas 1-3)
**Objetivo: Dono consegue ver o gap diário de cada unidade**

- [ ] Setup Supabase (tabelas, RLS, auth)
- [ ] Setup React + Vite + Tailwind + Vercel
- [ ] Login e autenticação
- [ ] CRUD de lançamentos (manual)
- [ ] Dashboard consolidado (cards + tabela)
- [ ] Detalhamento por unidade
- [ ] Gráficos de evolução (Recharts)
- [ ] Seed com dados históricos da planilha

### Fase 2 — Relatórios + PDF (Semanas 4-5)
**Objetivo: Dono imprime relatórios profissionais**

- [ ] Relatório diário (impressão)
- [ ] Relatório semanal
- [ ] Relatório mensal
- [ ] Relatório por unidade
- [ ] Relatório comparativo
- [ ] Exportação PDF (jsPDF)

### Fase 3 — IA (Semanas 5-6)
**Objetivo: IA analisa e gera insights automaticamente**

- [ ] Setup FastAPI na VPS
- [ ] Integração OpenAI API
- [ ] Chat IA no frontend
- [ ] Análise automática no dashboard
- [ ] Análise nos relatórios
- [ ] Projeções e recomendações

### Fase 4 — WhatsApp (Semanas 6-7)
**Objetivo: Alertas e interação via WhatsApp**

- [ ] Setup UazAPI
- [ ] Envio de resumo diário automático
- [ ] Envio de alertas críticos
- [ ] Recebimento de perguntas e resposta IA
- [ ] Lançamento via WhatsApp

### Fase 5 — PDF Parser + Automação (Semanas 7-8)
**Objetivo: Extração automática de dados dos PDFs**

- [ ] Parser pdfplumber para relatórios Águia Web ERP
- [ ] Upload e processamento de PDF no app
- [ ] Conferência e confirmação pelo gerente
- [ ] Detecção de anomalias automática

### Fase 6 — Evolução (Contínuo)
- [ ] Recebimento por tipo de documento
- [ ] Histórico multi-mês e comparação
- [ ] Dashboard do gerente (visão limitada)
- [ ] Metas e OKRs por unidade
- [ ] Notificações push no navegador
- [ ] PWA para acesso offline

---

## 12. CRITÉRIOS DE ACEITE

### 12.1 Dashboard
- [ ] Carrega em menos de 2 segundos
- [ ] Atualiza em tempo real quando novo lançamento é feito
- [ ] Mostra dados corretos conferidos com a planilha Excel original
- [ ] Todos os 4 cards de unidade visíveis sem scroll em desktop
- [ ] Cores de severidade corretas (verde/amarelo/vermelho)

### 12.2 Lançamento
- [ ] Gerente consegue lançar faturamento + recebimento em menos de 60 segundos
- [ ] Validação impede valores negativos ou datas futuras
- [ ] Feedback visual imediato após salvar

### 12.3 Relatórios
- [ ] Relatório diário imprime em 1 página A4 (consolidado)
- [ ] Relatório semanal imprime em 2-3 páginas A4
- [ ] Valores conferem com dados do banco
- [ ] Análise IA presente em todos os relatórios
- [ ] Layout profissional e legível

### 12.4 IA
- [ ] Responde perguntas em menos de 5 segundos
- [ ] Análises são coerentes com os dados
- [ ] Não inventa dados — quando não tem, diz que não tem
- [ ] Linguagem clara, em português

### 12.5 WhatsApp
- [ ] Resumo diário chega às 20h (±5 min)
- [ ] Alerta crítico chega em menos de 5 minutos após lançamento
- [ ] Respostas do chatbot em menos de 10 segundos

---

## 13. APÊNDICE — DADOS DE REFERÊNCIA

### 13.1 Estrutura Atual das Unidades

| Unidade | Sub-unidades | Código |
|---------|-------------|--------|
| ILHÉUS | GF ILHÉUS, FM ILHÉUS | ilheus |
| ITABUNA | BS ITABUNA, VF COMÉRCIO ITABUNA | itabuna |
| ITAPETINGA | F CARLOS ITAPETINGA | itapetinga |
| CONQUISTA | COMERCIAL V&F CONQUISTA | conquista |

### 13.2 Volume Médio Diário (Março/2026, primeiros 19 dias)

| Unidade | Fat. Médio/Dia | Rec. Médio/Dia | Gap Médio/Dia |
|---------|---------------|----------------|---------------|
| Ilhéus | R$ 26.800 | R$ 10.937 | R$ 15.862 |
| Itabuna | R$ 39.397 | R$ 9.635 | R$ 29.762 |
| Itapetinga | R$ 6.487 | R$ 2.592 | R$ 3.895 |
| Conquista | R$ 29.543 | R$ 9.517 | R$ 20.026 |

### 13.3 Tipos de Documento de Recebimento (extraídos dos PDFs)

| Código | Nome | Descrição |
|--------|------|-----------|
| 001 | PIX SANTANDER | Transferência PIX via Santander |
| 012 | NOTA PROMISSÓRIA | Nota promissória |
| 013 | CONVÊNIOS | Convênios empresariais |
| 021 | CH PRE | Cheque pré-datado |
| 031 | BOLETO | Boleto bancário |
| 046 | AZUL GAS DO POVO | Programa Gás do Povo |
| 117 | UP BRASIL | Vale alimentação/gás |
| 119 | GETNET DÉBITO | Máquina Getnet — débito |
| 120 | GETNET CRED AV | Máquina Getnet — crédito à vista |
| 121 | GETNET CRED 2X | Máquina Getnet — crédito 2x |
| 122 | GETNET CRED 3X | Máquina Getnet — crédito 3x |
| 123 | GETNET PIX | Máquina Getnet — PIX |

---

## 14. ESTRUTURA DE PASTAS DO PROJETO

### 14.1 Frontend (React + Vite)

```
gf-gas-control/
├── public/
│   ├── favicon.ico
│   ├── logo-gf-gas.svg
│   └── manifest.json
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   │
│   ├── config/
│   │   ├── supabase.js
│   │   ├── constants.js
│   │   └── api.js
│   │
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   ├── UnidadesContext.jsx
│   │   └── AlertasContext.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useLancamentos.js
│   │   ├── useResumo.js
│   │   ├── useResumoUnidade.js
│   │   ├── useAlertas.js
│   │   ├── useIA.js
│   │   ├── useRelatorio.js
│   │   └── useRealtime.js
│   │
│   ├── services/
│   │   ├── lancamentosService.js
│   │   ├── resumoService.js
│   │   ├── alertasService.js
│   │   ├── iaService.js
│   │   ├── pdfService.js
│   │   ├── configService.js
│   │   ├── unidadesService.js
│   │   └── usuariosService.js
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── MobileNav.jsx
│   │   │   └── PrintLayout.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── CardResumoGlobal.jsx
│   │   │   ├── CardUnidade.jsx
│   │   │   ├── GraficoEvolucaoDiaria.jsx
│   │   │   ├── GraficoAcumulado.jsx
│   │   │   ├── TabelaResumoDiario.jsx
│   │   │   ├── RankingUnidades.jsx
│   │   │   ├── PainelAlertas.jsx
│   │   │   ├── AnaliseIACard.jsx
│   │   │   └── SparklineGap.jsx
│   │   │
│   │   ├── unidade/
│   │   │   ├── CardsMetricasUnidade.jsx
│   │   │   ├── GraficoLinhaDupla.jsx
│   │   │   ├── GraficoAcumuladoUnidade.jsx
│   │   │   ├── BreakdownSubUnidades.jsx
│   │   │   ├── TabelaDiariaUnidade.jsx
│   │   │   └── AnaliseIAUnidade.jsx
│   │   │
│   │   ├── lancamento/
│   │   │   ├── FormLancamento.jsx
│   │   │   ├── CampoValor.jsx
│   │   │   ├── ResumoLancamento.jsx
│   │   │   ├── HistoricoRecente.jsx
│   │   │   ├── UploadPDF.jsx
│   │   │   └── ConfirmacaoPDF.jsx
│   │   │
│   │   ├── relatorios/
│   │   │   ├── RelatorioHeader.jsx
│   │   │   ├── RelatorioFooter.jsx
│   │   │   ├── RelatorioDiario.jsx
│   │   │   ├── RelatorioSemanal.jsx
│   │   │   ├── RelatorioMensal.jsx
│   │   │   ├── RelatorioUnidade.jsx
│   │   │   ├── RelatorioComparativo.jsx
│   │   │   ├── TabelaRelatorio.jsx
│   │   │   ├── GraficoRelatorio.jsx
│   │   │   └── SecaoAnaliseIA.jsx
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatContainer.jsx
│   │   │   ├── ChatMessage.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   ├── SugestoesPergunta.jsx
│   │   │   └── ChatSidebar.jsx
│   │   │
│   │   ├── alertas/
│   │   │   ├── ListaAlertas.jsx
│   │   │   ├── AlertaItem.jsx
│   │   │   ├── FiltrosAlerta.jsx
│   │   │   └── BadgeAlerta.jsx
│   │   │
│   │   ├── configuracoes/
│   │   │   ├── ConfigGeral.jsx
│   │   │   ├── ConfigAlertas.jsx
│   │   │   ├── GerenciarUnidades.jsx
│   │   │   └── GerenciarUsuarios.jsx
│   │   │
│   │   └── ui/
│   │       ├── StatusBadge.jsx
│   │       ├── TendenciaIcon.jsx
│   │       ├── ValorFormatado.jsx
│   │       ├── PercentualBadge.jsx
│   │       ├── BarraProgresso.jsx
│   │       ├── Loading.jsx
│   │       ├── EmptyState.jsx
│   │       ├── ErrorBoundary.jsx
│   │       ├── Modal.jsx
│   │       ├── DatePicker.jsx
│   │       ├── SelectUnidade.jsx
│   │       └── Tooltip.jsx
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── UnidadeDetalhePage.jsx
│   │   ├── LancamentoPage.jsx
│   │   ├── LancamentoPDFPage.jsx
│   │   ├── RelatoriosPage.jsx
│   │   ├── RelatorioDiarioPage.jsx
│   │   ├── RelatorioSemanalPage.jsx
│   │   ├── RelatorioMensalPage.jsx
│   │   ├── RelatorioUnidadePage.jsx
│   │   ├── RelatorioComparativoPage.jsx
│   │   ├── ChatIAPage.jsx
│   │   ├── AlertasPage.jsx
│   │   ├── ConfiguracoesPage.jsx
│   │   └── NotFoundPage.jsx
│   │
│   └── utils/
│       ├── formatters.js
│       ├── calculations.js
│       ├── colors.js
│       ├── dates.js
│       ├── validators.js
│       └── pdf.js
│
├── .env
├── .env.production
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── vercel.json
└── README.md
```

### 14.2 Backend Python (FastAPI — VPS Hostinger)

```
gf-gas-api/
├── app/
│   ├── main.py
│   ├── config.py
│   │
│   ├── routers/
│   │   ├── pdf.py
│   │   ├── whatsapp.py
│   │   ├── ia.py
│   │   └── health.py
│   │
│   ├── services/
│   │   ├── pdf_parser.py
│   │   ├── claude_service.py
│   │   ├── whatsapp_service.py
│   │   ├── supabase_service.py
│   │   └── alerta_service.py
│   │
│   ├── jobs/
│   │   ├── scheduler.py
│   │   ├── resumo_diario.py
│   │   ├── resumo_semanal.py
│   │   ├── verificar_lancamentos.py
│   │   └── analise_anomalias.py
│   │
│   ├── models/
│   │   ├── pdf_models.py
│   │   ├── whatsapp_models.py
│   │   └── ia_models.py
│   │
│   └── utils/
│       ├── formatters.py
│       └── prompts.py
│
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env
└── README.md
```

---

## 15. CONTRATOS DE API (FastAPI)

### 15.1 POST `/api/pdf/parse`

**Request:**
```
Content-Type: multipart/form-data
Authorization: Bearer {api_key}
file: <arquivo.pdf>
unidade_codigo: "ilheus"
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "data_referencia": "2026-03-05",
    "unidade_detectada": "001-ILHEUS",
    "faturamento": {
      "total": 31634.89,
      "a_vista": 16956.00,
      "a_prazo": 14678.89,
      "quantidade_unidades": 323,
      "preco_medio_13kg": 111.22,
      "preco_medio_45kg": 490.00
    },
    "recebimento_consolidado": 14648.57,
    "recebimento_por_documento": [
      {"codigo": "001", "nome": "PIX SANTANDER", "valor": 4669.00},
      {"codigo": "012", "nome": "NOTA PROMISSORIA", "valor": 1200.00},
      {"codigo": "119", "nome": "GETNET DEBITO", "valor": 3200.50},
      {"codigo": "120", "nome": "GETNET CRED AV", "valor": 1108.00},
      {"codigo": "121", "nome": "GETNET CRED 2X", "valor": 2036.00},
      {"codigo": "122", "nome": "GETNET CRED 3X", "valor": 328.33},
      {"codigo": "123", "nome": "GETNET PIX", "valor": 1895.00}
    ],
    "fechamento": {
      "vendas_caixa": 36303.89,
      "vendas_a_prazo": 19347.89,
      "saldo_dia": 4476.00,
      "caixa_atual": 16298.55
    },
    "vendedores": [
      {
        "nome": "ANTONIO",
        "codigo": "008923",
        "quantidade": 75,
        "valor_total": 7867.00,
        "preco_medio": 104.89,
        "a_vista": 2900.00,
        "a_prazo": 2763.00
      }
    ]
  }
}
```

### 15.2 POST `/api/ia/analyze`

**Request:**
```json
{
  "tipo": "resumo_diario",
  "data": "2026-03-19",
  "dados": {
    "dia": {
      "ilheus": {"faturamento": 31186.03, "recebimento": 32539.24},
      "itabuna": {"faturamento": 12208.78, "recebimento": 19046.47},
      "itapetinga": {"faturamento": 443.74, "recebimento": 443.74},
      "conquista": {"faturamento": 71134.47, "recebimento": 22410.26}
    },
    "acumulado": {
      "ilheus": {"faturamento": 509195.20, "recebimento": 207817.13},
      "itabuna": {"faturamento": 748540.63, "recebimento": 183066.77},
      "itapetinga": {"faturamento": 49260.05, "recebimento": 49260.05},
      "conquista": {"faturamento": 561321.41, "recebimento": 181241.76}
    },
    "historico_7d": [
      {"data": "2026-03-13", "faturamento_total": 118547.12, "recebimento_total": 94452.55},
      {"data": "2026-03-14", "faturamento_total": 95843.78, "recebimento_total": 0},
      {"data": "2026-03-15", "faturamento_total": 9499.39, "recebimento_total": 0},
      {"data": "2026-03-16", "faturamento_total": 119913.15, "recebimento_total": 178682.76},
      {"data": "2026-03-17", "faturamento_total": 127497.95, "recebimento_total": 113165.95},
      {"data": "2026-03-18", "faturamento_total": 79049.76, "recebimento_total": 75351.29},
      {"data": "2026-03-19", "faturamento_total": 114972.02, "recebimento_total": 74439.71}
    ]
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "analise": "Conquista registrou o pior desempenho do dia com gap de R$ 48.724 (68,5%)...",
  "metricas_geradas": {
    "unidade_pior_dia": "conquista",
    "unidade_melhor_dia": "itabuna",
    "tendencia_gap": "diminuindo",
    "projecao_gap_fim_mes": 450000,
    "score_saude": {
      "ilheus": 65,
      "itabuna": 25,
      "itapetinga": 100,
      "conquista": 30
    }
  }
}
```

### 15.3 POST `/api/ia/chat`

**Request:**
```json
{
  "mensagem": "Compare itabuna com conquista nesta semana",
  "usuario_id": "uuid-do-dono",
  "historico": [
    {"role": "user", "content": "como está hoje?"},
    {"role": "assistant", "content": "Hoje o gap consolidado..."}
  ]
}
```

**Response 200:**
```json
{
  "success": true,
  "resposta": "Comparando Itabuna e Conquista nos últimos 7 dias...",
  "sugestoes_followup": [
    "Qual vendedor de Itabuna vende mais a prazo?",
    "Gere um relatório comparativo para imprimir",
    "Quais ações posso tomar com Conquista?"
  ]
}
```

### 15.4 POST `/api/whatsapp/webhook`

**Request (UazAPI envia):**
```json
{
  "event": "message",
  "data": {
    "from": "5573999999999",
    "body": "como está itabuna?",
    "timestamp": 1711144800,
    "messageId": "abc123"
  }
}
```

Sistema processa assincronamente:
1. Identifica remetente na tabela `perfis` pelo telefone
2. Detecta intenção: `FAT`/`REC` → lançamento | pergunta → chat IA
3. Responde via POST para UazAPI

### 15.5 POST `/api/whatsapp/send`

**Request:**
```json
{
  "telefone": "5573999999999",
  "mensagem": "📊 *GF GÁS — RESUMO DIÁRIO*\n📅 19/03/2026...",
  "tipo": "text"
}
```

---

## 16. VARIÁVEIS DE AMBIENTE

### 16.1 Frontend (.env / .env.production)

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_API_URL=https://api.gfgas.com.br
VITE_APP_NAME=GF Gás Control
VITE_APP_VERSION=1.0.0
```

### 16.2 Backend Python (.env)

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...
OPENAI_API_KEY=sk-ant-api03-...
OPENAI_MODEL=gpt-4o
UAZAPI_URL=https://api.uazapi.com
UAZAPI_TOKEN=seu-token-aqui
UAZAPI_INSTANCE=sua-instancia
API_KEY=chave-secreta-para-autenticar-requests
TIMEZONE=America/Bahia
TELEFONE_DONO=5573999999999
HOST=0.0.0.0
PORT=8000
```

---

## 17. CONFIGURAÇÃO DE DEPLOY

### 17.1 Vercel (Frontend)

**vercel.json:**
```json
{
  "rewrites": [
    {"source": "/((?!assets/).*)", "destination": "/index.html"}
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}
      ]
    }
  ]
}
```

### 17.2 VPS Hostinger (Backend Python)

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    env_file: .env
    restart: always
    volumes:
      - ./uploads:/app/uploads

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - api
    restart: always
```

**Dockerfile:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./app/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**requirements.txt:**
```
fastapi==0.115.0
uvicorn[standard]==0.30.0
pdfplumber==0.11.0
httpx==0.27.0
apscheduler==3.10.4
openai>=1.0.0
supabase==2.10.0
python-multipart==0.0.9
pydantic-settings==2.5.0
python-dotenv==1.0.1
```

### 17.3 Supabase RLS Policies

```sql
-- Dono vê tudo
CREATE POLICY "dono_full_access" ON lancamentos
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND papel = 'dono')
  );

-- Gerente vê/edita apenas sua unidade
CREATE POLICY "gerente_own_unit" ON lancamentos
  FOR ALL TO authenticated
  USING (
    unidade_id = (SELECT unidade_id FROM perfis WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND papel = 'gerente')
  );
```

---

## 18. INSTRUÇÕES PARA CLAUDE CODE

### 18.1 Prompt Inicial Sugerido

```
Leia o arquivo PRD_GF_GAS_CONTROL.md na raiz do projeto. Este é o PRD
completo do sistema GF Gás Control. Vamos desenvolver fase por fase.

Comece pela FASE 1 (MVP):
1. Inicialize o projeto React com Vite + Tailwind CSS
2. Configure o Supabase client
3. Crie a estrutura de pastas conforme Seção 14.1
4. Implemente o sistema de autenticação (login)
5. Implemente o CRUD de lançamentos
6. Implemente o Dashboard consolidado com todos os componentes
7. Implemente a tela de detalhamento por unidade

Use EXATAMENTE a stack definida no PRD:
- React 18+ com Vite
- Tailwind CSS 3
- React Router v6
- Recharts para gráficos
- TanStack Query para data fetching
- Supabase JS client
- Lucide React para ícones
- date-fns com locale pt-BR

O design deve seguir as cores da Seção 9.1.
O modelo de dados está na Seção 3.
A estrutura de rotas está na Seção 5.1.
Os componentes estão detalhados na Seção 14.1.
```

### 18.2 Ordem de Desenvolvimento por Fase

**FASE 1 — Setup + Dashboard (Semanas 1-3):**

```
Passo 1: Setup do projeto
- npm create vite@latest gf-gas-control -- --template react
- Instalar: tailwindcss, react-router-dom, @supabase/supabase-js,
  @tanstack/react-query, recharts, lucide-react, date-fns
- Configurar tailwind.config.js com cores da Seção 9.1
- Criar src/config/supabase.js e src/config/constants.js

Passo 2: Autenticação
- AuthContext.jsx com Supabase Auth
- LoginPage.jsx
- ProtectedRoute component
- App.jsx com rotas

Passo 3: Layout base
- AppLayout.jsx com sidebar + header
- Sidebar.jsx com menu de navegação
- Header.jsx com info do usuário

Passo 4: Services e hooks
- lancamentosService.js (CRUD Supabase)
- resumoService.js (queries para views)
- useLancamentos.js e useResumo.js hooks

Passo 5: Dashboard
- DashboardPage.jsx
- CardResumoGlobal.jsx (4 cards superiores)
- CardUnidade.jsx (4 cards por unidade)
- GraficoEvolucaoDiaria.jsx (Recharts AreaChart)
- TabelaResumoDiario.jsx
- RankingUnidades.jsx

Passo 6: Detalhamento de unidade
- UnidadeDetalhePage.jsx
- CardsMetricasUnidade.jsx
- GraficoLinhaDupla.jsx
- TabelaDiariaUnidade.jsx

Passo 7: Lançamento
- LancamentoPage.jsx
- FormLancamento.jsx
- CampoValor.jsx (input monetário)
- HistoricoRecente.jsx

Passo 8: Seed de dados no Supabase (Seção 19)
```

**FASE 2 — Relatórios (Semanas 4-5)**
**FASE 3 — IA (Semanas 5-6)**
**FASE 4 — WhatsApp (Semanas 6-7)**
**FASE 5 — PDF Parser (Semanas 7-8)**

---

## 19. DADOS DE SEED (MIGRAÇÃO DA PLANILHA)

```sql
DO $$
DECLARE
  uid_ilheus UUID;
  uid_itabuna UUID;
  uid_itapetinga UUID;
  uid_conquista UUID;
  sub_gf_ilheus UUID;
  sub_fm_ilheus UUID;
  sub_bs_itabuna UUID;
  sub_vf_itabuna UUID;
  sub_f_carlos UUID;
  sub_vf_conquista UUID;
BEGIN
  SELECT id INTO uid_ilheus FROM unidades WHERE codigo = 'ilheus';
  SELECT id INTO uid_itabuna FROM unidades WHERE codigo = 'itabuna';
  SELECT id INTO uid_itapetinga FROM unidades WHERE codigo = 'itapetinga';
  SELECT id INTO uid_conquista FROM unidades WHERE codigo = 'conquista';
  SELECT id INTO sub_gf_ilheus FROM sub_unidades WHERE codigo = 'gf_ilheus';
  SELECT id INTO sub_fm_ilheus FROM sub_unidades WHERE codigo = 'fm_ilheus';
  SELECT id INTO sub_bs_itabuna FROM sub_unidades WHERE codigo = 'bs_itabuna';
  SELECT id INTO sub_vf_itabuna FROM sub_unidades WHERE codigo = 'vf_itabuna';
  SELECT id INTO sub_f_carlos FROM sub_unidades WHERE codigo = 'f_carlos_itapetinga';
  SELECT id INTO sub_vf_conquista FROM sub_unidades WHERE codigo = 'vf_conquista';

  -- FATURAMENTO 01/03 a 19/03
  INSERT INTO lancamentos (data, unidade_id, sub_unidade_id, tipo, valor, origem) VALUES
    ('2026-03-01', uid_ilheus, sub_gf_ilheus, 'faturamento', 10905.00, 'api'),
    ('2026-03-01', uid_ilheus, sub_fm_ilheus, 'faturamento', 0, 'api'),
    ('2026-03-01', uid_itabuna, sub_bs_itabuna, 'faturamento', 0, 'api'),
    ('2026-03-01', uid_itabuna, sub_vf_itabuna, 'faturamento', 0, 'api'),
    ('2026-03-01', uid_itapetinga, sub_f_carlos, 'faturamento', 0, 'api'),
    ('2026-03-01', uid_conquista, sub_vf_conquista, 'faturamento', 1270.00, 'api'),
    ('2026-03-02', uid_ilheus, sub_gf_ilheus, 'faturamento', 30973.00, 'api'),
    ('2026-03-02', uid_itabuna, sub_bs_itabuna, 'faturamento', 54198.39, 'api'),
    ('2026-03-02', uid_itabuna, sub_vf_itabuna, 'faturamento', 1063.90, 'api'),
    ('2026-03-02', uid_itapetinga, sub_f_carlos, 'faturamento', 10125.89, 'api'),
    ('2026-03-02', uid_conquista, sub_vf_conquista, 'faturamento', 85733.49, 'api'),
    ('2026-03-03', uid_ilheus, sub_gf_ilheus, 'faturamento', 30381.62, 'api'),
    ('2026-03-03', uid_ilheus, sub_fm_ilheus, 'faturamento', 17990.00, 'api'),
    ('2026-03-03', uid_itabuna, sub_bs_itabuna, 'faturamento', 56589.09, 'api'),
    ('2026-03-03', uid_itabuna, sub_vf_itabuna, 'faturamento', 201.17, 'api'),
    ('2026-03-03', uid_itapetinga, sub_f_carlos, 'faturamento', 7475.78, 'api'),
    ('2026-03-03', uid_conquista, sub_vf_conquista, 'faturamento', 29803.29, 'api'),
    ('2026-03-04', uid_ilheus, sub_gf_ilheus, 'faturamento', 26375.24, 'api'),
    ('2026-03-04', uid_itabuna, sub_bs_itabuna, 'faturamento', 34726.00, 'api'),
    ('2026-03-04', uid_itabuna, sub_vf_itabuna, 'faturamento', 10033.12, 'api'),
    ('2026-03-04', uid_itapetinga, sub_f_carlos, 'faturamento', 7858.89, 'api'),
    ('2026-03-04', uid_conquista, sub_vf_conquista, 'faturamento', 24919.56, 'api'),
    ('2026-03-05', uid_ilheus, sub_gf_ilheus, 'faturamento', 31634.89, 'api'),
    ('2026-03-05', uid_itabuna, sub_bs_itabuna, 'faturamento', 26509.39, 'api'),
    ('2026-03-05', uid_itabuna, sub_vf_itabuna, 'faturamento', 12330.95, 'api'),
    ('2026-03-05', uid_itapetinga, sub_f_carlos, 'faturamento', 12819.17, 'api'),
    ('2026-03-05', uid_conquista, sub_vf_conquista, 'faturamento', 24250.95, 'api'),
    ('2026-03-06', uid_ilheus, sub_gf_ilheus, 'faturamento', 41124.39, 'api'),
    ('2026-03-06', uid_itabuna, sub_bs_itabuna, 'faturamento', 30823.00, 'api'),
    ('2026-03-06', uid_itabuna, sub_vf_itabuna, 'faturamento', 212.78, 'api'),
    ('2026-03-06', uid_itapetinga, sub_f_carlos, 'faturamento', 6139.78, 'api'),
    ('2026-03-06', uid_conquista, sub_vf_conquista, 'faturamento', 27094.78, 'api'),
    ('2026-03-07', uid_ilheus, sub_gf_ilheus, 'faturamento', 26927.89, 'api'),
    ('2026-03-07', uid_itabuna, sub_bs_itabuna, 'faturamento', 62281.39, 'api'),
    ('2026-03-07', uid_itabuna, sub_vf_itabuna, 'faturamento', 106.39, 'api'),
    ('2026-03-07', uid_itapetinga, sub_f_carlos, 'faturamento', 4375.89, 'api'),
    ('2026-03-07', uid_conquista, sub_vf_conquista, 'faturamento', 36613.39, 'api'),
    ('2026-03-08', uid_ilheus, sub_gf_ilheus, 'faturamento', 7999.00, 'api'),
    ('2026-03-08', uid_conquista, sub_vf_conquista, 'faturamento', 5946.39, 'api'),
    ('2026-03-09', uid_ilheus, sub_gf_ilheus, 'faturamento', 21148.17, 'api'),
    ('2026-03-09', uid_itabuna, sub_bs_itabuna, 'faturamento', 46453.00, 'api'),
    ('2026-03-09', uid_itabuna, sub_vf_itabuna, 'faturamento', 744.73, 'api'),
    ('2026-03-09', uid_itapetinga, sub_f_carlos, 'faturamento', 10505.00, 'api'),
    ('2026-03-09', uid_conquista, sub_vf_conquista, 'faturamento', 19601.17, 'api'),
    ('2026-03-10', uid_ilheus, sub_gf_ilheus, 'faturamento', 34271.29, 'api'),
    ('2026-03-10', uid_itabuna, sub_bs_itabuna, 'faturamento', 54492.87, 'api'),
    ('2026-03-10', uid_itabuna, sub_vf_itabuna, 'faturamento', 5961.95, 'api'),
    ('2026-03-10', uid_itapetinga, sub_f_carlos, 'faturamento', 9482.28, 'api'),
    ('2026-03-10', uid_conquista, sub_vf_conquista, 'faturamento', 27712.78, 'api'),
    ('2026-03-11', uid_ilheus, sub_gf_ilheus, 'faturamento', 33376.50, 'api'),
    ('2026-03-11', uid_itabuna, sub_bs_itabuna, 'faturamento', 23570.39, 'api'),
    ('2026-03-11', uid_itabuna, sub_vf_itabuna, 'faturamento', 11428.67, 'api'),
    ('2026-03-11', uid_itapetinga, sub_f_carlos, 'faturamento', 8377.89, 'api'),
    ('2026-03-11', uid_conquista, sub_vf_conquista, 'faturamento', 62571.95, 'api'),
    ('2026-03-12', uid_ilheus, sub_gf_ilheus, 'faturamento', 24563.00, 'api'),
    ('2026-03-12', uid_itabuna, sub_bs_itabuna, 'faturamento', 54115.39, 'api'),
    ('2026-03-12', uid_itabuna, sub_vf_itabuna, 'faturamento', 531.95, 'api'),
    ('2026-03-12', uid_itapetinga, sub_f_carlos, 'faturamento', 5084.89, 'api'),
    ('2026-03-12', uid_conquista, sub_vf_conquista, 'faturamento', 25384.00, 'api'),
    ('2026-03-13', uid_ilheus, sub_gf_ilheus, 'faturamento', 24570.89, 'api'),
    ('2026-03-13', uid_itabuna, sub_bs_itabuna, 'faturamento', 59304.89, 'api'),
    ('2026-03-13', uid_itapetinga, sub_f_carlos, 'faturamento', 8262.78, 'api'),
    ('2026-03-13', uid_conquista, sub_vf_conquista, 'faturamento', 26408.56, 'api'),
    ('2026-03-14', uid_ilheus, sub_gf_ilheus, 'faturamento', 14308.89, 'api'),
    ('2026-03-14', uid_itabuna, sub_bs_itabuna, 'faturamento', 51980.00, 'api'),
    ('2026-03-14', uid_itapetinga, sub_f_carlos, 'faturamento', 6220.50, 'api'),
    ('2026-03-14', uid_conquista, sub_vf_conquista, 'faturamento', 23334.39, 'api'),
    ('2026-03-15', uid_ilheus, sub_gf_ilheus, 'faturamento', 8123.00, 'api'),
    ('2026-03-15', uid_conquista, sub_vf_conquista, 'faturamento', 1376.39, 'api'),
    ('2026-03-16', uid_ilheus, sub_gf_ilheus, 'faturamento', 12701.00, 'api'),
    ('2026-03-16', uid_ilheus, sub_fm_ilheus, 'faturamento', 22296.75, 'api'),
    ('2026-03-16', uid_itabuna, sub_bs_itabuna, 'faturamento', 41431.50, 'api'),
    ('2026-03-16', uid_itabuna, sub_vf_itabuna, 'faturamento', 638.34, 'api'),
    ('2026-03-16', uid_itapetinga, sub_f_carlos, 'faturamento', 14548.00, 'api'),
    ('2026-03-16', uid_conquista, sub_vf_conquista, 'faturamento', 28297.56, 'api'),
    ('2026-03-17', uid_ilheus, sub_gf_ilheus, 'faturamento', 25373.50, 'api'),
    ('2026-03-17', uid_ilheus, sub_fm_ilheus, 'faturamento', 8377.57, 'api'),
    ('2026-03-17', uid_itabuna, sub_bs_itabuna, 'faturamento', 57342.71, 'api'),
    ('2026-03-17', uid_itabuna, sub_vf_itabuna, 'faturamento', 8402.33, 'api'),
    ('2026-03-17', uid_itapetinga, sub_f_carlos, 'faturamento', 6292.89, 'api'),
    ('2026-03-17', uid_conquista, sub_vf_conquista, 'faturamento', 21708.95, 'api'),
    ('2026-03-18', uid_ilheus, sub_gf_ilheus, 'faturamento', 24587.58, 'api'),
    ('2026-03-18', uid_itabuna, sub_bs_itabuna, 'faturamento', 23279.78, 'api'),
    ('2026-03-18', uid_itabuna, sub_vf_itabuna, 'faturamento', 7577.78, 'api'),
    ('2026-03-18', uid_itapetinga, sub_f_carlos, 'faturamento', 5445.28, 'api'),
    ('2026-03-18', uid_conquista, sub_vf_conquista, 'faturamento', 18159.34, 'api'),
    ('2026-03-19', uid_ilheus, sub_gf_ilheus, 'faturamento', 23771.89, 'api'),
    ('2026-03-19', uid_ilheus, sub_fm_ilheus, 'faturamento', 7414.14, 'api'),
    ('2026-03-19', uid_itabuna, sub_bs_itabuna, 'faturamento', 11996.00, 'api'),
    ('2026-03-19', uid_itabuna, sub_vf_itabuna, 'faturamento', 212.78, 'api'),
    ('2026-03-19', uid_conquista, sub_vf_conquista, 'faturamento', 71134.47, 'api');

  -- RECEBIMENTO (dados disponíveis na planilha)
  INSERT INTO lancamentos (data, unidade_id, sub_unidade_id, tipo, valor, origem) VALUES
    ('2026-03-02', uid_ilheus, sub_gf_ilheus, 'recebimento', 51143.47, 'api'),
    ('2026-03-02', uid_ilheus, sub_fm_ilheus, 'recebimento', 7339.97, 'api'),
    ('2026-03-02', uid_itabuna, sub_bs_itabuna, 'recebimento', 53528.50, 'api'),
    ('2026-03-02', uid_itabuna, sub_vf_itabuna, 'recebimento', 744.73, 'api'),
    ('2026-03-02', uid_itapetinga, sub_f_carlos, 'recebimento', 19596.98, 'api'),
    ('2026-03-02', uid_conquista, sub_vf_conquista, 'recebimento', 47392.35, 'api'),
    ('2026-03-16', uid_ilheus, sub_gf_ilheus, 'recebimento', 52497.25, 'api'),
    ('2026-03-16', uid_ilheus, sub_fm_ilheus, 'recebimento', 7319.11, 'api'),
    ('2026-03-16', uid_itabuna, sub_bs_itabuna, 'recebimento', 47120.77, 'api'),
    ('2026-03-16', uid_itabuna, sub_vf_itabuna, 'recebimento', 8351.12, 'api'),
    ('2026-03-16', uid_itapetinga, sub_f_carlos, 'recebimento', 18412.24, 'api'),
    ('2026-03-16', uid_conquista, sub_vf_conquista, 'recebimento', 44982.27, 'api'),
    ('2026-03-17', uid_ilheus, sub_gf_ilheus, 'recebimento', 32570.60, 'api'),
    ('2026-03-17', uid_ilheus, sub_fm_ilheus, 'recebimento', 2159.64, 'api'),
    ('2026-03-17', uid_itabuna, sub_bs_itabuna, 'recebimento', 23229.54, 'api'),
    ('2026-03-17', uid_itabuna, sub_vf_itabuna, 'recebimento', 425.56, 'api'),
    ('2026-03-17', uid_itapetinga, sub_f_carlos, 'recebimento', 8972.03, 'api'),
    ('2026-03-17', uid_conquista, sub_vf_conquista, 'recebimento', 45808.58, 'api'),
    ('2026-03-18', uid_ilheus, sub_gf_ilheus, 'recebimento', 21059.71, 'api'),
    ('2026-03-18', uid_ilheus, sub_fm_ilheus, 'recebimento', 1188.14, 'api'),
    ('2026-03-18', uid_itabuna, sub_bs_itabuna, 'recebimento', 22949.14, 'api'),
    ('2026-03-18', uid_itabuna, sub_vf_itabuna, 'recebimento', 7670.94, 'api'),
    ('2026-03-18', uid_itapetinga, sub_f_carlos, 'recebimento', 1835.06, 'api'),
    ('2026-03-18', uid_conquista, sub_vf_conquista, 'recebimento', 20648.30, 'api'),
    ('2026-03-19', uid_ilheus, sub_gf_ilheus, 'recebimento', 29561.01, 'api'),
    ('2026-03-19', uid_ilheus, sub_fm_ilheus, 'recebimento', 2978.23, 'api'),
    ('2026-03-19', uid_itabuna, sub_bs_itabuna, 'recebimento', 18940.08, 'api'),
    ('2026-03-19', uid_itabuna, sub_vf_itabuna, 'recebimento', 106.39, 'api'),
    ('2026-03-19', uid_itapetinga, sub_f_carlos, 'recebimento', 443.74, 'api'),
    ('2026-03-19', uid_conquista, sub_vf_conquista, 'recebimento', 22410.26, 'api');

END $$;
```

---

## 20. PADRÕES DE CÓDIGO

### 20.1 Nomenclatura

| Contexto | Padrão | Exemplo |
|----------|--------|---------|
| Componentes React | PascalCase | `CardUnidade.jsx` |
| Hooks | camelCase com prefixo `use` | `useResumo.js` |
| Services | camelCase com sufixo `Service` | `lancamentosService.js` |
| Utilitários | camelCase | `formatCurrency()` |
| Constantes | UPPER_SNAKE_CASE | `GAP_LIMITE_CRITICO` |
| Tabelas SQL | snake_case | `lancamentos` |
| Endpoints API | kebab-case | `/api/ia/chat` |

### 20.2 Formatação de Valores (utils/formatters.js)

```javascript
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(value);
};

export const formatCurrencyCompact = (value) => {
  if (Math.abs(value) >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
  return formatCurrency(value);
};

export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0,0%';
  return `${value.toFixed(decimals).replace('.', ',')}%`;
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(new Date(date));
};

export const getDiaSemana = (date) => {
  const dias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  return dias[new Date(date).getDay()];
};
```

### 20.3 Cálculos (utils/calculations.js)

```javascript
export const calcGap = (fat, rec) => fat - rec;

export const calcGapPercent = (fat, rec) => {
  if (!fat || fat === 0) return 0;
  return ((fat - rec) / fat) * 100;
};

export const calcTaxaRecebimento = (fat, rec) => {
  if (!fat || fat === 0) return 0;
  return (rec / fat) * 100;
};

export const getStatusFromGap = (gapPercent) => {
  if (gapPercent <= 0) return 'positivo';
  if (gapPercent < 20) return 'normal';
  if (gapPercent < 40) return 'atencao';
  return 'critico';
};

export const calcTendencia = (valores) => {
  if (!valores || valores.length < 2) return 'estavel';
  const primeiro = valores[0];
  const ultimo = valores[valores.length - 1];
  const variacao = ((ultimo - primeiro) / Math.abs(primeiro || 1)) * 100;
  if (variacao > 5) return 'piorando';
  if (variacao < -5) return 'melhorando';
  return 'estavel';
};

export const projetarFinalMes = (acumulado, diasPassados, diasNoMes = 31) => {
  if (!diasPassados) return 0;
  return acumulado + ((acumulado / diasPassados) * (diasNoMes - diasPassados));
};
```

### 20.4 Cores (utils/colors.js)

```javascript
export const COLORS = {
  primary: '#1E40AF',
  secondary: '#059669',
  danger: '#DC2626',
  warning: '#D97706',
  neutral: '#6B7280',
  background: '#F9FAFB',
  faturamento: '#3B82F6',
  recebimento: '#10B981',
  gap: '#EF4444',
  gapArea: 'rgba(239, 68, 68, 0.15)',
};

export const STATUS_COLORS = {
  positivo: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  normal:   { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  atencao:  { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  critico:  { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  sem_dados:{ bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' },
};
```

---

## 21. TEMPLATES DE PROMPTS DA IA

### 21.1 System Prompt Base

```
Você é o GF Gás Analyst, analista financeiro inteligente da GF Comércio
de Gás LTDA, distribuidora de GLP em Ilhéus-BA com 4 unidades:
ILHÉUS (GF + FM), ITABUNA (BS + VF), ITAPETINGA (F Carlos), CONQUISTA (V&F).

Analise faturamento vs recebimento. Valores em R$ formatados (R$ 31.186,03).
Seja DIRETO e ACIONÁVEL. Compare unidades. Identifique tendências.
Se dados insuficientes, diga claramente.
```

### 21.2 Prompt para Resumo Diário

```
DATA: {data}
DADOS DO DIA: {json}
ACUMULADO: {json}
ÚLTIMOS 7 DIAS: {json}

Gere: cenário geral, unidade pior, unidade melhor, tendência do gap,
ação concreta para amanhã, projeção final do mês.
Máximo 8 frases, texto corrido.
```

### 21.3 Prompt para Chat

```
DADOS: {json_todos_dados}
PERGUNTA: {pergunta}
HISTÓRICO: {historico}

Responda com números reais. Sugira 2-3 follow-ups úteis.
```

---

## 22. CHECKLIST FINAL

### MVP (Fase 1)
- [ ] React + Vite + Tailwind rodando na Vercel
- [ ] Supabase com tabelas, views, RLS, Realtime
- [ ] Login/logout funcional
- [ ] Dashboard com 4 cards, gráfico, tabela, ranking
- [ ] Lançamento funcional (faturamento + recebimento)
- [ ] Detalhamento por unidade com métricas
- [ ] Dados seed conferidos com planilha original
- [ ] Mobile responsivo

### Relatórios (Fase 2)
- [ ] 5 tipos de relatório otimizados para impressão A4
- [ ] Exportação PDF (jsPDF)

### IA (Fase 3)
- [ ] FastAPI + OpenAI API na VPS
- [ ] Chat IA web funcional
- [ ] Análise automática no dashboard e relatórios

### WhatsApp (Fase 4)
- [ ] Resumo diário automático 20h
- [ ] Alertas críticos imediatos
- [ ] Chat IA via WhatsApp

### PDF Parser (Fase 5)
- [ ] Parser reconhece relatórios Águia Web ERP
- [ ] Upload + conferência + salvamento

---

*Documento gerado em 22/03/2026. Versão 1.1 — Expandido com estrutura de projeto, contratos de API, deploy, instruções Gemini/Cursor (IA de Código), seed data, padrões de código e templates IA.*

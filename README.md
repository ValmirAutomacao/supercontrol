# SuperControl — GF Gas Control

Sistema de controle financeiro para redes de distribuição de gás, com dashboard executivo, ingestão de PDFs via IA e análise de gap entre faturamento e recebimento.

---

## Visão Geral

O SuperControl permite que gestores de redes de postos de gás acompanhem, em tempo real, o desempenho financeiro de cada unidade. O sistema processa automaticamente PDFs de fechamento de caixa e extratos bancários, extrai os dados via IA (GPT-4o) e consolida as informações em um painel interativo por unidade e pela rede como um todo.

**Funcionalidades principais:**
- Upload e parsing automático de PDFs de fechamento de caixa
- Upload e parsing de extratos bancários (Santander, Safra, Caixa, Sicoob) com OCR como fallback
- Extração estruturada de dados via GPT-4o
- Dashboard executivo com KPIs consolidados da rede
- Dashboard por unidade com análise de gap faturamento vs. recebimento
- Relatórios financeiros com exportação para PDF
- Configurações de unidades
- Análise de gap agendada automaticamente às 08h00 diariamente

---

## Arquitetura

```
supercontrol/
├── backend/          # API FastAPI (Python)
└── frontend/         # SPA React + TypeScript + Tailwind
```

O banco de dados e a autenticação são gerenciados pelo **Supabase**. O frontend se comunica diretamente com o Supabase para leitura de dados e com o backend FastAPI para ingestão de arquivos.

---

## Stack

| Camada      | Tecnologia                                                    |
|-------------|---------------------------------------------------------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS, Recharts, jsPDF    |
| Backend     | FastAPI, Uvicorn, APScheduler, pdfplumber, PyMuPDF, python-doctr |
| IA          | OpenAI GPT-4o (via API compatível)                            |
| Banco       | Supabase (PostgreSQL)                                         |
| Deploy      | Docker (backend), Vercel (frontend)                           |

---

## Pré-requisitos

- Python 3.12+
- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- Chave de API da OpenAI (ou endpoint compatível com a API OpenAI)

---

## Configuração

### Backend

1. Entre na pasta do backend:
   ```bash
   cd backend
   ```

2. Crie um arquivo `.env` com as seguintes variáveis:
   ```env
   SUPABASE_URL=https://<seu-projeto>.supabase.co
   SUPABASE_KEY=<sua-service-role-key>

   OPENAI_API_KEY=<sua-chave-openai>
   OPENAI_MODEL_NAME=gpt-4o          # opcional, padrão: gpt-4o
   OPENAI_BASE_URL=                  # opcional, para endpoints alternativos
   ```

3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

4. Suba o servidor:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend

1. Entre na pasta do frontend:
   ```bash
   cd frontend
   ```

2. Crie um arquivo `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
   VITE_SUPABASE_ANON_KEY=<sua-anon-key>
   ```

3. Instale as dependências e rode em modo desenvolvimento:
   ```bash
   npm install
   npm run dev
   ```

---

## Deploy

### Backend via Docker

```bash
cd backend
docker build -t supercontrol-api .
docker run -p 80:80 --env-file .env supercontrol-api
```

### Frontend via Vercel

O projeto já inclui `vercel.json` configurado. Basta conectar o repositório ao Vercel e definir as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no painel do projeto.

---

## API — Endpoints principais

| Método | Rota                    | Descrição                                                    |
|--------|-------------------------|--------------------------------------------------------------|
| GET    | `/`                     | Health check da API                                          |
| POST   | `/api/upload-pdf`       | Recebe PDF de fechamento de caixa e processa em background   |
| POST   | `/api/upload-extrato`   | Recebe extrato bancário PDF e extrai recebimentos            |
| POST   | `/api/webhook/uazapi`   | Webhook para integração com WhatsApp (uazapi)                |

### `POST /api/upload-pdf`

| Campo         | Tipo   | Descrição                             |
|---------------|--------|---------------------------------------|
| `file`        | File   | Arquivo PDF de fechamento de caixa    |
| `unidade_id`  | string | (Opcional) ID da unidade no Supabase  |

### `POST /api/upload-extrato`

| Campo            | Tipo   | Descrição                                        |
|------------------|--------|--------------------------------------------------|
| `file`           | File   | Arquivo PDF do extrato bancário                  |
| `unidade_id`     | string | ID da unidade no Supabase                        |
| `data_referencia`| string | Data de referência no formato `YYYY-MM-DD`       |
| `banco`          | string | (Opcional) Hint do banco: `santander`, `safra`, `caixa`, `sicoob` |

---

## Banco de Dados

O sistema utiliza as seguintes tabelas no Supabase:

- **`unidades`** — cadastro das unidades/filiais da rede
- **`lancamentos`** — registros financeiros com tipo (`faturamento` ou `recebimento`), valor, data e origem (`pdf_import` ou `extrato_bancario`)

---

## Parsing de Extratos Bancários

O módulo `extrato_parser.py` suporta extratos dos seguintes bancos:

- Santander
- Safra
- Caixa Econômica Federal
- Sicoob (com OCR via python-doctr como fallback para PDFs escaneados)

O parser aplica regras de negócio para ignorar transferências entre entidades internas do grupo (CNPJs configurados em `CNPJS_IGNORAR`), computando apenas os recebimentos externos líquidos do dia.

---

## Tarefas Agendadas

O backend utiliza APScheduler para executar análises automaticamente:

| Horário | Tarefa                                                  |
|---------|---------------------------------------------------------|
| 08h00   | Análise de gap por unidade e geração de alertas (em desenvolvimento) |

---

## Páginas do Frontend

| Rota              | Página           | Descrição                                      |
|-------------------|------------------|------------------------------------------------|
| `/login`          | Login            | Autenticação via Supabase Auth                 |
| `/dashboard`      | Dashboard        | KPIs executivos da rede                        |
| `/unit/:id`       | Unit Dashboard   | Desempenho individual de cada unidade          |
| `/reports`        | Reports          | Relatórios financeiros com exportação PDF      |
| `/data-ingestion` | Data Ingestion   | Upload de PDFs de caixa e extratos bancários   |
| `/settings`       | Settings         | Configurações de unidades                      |

---

## Contribuindo

1. Faça um fork do repositório
2. Crie uma branch para sua feature: `git checkout -b feat/minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: minha feature'`
4. Abra um Pull Request

---

## Licença

Projeto proprietário — © GF Automação. Todos os direitos reservados.

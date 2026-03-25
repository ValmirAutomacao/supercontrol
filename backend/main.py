from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi import Form
import uvicorn
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from database import supabase
from pdf_extractor import extract_invoice_data
from ai_agent import process_pdf_with_ai, analyze_gap_and_alert
from extrato_parser import parse_extrato

app = FastAPI(title="GF Gas Control API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup_event():
    # Setup scheduled tasks
    scheduler.add_job(scheduled_gap_analysis, 'cron', hour=8, minute=0)
    scheduler.start()
    print("Scheduler startado.")

async def scheduled_gap_analysis():
    # Exemplo: Rodar para a Unidade Ilhéus (ou buscar todas da tabela unidades)
    print("Rodando análise de Gaps agendada...")
    # await analyze_gap_and_alert(unidade_id="...")

@app.get("/")
def read_root():
    return {"status": "ok", "service": "GF Gas Control API"}

@app.post("/api/upload-pdf")
async def upload_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...), unidade_id: str = Form(None)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são permitidos.")
        
    # Read file content
    content = await file.read()
    
    # Process PDF asynchronously
    background_tasks.add_task(process_pdf_task, content, file.filename, unidade_id)
    
    return {"message": "PDF recebido e sendo processado em background", "filename": file.filename}

def process_pdf_task(pdf_content: bytes, filename: str, forced_unidade_id: str = None):
    try:
        raw_text = extract_invoice_data(pdf_content)
        if not raw_text:
            print(f"[{filename}] Sem texto extraível.")
            return
            
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        print(f"[{filename}] Extraindo dados financeiros com GPT-4o...", flush=True)
        data = loop.run_until_complete(process_pdf_with_ai(raw_text, filename))
        loop.close()
        
        if data:
            print(f"[{filename}] Sucesso na extração estruturada: {data}", flush=True)
            try:
                unidade_nome = data.get('unidade_nome', '')
                unidade_id = None
                
                if forced_unidade_id:
                    unidade_id = forced_unidade_id
                else:
                    # Try to find the correct Unit ID based on the name extracted
                    unidade_response = supabase.table('unidades').select('id, nome').ilike('nome', f"%{unidade_nome.split()[0]}%").execute()
                    if unidade_response.data and len(unidade_response.data) > 0:
                        unidade_id = unidade_response.data[0]['id']
                        
                if unidade_id:
                    data_ref = data.get('data_referencia')
                    faturamento = float(data.get('faturamento_total', 0))
                    recebimento = float(data.get('recebimento_total', 0))
                    
                    inserts = []
                    if faturamento > 0:
                        inserts.append({
                            "data": data_ref,
                            "unidade_id": unidade_id,
                            "tipo": "faturamento",
                            "valor": faturamento,
                            "origem": "pdf_import"
                        })
                    if recebimento > 0:
                        inserts.append({
                            "data": data_ref,
                            "unidade_id": unidade_id,
                            "tipo": "recebimento",
                            "valor": recebimento,
                            "origem": "pdf_import"
                        })
                        
                    if inserts:
                        res = supabase.table('lancamentos').insert(inserts).execute()
                        print(f"[{filename}] Lançamentos inseridos com sucesso no Supabase! {len(inserts)} registros para unidade {unidade_id}.", flush=True)
                else:
                    print(f"[{filename}] ERRO: Unidade '{unidade_nome}' não encontrada no banco de dados e nenhum ID forçado foi passado.", flush=True)
                    
            except Exception as e:
                print(f"[{filename}] Erro inserindo no Supabase: {e}", flush=True)
        else:
            print(f"[{filename}] Falha no parsing do JSON ou AI não retornou dados esperados.", flush=True)
            
    except Exception as e:
        print(f"Erro ao processar {filename}: {e}", flush=True)

@app.post("/api/upload-extrato")
async def upload_extrato(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    unidade_id: str = Form(...),
    data_referencia: str = Form(...),
    banco: str = Form(None)
):
    """Receive a bank statement PDF and parse it into recebimento lancamentos."""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são permitidos.")

    content = await file.read()
    background_tasks.add_task(
        process_extrato_task, content, file.filename, unidade_id, data_referencia, banco
    )
    return {"message": "Extrato recebido e sendo processado", "filename": file.filename}


def process_extrato_task(
    pdf_bytes: bytes,
    filename: str,
    unidade_id: str,
    data_referencia: str,
    banco: str = None
):
    """Background task: parse the bank statement and save to Supabase."""
    print(f"[extrato] Iniciando parse de '{filename}' para unidade {unidade_id}", flush=True)
    try:
        result = parse_extrato(pdf_bytes, filename, banco_hint=banco)
        total = result["total_recebido"]
        banco_detectado = result["banco"]

        if total > 0:
            record = {
                "data": data_referencia,
                "unidade_id": unidade_id,
                "tipo": "recebimento",
                "valor": total,
                "origem": "extrato_bancario",
                "banco": banco_detectado,
                "origem_detalhe": f"extrato {banco_detectado} {filename}",
            }
            res = supabase.table("lancamentos").insert(record).execute()
            print(f"[extrato] '{filename}' inserido: R${total:.2f} ({banco_detectado})", flush=True)
        else:
            print(f"[extrato] '{filename}' sem entradas válidas após filtros.", flush=True)
    except Exception as e:
        print(f"[extrato] Erro ao processar '{filename}': {e}", flush=True)


@app.post("/api/webhook/uazapi")
async def webhook_uazapi(payload: dict):
    return {"status": "received"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

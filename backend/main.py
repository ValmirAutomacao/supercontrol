from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from database import supabase
from pdf_extractor import extract_invoice_data
from ai_agent import process_pdf_with_ai, analyze_gap_and_alert

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
async def upload_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são permitidos.")
        
    # Read file content
    content = await file.read()
    
    # Process PDF asynchronously
    background_tasks.add_task(process_pdf_task, content, file.filename)
    
    return {"message": "PDF recebido e sendo processado em background", "filename": file.filename}

def process_pdf_task(pdf_content: bytes, filename: str):
    try:
        raw_text = extract_invoice_data(pdf_content)
        if not raw_text:
            print(f"[{filename}] Sem texto extraível.")
            return
            
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        print(f"[{filename}] Extraindo dados financeiros com GPT-4o...")
        data = loop.run_until_complete(process_pdf_with_ai(raw_text, filename))
        loop.close()
        
        if data:
            print(f"[{filename}] Sucesso na extração estruturada: {data}")
            #TODO: Inserts no Supabase com formatação correta.
        else:
            print(f"[{filename}] Falha no parsing do JSON.")
            
    except Exception as e:
        print(f"Erro ao processar {filename}: {e}")

@app.post("/api/webhook/uazapi")
async def webhook_uazapi(payload: dict):
    return {"status": "received"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

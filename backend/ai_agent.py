import os
import json
from openai import AsyncOpenAI
from database import supabase

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY", "placeholder"))

async def process_pdf_with_ai(raw_text: str, filename: str):
    """
    Usa o GPT-4o para processar o texto extraído do PDF e estruturar os dados.
    """
    prompt = f"""
    Você é um especialista em análise de relatórios financeiros de fechamento de caixa de distribuição de gás.
    Extraia as seguintes informações do texto do relatório PDF abaixo:
    1. faturamento_total: O valor total vendido/faturado no dia (número float).
    2. recebimento_total: O valor efetivamente recebido/em caixa no dia (número float).
    3. data_referencia: A data do relatório no formato YYYY-MM-DD.
    4. unidade_nome: O nome da unidade ou filial.
    
    Retorne APENAS um JSON válido com essas chaves.
    
    Texto do PDF:
    {raw_text}
    """
    
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.1
    )
    
    result_text = response.choices[0].message.content
    try:
        data = json.loads(result_text)
        return data
    except Exception as e:
        print(f"Erro ao parsear JSON da OpenAI: {e}")
        return None

async def analyze_gap_and_alert(unidade_id: str):
    """
    Analisa os dados de gap usando GPT-4o e decide sobre o envio de alertas.
    """
    pass

import pdfplumber
import io

def extract_invoice_data(pdf_content: bytes) -> str:
    """
    Extrai o texto completo do PDF para envio ao LLM (abordagem iterativa e robusta).
    Focamos nas últimas páginas onde o resumo financeiro costuma ficar.
    """
    extracted_text = []
    
    with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
        if len(pdf.pages) == 0:
            return ""
            
        # Pega as duas últimas páginas para garantir que temos o resumo
        pages_to_extract = pdf.pages[-2:] if len(pdf.pages) >= 2 else pdf.pages
        
        for page in pages_to_extract:
            text = page.extract_text()
            if text:
                extracted_text.append(text)
                
    return "\n".join(extracted_text)

"""
extrato_parser.py
Parses bank statement PDFs (Santander, Safra, Caixa, Sicoob) and applies
the business filtering rules to compute net received cash for that day.
"""

import re
import pdfplumber
from io import BytesIO

# CNPJs of internal entities to IGNORE when parsing PIX RECEBIDO
CNPJS_IGNORAR = {
    "04365786000100",   # GF Comercio de Gas
    "18711529000189",   # BS Itabuna
    "07789412000100",
    "20727198000117",
    "02088504000130",
    "15463611000143",   # Comercial V&F
    "12997269000173",
}

def _clean_cnpj(text: str) -> str:
    """Remove dots, dashes and slashes from CNPJ/CPF string."""
    return re.sub(r'[\.\-/]', '', text)


def _extract_text_pdfplumber(pdf_bytes: bytes) -> str:
    """Try to extract text via pdfplumber (works for digital PDFs)."""
    try:
        with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
            all_text = ""
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    all_text += t + "\n"
        return all_text.strip()
    except Exception as e:
        print(f"[extrato_parser] pdfplumber failed: {e}", flush=True)
        return ""


def _extract_text_ocr(pdf_bytes: bytes) -> str:
    """
    OCR fallback using python-doctr for scanned PDFs (e.g. Sicoob).
    Converts PDF pages to images then runs detection + recognition.
    """
    try:
        import fitz  # pymupdf
        from doctr.io import DocumentFile
        from doctr.models import ocr_predictor

        model = ocr_predictor(pretrained=True)
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        all_text = ""

        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            mat = fitz.Matrix(2, 2)  # 2x zoom for better OCR quality
            pix = page.get_pixmap(matrix=mat)
            img_bytes = pix.tobytes("png")

            # doctr processes image bytes
            from doctr.io import DocumentFile
            doctr_doc = DocumentFile.from_images([img_bytes])
            result = model(doctr_doc)
            page_text = result.render()
            all_text += page_text + "\n"

        return all_text.strip()
    except Exception as e:
        print(f"[extrato_parser] doctr OCR failed: {e}", flush=True)
        return ""


def detect_banco(filename: str, banco_hint: str = None) -> str:
    """Detect the bank from filename prefix or use provided hint."""
    if banco_hint and banco_hint.strip():
        return banco_hint.strip().lower()

    fname = filename.lower()
    if "santander" in fname:
        return "santander"
    elif "safra" in fname:
        return "safra"
    elif "caixa" in fname:
        return "caixa"
    elif "sicoob" in fname:
        return "sicoob"
    elif "itau" in fname:
        return "itau"
    elif "bradesco" in fname:
        return "bradesco"
    else:
        return "desconhecido"


def _parse_value(value_str: str) -> float:
    """Convert Brazilian currency string to float."""
    v = value_str.strip()
    # Remove thousand separators, replace decimal comma
    v = v.replace(".", "").replace(",", ".")
    try:
        return float(v)
    except ValueError:
        return 0.0


def _has_ignored_cnpj(line: str) -> bool:
    """Check if a line contains a CNPJ from the ignore list."""
    # Find any sequence that looks like a CNPJ (14 digits)
    cnpj_matches = re.findall(r'\b(\d{14})\b', line.replace(".", "").replace("-", "").replace("/", ""))
    for cnpj in cnpj_matches:
        if cnpj in CNPJS_IGNORAR:
            return True

    # Also check formatted CNPJs in text
    formatted_matches = re.findall(r'\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}', line)
    for cnpj in formatted_matches:
        cleaned = _clean_cnpj(cnpj)
        if cleaned in CNPJS_IGNORAR:
            return True

    return False


def _is_value_in_parens(value_str: str) -> bool:
    """Check if a value string is between parentheses (indicates negative/write-off)."""
    v = value_str.strip()
    return v.startswith("(") and v.endswith(")")


def parse_santander(text: str) -> float:
    """
    Parse Santander bank statement text.
    Format: DATE DESCRIPTION CNPJ/DOC DOC VALUE
    Positive values = credit (entrada), negative = debit
    """
    total = 0.0
    for line in text.splitlines():
        line_upper = line.upper()

        # Skip irrelevant lines
        if not any(k in line_upper for k in [
            "PIX RECEBIDO", "PAGAMENTO CARTAO", "PAGTO CART",
            "GETNET", "GETN", "CR ANT", "ANTECIP"
        ]):
            continue

        # Skip ignored CNPJs
        if _has_ignored_cnpj(line):
            continue

        # Skip PIX ENVIADO (saída)
        if "PIX ENVIADO" in line_upper:
            continue

        # Skip CRED TEV / CRED PIX
        if "CRED PIX" in line_upper or "CRED TEV" in line_upper:
            continue

        # Skip RESGATE / APLICACAO
        if "RESGATE" in line_upper or "APLICACAO" in line_upper:
            continue

        # Skip TARIFA lines (fees)
        if "TARIFA" in line_upper:
            continue

        # Find value: last number in line (possibly after lots of spaces)
        # Values are like: 115,00 or 17.500,00 or -7,31
        value_matches = re.findall(r'-?[\d\.]+,\d{2}', line)
        if value_matches:
            last_val = value_matches[-1]
            if _is_value_in_parens(last_val):
                continue
            val = _parse_value(last_val)
            if val > 0:
                total += val
                print(f"[Santander] +{val:.2f} <- {line.strip()[:80]}", flush=True)

    return total


def parse_safra(text: str) -> float:
    """
    Parse Safra bank statement text.
    Format: DATE description COMPLEMENTO doc_num value
    """
    total = 0.0
    for line in text.splitlines():
        line_upper = line.upper()

        # Lines we want to count
        is_pix = "PIX RECEBIDO" in line_upper
        is_antecip = "ANTECIPACAO RV" in line_upper or "CR ANT" in line_upper
        is_card = ("RESUMO VENDAS CARTAO DEBITO" in line_upper or
                   "PAGAMENTO CARTAO" in line_upper)

        if not (is_pix or is_antecip or is_card):
            continue

        # Skip PIX RECEBIDO from blocked CNPJs (also check prev line for CNPJ)
        if is_pix and _has_ignored_cnpj(line):
            continue

        # Skip CRED PIX / CRED TEV
        if "CRED PIX" in line_upper or "CRED TEV" in line_upper:
            continue

        # Skip RESGATE CDB
        if "RESGATE" in line_upper:
            continue

        # Skip TARIFA lines
        if "TARIFA" in line_upper:
            continue

        # Skip negative values / values in parens
        value_matches = re.findall(r'-?[\d\.]+,\d{2}', line)
        if value_matches:
            last_val = value_matches[-1]
            if _is_value_in_parens(last_val):
                continue
            val = _parse_value(last_val)
            if val > 0:
                total += val
                print(f"[Safra] +{val:.2f} <- {line.strip()[:80]}", flush=True)

    return total


def parse_caixa(text: str) -> float:
    """
    Parse Caixa Econômica Federal bank statement text.
    Format: DATE DOC HIST VALUE C/D SALDO
    C = credit (entrada), D = debit (saída)

    Key mappings:
    - GETN MC CC / GETN VS CC / GETN EL CC = cartão (count)
    - DP DIN ATM / DP DIN LOT = depósito dinheiro (count)
    - CRED PIX = ignore
    - PIX ENVIADO = ignore
    """
    total = 0.0
    for line in text.splitlines():
        line_upper = line.upper()

        is_cartao = any(k in line_upper for k in [
            "GETN MC", "GETN VS", "GETN EL", "AZCX MC", "AZCX VS",
            "PAGAMENTO CARTAO", "PGT CART",
        ])
        is_deposito = any(k in line_upper for k in [
            "DP DIN ATM", "DP DIN LOT", "DEP DINHEIRO ATM",
            "DEP DIN ATM", "DEP DIN LOT",
        ])
        is_pix_recebido = "PIX RECEBIDO" in line_upper or "CRED PIX" in line_upper

        # Only process credit lines we care about
        if not (is_cartao or is_deposito or is_pix_recebido):
            continue

        # Ignore CRED PIX (internal transfers via PIX)
        if "CRED PIX" in line_upper:
            continue

        # Ignore PIX ENVIADO
        if "PIX ENVIADO" in line_upper:
            continue

        # Ignore internal CNPJs
        if _has_ignored_cnpj(line):
            continue

        # Skip TARIFA
        if "TARIFA" in line_upper:
            continue

        # In Caixa format "C" before saldo means credit
        # Check for pattern: VALUE C SALDO
        # Extract all numeric values
        value_matches = re.findall(r'([\d\.]+,\d{2})\s+C\b', line)
        if value_matches:
            val = _parse_value(value_matches[0])
            if val > 0:
                total += val
                print(f"[Caixa] +{val:.2f} <- {line.strip()[:80]}", flush=True)
        else:
            # Fallback: grab last positive numeric value if line clearly credit
            plain_values = re.findall(r'(?<!\-)([\d\.]+,\d{2})', line)
            if plain_values and (is_cartao or is_deposito):
                val = _parse_value(plain_values[0])
                if 0 < val < 100000:  # sanity check
                    total += val
                    print(f"[Caixa-fallback] +{val:.2f} <- {line.strip()[:80]}", flush=True)

    return total


def parse_sicoob(text: str) -> float:
    """
    Parse Sicoob bank statement (OCR output).
    Apply similar PIX RECEBIDO logic.
    """
    return parse_santander(text)  # Sicoob format is similar to Santander


PARSERS = {
    "santander": parse_santander,
    "safra": parse_safra,
    "caixa": parse_caixa,
    "sicoob": parse_sicoob,
}


def parse_extrato(pdf_bytes: bytes, filename: str, banco_hint: str = None) -> dict:
    """
    Main entry point. Returns dict with:
    - banco: detected bank name
    - total_recebido: sum of valid receipts
    - raw_text: extracted text (for debugging)
    """
    banco = detect_banco(filename, banco_hint)
    print(f"[extrato_parser] Processing '{filename}' as banco='{banco}'", flush=True)

    # Try text extraction
    text = _extract_text_pdfplumber(pdf_bytes)

    # If not enough text, do OCR
    if len(text) < 100:
        print(f"[extrato_parser] Text too short ({len(text)} chars), trying OCR...", flush=True)
        text = _extract_text_ocr(pdf_bytes)

    if not text:
        print(f"[extrato_parser] Could not extract text from '{filename}'", flush=True)
        return {"banco": banco, "total_recebido": 0.0, "raw_text": ""}

    parser_fn = PARSERS.get(banco, parse_santander)
    total = parser_fn(text)

    print(f"[extrato_parser] '{filename}' total_recebido={total:.2f}", flush=True)
    return {
        "banco": banco,
        "total_recebido": total,
        "raw_text": text[:2000],  # truncate for logging
    }

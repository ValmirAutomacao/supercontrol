import pdfplumber

def main():
    path = "../PDFs exemplo/Resumo das vendas do dia_010326.pdf"
    print(f"Reading: {path}")
    try:
        with pdfplumber.open(path) as pdf:
            print(f"Total pages: {len(pdf.pages)}")
            for i, page in enumerate(pdf.pages):
                print(f"--- Page {i+1} ---")
                text = page.extract_text()
                print(text)
                
                # Also try to extract tables for precision
                tables = page.extract_tables()
                if tables:
                    print("--- Extracted Tables ---")
                    for t in tables:
                        print(t)
    except Exception as e:
        print(f"Erro ao ler PDF: {e}")

if __name__ == "__main__":
    main()

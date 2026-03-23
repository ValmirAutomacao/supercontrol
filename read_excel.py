import pandas as pd
import json

try:
    df = pd.read_excel('Aguia.xlsx', sheet_name=None)
    for sheet_name, sheet_df in df.items():
        print(f"--- Sheet: {sheet_name} ---")
        print(sheet_df.head(20).to_string())
        print("\n")
except Exception as e:
    print(f"Error reading Excel: {e}")

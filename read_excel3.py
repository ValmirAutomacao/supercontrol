import pandas as pd
df = pd.read_excel('Aguia.xlsx', sheet_name=None, header=None)
for k, v in df.items():
    print(f"--- Sheet: {k} ---")
    print(v.head(10).to_csv(index=False))

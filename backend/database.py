import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL") or "http://localhost:54321"
key: str = os.environ.get("SUPABASE_KEY") or "placeholder-key"

def get_supabase() -> Client:
    if not url or not key:
        raise ValueError("SUPABASE_URL e SUPABASE_KEY não configurados")
    return create_client(url, key)

supabase = get_supabase()

import os
import sys
from dotenv import load_dotenv

load_dotenv()
load_dotenv('backend/.env')

def run_migrations():
    """Apply Stage 1, Stage 2, and Stage 3 migrations to live Supabase Postgres."""
    db_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or os.getenv("SUPABASE_DB_URL")
    
    # 1. Read consolidated schema
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    seed_path = os.path.join(os.path.dirname(__file__), "seed.sql")
    
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    
    seed_sql = ""
    if os.path.exists(seed_path):
        with open(seed_path, "r", encoding="utf-8") as f:
            seed_sql = f.read()

    if db_url:
        try:
            import psycopg2
            print(f"[Migration] Connecting to live PostgreSQL database...")
            conn = psycopg2.connect(db_url)
            conn.autocommit = True
            with conn.cursor() as cur:
                print("[Migration] Applying schema.sql (Stage 1, 2, 3)...")
                cur.execute(schema_sql)
                print("[Migration] ✓ Schema applied successfully.")
                if seed_sql:
                    print("[Migration] Applying seed.sql...")
                    cur.execute(seed_sql)
                    print("[Migration] ✓ Seed data applied successfully.")
            conn.close()
            print("[Migration] ALL MIGRATIONS COMPLETED SUCCESSFULLY.")
            return True
        except ImportError:
            print("[Migration] psycopg2 not installed. Install via: pip install psycopg2-binary")
        except Exception as e:
            print(f"[Migration] Database execution error: {e}")
            return False
    else:
        print("[Migration] Notice: DATABASE_URL not found in environment.")
        print("[Migration] To apply schema directly via Supabase Dashboard:")
        print("  1. Open your Supabase Dashboard -> SQL Editor.")
        print(f"  2. Paste contents of: {schema_path}")
        print("  3. Click 'Run' to apply Stage 1, Stage 2, and Stage 3 schema.")
        return False

if __name__ == "__main__":
    run_migrations()

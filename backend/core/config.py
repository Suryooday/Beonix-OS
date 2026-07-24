import os
from pathlib import Path

# ─── Load .env file if present (for local development) ──────
# In production, env vars are set by the hosting platform
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path)
    except ImportError:
        # python-dotenv not installed — read manually
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    os.environ.setdefault(key.strip(), value.strip())

# ─── Database Configuration ─────────────────────────────────
# Priority: DATABASE_URL env var → SQLite fallback
DATABASE_DIR = os.path.join("beonix_data", "sqlite")
os.makedirs(DATABASE_DIR, exist_ok=True)
DATABASE_FILE = "beonix.db"
DATABASE_PATH = os.path.join(DATABASE_DIR, DATABASE_FILE)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH}")

# Render & Railway connection strings often start with 'postgres://'
# SQLAlchemy requires 'postgresql://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# ─── Supabase Project Keys (for future frontend direct access) ──
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# ─── Groq API Key (for Whisper transcription + LLM) ─────────
GROQ_API_KEY = os.getenv("grok", "")


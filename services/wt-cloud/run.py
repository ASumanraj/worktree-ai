"""WorkTree AI Cloud Core runner.
Loads port configuration from root or local .env and runs uvicorn.
"""

import os
import sys
from pathlib import Path

# Add current directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))


def load_env_file(env_path: Path):
    if not env_path.exists():
        return
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip().strip("'\"")
            if k not in os.environ:
                os.environ[k] = v


# 1. Safely locate and load .env from current directory or any ancestor
current_file = Path(__file__).resolve()
load_env_file(current_file.parent / ".env")
for parent_dir in current_file.parents:
    load_env_file(parent_dir / ".env")

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("WT_CLOUD_PORT", os.environ.get("PORT", 8000)))
    host = os.environ.get("WT_CLOUD_HOST", "0.0.0.0")

    print(f"\n==================================================")
    print(f"🚀 Starting WorkTree AI Cloud API on port {port}")
    print(f"   Docs:   http://localhost:{port}/docs")
    print(f"   Health: http://localhost:{port}/health")
    print(f"==================================================\n")

    uvicorn.run("app.main:app", host=host, port=port, reload=True)

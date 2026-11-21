#!/usr/bin/env python3
"""Run the live registration, authenticator and session checks."""
from pathlib import Path
from runpy import run_path

if __name__ == "__main__":
    run_path(str(Path(__file__).resolve().parents[1] / "tests" / "verify_auth_live.py"), run_name="__main__")

#!/usr/bin/env python3
"""Run the authenticated HTTP and CSRF checks through the local web proxy."""
from pathlib import Path
from runpy import run_path

if __name__ == "__main__":
    run_path(str(Path(__file__).resolve().parents[1] / "tests" / "verify_modular_http.py"), run_name="__main__")

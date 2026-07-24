import os
import pandas as pd
from typing import List, Dict, Any, Tuple

class FileImportService:
    @staticmethod
    def validate_file(file_path: str) -> bool:
        """Validates that the file exists, is non-empty, and has a supported extension."""
        if not os.path.exists(file_path):
            return False
        if os.path.getsize(file_path) == 0:
            return False
        ext = os.path.splitext(file_path)[1].lower()
        return ext in [".csv", ".xlsx", ".xls"]

    @staticmethod
    def parse_spreadsheet(file_path: str) -> Tuple[List[str], List[Dict[str, Any]]]:
        """Parses CSV/Excel files using pandas and returns columns and row dicts."""
        if not FileImportService.validate_file(file_path):
            raise ValueError("Invalid, missing, or corrupted spreadsheet file.")

        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".csv":
            try:
                df = pd.read_csv(file_path, encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(file_path, encoding="latin1")
        else:
            engine = "openpyxl" if ext == ".xlsx" else "xlrd"
            df = pd.read_excel(file_path, engine=engine)

        # Sanitize NaNs for JSON
        df = df.fillna("")

        columns = [str(col).strip() for col in df.columns]
        # Clean dict keys to strip whitespace
        rows = []
        for r in df.to_dict(orient="records"):
            clean_r = {str(k).strip(): v for k, v in r.items()}
            rows.append(clean_r)

        return columns, rows

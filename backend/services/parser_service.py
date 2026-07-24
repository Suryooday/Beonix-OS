import os
import re

class ParserService:
    def extract_pdf_text(self, path: str) -> str:
        """Extracts text page-by-page from a PDF file using pypdf."""
        import pypdf
        reader = pypdf.PdfReader(path)
        pages_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages_text.append(text)
        return "\n\n".join(pages_text)

    def extract_docx_text(self, path: str) -> str:
        """Extracts paragraphs from a DOCX file using python-docx."""
        import docx
        doc = docx.Document(path)
        return "\n\n".join([p.text for p in doc.paragraphs if p.text.strip()])

    def extract_txt_text(self, path: str) -> str:
        """Reads raw content of a plain text file."""
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    def extract_text(self, path: str) -> str:
        """
        Dispatches file to correct extractor, cleans whitespace,
        and returns the consolidated document text.
        """
        ext = os.path.splitext(path.lower())[1]
        raw_text = ""
        if ext == ".pdf":
            raw_text = self.extract_pdf_text(path)
        elif ext == ".docx":
            raw_text = self.extract_docx_text(path)
        elif ext == ".txt":
            raw_text = self.extract_txt_text(path)
        else:
            raise ValueError(f"Unsupported file format for text extraction: {ext}")

        # Clean duplicate spaces and multiple blank lines
        cleaned = re.sub(r" +", " ", raw_text)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        return cleaned.strip()

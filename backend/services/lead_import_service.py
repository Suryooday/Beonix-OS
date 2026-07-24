from sqlalchemy.orm import Session
from datetime import datetime, timezone
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

from backend.models.lead import Lead
from backend.models.activity import Activity
from backend.models.import_job import ImportJob
from backend.services.duplicate_service import DuplicateService
from backend.services.scoring_service import ScoringService

class LeadSourceConnector(ABC):
    @abstractmethod
    def fetch_leads(self, **kwargs) -> List[Dict[str, Any]]:
        """Abstract connector interface for Meta, LinkedIn, Google Ads sources."""
        pass

class LeadImportService:
    @staticmethod
    def import_rows(job_id: int, rows: List[Dict[str, Any]], field_mapping: Dict[str, str], dup_action: str, db: Session) -> ImportJob:
        """Processes raw rows, resolves duplicate options, and updates lead tables."""
        job = db.query(ImportJob).filter(ImportJob.id == job_id).first()
        if not job:
            raise ValueError(f"ImportJob {job_id} not found.")

        job.status = "processing"
        job.total_rows = len(rows)
        db.commit()

        imported = 0
        duplicates = 0
        failed = 0

        # Helper mapper helper
        def get_mapped_value(r_dict: dict, target_field: str) -> str:
            for raw_col, mapped_to in field_mapping.items():
                if mapped_to == target_field:
                    val = r_dict.get(raw_col, "")
                    return str(val).strip()
            return ""

        scoring_service = ScoringService()

        for row in rows:
            name = get_mapped_value(row, "name")
            email = get_mapped_value(row, "email")
            phone = get_mapped_value(row, "phone")
            company = get_mapped_value(row, "company")

            if not name or not email:
                failed += 1
                continue

            # Duplicate Check
            dup_lead = DuplicateService.detect_duplicate(email, phone, company, db)

            if dup_lead:
                duplicates += 1
                if dup_action == "skip":
                    continue
                elif dup_action == "update":
                    dup_lead.name = name
                    dup_lead.phone = phone
                    dup_lead.company = company
                    dup_lead.imported_at = datetime.now(timezone.utc)
                    dup_lead.source = "Spreadsheet Import"
                    
                    act = Activity(
                        lead_id=dup_lead.id,
                        type="System",
                        content=f"Lead details updated via bulk import job #{job_id}."
                    )
                    db.add(act)
                    db.commit()

                    # Scoring trigger (graceful try/except fallback)
                    try:
                        scoring_service.score_lead(db, dup_lead.id)
                    except Exception:
                        pass
                    
                    imported += 1
                else:  # Create New regardless of duplicate matching
                    new_lead = Lead(
                        name=name,
                        email=email,
                        phone=phone,
                        company=company,
                        source="Spreadsheet Import",
                        imported_at=datetime.now(timezone.utc)
                    )
                    db.add(new_lead)
                    db.commit()
                    db.refresh(new_lead)

                    act = Activity(
                        lead_id=new_lead.id,
                        type="System",
                        content=f"Duplicate lead created via bulk import job #{job_id}."
                    )
                    db.add(act)
                    db.commit()

                    try:
                        scoring_service.score_lead(db, new_lead.id)
                    except Exception:
                        pass

                    imported += 1
            else:
                # No duplicate found -> Create new lead
                new_lead = Lead(
                    name=name,
                    email=email,
                    phone=phone,
                    company=company,
                    source="Spreadsheet Import",
                    imported_at=datetime.now(timezone.utc)
                )
                db.add(new_lead)
                db.commit()
                db.refresh(new_lead)

                act = Activity(
                    lead_id=new_lead.id,
                    type="System",
                    content=f"New lead imported via bulk job #{job_id}."
                )
                db.add(act)
                db.commit()

                try:
                    scoring_service.score_lead(db, new_lead.id)
                except Exception:
                    pass

                imported += 1

        job.imported_rows = imported
        job.duplicate_rows = duplicates
        job.failed_rows = failed
        job.status = "completed"
        db.commit()
        db.refresh(job)
        return job

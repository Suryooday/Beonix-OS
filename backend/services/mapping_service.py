from typing import List, Dict

class MappingService:
    @staticmethod
    def suggest_mapping(headers: List[str]) -> Dict[str, str]:
        """Fuzzy detects suggested field mappings based on header patterns."""
        mappings = {}

        patterns = {
            "name": ["name", "full_name", "full name", "customer_name", "client_name", "customer", "client", "lead name", "lead_name"],
            "email": ["email", "email_address", "contact_email", "email address", "contact email", "mail", "contact mail"],
            "phone": ["phone", "mobile", "phone_number", "contact_number", "phone number", "contact number", "mobile number", "mobile_number"],
            "company": ["company", "company_name", "organization", "company name", "org"]
        }

        for header in headers:
            normalized = str(header).strip().lower()
            mapped = None

            # Check matches
            for target, synonyms in patterns.items():
                if normalized in synonyms or any(syn in normalized for syn in synonyms):
                    mapped = target
                    break

            if mapped:
                mappings[header] = mapped

        return mappings

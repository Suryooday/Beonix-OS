export interface Activity {
  id: number;
  lead_id: number;
  type: string;
  content: string;
  timestamp: string;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  company: string | null;
  phone?: string | null;
  source?: string;
  source_platform?: string | null;
  source_campaign?: string | null;
  imported_at?: string | null;
  manual_review?: string | null;
  talking_points?: string | null;
  stage: string;
  score: number;
  priority?: string;
  score_reasoning?: string | null;
  created_at: string;
}

export interface Transcript {
  id: number;
  lead_id: number | null;
  filename: string;
  transcript_text: string;
  duration_seconds: number;
  created_at: string;
}

export interface LeadDetail extends Lead {
  activities: Activity[];
  transcripts?: Transcript[];
}

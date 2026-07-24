import { Lead, LeadDetail, Activity } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Standard mock data to initialize when API is offline
const INITIAL_MOCK_LEADS: LeadDetail[] = [
  {
    id: 101,
    name: "Sarah Jenkins",
    email: "sarah.j@techcorp.io",
    company: "TechCorp Solutions",
    stage: "New",
    score: 92,
    priority: "High",
    score_reasoning: JSON.stringify({
      urgency: { score: 9, reason: "Wants to implement CRM sync before new sales quarter starts." },
      budget_signal: { score: 9, reason: "Budget allocated for CRM optimization." },
      decision_maker: { score: 9, reason: "VP of Operations is key evaluator." },
      engagement: { score: 10, reason: "Replied within hours to integration docs." },
      sentiment: { score: 9, reason: "Very enthusiastic about automation triggers." }
    }),
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    activities: [
      {
        id: 201,
        lead_id: 101,
        type: "System",
        content: "Lead created automatically via Web Ingestion API.",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    ]
  },
  {
    id: 102,
    name: "Marcus Vance",
    email: "m.vance@apexfinance.com",
    company: "Apex Finance",
    stage: "Contacted",
    score: 45,
    priority: "Medium",
    score_reasoning: JSON.stringify({
      urgency: { score: 4, reason: "Evaluating for next fiscal year implementation." },
      budget_signal: { score: 5, reason: "Asked general pricing range questions." },
      decision_maker: { score: 4, reason: "Mid-level analyst researching options." },
      engagement: { score: 5, reason: "Initial call done but slow follow up." },
      sentiment: { score: 6, reason: "Polite but cautious tone." }
    }),
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    activities: [
      {
        id: 202,
        lead_id: 102,
        type: "System",
        content: "Lead initialized from bulk import.",
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 203,
        lead_id: 102,
        type: "Call",
        content: "Initial discovery call completed. Marcus expressed interest in our automation integrations.",
        timestamp: new Date(Date.now() - 3600000 * 22).toISOString(),
      }
    ]
  },
  {
    id: 103,
    name: "Elena Rostova",
    email: "elena@bio-labs.org",
    company: "BioLabs Global",
    stage: "Qualified",
    score: 95,
    priority: "High",
    score_reasoning: JSON.stringify({
      urgency: { score: 10, reason: "Urgent need to sanitize and index HIPAA data." },
      budget_signal: { score: 9, reason: "Explicit budget available for medical text ingestion." },
      decision_maker: { score: 9, reason: "Head of Biotech Informatics is leading setup." },
      engagement: { score: 9, reason: "Provided details on target embedding dimensions." },
      sentiment: { score: 10, reason: "Highly cooperative and eager." }
    }),
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    activities: [
      {
        id: 204,
        lead_id: 103,
        type: "System",
        content: "Lead captured via marketing brochure download.",
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
      {
        id: 205,
        lead_id: 103,
        type: "Stage Change",
        content: "Lead stage transitioned from 'New' to 'Contacted'.",
        timestamp: new Date(Date.now() - 3600000 * 46).toISOString(),
      },
      {
        id: 206,
        lead_id: 103,
        type: "Stage Change",
        content: "Lead stage transitioned from 'Contacted' to 'Qualified'.",
        timestamp: new Date(Date.now() - 3600000 * 45).toISOString(),
      }
    ]
  },
  {
    id: 104,
    name: "David Chen",
    email: "david@skyline.dev",
    company: "Skyline Dev Group",
    stage: "Proposal",
    score: 65,
    priority: "Medium",
    score_reasoning: JSON.stringify({
      urgency: { score: 7, reason: "Wants proposal reviewed by end of month." },
      budget_signal: { score: 6, reason: "Requested standard pricing breakdown." },
      decision_maker: { score: 6, reason: "Technical Lead with influence on selection." },
      engagement: { score: 7, reason: "Responsive on technical parameters." },
      sentiment: { score: 7, reason: "Constructive feedback on proposal features." }
    }),
    created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
    activities: [
      {
        id: 207,
        lead_id: 104,
        type: "System",
        content: "Lead created via inbound email enquiry.",
        timestamp: new Date(Date.now() - 3600000 * 120).toISOString(),
      },
      {
        id: 208,
        lead_id: 104,
        type: "Proposal",
        content: "Sent customized pricing proposal for Enterprise Tier plan.",
        timestamp: new Date(Date.now() - 3600000 * 115).toISOString(),
      }
    ]
  },
  {
    id: 105,
    name: "Rachel Green",
    email: "rachel@ralphlauren.com",
    company: "Ralph Lauren Corp",
    stage: "Closed",
    score: 25,
    priority: "Low",
    score_reasoning: JSON.stringify({
      urgency: { score: 2, reason: "No active plans to replace current CRM system." },
      budget_signal: { score: 3, reason: "Expressed concern on price per seat metrics." },
      decision_maker: { score: 2, reason: "Associate intern compiling market lists." },
      engagement: { score: 3, reason: "Very short answers and single email reply." },
      sentiment: { score: 4, reason: "Neutral and distant tone." }
    }),
    created_at: new Date(Date.now() - 3600000 * 200).toISOString(),
    activities: [
      {
        id: 209,
        lead_id: 105,
        type: "System",
        content: "Lead created via direct partner link.",
        timestamp: new Date(Date.now() - 3600000 * 200).toISOString(),
      },
      {
        id: 210,
        lead_id: 105,
        type: "Stage Change",
        content: "Lead stage transitioned from 'Proposal' to 'Closed' (Won). Contract signed.",
        timestamp: new Date(Date.now() - 3600000 * 190).toISOString(),
      }
    ]
  }
];

// Helper to interact with browser local storage for fallback persistence
const isBrowser = typeof window !== "undefined";

function getLocalMockLeads(): LeadDetail[] {
  if (!isBrowser) return INITIAL_MOCK_LEADS;
  const stored = localStorage.getItem("beonix_mock_leads");
  if (!stored) {
    localStorage.setItem("beonix_mock_leads", JSON.stringify(INITIAL_MOCK_LEADS));
    return INITIAL_MOCK_LEADS;
  }
  return JSON.parse(stored);
}

function saveLocalMockLeads(leads: LeadDetail[]) {
  if (isBrowser) {
    localStorage.setItem("beonix_mock_leads", JSON.stringify(leads));
  }
}

const INITIAL_MOCK_DOCUMENTS = [
  {
    id: 1,
    filename: "sales_playbook.pdf",
    document_type: "pdf",
    file_size: 154200,
    uploaded_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    chunk_count: 45,
    processing_status: "completed"
  },
  {
    id: 2,
    filename: "employee_handbook.docx",
    document_type: "docx",
    file_size: 320500,
    uploaded_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    chunk_count: 85,
    processing_status: "completed"
  },
  {
    id: 3,
    filename: "refund_policy.txt",
    document_type: "txt",
    file_size: 4500,
    uploaded_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    chunk_count: 4,
    processing_status: "completed"
  }
];

function getLocalMockDocuments(): any[] {
  if (!isBrowser) return INITIAL_MOCK_DOCUMENTS;
  const stored = localStorage.getItem("beonix_mock_documents");
  if (!stored) {
    localStorage.setItem("beonix_mock_documents", JSON.stringify(INITIAL_MOCK_DOCUMENTS));
    return INITIAL_MOCK_DOCUMENTS;
  }
  return JSON.parse(stored);
}

function saveLocalMockDocuments(docs: any[]) {
  if (isBrowser) {
    localStorage.setItem("beonix_mock_documents", JSON.stringify(docs));
  }
}

const INITIAL_MOCK_SESSIONS = [
  {
    id: 1,
    title: "What is our refund policy?",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    messages: [
      {
        id: 11,
        role: "user",
        content: "What is our refund policy?",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 12,
        role: "assistant",
        content: JSON.stringify({
          answer: "The refund policy states that clients can request a full refund within 14 days of purchase. Refund processing takes 5-7 business days.",
          sources: [{ document: "refund_policy.txt", chunk: 0, score: 0.94 }]
        }),
        created_at: new Date(Date.now() - 3600000 * 2 + 1000).toISOString()
      }
    ]
  }
];

function getLocalMockSessions(): any[] {
  if (!isBrowser) return INITIAL_MOCK_SESSIONS;
  const stored = localStorage.getItem("beonix_mock_chat_sessions");
  if (!stored) {
    localStorage.setItem("beonix_mock_chat_sessions", JSON.stringify(INITIAL_MOCK_SESSIONS));
    return INITIAL_MOCK_SESSIONS;
  }
  return JSON.parse(stored);
}

function saveLocalMockSessions(sessions: any[]) {
  if (isBrowser) {
    localStorage.setItem("beonix_mock_chat_sessions", JSON.stringify(sessions));
  }
}

export const api = {
  /**
   * Fetch all leads.
   */
  async getLeads(): Promise<{ data: Lead[]; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/leads`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI backend offline, falling back to local mock data.", error);
      const mockLeads = getLocalMockLeads();
      // Remove activities when sending back basic Lead array
      const basicLeads: Lead[] = mockLeads.map(({ activities, ...rest }) => rest);
      return { data: basicLeads, isMock: true };
    }
  },

  /**
   * Fetch details of a single lead, including activity logs.
   */
  async getLeadById(id: number): Promise<{ data: LeadDetail; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI backend offline, fetching lead ID ${id} from mock data.`, error);
      const mockLeads = getLocalMockLeads();
      const match = mockLeads.find((l) => l.id === id);
      if (!match) throw new Error(`Lead with ID ${id} not found in mock database.`);
      return { data: match, isMock: true };
    }
  },

  /**
   * Create a new lead.
   */
  async createLead(lead: Omit<Lead, "id" | "stage" | "created_at">): Promise<{ data: Lead; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI backend offline, creating lead in local mock data.", error);
      const mockLeads = getLocalMockLeads();
      
      const newId = Math.max(...mockLeads.map((l) => l.id), 0) + 1;
      const newLeadDetail: LeadDetail = {
        id: newId,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        stage: "New",
        score: lead.score ?? 0,
        priority: "Low",
        score_reasoning: null,
        created_at: new Date().toISOString(),
        activities: [
          {
            id: Date.now(),
            lead_id: newId,
            type: "System",
            content: `Lead created with status 'New' and score ${lead.score ?? 0}.`,
            timestamp: new Date().toISOString(),
          }
        ],
        transcripts: []
      };

      const updated = [newLeadDetail, ...mockLeads];
      saveLocalMockLeads(updated);
      
      const { activities, ...basicLead } = newLeadDetail;
      return { data: basicLead, isMock: true };
    }
  },

  /**
   * Update a lead's stage and append a stage transition log.
   */
  async updateLeadStage(id: number, stage: string): Promise<{ data: Lead; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/leads/${id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI backend offline, patching stage for lead ID ${id} in mock data.`, error);
      const mockLeads = getLocalMockLeads();
      const index = mockLeads.findIndex((l) => l.id === id);
      if (index === -1) throw new Error(`Lead with ID ${id} not found in mock database.`);

      const oldStage = mockLeads[index].stage;
      mockLeads[index].stage = stage;
      mockLeads[index].activities.push({
        id: Date.now(),
        lead_id: id,
        type: "Stage Change",
        content: `Lead stage transitioned from '${oldStage}' to '${stage}'.`,
        timestamp: new Date().toISOString(),
      });

      saveLocalMockLeads(mockLeads);
      const { activities, ...basicLead } = mockLeads[index];
      return { data: basicLead, isMock: true };
    }
  },

  /**
   * Log an activity manually.
   */
  async addManualActivity(leadId: number, type: string, content: string): Promise<{ data: Activity; isMock: boolean }> {
    const mockLeads = getLocalMockLeads();
    const index = mockLeads.findIndex((l) => l.id === leadId);
    
    const newActivity: Activity = {
      id: Date.now(),
      lead_id: leadId,
      type,
      content,
      timestamp: new Date().toISOString()
    };

    if (index !== -1) {
      mockLeads[index].activities.push(newActivity);
      saveLocalMockLeads(mockLeads);
    }
    
    return { data: newActivity, isMock: true };
  },

  /**
   * Calculate/recalculate lead score.
   */
  async calculateLeadScore(leadId: number): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/leads/${leadId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI backend offline, mocking lead score calculation for lead ID ${leadId}.`, error);
      const mockLeads = getLocalMockLeads();
      const index = mockLeads.findIndex((l) => l.id === leadId);
      if (index === -1) throw new Error(`Lead with ID ${leadId} not found in mock database.`);

      const mockScore = 78;
      const mockPriority = "High";
      const mockReasoning = {
        urgency: { score: 8, reason: "Mock: Requested pricing details and demo call soon." },
        budget_signal: { score: 7, reason: "Mock: Discussed budget fits standard tier plans." },
        decision_maker: { score: 8, reason: "Mock: Director of Operations is evaluating." },
        engagement: { score: 7, reason: "Mock: Responsive follow-up conversation." },
        sentiment: { score: 9, reason: "Mock: Warm discovery tone." }
      };

      mockLeads[index].score = mockScore;
      mockLeads[index].priority = mockPriority;
      mockLeads[index].score_reasoning = JSON.stringify(mockReasoning);
      mockLeads[index].activities.push({
        id: Date.now(),
        lead_id: leadId,
        type: "System",
        content: `Lead scored: ${mockScore}/100 (${mockPriority} Priority) (Mock Offline)`,
        timestamp: new Date().toISOString()
      });

      saveLocalMockLeads(mockLeads);
      return { data: { lead_id: leadId, score: mockScore, priority: mockPriority, reasoning: mockReasoning }, isMock: true };
    }
  },

  /**
   * Submit manual lead review and generate talking points.
   */
  async submitLeadPrep(leadId: number, manualReview: string): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/leads/${leadId}/prep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manual_review: manualReview })
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI backend offline, mocking lead prep submission for lead ID ${leadId}.`, error);
      const mockLeads = getLocalMockLeads();
      const index = mockLeads.findIndex((l) => l.id === leadId);
      if (index === -1) throw new Error(`Lead with ID ${leadId} not found in mock database.`);

      const mockPoints = [
        `Discuss notes details: ${manualReview.substring(0, 60)} (Mock Offline)`,
        "Present fast-track onboarding timelines",
        "Verify pricing structures and budget parameters"
      ];

      mockLeads[index].manual_review = manualReview;
      mockLeads[index].talking_points = JSON.stringify(mockPoints);
      if (!mockLeads[index].activities) {
        mockLeads[index].activities = [];
      }
      mockLeads[index].activities.push({
        id: Date.now(),
        lead_id: leadId,
        type: "System",
        content: "Lead manual review and talking topics prep updated (Mock Offline).",
        timestamp: new Date().toISOString()
      });

      saveLocalMockLeads(mockLeads);
      return { data: mockLeads[index], isMock: true };
    }
  },

  /**
   * Upload an audio call recording for transcription, extraction and scoring.
   */
  async uploadAudioCall(file: File, onProgress?: (status: string) => void): Promise<{ data: any; isMock: boolean }> {
    try {
      onProgress?.("0%");
      const formData = new FormData();
      formData.append("file", file);
      
      onProgress?.("Transcribing Audio");
      const response = await fetch(`${API_BASE_URL}/ingest/call`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Audio ingestion API responded with an error");
      
      onProgress?.("Extracting Lead Details");
      await new Promise(r => setTimeout(r, 600));
      onProgress?.("Scoring Lead");
      await new Promise(r => setTimeout(r, 600));
      
      const data = await response.json();
      onProgress?.("Completed");
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI backend offline, mocking audio ingestion locally.", error);
      
      onProgress?.("Transcribing Audio");
      await new Promise(r => setTimeout(r, 1200));
      onProgress?.("Extracting Lead Details");
      await new Promise(r => setTimeout(r, 1000));
      onProgress?.("Scoring Lead");
      await new Promise(r => setTimeout(r, 850));
      
      const mockLeads = getLocalMockLeads();
      const name = "Elena Rostova";
      const email = "elena@bio-labs.org";
      const company = "BioLabs Global";
      const score = 95;
      const priority = "High";
      
      const scoreReasoning = {
        urgency: { score: 10, reason: "Mock: Urgent need to sanitize and index HIPAA data." },
        budget_signal: { score: 9, reason: "Mock: Explicit budget available for medical text ingestion." },
        decision_maker: { score: 9, reason: "Mock: Head of Biotech Informatics is leading setup." },
        engagement: { score: 9, reason: "Mock: Provided details on target embedding dimensions." },
        sentiment: { score: 10, reason: "Mock: Highly cooperative and eager." }
      };

      const mockTranscript = {
        id: Date.now(),
        lead_id: null as number | null,
        filename: file.name,
        transcript_text: "Hi, I am Elena Rostova from BioLabs Global. We are looking for an AI memory indexing system to ingest our clinical trial logs into vector collections. My email is elena@bio-labs.org.",
        duration_seconds: 45,
        created_at: new Date().toISOString()
      };

      let matchedLeadIndex = mockLeads.findIndex((l) => l.email === email);
      let leadId = 103;
      let created = false;

      if (matchedLeadIndex !== -1) {
        leadId = mockLeads[matchedLeadIndex].id;
        mockLeads[matchedLeadIndex].company = company;
        mockLeads[matchedLeadIndex].score = score;
        mockLeads[matchedLeadIndex].priority = priority;
        mockLeads[matchedLeadIndex].score_reasoning = JSON.stringify(scoreReasoning);
        mockLeads[matchedLeadIndex].transcripts = mockLeads[matchedLeadIndex].transcripts || [];
        mockTranscript.lead_id = leadId;
        mockLeads[matchedLeadIndex].transcripts.push(mockTranscript);
        mockLeads[matchedLeadIndex].activities.push({
          id: Date.now() + 1,
          lead_id: leadId,
          type: "System",
          content: `Audio uploaded: ${file.name} (Mock)`,
          timestamp: new Date().toISOString()
        });
        mockLeads[matchedLeadIndex].activities.push({
          id: Date.now() + 2,
          lead_id: leadId,
          type: "System",
          content: `Transcript generated (45s duration) (Mock)`,
          timestamp: new Date().toISOString()
        });
        mockLeads[matchedLeadIndex].activities.push({
          id: Date.now() + 3,
          lead_id: leadId,
          type: "System",
          content: `Lead updated via Audio Pipeline (Mock)`,
          timestamp: new Date().toISOString()
        });
      } else {
        leadId = Math.max(...mockLeads.map((l) => l.id), 0) + 1;
        created = true;
        mockTranscript.lead_id = leadId;
        const newLeadDetail: LeadDetail = {
          id: leadId,
          name,
          email,
          company,
          stage: "New",
          score,
          priority,
          score_reasoning: JSON.stringify(scoreReasoning),
          created_at: new Date().toISOString(),
          activities: [
            {
              id: Date.now() + 1,
              lead_id: leadId,
              type: "System",
              content: `Audio uploaded: ${file.name} (Mock)`,
              timestamp: new Date().toISOString()
            },
            {
              id: Date.now() + 2,
              lead_id: leadId,
              type: "System",
              content: `Transcript generated (45s duration) (Mock)`,
              timestamp: new Date().toISOString()
            },
            {
              id: Date.now() + 3,
              lead_id: leadId,
              type: "System",
              content: `Lead created via Audio Pipeline (Mock)`,
              timestamp: new Date().toISOString()
            }
          ],
          transcripts: [mockTranscript]
        };
        mockLeads.push(newLeadDetail);
      }

      saveLocalMockLeads(mockLeads);
      onProgress?.("Completed");
      return { 
        data: { success: true, lead_id: leadId, transcript_id: mockTranscript.id, lead_score: score, created }, 
        isMock: true 
      };
    }
  },

  /**
   * Fetch all indexed memory documents.
   */
  async getDocuments(): Promise<{ data: any[]; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI backend offline, falling back to local mock documents.", error);
      return { data: getLocalMockDocuments(), isMock: true };
    }
  },

  /**
   * Fetch details of a single document.
   */
  async getDocumentById(id: number): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI backend offline, fetching document ID ${id} from mock data.`, error);
      const docs = getLocalMockDocuments();
      const match = docs.find((d) => d.id === id);
      if (!match) throw new Error(`Document with ID ${id} not found.`);
      return { data: { document: match, chunk_count: match.chunk_count }, isMock: true };
    }
  },

  /**
   * Upload and process a new document (PDF, DOCX, TXT).
   */
  async uploadDocument(file: File, onProgress?: (status: string) => void): Promise<{ data: any; isMock: boolean }> {
    try {
      onProgress?.("0%");
      const formData = new FormData();
      formData.append("file", file);
      
      onProgress?.("Extracting text");
      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Document ingestion API responded with an error");
      
      onProgress?.("Splitting chunks");
      await new Promise(r => setTimeout(r, 600));
      onProgress?.("Generating embeddings");
      await new Promise(r => setTimeout(r, 600));
      onProgress?.("Stored in vector DB");
      await new Promise(r => setTimeout(r, 400));
      
      const data = await response.json();
      onProgress?.("Completed");
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI backend offline, mocking document upload locally.", error);
      
      onProgress?.("Extracting text");
      await new Promise(r => setTimeout(r, 800));
      onProgress?.("Splitting chunks");
      await new Promise(r => setTimeout(r, 800));
      onProgress?.("Generating embeddings");
      await new Promise(r => setTimeout(r, 600));
      onProgress?.("Stored in vector DB");
      await new Promise(r => setTimeout(r, 500));
      
      const docs = getLocalMockDocuments();
      const newId = Math.max(...docs.map((d) => d.id), 0) + 1;
      const docType = file.name.split(".").pop() || "txt";
      const estimatedChunks = Math.max(1, Math.floor(file.size / 700));
      
      const newDoc = {
        id: newId,
        filename: file.name,
        document_type: docType.toLowerCase(),
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
        chunk_count: estimatedChunks,
        processing_status: "completed"
      };
      
      docs.unshift(newDoc);
      saveLocalMockDocuments(docs);
      onProgress?.("Completed");
      return {
        data: {
          success: true,
          document_id: newId,
          chunks_created: estimatedChunks,
          status: "completed"
        },
        isMock: true
      };
    }
  },

  /**
   * Ask one-off question using context retrieval (RAG).
   */
  async askOneOff(question: string): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI backend offline, running mock Q&A locally.", error);
      
      const qLower = question.toLowerCase();
      let answer = "I could not find this information in the company knowledge base.";
      let sources: any[] = [];
      
      if (qLower.includes("onboarding")) {
        answer = "HR paperwork, IT setup, team intros.";
        sources = [{ document: "onboarding_sop.pdf", chunk: 14, score: 0.88 }];
      } else if (qLower.includes("refund")) {
        answer = "The refund policy states that clients can request a full refund within 14 days of purchase. Refund processing takes 5-7 business days.";
        sources = [{ document: "refund_policy.txt", chunk: 0, score: 0.94 }];
      } else if (qLower.includes("sales")) {
        answer = "Our sales process is structured into 5 stages: New -> Contacted -> Qualified -> Proposal -> Closed. Each lead score evaluates buying signals.";
        sources = [{ document: "sales_playbook.pdf", chunk: 3, score: 0.90 }];
      }
      
      return { data: { answer, sources }, isMock: true };
    }
  },

  /**
   * Create a new persistent chat session.
   */
  async createChatSession(): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/memory/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI backend offline, creating mock chat session.", error);
      const sessions = getLocalMockSessions();
      const newId = Math.max(...sessions.map((s) => s.id), 0) + 1;
      const newSession = {
        id: newId,
        title: "New Conversation",
        created_at: new Date().toISOString(),
        messages: []
      };
      sessions.unshift(newSession);
      saveLocalMockSessions(sessions);
      return { data: newSession, isMock: true };
    }
  },

  /**
   * Fetch chat session with complete history.
   */
  async getChatSession(id: number): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/memory/session/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI backend offline, fetching mock chat session ID ${id}.`, error);
      const sessions = getLocalMockSessions();
      const match = sessions.find((s) => s.id === id);
      if (!match) throw new Error(`Chat session with ID ${id} not found.`);
      return { data: match, isMock: true };
    }
  },

  /**
   * Post a message, run RAG, save both in session, and return assistant message response.
   */
  async postChatMessage(sessionId: number, question: string): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/memory/session/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, processing mock message in session locally.", error);
      const sessions = getLocalMockSessions();
      const sessionIndex = sessions.findIndex((s) => s.id === sessionId);
      if (sessionIndex === -1) throw new Error(`Chat session with ID ${sessionId} not found.`);
      
      const session = sessions[sessionIndex];
      
      // Create user message
      const userMsg = {
        id: Date.now() + 1,
        role: "user",
        content: question,
        created_at: new Date().toISOString()
      };
      session.messages.push(userMsg);
      
      // Process question keywords
      const qLower = question.toLowerCase();
      let answer = "I could not find this information in the company knowledge base.";
      let sources: any[] = [];
      
      if (qLower.includes("onboarding")) {
        answer = "HR paperwork, IT setup, team intros.";
        sources = [{ document: "onboarding_sop.pdf", chunk: 14, score: 0.88 }];
      } else if (qLower.includes("refund")) {
        answer = "The refund policy states that clients can request a full refund within 14 days of purchase. Refund processing takes 5-7 business days.";
        sources = [{ document: "refund_policy.txt", chunk: 0, score: 0.94 }];
      } else if (qLower.includes("sales")) {
        answer = "Our sales process is structured into 5 stages: New -> Contacted -> Qualified -> Proposal -> Closed. Each lead score evaluates buying signals.";
        sources = [{ document: "sales_playbook.pdf", chunk: 3, score: 0.90 }];
      }
      
      // Update title if it's new
      if (session.title === "New Conversation") {
        session.title = question.slice(0, 32) + (question.length > 32 ? "..." : "");
      }
      
      // Create assistant message
      const assistantMsg = {
        id: Date.now() + 2,
        role: "assistant",
        content: JSON.stringify({ answer, sources }),
        created_at: new Date().toISOString()
      };
      session.messages.push(assistantMsg);
      
      sessions[sessionIndex] = session;
      saveLocalMockSessions(sessions);
      return { data: assistantMsg, isMock: true };
    }
  },

  /**
   * Ask the AI assistant questions scoped strictly to this lead's interaction history.
   */
  async askLeadQuestion(leadId: number, question: string): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/leads/${leadId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI server offline, processing mock question for lead ID ${leadId} locally.`, error);
      
      const qLower = question.toLowerCase();
      let answer = "I could not find that information in this lead's history.";
      let sources: any[] = [];
      let recommended_actions: string[] = ["Schedule follow-up call", "Email standard product brochure"];
      
      if (qLower.includes("objection") || qLower.includes("concern")) {
        answer = "The lead has raised concerns about custom onboarding sync times and pricing plans.";
        sources = [{ type: "activity", date: new Date().toISOString().slice(0,10) }];
        recommended_actions = ["Prepare customized implementation timeline document", "Draft standard discount pricing table"];
      } else if (qLower.includes("pricing") || qLower.includes("cost") || qLower.includes("budget")) {
        answer = "Pricing was discussed during the scoping call. The lead is reviewing pricing tiers to see if they align with their budget allocations.";
        sources = [{ type: "call", date: new Date(Date.now() - 3600000 * 24).toISOString().slice(0,10) }];
        recommended_actions = ["Send customized proposal document", "Verify trial integration seat parameters"];
      } else if (qLower.includes("next step") || qLower.includes("todo")) {
        answer = "Next actions are to follow up on trial integrations and share sandbox API documentation.";
        sources = [{ type: "activity", date: new Date().toISOString().slice(0,10) }];
        recommended_actions = ["Share integration endpoints documentation", "Call to verify sandbox credentials"];
      } else if (qLower.includes("summarize") || qLower.includes("summary")) {
        answer = "This lead is highly qualified (95 score) and has an active Q3 timeline requirement to ingest HIPAA logs.";
        sources = [
          { type: "call", date: new Date(Date.now() - 3600000 * 48).toISOString().slice(0,10) },
          { type: "summary", date: new Date().toISOString().slice(0,10) }
        ];
        recommended_actions = ["Schedule trial kickoff call", "Initiate technical sandbox onboarding"];
      }
      
      return { data: { answer, sources, recommended_actions }, isMock: true };
    }
  },

  /**
   * Retrieves key profiling insights (decision maker, objections, last contact) for a specific lead.
   */
  async getLeadInsights(leadId: number): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/leads/${leadId}/insights`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI server offline, fetching mock insights for lead ID ${leadId} locally.`, error);
      
      const mockLeads = getLocalMockLeads();
      const lead = mockLeads.find((l) => l.id === leadId);
      
      const decision_maker = leadId === 103 || leadId === 1 ? "VP of Operations" : "Lead Evaluator Team";
      const sentiment = leadId === 103 || leadId === 1 ? "Positive" : (leadId === 101 ? "Positive" : "Neutral");
      const risk_level = lead && lead.score >= 80 ? "Low" : (lead && lead.score >= 50 ? "Medium" : "High");
      const confidence_score = lead ? lead.score : 75;
      
      return {
        data: {
          decision_maker,
          key_objections: ["Pricing Tier", "Timeline Sync"],
          sentiment,
          last_contact: new Date().toISOString().slice(0,10),
          next_steps: ["Follow up on integrations proposal"],
          risk_level,
          confidence_score
        },
        isMock: true
      };
    }
  },

  /**
   * Retrieves all pending recovery cases in the queue.
   */
  async getRecoveryQueue(): Promise<{ data: any[]; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/recovery`);
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, fetching mock recovery cases locally.", error);
      const mockLeads = getLocalMockLeads();
      const mockCases = [
        {
          id: 1,
          lead_id: 101,
          lead_name: mockLeads.find(l => l.id === 101)?.name || "Acme Corp",
          risk_level: "high",
          days_inactive: 18,
          reason: "Proposal sent but no engagement recorded for 18 days.",
          recommended_action: "Schedule implementation walkthrough and address timeline concerns.",
          status: "pending",
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          lead_id: 102,
          lead_name: mockLeads.find(l => l.id === 102)?.name || "Initech",
          risk_level: "medium",
          days_inactive: 9,
          reason: "Opportunity cooling down with no touchpoints for 9 days since intro call.",
          recommended_action: "Email product onboarding deck and follow up on budget alignment parameters.",
          status: "pending",
          created_at: new Date().toISOString()
        }
      ];
      if (typeof window !== "undefined") {
        if (!localStorage.getItem("beonix_mock_recovery_cases")) {
          localStorage.setItem("beonix_mock_recovery_cases", JSON.stringify(mockCases));
        }
        const stored = JSON.parse(localStorage.getItem("beonix_mock_recovery_cases") || "[]");
        return { data: stored.filter((c: any) => c.status === "pending"), isMock: true };
      }
      return { data: mockCases, isMock: true };
    }
  },

  /**
   * Performs live recovery analysis and strategy generation for a single lead.
   */
  async analyzeLeadRecovery(leadId: number): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/recovery/${leadId}/analyze`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI server offline, generating mock recovery analysis for lead ID ${leadId} locally.`, error);
      const mockLeads = getLocalMockLeads();
      const lead = mockLeads.find(l => l.id === leadId);
      
      const risk_level = leadId === 101 ? "high" : "medium";
      const recovery_strategy = `Schedule follow-up to address objections and review the outstanding proposal.`;
      const recommended_actions = ["Schedule proposal review call", "Share fast-track implementation timelines"];
      
      return {
        data: { risk_level, recovery_strategy, recommended_actions },
        isMock: true
      };
    }
  },

  /**
   * Resolves a recovery case status.
   */
  async resolveRecoveryCase(caseId: number, status: string): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/recovery/${caseId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI server offline, resolving mock recovery case ID ${caseId} locally.`, error);
      if (typeof window !== "undefined") {
        const stored = JSON.parse(localStorage.getItem("beonix_mock_recovery_cases") || "[]");
        const updated = stored.map((c: any) => {
          if (c.id === caseId) return { ...c, status };
          return c;
        });
        localStorage.setItem("beonix_mock_recovery_cases", JSON.stringify(updated));
        const resolved = updated.find((c: any) => c.id === caseId);
        return { data: resolved, isMock: true };
      }
      return { data: { id: caseId, status }, isMock: true };
    }
  },

  /**
   * Generates custom multi-channel re-engagement scripts.
   */
  async getFollowupDrafts(leadId: number): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/recovery/${leadId}/followup`);
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI server offline, generating mock follow-up drafts for lead ID ${leadId} locally.`, error);
      const mockLeads = getLocalMockLeads();
      const lead = mockLeads.find(l => l.id === leadId);
      const company = lead ? lead.company : "your organization";
      
      return {
        data: {
          email_subject: `Next steps: address timeline and pricing concern points for ${company}`,
          email_body: `Hi ${lead ? lead.name : "Team"},\n\nI hope you are doing well.\n\nI'm reaching out to check in on our last conversation regarding Beonix OS. We have formulated a fast-track implementation plan to deploy in under 2 weeks.\n\nWould you be open to a brief 10-minute review call this week?\n\nBest regards,\nBeonix Account Team`,
          whatsapp_body: `Hi ${lead ? lead.name : "there"}! Checking in on the Beonix OS integration proposal. We can schedule a technical onboarding walkthrough whenever your team is free. Let me know!`,
          call_talking_points: [
            `Address deployment timelines raised for ${company}`,
            "Clarify onboarding sandbox details and technical dependencies",
            "Follow up on pending proposal review status"
          ]
        },
        isMock: true
      };
    }
  },

  /**
   * Retrieves the follow-up tasks categorized list and stats for dashboard.
   */
  async getFollowupDashboard(): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/followups/dashboard`);
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, compiling local mock follow-up dashboard.");
      const mockLeads = getLocalMockLeads();
      const mockTasks = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_followups") || "[]") : "[]");
      
      if (mockTasks.length === 0) {
        const initial = [
          {
            id: 10,
            lead_id: 101,
            lead_name: mockLeads.find(l => l.id === 101)?.name || "Acme Corp",
            title: "Follow up on proposal review status",
            description: "",
            followup_type: "email",
            scheduled_at: new Date(Date.now() + 3600000 * 24 * 3).toISOString(),
            status: "scheduled",
            created_at: new Date().toISOString()
          },
          {
            id: 11,
            lead_id: 102,
            lead_name: mockLeads.find(l => l.id === 102)?.name || "Initech",
            title: "Introductory discovery call",
            description: "",
            followup_type: "call",
            scheduled_at: new Date().toISOString(),
            status: "scheduled",
            created_at: new Date().toISOString()
          },
          {
            id: 12,
            lead_id: 103,
            lead_name: mockLeads.find(l => l.id === 103)?.name || "Hooli",
            title: "Urgent recovery call: objections",
            description: "",
            followup_type: "call",
            scheduled_at: new Date(Date.now() - 3600000 * 24).toISOString(),
            status: "overdue",
            created_at: new Date().toISOString()
          }
        ];
        if (typeof window !== "undefined") {
          localStorage.setItem("beonix_mock_followups", JSON.stringify(initial));
        }
        return {
          data: {
            today: [initial[1]],
            upcoming: [initial[0]],
            overdue: [initial[2]],
            completed: [],
            stats: { pending_count: 2, overdue_count: 1, completed_count: 0, success_rate: 100.0 }
          },
          isMock: true
        };
      }

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 3600 * 1000);

      const today: any[] = [];
      const upcoming: any[] = [];
      const overdue: any[] = [];
      const completed: any[] = [];

      mockTasks.forEach((t: any) => {
        const sched = new Date(t.scheduled_at);
        if (t.status === "completed") {
          completed.push(t);
        } else if (t.status === "cancelled") {
          // ignore
        } else if (sched < todayStart) {
          overdue.push({ ...t, status: "overdue" });
        } else if (sched >= todayStart && sched < todayEnd) {
          today.push(t);
        } else {
          upcoming.push(t);
        }
      });

      const totalFinished = completed.length + overdue.length;
      const success_rate = totalFinished > 0 ? Math.round((completed.length / totalFinished) * 100) : 100.0;

      return {
        data: {
          today,
          upcoming,
          overdue,
          completed,
          stats: {
            pending_count: today.length + upcoming.length,
            overdue_count: overdue.length,
            completed_count: completed.length,
            success_rate
          }
        },
        isMock: true
      };
    }
  },

  /**
   * Retrieves all follow-up tasks scheduled for a single lead.
   */
  async getLeadFollowups(leadId: number): Promise<{ data: any[]; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/followups/lead/${leadId}`);
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI server offline, fetching mock follow-ups for lead ID ${leadId}`);
      await this.getFollowupDashboard();
      const mockTasks = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_followups") || "[]") : "[]");
      return { data: mockTasks.filter((t: any) => t.lead_id === leadId), isMock: true };
    }
  },

  /**
   * Schedules a new follow-up task. If details are missing, rule engine determines them.
   */
  async createFollowup(payload: { lead_id: number; followup_type?: string; title?: string; scheduled_at?: string }): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/followups/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, creating mock follow-up in local state.");
      const mockLeads = getLocalMockLeads();
      const lead = mockLeads.find(l => l.id === payload.lead_id);
      
      const type = payload.followup_type || (lead?.stage === "New" ? "call" : "email");
      const title = payload.title || (lead?.stage === "New" ? "Introductory discovery call" : "Follow up on proposal review status");
      const scheduled_at = payload.scheduled_at || new Date(Date.now() + 3600000 * 24 * (lead?.stage === "New" ? 1 : 5)).toISOString();

      const newTask = {
        id: Date.now(),
        lead_id: payload.lead_id,
        lead_name: lead?.name || "Unknown",
        title,
        description: "",
        followup_type: type,
        scheduled_at,
        status: "scheduled",
        created_at: new Date().toISOString()
      };

      const mockTasks = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_followups") || "[]") : "[]");
      mockTasks.push(newTask);
      if (typeof window !== "undefined") {
        localStorage.setItem("beonix_mock_followups", JSON.stringify(mockTasks));
      }
      
      return { data: { followup_id: newTask.id, status: "scheduled" }, isMock: true };
    }
  },

  /**
   * Executes a scheduled task.
   */
  async executeFollowup(followupId: number): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/followups/${followupId}/execute`, { method: "POST" });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, completing mock task in local state.");
      const mockTasks = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_followups") || "[]") : "[]");
      const updated = mockTasks.map((t: any) => {
        if (t.id === followupId) return { ...t, status: "completed" };
        return t;
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("beonix_mock_followups", JSON.stringify(updated));
      }
      return { data: { success: true }, isMock: true };
    }
  },

  /**
   * Reschedules a task to a new time.
   */
  async rescheduleFollowup(followupId: number, scheduledAt: string): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/followups/${followupId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_at: scheduledAt })
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, rescheduling mock task.");
      const mockTasks = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_followups") || "[]") : "[]");
      const updated = mockTasks.map((t: any) => {
        if (t.id === followupId) return { ...t, scheduled_at: scheduledAt, status: "scheduled" };
        return t;
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("beonix_mock_followups", JSON.stringify(updated));
      }
      return { data: { success: true }, isMock: true };
    }
  },

  /**
   * Cancels a scheduled task.
   */
  async cancelFollowup(followupId: number): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/followups/${followupId}/cancel`, { method: "POST" });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, cancelling mock task.");
      const mockTasks = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_followups") || "[]") : "[]");
      const updated = mockTasks.map((t: any) => {
        if (t.id === followupId) return { ...t, status: "cancelled" };
        return t;
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("beonix_mock_followups", JSON.stringify(updated));
      }
      return { data: { success: true }, isMock: true };
    }
  },

  /**
   * Retrieves all visual workflows.
   */
  async getWorkflows(): Promise<{ data: any[]; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows`);
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, fetching mock workflows.");
      const mockWorkflows = [
        {
          id: 1,
          name: "High Value Lead Follow-Up",
          description: "Trigger an urgent call when a lead scores higher than 80.",
          status: "active",
          nodes: [
            { id: "node_1", node_type: "New Lead", config: {} },
            { id: "node_2", node_type: "Score Greater Than", config: { value: 80 } },
            { id: "node_3", node_type: "Create Follow-Up", config: { type: "call", title: "Urgent recovery call" } },
            { id: "node_4", node_type: "Send Notification", config: { message: "High value lead registered!" } }
          ],
          edges: [
            { source_node: "node_1", target_node: "node_2" },
            { source_node: "node_2", target_node: "node_3" },
            { source_node: "node_3", target_node: "node_4" }
          ]
        },
        {
          id: 2,
          name: "Cold Lead Recovery",
          description: "Escalates cold leads automatically to the Recovery Queue after 14 days of inactivity.",
          status: "active",
          nodes: [
            { id: "node_a", node_type: "Scheduled Event", config: {} },
            { id: "node_b", node_type: "Days Since Activity", config: { value: 14 } },
            { id: "node_c", node_type: "Create Recovery Case", config: {} },
            { id: "node_d", node_type: "Send Notification", config: { message: "Lead Recovery Case generated." } }
          ],
          edges: [
            { source_node: "node_a", target_node: "node_b" },
            { source_node: "node_b", target_node: "node_c" },
            { source_node: "node_c", target_node: "node_d" }
          ]
        }
      ];
      if (typeof window !== "undefined") {
        if (!localStorage.getItem("beonix_mock_workflows")) {
          localStorage.setItem("beonix_mock_workflows", JSON.stringify(mockWorkflows));
        }
        const stored = JSON.parse(localStorage.getItem("beonix_mock_workflows") || "[]");
        return { data: stored, isMock: true };
      }
      return { data: mockWorkflows, isMock: true };
    }
  },

  /**
   * Retrieves detail config for a specific workflow.
   */
  async getWorkflow(workflowId: number): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}`);
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI server offline, fetching mock workflow ID ${workflowId}.`);
      const res = await this.getWorkflows();
      const wf = res.data.find(w => w.id === workflowId);
      return { data: wf, isMock: true };
    }
  },

  /**
   * Saves a new workflow canvas.
   */
  async createWorkflow(payload: any): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, saving workflow to local storage.");
      const res = await this.getWorkflows();
      const newWf = {
        ...payload,
        id: Date.now(),
        created_at: new Date().toISOString()
      };
      res.data.push(newWf);
      if (typeof window !== "undefined") {
        localStorage.setItem("beonix_mock_workflows", JSON.stringify(res.data));
      }
      return { data: newWf, isMock: true };
    }
  },

  /**
   * Manually executes a workflow with context.
   */
  async executeWorkflow(workflowId: number, context: any): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(context)
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI server offline, simulating workflow ID ${workflowId} run.`);
      const now = new Date().toISOString();
      const mockExecution = {
        id: Date.now(),
        workflow_id: workflowId,
        status: "completed",
        started_at: now,
        completed_at: now,
        logs: [
          { id: 1, node_id: "node_1", node_type: "New Lead", status: "success", execution_time: now, result_data: "Trigger matched: New Lead" },
          { id: 2, node_id: "node_2", node_type: "Score Greater Than", status: "success", execution_time: now, result_data: "Condition evaluated to: true" },
          { id: 3, node_id: "node_3", node_type: "Create Follow-Up", status: "success", execution_time: now, result_data: "Created follow-up task." },
          { id: 4, node_id: "node_4", node_type: "Send Notification", status: "success", execution_time: now, result_data: "Notified sales rep." }
        ]
      };
      
      const storedHistory = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem(`beonix_exec_history_${workflowId}`) || "[]") : "[]");
      storedHistory.push(mockExecution);
      if (typeof window !== "undefined") {
        localStorage.setItem(`beonix_exec_history_${workflowId}`, JSON.stringify(storedHistory));
      }
      return { data: mockExecution, isMock: true };
    }
  },

  /**
   * Retrieves execution history list.
   */
  async getWorkflowExecutions(workflowId: number): Promise<{ data: any[]; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}/executions`);
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI server offline, pulling local simulation history for workflow ID ${workflowId}.`);
      const storedHistory = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem(`beonix_exec_history_${workflowId}`) || "[]") : "[]");
      return { data: storedHistory, isMock: true };
    }
  },

  /**
   * Retrieves Capital operations dashboard statistics and feeds.
   */
  async getFinanceDashboard(): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/capital/dashboard`);
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, fetching mock finance dashboard data.");
      
      // Load from local storage
      const mockInvoices = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_invoices") || "null") : "null") || [
        { id: 1, invoice_number: "INV-2026-001", customer_name: "Stark Industries", amount: 1000.0, due_date: new Date(Date.now() + 5*24*60*60*1000).toISOString(), status: "paid" },
        { id: 2, invoice_number: "INV-2026-002", customer_name: "Wayne Enterprises", amount: 500.0, due_date: new Date(Date.now() - 18*24*60*60*1000).toISOString(), status: "overdue" },
        { id: 3, invoice_number: "INV-2026-003", customer_name: "LexCorp", amount: 1200.0, due_date: new Date(Date.now() - 35*24*60*60*1000).toISOString(), status: "overdue" }
      ];
      
      const mockPayments = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_payments") || "null") : "null") || [
        { id: 1, invoice_id: 1, amount: 1000.0, payment_date: new Date().toISOString(), payment_method: "wire transfer" }
      ];

      const mockApprovals = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_approvals") || "null") : "null") || [
        { id: 1, title: "Q3 Payroll Allocation Check", requester: "HR Director", approver: "CFO", status: "pending", created_at: new Date().toISOString() }
      ];

      if (typeof window !== "undefined") {
        if (!localStorage.getItem("beonix_mock_invoices")) localStorage.setItem("beonix_mock_invoices", JSON.stringify(mockInvoices));
        if (!localStorage.getItem("beonix_mock_payments")) localStorage.setItem("beonix_mock_payments", JSON.stringify(mockPayments));
        if (!localStorage.getItem("beonix_mock_approvals")) localStorage.setItem("beonix_mock_approvals", JSON.stringify(mockApprovals));
      }

      // Calculate totals
      let outstanding = 0;
      let overdue = 0;
      mockInvoices.forEach((inv: any) => {
        if (inv.status !== "paid") {
          outstanding += inv.amount;
          if (inv.status === "overdue") overdue += inv.amount;
        }
      });

      return {
        data: {
          stats: {
            outstanding_revenue: outstanding,
            paid_this_month: 1000.0,
            overdue_revenue: overdue,
            pending_approvals: mockApprovals.filter((a: any) => a.status === "pending").length
          },
          aging_buckets: {
            "0-30 Days": 500.0,
            "31-60 Days": 1200.0,
            "61-90 Days": 0.0,
            "90+ Days": 0.0
          },
          invoices: mockInvoices,
          payments: mockPayments,
          approvals: mockApprovals
        },
        isMock: true
      };
    }
  },

  /**
   * Saves a new client invoice.
   */
  async createInvoice(payload: any): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/capital/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, writing mock invoice.");
      const current = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_invoices") || "[]") : "[]");
      const newInv = {
        ...payload,
        id: current.length + 1,
        created_at: new Date().toISOString()
      };
      current.push(newInv);
      if (typeof window !== "undefined") {
        localStorage.setItem("beonix_mock_invoices", JSON.stringify(current));
      }
      return { data: newInv, isMock: true };
    }
  },

  /**
   * Records a payment against an invoice.
   */
  async recordPayment(payload: any): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/capital/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, recording mock payment receipt.");
      const invoices = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_invoices") || "[]") : "[]");
      const updatedInvoices = invoices.map((inv: any) => {
        if (inv.id === payload.invoice_id) return { ...inv, status: "paid" };
        return inv;
      });
      
      const payments = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_payments") || "[]") : "[]");
      const newPay = {
        ...payload,
        id: payments.length + 1,
        payment_date: new Date().toISOString()
      };
      payments.push(newPay);

      if (typeof window !== "undefined") {
        localStorage.setItem("beonix_mock_invoices", JSON.stringify(updatedInvoices));
        localStorage.setItem("beonix_mock_payments", JSON.stringify(payments));
      }
      return { data: newPay, isMock: true };
    }
  },

  /**
   * Submits a payroll/budget/expense approval request.
   */
  async createApprovalRequest(payload: any): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/capital/approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, creating mock approval request.");
      const approvals = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_approvals") || "[]") : "[]");
      const newApp = {
        ...payload,
        id: approvals.length + 1,
        created_at: new Date().toISOString()
      };
      approvals.push(newApp);
      if (typeof window !== "undefined") {
        localStorage.setItem("beonix_mock_approvals", JSON.stringify(approvals));
      }
      return { data: newApp, isMock: true };
    }
  },

  /**
   * Approves or rejects a request.
   */
  async updateApprovalStatus(approvalId: number, status: string): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/capital/approvals/${approvalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI server offline, updating mock approval request ID ${approvalId}.`);
      const approvals = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_approvals") || "[]") : "[]");
      const updated = approvals.map((a: any) => {
        if (a.id === approvalId) return { ...a, status };
        return a;
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("beonix_mock_approvals", JSON.stringify(updated));
      }
      return { data: { success: true }, isMock: true };
    }
  },

  /**
   * Retrieves dunning notice details for an invoice.
   */
  async getInvoiceDunning(invoiceId: number): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/capital/invoices/${invoiceId}/dunning`);
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI server offline, generating mock dunning notification details for invoice ID ${invoiceId}.`);
      const invoices = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_invoices") || "[]") : "[]");
      const inv = invoices.find((i: any) => i.id === invoiceId);
      
      const now = new Date();
      const due = new Date(inv?.due_date || now);
      const diffTime = Math.abs(now.getTime() - due.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        data: {
          level: days >= 30 ? "Escalation" : "Level 2",
          days_overdue: days,
          email_subject: `URGENT Reminder: Invoice ${inv?.invoice_number || "INV-001"} past-due`,
          email_body: `Dear customer,\n\nYour invoice ${inv?.invoice_number || "INV-001"} is outstanding by ${days} days. Please settle this balance immediately.`,
          call_script: `Call contact regarding past due invoice for $${inv?.amount || 0}.`,
          collection_notes: `Initiated Level 2 warning.`
        },
        isMock: true
      };
    }
  },

  /**
   * Retrieves Compliance dashboard data.
   */
  async getComplianceDashboard(): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/compliance/dashboard`);
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, fetching mock compliance data.");
      
      const mockReqs = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_compliance_reqs") || "null") : "null") || [
        { id: 1, title: "Q2 GST Filing", category: "GST", due_date: new Date(Date.now() + 2*24*60*60*1000).toISOString(), status: "at_risk", owner: "Finance Manager", created_at: new Date().toISOString() },
        { id: 2, title: "Annual MCA Audit Return", category: "MCA", due_date: new Date(Date.now() + 5*24*60*60*1000).toISOString(), status: "pending", owner: "Compliance Officer", created_at: new Date().toISOString() },
        { id: 3, title: "Q1 TDS Filing", category: "Tax", due_date: new Date(Date.now() - 10*24*60*60*1000).toISOString(), status: "overdue", owner: "Finance Manager", created_at: new Date().toISOString() }
      ];

      const mockRisks = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_compliance_risks") || "null") : "null") || [
        { id: 1, requirement_id: 3, severity: "critical", description: "Filing deadline exceeded for 'Q1 TDS Filing'.", recommendation: "Submit filing immediately and review late fees." },
        { id: 2, requirement_id: 1, severity: "high", description: "Approaching critical deadline for 'Q2 GST Filing' in 1 days.", recommendation: "Assign resources to finish and upload verify docs." }
      ];

      const mockDocs = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_compliance_docs") || "null") : "null") || [
        { id: 1, requirement_id: 2, filename: "mca_annual_2026.pdf", upload_date: new Date().toISOString(), verification_status: "verified" }
      ];

      if (typeof window !== "undefined") {
        if (!localStorage.getItem("beonix_mock_compliance_reqs")) localStorage.setItem("beonix_mock_compliance_reqs", JSON.stringify(mockReqs));
        if (!localStorage.getItem("beonix_mock_compliance_risks")) localStorage.setItem("beonix_mock_compliance_risks", JSON.stringify(mockRisks));
        if (!localStorage.getItem("beonix_mock_compliance_docs")) localStorage.setItem("beonix_mock_compliance_docs", JSON.stringify(mockDocs));
      }

      return {
        data: {
          stats: {
            upcoming_deadlines: 0,
            overdue_items: mockReqs.filter((r: any) => r.status === "overdue").length,
            risk_alerts: mockRisks.length,
            compliance_score: 0
          },
          requirements: mockReqs,
          risks: mockRisks,
          documents: mockDocs
        },
        isMock: true
      };
    }
  },

  /**
   * Saves a new compliance requirement.
   */
  async createComplianceRequirement(payload: any): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/compliance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, writing mock compliance requirement.");
      const current = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_compliance_reqs") || "[]") : "[]");
      const newReq = {
        ...payload,
        id: current.length + 1,
        created_at: new Date().toISOString()
      };
      current.push(newReq);
      if (typeof window !== "undefined") {
        localStorage.setItem("beonix_mock_compliance_reqs", JSON.stringify(current));
      }
      return { data: newReq, isMock: true };
    }
  },

  /**
   * Updates requirement status.
   */
  async updateComplianceRequirement(requirementId: number, status: string): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/compliance/${requirementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI server offline, updating mock requirement ID ${requirementId}.`);
      const current = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_compliance_reqs") || "[]") : "[]");
      const updated = current.map((r: any) => {
        if (r.id === requirementId) return { ...r, status };
        return r;
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("beonix_mock_compliance_reqs", JSON.stringify(updated));
      }
      return { data: { success: true }, isMock: true };
    }
  },

  /**
   * Triggers risks scanning.
   */
  async analyzeComplianceRisks(): Promise<{ data: any[]; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/compliance/analyze`, { method: "POST" });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, returning mock compliance risks analysis.");
      const risks = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_compliance_risks") || "[]") : "[]");
      return { data: risks, isMock: true };
    }
  },

  /**
   * Uploads a document to local memory repository.
   */
  async uploadComplianceDocument(payload: any): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/compliance/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, logging mock compliance document upload.");
      const docs = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_compliance_docs") || "[]") : "[]");
      const newDoc = {
        ...payload,
        id: docs.length + 1,
        upload_date: new Date().toISOString(),
        verification_status: "pending"
      };
      docs.push(newDoc);
      if (typeof window !== "undefined") {
        localStorage.setItem("beonix_mock_compliance_docs", JSON.stringify(docs));
      }
      return { data: newDoc, isMock: true };
    }
  },

  /**
   * Lists uploaded documents.
   */
  async getComplianceDocuments(): Promise<{ data: any[]; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/compliance/documents`);
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, fetching mock compliance documents list.");
      const docs = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_compliance_docs") || "[]") : "[]");
      return { data: docs, isMock: true };
    }
  },

  /**
   * Uploads spreadsheet for bulk lead import preview.
   */
  async uploadImportFile(file: File): Promise<{ data: any; isMock: boolean }> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_BASE_URL}/imports/upload`, {
        method: "POST",
        body: formData
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline — parsing file client-side with SheetJS.");

      // ── Real client-side file parsing ──────────────────────────────
      const parseFile = (f: File): Promise<{ columns: string[]; rows: any[] }> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              // Dynamic import to avoid SSR issues
              import("xlsx").then((XLSX) => {
                const data = new Uint8Array(evt.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
                const columns: string[] = rows.length > 0 ? Object.keys(rows[0]) : [];
                resolve({ columns, rows });
              }).catch(reject);
            } catch (e) {
              reject(e);
            }
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(f);
        });

      let columns: string[] = [];
      let allRows: any[] = [];

      try {
        const parsed = await parseFile(file);
        columns = parsed.columns;
        allRows = parsed.rows;
      } catch (parseErr) {
        console.error("Client-side parse failed:", parseErr);
        // Last-resort fallback if even SheetJS fails (e.g., corrupt file)
        columns = ["Name", "Email", "Phone", "Company"];
        allRows = [];
      }

      // ── Auto-detect field mapping from column headers ───────────────
      const FIELD_HINTS: Record<string, string> = {
        name: "name", fullname: "name", "full name": "name", contact: "name", "client name": "name",
        email: "email", mail: "email", "contact mail": "email", "email address": "email",
        phone: "phone", mobile: "phone", "mobile number": "phone", tel: "phone", telephone: "phone",
        company: "company", organization: "company", org: "company", business: "company",
        source: "source", "lead source": "source",
        notes: "notes", note: "notes", comments: "notes",
      };

      const suggested_mapping: Record<string, string> = {};
      for (const col of columns) {
        const lower = col.toLowerCase().trim();
        if (FIELD_HINTS[lower]) suggested_mapping[col] = FIELD_HINTS[lower];
      }

      const job_id = Date.now();
      const sample_rows = allRows.slice(0, 10); // show up to 10 preview rows

      if (typeof window !== "undefined") {
        // Store ALL rows for processImport to use later
        localStorage.setItem(`beonix_import_temp_${job_id}`, JSON.stringify(allRows));
      }

      return {
        data: { job_id, columns, suggested_mapping, sample_rows, total_rows: allRows.length },
        isMock: true,
      };
    }
  },

  /**
   * Processes the bulk lead import.
   */
  async processImport(payload: any): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/imports/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn(`FastAPI server offline, processing mock bulk import ID ${payload.job_id}.`);
      
      const sampleRows = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem(`beonix_import_temp_${payload.job_id}`) || "[]") : "[]");
      const mapping = payload.field_mapping;
      const action = payload.dup_action;

      let total = sampleRows.length;
      let imported = 0;
      let duplicates = 0;
      let failed = 0;

      // Seed mock leads in localStorage CRM board
      const localLeads = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_leads") || "[]") : "[]");
      
      // ── Use field_mapping to extract values from real column names ──
      const getField = (row: any, fieldName: string): string => {
        // Find which column maps to this field
        for (const [col, mapped] of Object.entries(mapping)) {
          if (mapped === fieldName) return String(row[col] || "").trim();
        }
        // Fallback: try the field name directly as a column key
        return String(row[fieldName] || "").trim();
      };

      sampleRows.forEach((row: any) => {
        const name = getField(row, "name");
        const email = getField(row, "email");
        const phone = getField(row, "phone");
        const company = getField(row, "company");
        const source = getField(row, "source");

        if (!name && !email) {
          failed++;
          return;
        }

        const isDup = email ? localLeads.some((l: any) => l.email === email) : false;
        if (isDup) {
          duplicates++;
          if (action === "skip") return;
          if (action === "update") {
            const index = localLeads.findIndex((l: any) => l.email === email);
            if (index !== -1) {
              localLeads[index] = { ...localLeads[index], company, phone, source };
            }
            imported++;
          } else {
            localLeads.push({
              id: Date.now() + Math.random(),
              name: name || email,
              email,
              phone,
              company,
              source,
              stage: "New",
              score: 70 + Math.round(Math.random() * 20),
              priority: "Medium"
            });
            imported++;
          }
        } else {
          localLeads.push({
            id: Date.now() + Math.random(),
            name: name || email,
            email,
            phone,
            company,
            source,
            stage: "New",
            score: 60 + Math.round(Math.random() * 30),
            priority: "Medium"
          });
          imported++;
        }
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("beonix_mock_leads", JSON.stringify(localLeads));
        
        const importHist = JSON.parse(localStorage.getItem("beonix_import_history") || "[]");
        const storedFilename = typeof window !== "undefined"
          ? (localStorage.getItem(`beonix_import_filename_${payload.job_id}`) || `Import #${payload.job_id}`)
          : `Import #${payload.job_id}`;
        const newJob = {
          id: payload.job_id,
          filename: storedFilename,
          total_rows: total,
          imported_rows: imported,
          duplicate_rows: duplicates,
          failed_rows: failed,
          status: "completed",
          created_at: new Date().toISOString()
        };
        importHist.push(newJob);
        localStorage.setItem("beonix_import_history", JSON.stringify(importHist));
      }

      return {
        data: {
          job_id: payload.job_id,
          total_rows: total,
          imported_rows: imported,
          duplicate_rows: duplicates,
          failed_rows: failed,
          status: "completed"
        },
        isMock: true
      };
    }
  },

  /**
   * Retrieves import jobs history log list.
   */
  async getImportHistory(): Promise<{ data: any[]; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/imports`);
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, returning local mock import history.");
      const hist = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_import_history") || "[]") : "[]");
      return { data: hist, isMock: true };
    }
  },

  /**
   * Generates a personalized outreach email draft.
   */
  async generateOutreachEmail(leadId: number): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/emails/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId })
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, simulating email generation in localStorage.");
      
      const localLeads = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_leads") || "[]") : "[]");
      const idx = localLeads.findIndex((l: any) => Number(l.id) === Number(leadId));
      let leadName = "Unknown";
      let leadEmail = "unknown@prospect.com";
      let company = "Their Org";
      
      if (idx !== -1) {
        localLeads[idx].stage = "Contacted";
        leadName = localLeads[idx].name;
        leadEmail = localLeads[idx].email;
        company = localLeads[idx].company || "Their Org";
        
        // Add activity
        if (!localLeads[idx].activities) localLeads[idx].activities = [];
        localLeads[idx].activities.unshift({
          id: Date.now() + Math.random(),
          lead_id: leadId,
          type: "Stage Change",
          content: "Lead stage transitioned from 'New' to 'Contacted' (AI Outreach generated).",
          timestamp: new Date().toISOString()
        });
        localLeads[idx].activities.unshift({
          id: Date.now() + Math.random() + 1,
          lead_id: leadId,
          type: "System",
          content: `AI Outreach email draft generated for ${leadName}.`,
          timestamp: new Date().toISOString()
        });
        
        if (typeof window !== "undefined") {
          localStorage.setItem("beonix_mock_leads", JSON.stringify(localLeads));
        }
      }

      const drafts = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_emails") || "[]") : "[]");
      const newDraft = {
        id: Date.now(),
        lead_id: leadId,
        lead_name: leadName,
        lead_email: leadEmail,
        subject: `Partnership proposal / custom OS specs for ${company}`,
        body: `Hi ${leadName},\n\nI was reviewing your profile and wanted to reach out regarding Beonix OS. Based on your company notes, we can set up custom pipelines to speed up operations.\n\nWould next Tuesday at 3 PM work for a brief intro call?\n\nBest regards,\nBeonix Account Team`,
        status: "draft",
        created_at: new Date().toISOString()
      };
      
      drafts.push(newDraft);
      if (typeof window !== "undefined") {
        localStorage.setItem("beonix_mock_emails", JSON.stringify(drafts));
      }
      
      return { data: newDraft, isMock: true };
    }
  },

  /**
   * Retrieves all drafts and outreach emails log.
   */
  async getOutreachEmails(): Promise<{ data: any[]; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/emails/drafts`);
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, returning local mock outreach emails.");
      const drafts = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_emails") || "[]") : "[]");
      return { data: drafts, isMock: true };
    }
  },

  /**
   * Approves a draft outreach email.
   */
  async approveOutreachEmail(emailId: number): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/emails/${emailId}/approve`, {
        method: "POST"
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, simulating email approval.");
      const drafts = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_emails") || "[]") : "[]");
      const idx = drafts.findIndex((d: any) => Number(d.id) === Number(emailId));
      if (idx !== -1) {
        drafts[idx].status = "approved";
        
        // Log lead activity if possible
        const localLeads = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_leads") || "[]") : "[]");
        const lIdx = localLeads.findIndex((l: any) => Number(l.id) === Number(drafts[idx].lead_id));
        if (lIdx !== -1) {
          if (!localLeads[lIdx].activities) localLeads[lIdx].activities = [];
          localLeads[lIdx].activities.unshift({
            id: Date.now() + Math.random(),
            lead_id: drafts[idx].lead_id,
            type: "System",
            content: `Outreach email approved for dispatch: '${drafts[idx].subject}'.`,
            timestamp: new Date().toISOString()
          });
          if (typeof window !== "undefined") {
            localStorage.setItem("beonix_mock_leads", JSON.stringify(localLeads));
          }
        }
        
        if (typeof window !== "undefined") {
          localStorage.setItem("beonix_mock_emails", JSON.stringify(drafts));
        }
      }
      return { data: { success: true }, isMock: true };
    }
  },

  /**
   * Dispatches an outreach email via Gmail API simulation.
   */
  async sendOutreachEmail(emailId: number): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/emails/${emailId}/send`, {
        method: "POST"
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, simulating Gmail API send.");
      const drafts = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_emails") || "[]") : "[]");
      const idx = drafts.findIndex((d: any) => Number(d.id) === Number(emailId));
      if (idx !== -1) {
        drafts[idx].status = "sent";
        drafts[idx].sent_at = new Date().toISOString();
        
        const localLeads = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_leads") || "[]") : "[]");
        const lIdx = localLeads.findIndex((l: any) => Number(l.id) === Number(drafts[idx].lead_id));
        if (lIdx !== -1) {
          if (!localLeads[lIdx].activities) localLeads[lIdx].activities = [];
          localLeads[lIdx].activities.unshift({
            id: Date.now() + Math.random(),
            lead_id: drafts[idx].lead_id,
            type: "System",
            content: `Gmail API Sent Outreach email to ${localLeads[lIdx].email}: '${drafts[idx].subject}'.`,
            timestamp: new Date().toISOString()
          });
          if (typeof window !== "undefined") {
            localStorage.setItem("beonix_mock_leads", JSON.stringify(localLeads));
          }
        }
        
        if (typeof window !== "undefined") {
          localStorage.setItem("beonix_mock_emails", JSON.stringify(drafts));
        }
      }
      return { data: { success: true }, isMock: true };
    }
  },

  /**
   * Simulates a reply from the prospect and triggers score/column movements.
   */
  async simulateOutreachReply(emailId: number, sentiment: string): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/emails/${emailId}/simulate-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentiment })
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, simulating reply and stage updates locally.");
      const drafts = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_emails") || "[]") : "[]");
      const idx = drafts.findIndex((d: any) => Number(d.id) === Number(emailId));
      let updatedData = {};
      
      if (idx !== -1) {
        drafts[idx].status = "replied";
        drafts[idx].response_sentiment = sentiment;
        drafts[idx].replied_at = new Date().toISOString();
        
        let reply_text = "";
        let next_stage = "Contacted";
        let score_delta = 0;
        let followup_title = "Follow up";
        let followup_desc = "Review email thread.";
        
        if (sentiment === "positive") {
          reply_text = "Thanks for your outreach email! The Beonix OS custom pipeline specs sound exactly like what we need. Let's schedule a brief demo meeting next Tuesday afternoon.";
          next_stage = "Qualified";
          score_delta = 20;
          followup_title = "Schedule Demo Call";
          followup_desc = "Prospect responded positively. Set up a meeting link.";
        } else if (sentiment === "negative") {
          reply_text = "Please remove us from your mailing list. We are not interested in custom OS or dashboard tools.";
          next_stage = "Closed";
          score_delta = -15;
          followup_title = "Archive Lead";
          followup_desc = "Prospect is not interested. Mark lead as lost.";
        } else {
          reply_text = "Hello, I am currently out of office on business travel with delayed response times. I will review and get back to you next week.";
          next_stage = "Contacted";
          score_delta = 0;
          followup_title = "Re-check in 2 weeks";
          followup_desc = "Prospect sent a neutral or out-of-office response.";
        }
        
        drafts[idx].response_received = reply_text;
        
        const localLeads = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_leads") || "[]") : "[]");
        const lIdx = localLeads.findIndex((l: any) => Number(l.id) === Number(drafts[idx].lead_id));
        if (lIdx !== -1) {
          const oldStage = localLeads[lIdx].stage;
          const oldScore = localLeads[lIdx].score || 0;
          
          localLeads[lIdx].stage = next_stage;
          localLeads[lIdx].score = Math.max(0, Math.min(100, oldScore + score_delta));
          
          if (!localLeads[lIdx].activities) localLeads[lIdx].activities = [];
          localLeads[lIdx].activities.unshift({
            id: Date.now() + Math.random(),
            lead_id: drafts[idx].lead_id,
            type: "Email Response",
            content: `Prospect replied: "${reply_text}"`,
            timestamp: new Date().toISOString()
          });
          localLeads[lIdx].activities.unshift({
            id: Date.now() + Math.random() + 1,
            lead_id: drafts[idx].lead_id,
            type: "Stage Change",
            content: `Stage transitioned from '${oldStage}' to '${next_stage}' based on reply sentiment analysis (${sentiment.toUpperCase()}).`,
            timestamp: new Date().toISOString()
          });
          localLeads[lIdx].activities.unshift({
            id: Date.now() + Math.random() + 2,
            lead_id: drafts[idx].lead_id,
            type: "System",
            content: `Lead score adjusted from ${oldScore} to ${localLeads[lIdx].score} (delta ${score_delta > 0 ? '+' : ''}${score_delta}).`,
            timestamp: new Date().toISOString()
          });
          
          // Also create followup in mock followups
          const followups = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_followups") || "[]") : "[]");
          followups.push({
            id: Date.now() + Math.random(),
            lead_id: drafts[idx].lead_id,
            title: followup_title,
            description: followup_desc,
            followup_type: sentiment === "positive" ? "call" : "email",
            scheduled_at: new Date(Date.now() + 3600000 * 24 * (sentiment === "positive" ? 1 : 7)).toISOString(),
            status: "scheduled",
            created_at: new Date().toISOString()
          });
          
          if (typeof window !== "undefined") {
            localStorage.setItem("beonix_mock_leads", JSON.stringify(localLeads));
            localStorage.setItem("beonix_mock_followups", JSON.stringify(followups));
          }
        }
        
        if (typeof window !== "undefined") {
          localStorage.setItem("beonix_mock_emails", JSON.stringify(drafts));
        }
        
        updatedData = {
          success: true,
          sentiment,
          next_stage,
          new_score: score_delta,
          reply_text
        };
      }
      return { data: updatedData, isMock: true };
    }
  },

  /**
   * Updates a draft outreach email.
   */
  async updateOutreachEmail(emailId: number, subject: string, body: string): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/emails/${emailId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body })
      });
      if (!response.ok) throw new Error("API responded with an error");
      const data = await response.json();
      return { data, isMock: false };
    } catch (error) {
      console.warn("FastAPI server offline, simulating update locally.");
      const drafts = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_emails") || "[]") : "[]");
      const idx = drafts.findIndex((d: any) => Number(d.id) === Number(emailId));
      let updated = null;
      if (idx !== -1) {
        drafts[idx].subject = subject;
        drafts[idx].body = body;
        updated = drafts[idx];
        if (typeof window !== "undefined") {
          localStorage.setItem("beonix_mock_emails", JSON.stringify(drafts));
        }
      }
      return { data: updated, isMock: true };
    }
  },

  /**
   * Checks Gmail API integration status.
   */
  async getGmailStatus(): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/emails/gmail/status`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      return { data, isMock: false };
    } catch {
      const isConnected = typeof window !== "undefined" && localStorage.getItem("beonix_gmail_connected") === "true";
      const configPresent = typeof window !== "undefined" && !!localStorage.getItem("beonix_gmail_client_id");
      return {
        data: {
          connected: isConnected,
          email: isConnected ? (localStorage.getItem("beonix_gmail_address") || "sales@beonix.com") : null,
          client_id_configured: configPresent
        },
        isMock: true
      };
    }
  },

  /**
   * Saves Gmail client configurations locally or to API.
   */
  async saveGmailConfig(client_id: string, client_secret: string): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/emails/gmail/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id, client_secret })
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      return { data, isMock: false };
    } catch {
      if (typeof window !== "undefined") {
        localStorage.setItem("beonix_gmail_client_id", client_id);
        localStorage.setItem("beonix_gmail_client_secret", client_secret);
      }
      return { data: { success: true }, isMock: true };
    }
  },

  /**
   * Fetches Google OAuth authorization url.
   */
  async getGmailAuthUrl(): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/emails/gmail/auth-url`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      return { data, isMock: false };
    } catch {
      return {
        data: { auth_url: `${API_BASE_URL}/emails/gmail/callback?code=mock_code_sandbox` },
        isMock: true
      };
    }
  },

  /**
   * Disconnects the Gmail account.
   */
  async disconnectGmail(): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/emails/gmail/disconnect`, { method: "POST" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      return { data, isMock: false };
    } catch {
      if (typeof window !== "undefined") {
        localStorage.setItem("beonix_gmail_connected", "false");
        localStorage.removeItem("beonix_gmail_address");
      }
      return { data: { success: true }, isMock: true };
    }
  },

  /**
   * AI-powered email refinement.
   */
  async refineEmailWithAi(emailId: number, prompt: string): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/emails/${emailId}/ai-refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      return { data, isMock: false };
    } catch {
      const drafts = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_emails") || "[]") : "[]");
      const idx = drafts.findIndex((d: any) => Number(d.id) === Number(emailId));
      let updated = null;
      if (idx !== -1) {
        drafts[idx].subject = `[AI Refined] ${drafts[idx].subject}`;
        drafts[idx].body = `${drafts[idx].body}\n\n[AI Edit Suggestion (Prompt: "${prompt}")]: Adjusted messaging flow and added customized call to action.`;
        updated = drafts[idx];
        if (typeof window !== "undefined") {
          localStorage.setItem("beonix_mock_emails", JSON.stringify(drafts));
        }
      }
      return { data: updated, isMock: true };
    }
  },

  /**
   * Upload draft email attachments.
   */
  async uploadAttachment(emailId: number, file: File): Promise<{ data: any; isMock: boolean }> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_BASE_URL}/emails/${emailId}/attachments`, {
        method: "POST",
        body: formData
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      return { data, isMock: false };
    } catch {
      const mockAttachment = {
        id: Date.now() + Math.random(),
        filename: file.name,
        content_type: file.type || "application/octet-stream",
        created_at: new Date().toISOString()
      };
      
      const drafts = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_emails") || "[]") : "[]");
      const idx = drafts.findIndex((d: any) => Number(d.id) === Number(emailId));
      if (idx !== -1) {
        if (!drafts[idx].attachments) drafts[idx].attachments = [];
        drafts[idx].attachments.push(mockAttachment);
        if (typeof window !== "undefined") {
          localStorage.setItem("beonix_mock_emails", JSON.stringify(drafts));
        }
      }
      return { data: mockAttachment, isMock: true };
    }
  },

  /**
   * Deletes an email attachment.
   */
  async deleteAttachment(attachmentId: number): Promise<{ data: any; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/emails/attachments/${attachmentId}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      return { data, isMock: false };
    } catch {
      const drafts = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_emails") || "[]") : "[]");
      drafts.forEach((d: any) => {
        if (d.attachments) {
          d.attachments = d.attachments.filter((a: any) => Number(a.id) !== Number(attachmentId));
        }
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("beonix_mock_emails", JSON.stringify(drafts));
      }
      return { data: { success: true }, isMock: true };
    }
  },

  /**
   * Gets threaded conversation message list.
   */
  async getThreadMessages(emailId: number): Promise<{ data: any[]; isMock: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/emails/${emailId}/thread`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      return { data, isMock: false };
    } catch {
      // Local storage mock thread loader
      const key = `beonix_mock_thread_${emailId}`;
      const existing = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      if (existing) {
        return { data: JSON.parse(existing), isMock: true };
      }

      // Construct default messages list from draft status
      const drafts = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_emails") || "[]") : "[]");
      const draft = drafts.find((d: any) => Number(d.id) === Number(emailId));
      const thread: any[] = [];
      if (draft) {
        if (draft.status === "sent" || draft.status === "replied") {
          thread.push({
            id: 10000 + draft.id,
            sender: "user",
            subject: draft.subject,
            body: draft.body,
            created_at: draft.created_at
          });
        }
        if (draft.status === "replied" && draft.response_received) {
          thread.push({
            id: 20000 + draft.id,
            sender: "prospect",
            subject: `Re: ${draft.subject}`,
            body: draft.response_received,
            created_at: draft.created_at
          });
        }
      }
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(thread));
      }
      return { data: thread, isMock: true };
    }
  },

  /**
   * Sends a follow-up reply in a thread.
   */
  async sendThreadReply(emailId: number, body: string): Promise<{ data: any; isMock: boolean }> {
    try {
      const formData = new FormData();
      formData.append("body", body);
      const response = await fetch(`${API_BASE_URL}/emails/${emailId}/reply`, {
        method: "POST",
        body: formData
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      return { data, isMock: false };
    } catch {
      // Local Storage mock reply
      const drafts = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_emails") || "[]") : "[]");
      const draft = drafts.find((d: any) => Number(d.id) === Number(emailId));
      
      const newMsg = {
        id: Date.now(),
        sender: "user",
        subject: draft ? `Re: ${draft.subject}` : "Follow-up Outreach",
        body,
        created_at: new Date().toISOString()
      };

      const key = `beonix_mock_thread_${emailId}`;
      const thread = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem(key) || "[]") : "[]");
      thread.push(newMsg);
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(thread));
      }

      // Add to lead activities
      if (draft) {
        const localLeads = JSON.parse(typeof window !== "undefined" ? (localStorage.getItem("beonix_mock_leads") || "[]") : "[]");
        const idx = localLeads.findIndex((l: any) => Number(l.id) === Number(draft.lead_id));
        if (idx !== -1) {
          if (!localLeads[idx].activities) localLeads[idx].activities = [];
          localLeads[idx].activities.unshift({
            id: Date.now() + Math.random(),
            lead_id: draft.lead_id,
            type: "System",
            content: `Sent follow-up reply via Sandbox Simulator to ${localLeads[idx].email}: 'Re: ${draft.subject}'.`,
            timestamp: new Date().toISOString()
          });
          if (typeof window !== "undefined") {
            localStorage.setItem("beonix_mock_leads", JSON.stringify(localLeads));
          }
        }
      }

      return { data: newMsg, isMock: true };
    }
  }
};


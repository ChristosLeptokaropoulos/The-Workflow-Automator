export type Urgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Status = "NEW" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";

export interface Request {
  id: string;
  title: string;
  description: string;
  requester_name: string;
  requester_email: string;
  department: string | null;
  category: string | null;
  urgency: Urgency | null;
  routed_team: string | null;
  ai_summary: string | null;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface ClassificationResult {
  category: string;
  urgency: Urgency;
  routed_team: string;
  ai_summary: string;
  reasoning: string;
}

export interface SimilarRequest {
  id: string;
  title: string;
  description: string;
  category: string | null;
  urgency: string | null;
  routed_team: string | null;
  status: string | null;
  ai_summary: string | null;
  similarity: number;
}

import OpenAI from "openai";
import type { ClassificationResult } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function classifyRequest(
  title: string,
  description: string,
  department?: string
): Promise<ClassificationResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an internal request triage AI for a large pharmaceutical company.
Given a request title, description, and optionally department, classify it and return a JSON object with:

- "category": one of ["Dashboard/Report", "Tool/Application", "Process Improvement", "Data Request", "Integration", "Training", "Other"]
- "urgency": one of ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
- "routed_team": one of ["Data & Analytics", "Digital Solutions", "IT Operations", "Medical Affairs", "Commercial Tech", "HR Systems", "General"]
- "ai_summary": a concise 1-2 sentence summary of the request for the triage team
- "reasoning": brief explanation of why you classified it this way

URGENCY CLASSIFICATION RULES — read the full request carefully and infer urgency from CONTEXT, not just keywords:

CRITICAL — assign when ANY of these situations are present, even if the user does not say "critical" or "urgent":
  • Patient safety is at risk (adverse events, pharmacovigilance failures, contamination, dosing errors, safety signal detection)
  • Regulatory or compliance deadlines (FDA submissions, EMA inspections, audit findings, GxP violations, GDPR breaches)
  • Legal exposure (litigation hold, consent decree, warning letter response)
  • System outage or data loss affecting clinical trials, manufacturing, or drug safety databases
  • Product recall or supply chain failure impacting patient access to medication

HIGH — assign when ANY of these situations are present:
  • Revenue or commercial impact (launch delays, market access issues, pricing system failures)
  • Executive-level request or board-level visibility
  • Deadline within 1 week
  • Security incident (data breach, unauthorized access to sensitive data)
  • Clinical trial timeline at risk

MEDIUM — assign when:
  • The request is important but has no immediate deadline
  • Operational improvement with clear business value
  • Cross-team dependency but no patient/regulatory impact

LOW — assign when:
  • Nice-to-have, exploratory, or research phase
  • No stated deadline or business pressure
  • Minor enhancements or cosmetic changes

IMPORTANT: Users often understate urgency. Look for hidden signals in the description — mentions of FDA, EMA, patients, adverse events, recalls, audits, inspections, safety databases, GxP, clinical trials, or compliance deadlines should elevate urgency even if the title sounds routine.

Return ONLY valid JSON.`,
      },
      {
        role: "user",
        content: `Title: ${title}\n\nDescription: ${description}${department ? `\n\nDepartment: ${department}` : ""}`,
      },
    ],
  });

  return JSON.parse(
    response.choices[0].message.content!
  ) as ClassificationResult;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

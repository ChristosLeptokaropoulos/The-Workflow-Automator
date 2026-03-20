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
  - CRITICAL: patient safety, regulatory deadline, legal compliance
  - HIGH: revenue impact, executive request, < 1 week deadline
  - MEDIUM: important but no immediate deadline
  - LOW: nice-to-have, exploratory
- "routed_team": one of ["Data & Analytics", "Digital Solutions", "IT Operations", "Medical Affairs", "Commercial Tech", "HR Systems", "General"]
- "ai_summary": a concise 1-2 sentence summary of the request for the triage team
- "reasoning": brief explanation of why you classified it this way

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

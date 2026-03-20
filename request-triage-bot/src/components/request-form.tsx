"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const DEPARTMENTS = [
  "Marketing",
  "Medical Affairs",
  "Commercial",
  "HR",
  "Operations",
  "Finance",
  "IT",
  "Legal",
  "R&D",
  "Other",
];

interface SimilarRequest {
  id: string;
  title: string;
  similarity: number;
  status: string | null;
}

interface SubmissionResult {
  classification: {
    category: string;
    urgency: string;
    routed_team: string;
    ai_summary: string;
    reasoning: string;
  };
  similar_requests: SimilarRequest[];
}

export function RequestForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      requester_name: formData.get("requester_name") as string,
      requester_email: formData.get("requester_email") as string,
      department: formData.get("department") as string,
    };

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit request");
      }

      const data = await res.json();
      setResult({
        classification: data.classification,
        similar_requests: data.similar_requests || [],
      });
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit a Request</CardTitle>
          <CardDescription>
            Describe what you need in plain English. AI will classify,
            prioritize, and route it to the right team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requester_name">Your Name</Label>
                <Input id="requester_name" name="requester_name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requester_email">Email</Label>
                <Input
                  id="requester_email"
                  name="requester_email"
                  type="email"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                name="department"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select department...</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Request Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Dashboard to track Q3 HCP engagement"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={5}
                placeholder="Describe what you need, who it's for, and any deadlines..."
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Analyzing & submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-destructive">{error}</CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400">
              ✅ Request Submitted & Classified
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Category:</span>{" "}
                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded dark:bg-blue-900 dark:text-blue-200">
                  {result.classification.category}
                </span>
              </div>
              <div>
                <span className="font-semibold">Urgency:</span>{" "}
                <span
                  className={`ml-1 px-2 py-0.5 rounded font-semibold ${
                    result.classification.urgency === "CRITICAL"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : result.classification.urgency === "HIGH"
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                        : result.classification.urgency === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  }`}
                >
                  {result.classification.urgency}
                </span>
              </div>
              <div>
                <span className="font-semibold">Routed to:</span>{" "}
                {result.classification.routed_team}
              </div>
            </div>
            <div className="text-sm">
              <span className="font-semibold">AI Summary:</span>{" "}
              {result.classification.ai_summary}
            </div>
            {result.classification.reasoning && (
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold">Reasoning:</span>{" "}
                {result.classification.reasoning}
              </div>
            )}

            {result.similar_requests.length > 0 && (
              <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-sm mb-2">
                  📋 Similar Past Requests:
                </h4>
                <ul className="space-y-2">
                  {result.similar_requests.map((req) => (
                    <li
                      key={req.id}
                      className="text-sm bg-white dark:bg-zinc-900 p-3 rounded border"
                    >
                      <span className="font-medium">{req.title}</span>
                      <span className="text-muted-foreground ml-2">
                        ({Math.round(req.similarity * 100)}% similar)
                      </span>
                      {req.status && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
                          {req.status.replace("_", " ")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SimilarRequest } from "@/lib/types";

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SimilarRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    setResults(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Semantic Similarity Search</CardTitle>
          <CardDescription>
            Describe what you need. AI will find past requests that are
            semantically similar — even if the wording is different.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            rows={3}
            placeholder="e.g. I need a way to track marketing campaign performance across regions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading ? "Searching..." : "Find Similar Requests"}
          </Button>
        </CardContent>
      </Card>

      {searched && !loading && results.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No similar requests found. This looks like a new ask!
          </CardContent>
        </Card>
      )}

      {results.map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{r.title}</CardTitle>
              <Badge variant="outline">
                {Math.round(r.similarity * 100)}% match
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              {r.ai_summary || r.description}
            </p>
            <div className="flex gap-3">
              {r.category && <Badge variant="secondary">{r.category}</Badge>}
              {r.urgency && <Badge variant="secondary">{r.urgency}</Badge>}
              {r.status && (
                <Badge variant="secondary">
                  {r.status.replace("_", " ")}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

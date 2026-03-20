import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          🎯 Internal Request Triage Bot
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Submit requests in plain English. AI classifies, prioritizes, and
          routes them to the right team — automatically.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/submit">
            <Button size="lg">Submit a Request</Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">
              View Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📝 Smart Intake</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No dropdown mazes. Just describe what you need and AI handles
            classification, urgency detection, and team routing.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">⚡ Auto-Routing</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            N8N automation triggers instant alerts for critical requests and
            queues normal ones — no manual triage needed.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🔍 Duplicate Detection</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Vector embeddings find semantically similar past requests, even when
            the wording is completely different.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

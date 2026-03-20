import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { classifyRequest, generateEmbedding } from "@/lib/openai";

// POST — Submit a new request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, requester_name, requester_email, department } =
      body;

    if (!title || !description || !requester_name || !requester_email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. AI Classification (includes department for better context)
    const classification = await classifyRequest(title, description, department);

    // 2. Generate embedding for similarity search
    const embedding = await generateEmbedding(`${title} ${description}`);

    // 3. Store in Supabase
    const { data: insertedRequest, error: insertError } = await supabaseAdmin
      .from("requests")
      .insert({
        title,
        description,
        requester_name,
        requester_email,
        department,
        category: classification.category,
        urgency: classification.urgency,
        routed_team: classification.routed_team,
        ai_summary: classification.summary,
        embedding: JSON.stringify(embedding),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 4. Find similar past requests (filter out the one we just inserted)
    const { data: similarRequests } = await supabaseAdmin.rpc(
      "match_requests",
      {
        query_embedding: JSON.stringify(embedding),
        match_threshold: 0.7,
        match_count: 6,
      }
    );

    const filteredSimilar = (similarRequests || []).filter(
      (r: { id: string }) => r.id !== insertedRequest.id
    ).slice(0, 5);

    // 5. Send to N8N webhook (fire-and-forget)
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nUrl) {
      fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: insertedRequest.id,
          title,
          description,
          requester_name,
          requester_email,
          department,
          ...classification,
        }),
      }).catch(console.error);
    }

    return NextResponse.json(
      {
        success: true,
        request_id: insertedRequest.id,
        classification: {
          category: classification.category,
          urgency: classification.urgency,
          routed_team: classification.routed_team,
          ai_summary: classification.summary,
          reasoning: classification.reasoning,
        },
        similar_requests: filteredSimilar,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating request:", err);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}

// GET — List all requests with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const urgency = searchParams.get("urgency");
    const category = searchParams.get("category");

    let query = supabaseAdmin
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (urgency) query = query.eq("urgency", urgency);
    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching requests:", err);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateEmbedding } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query string is required" },
        { status: 400 }
      );
    }

    // Generate embedding for the search query
    const embedding = await generateEmbedding(query);

    // Search for similar requests using the Supabase RPC function
    const { data, error } = await supabaseAdmin.rpc("match_requests", {
      query_embedding: JSON.stringify(embedding),
      match_threshold: 0.3,
      match_count: 10,
    });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error searching requests:", err);
    return NextResponse.json(
      { error: "Failed to search requests" },
      { status: 500 }
    );
  }
}

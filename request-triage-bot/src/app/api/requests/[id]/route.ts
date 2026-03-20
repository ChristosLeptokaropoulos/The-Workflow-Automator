import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const validStatuses = ["NEW", "IN_PROGRESS", "COMPLETED", "REJECTED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error:
            "Invalid status. Must be one of: " + validStatuses.join(", "),
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("requests")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error updating request:", err);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}

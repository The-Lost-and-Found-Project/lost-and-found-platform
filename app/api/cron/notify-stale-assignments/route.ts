import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ retired: true, workflow: "prayer-care-assignments" });
}

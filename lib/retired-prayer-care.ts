import { NextResponse } from "next/server";

export function retiredPrayerCareResponse() {
  return NextResponse.json(
    { error: "This legacy Prayer Care workflow has been retired. Use the Community Prayer pages instead." },
    { status: 410 }
  );
}

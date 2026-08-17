import { NextResponse } from "next/server";

export function retiredEmailResponse(workflow: string) {
  return NextResponse.json(
    {
      retired: true,
      workflow,
      message: "This direct email workflow has been retired. Current updates use the Community App notification system.",
    },
    { status: 410 },
  );
}

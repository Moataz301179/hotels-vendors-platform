import { NextResponse } from "next/server";
import { getActor } from "@/lib/v2-auth";
import { loadHome, type PhoneActor } from "@/lib/mobile/phone-work";

/** Role home: membership, permissions, tasks, and the server's next proposal. */
export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  return NextResponse.json(await loadHome(actor as PhoneActor));
}

import { NextResponse } from "next/server";
import { getActor } from "@/lib/v2-auth";
import { loadSession, type PhoneActor } from "@/lib/mobile/phone-work";

/** The phone asks the server which workspace this account owns. */
export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  return NextResponse.json(await loadSession(actor as PhoneActor));
}

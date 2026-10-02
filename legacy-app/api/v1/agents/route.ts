/**
 * /api/v1/agents
 * GET — returns the live catalog of the 8 real swarm agents
 * (id/name/role/avatar/color/capabilities) straight from lib/agents/agents.ts.
 * No hardcoded catalog in the UI — the frontend renders whatever the API returns.
 */

import { NextResponse } from "next/server";
import { AGENTS } from "@/lib/agents/agents";

export const GET = async () => {
  try {
    const agents = Object.values(AGENTS).map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      avatar: a.avatar,
      color: a.color,
      capabilities: a.capabilities,
    }));

    return NextResponse.json({ success: true, agents }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load agent catalog" },
      { status: 500 }
    );
  }
};
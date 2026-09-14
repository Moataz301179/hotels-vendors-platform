import { getSessionToken, verifySession } from "@/lib/session";

export interface ServerSession {
  user?: {
    id: string;
    tenantId: string;
    role: string;
    platformRole: string;
  };
}

export async function getServerSession(): Promise<ServerSession | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const payload = await verifySession(token);
  if (!payload) return null;

  return {
    user: {
      id: payload.userId,
      tenantId: payload.tenantId,
      role: payload.platformRole,
      platformRole: payload.platformRole,
    },
  };
}

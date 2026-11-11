"use client";

import { useEffect, useState } from "react";
import { requestJson } from "@/lib/v2-http";

type Pool = { id: string; label: string; purpose: string; permissions: string[] };
type Member = { id: string; name: string; email: string; organizationRole: string; accessPoolId: string | null };
type AccessResponse = { pillar: string; accountAdmin: boolean; pools: Pool[]; members: Member[] };

const PILLAR_LABEL: Record<string, string> = { HOTEL: "Hotel", SUPPLIER: "Vendor", SHIPPING: "Carrier", FACTORING: "Funder" };

export function OrganizationAccessPanel() {
  const [data, setData] = useState<AccessResponse | null>(null);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function load() {
    const next = await requestJson<AccessResponse>("/api/v2/organization/access");
    setData(next);
    setChoice(Object.fromEntries(next.members.map((member) => [member.id, member.accessPoolId ?? next.pools[0]?.id ?? ""])));
  }

  useEffect(() => { void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Access settings are unavailable.")); }, []);

  async function apply(userId: string) {
    const poolId = choice[userId];
    if (!poolId) return;
    setMessage("");
    try {
      await requestJson("/api/v2/organization/access", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId, poolId }) });
      setMessage("The access choice was saved and audited.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The access choice was not saved.");
    }
  }

  if (!data) return <section className="card" style={{ padding: 24, marginTop: 16 }}><p className="muted">{message || "Loading access recommendations…"}</p></section>;

  return <section className="card" style={{ padding: 24, marginTop: 16 }}>
    <h2>{PILLAR_LABEL[data.pillar] ?? data.pillar} access</h2>
    <p className="muted">The account admin chooses one recommended access pool for each member. Placing a request and accepting an order are separate choices. A member cannot receive access outside this account.</p>
    <div style={{ display: "grid", gap: 12, marginTop: 16 }}>{data.pools.map((pool) => <div key={pool.id}><strong>{pool.label}</strong><p className="muted">{pool.purpose}</p></div>)}</div>
    {data.accountAdmin ? <div style={{ display: "grid", gap: 14, marginTop: 18 }}>{data.members.filter((member) => member.organizationRole !== "OWNER").map((member) => <form key={member.id} className="workspace-form" onSubmit={(event) => { event.preventDefault(); void apply(member.id); }}>
      <div><strong>{member.name}</strong><p className="muted">{member.email}</p></div>
      <label>Recommended access<select value={choice[member.id] ?? ""} onChange={(event) => setChoice((current) => ({ ...current, [member.id]: event.target.value }))}>{data.pools.map((pool) => <option key={pool.id} value={pool.id}>{pool.label}</option>)}</select></label>
      <button className="btn btn-blue" type="submit">Save access</button>
    </form>)}{data.members.filter((member) => member.organizationRole !== "OWNER").length === 0 && <p className="muted">No other active member is in this account yet. The account admin keeps both request and acceptance authority until a member is added.</p>}</div> : <p className="muted">Only the account admin can change these choices.</p>}
    {message && <p role="status">{message}</p>}
  </section>;
}

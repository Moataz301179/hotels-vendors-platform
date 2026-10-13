"use client";
import { useState } from "react";
import AppShell, { RequireAuth } from "@/components/AppShell";
import { Card, PageHead, Btn, T, Th, Td } from "@/components/ui";
import { useApi } from "@/lib/hooks/use-api";
interface Ticket { id: string; tenantId: string; subject: string; category: string; priority: string; status: string; createdAt: string }
interface Tickets { tickets: Ticket[]; pagination: { page: number; total: number; totalPages: number } }
export default function AdminSupportPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const result = useApi<Tickets>(`/api/v1/admin/support/tickets?page=${page}&limit=20${filter ? `&status=${filter}` : ""}`);
  return <RequireAuth><AppShell active="/admin/support"><PageHead title="Support queue" sub="Platform-wide ticket metadata. Customer messages and contact details are not exposed here." />
    <div className="flex items-center gap-3"><label htmlFor="ticket-status">Status</label><select id="ticket-status" value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }} className="rounded border p-2">{["", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(value => <option key={value} value={value}>{value || "All"}</option>)}</select><Btn onClick={() => result.refetch()}>Refresh</Btn></div>
    {result.loading ? <p role="status">Loading tickets…</p> : null}{result.error ? <p role="alert">{result.error}</p> : null}
    {result.data ? <Card className="mt-5 overflow-x-auto"><T><thead><tr><Th>Subject</Th><Th>Organization ID</Th><Th>Category</Th><Th>Priority</Th><Th>Status</Th><Th>Created</Th></tr></thead><tbody>{result.data.tickets.map(ticket => <tr key={ticket.id}><Td>{ticket.subject}</Td><Td>{ticket.tenantId}</Td><Td>{ticket.category}</Td><Td>{ticket.priority}</Td><Td>{ticket.status}</Td><Td>{new Date(ticket.createdAt).toLocaleDateString()}</Td></tr>)}</tbody></T>{!result.data.tickets.length ? <p className="p-5">No tickets match these filters.</p> : null}<div className="flex items-center gap-3 p-5"><Btn disabled={page <= 1 || result.loading} onClick={() => setPage(page - 1)}>Previous</Btn><p>Page {page} · {result.data.pagination.total} tickets</p><Btn disabled={page >= result.data.pagination.totalPages || result.loading} onClick={() => setPage(page + 1)}>Next</Btn></div></Card> : null}
  </AppShell></RequireAuth>;
}

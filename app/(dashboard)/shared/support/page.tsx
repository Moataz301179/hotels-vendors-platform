"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LifeBuoy,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Bot,
  Send,
  Plus,
  X,
  RefreshCw,
} from "lucide-react";
import { LoadingTable } from "@/components/dashboards/shared/loading-card";
import { EmptyState } from "@/components/dashboards/shared/empty-state";

// ─── Types ───────────────────────────────────────────────

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  agentResponse: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

interface TicketsResponse {
  tickets: SupportTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type Category = "BILLING" | "TECHNICAL" | "ORDER" | "SUPPLIER" | "FACTORING" | "ETA" | "OTHER";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// ─── Badges ──────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; bg: string; dot: string }> = {
    OPEN: { text: "Open", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", dot: "bg-blue-400" },
    IN_PROGRESS: { text: "In Progress", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
    RESOLVED: { text: "Resolved", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
    CLOSED: { text: "Closed", bg: "bg-gray-500/10 text-gray-400 border-gray-500/20", dot: "bg-gray-400" },
  };
  const c = config[status] || config.OPEN;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.text}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { text: string; bg: string }> = {
    URGENT: { text: "Urgent", bg: "bg-red-500/10 text-red-400 border-red-500/20" },
    HIGH: { text: "High", bg: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    MEDIUM: { text: "Medium", bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    LOW: { text: "Low", bg: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  };
  const c = config[priority] || config.LOW;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${c.bg}`}>
      {c.text}
    </span>
  );
}

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "BILLING", label: "Billing" },
  { value: "TECHNICAL", label: "Technical Issue" },
  { value: "ORDER", label: "Order" },
  { value: "SUPPLIER", label: "Supplier" },
  { value: "FACTORING", label: "Factoring" },
  { value: "ETA", label: "ETA Compliance" },
  { value: "OTHER", label: "Other" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

// ─── Ticket Detail Modal ─────────────────────────────────

function TicketDetailModal({ ticket, onClose }: { ticket: SupportTicket; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-1 border border-border-subtle rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between p-5 border-b border-border-subtle">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{ticket.subject}</h2>
            <p className="text-xs text-foreground-muted mt-1 flex items-center gap-1.5">
              <Clock size={12} /> Created {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="ml-3 p-1.5 rounded-lg hover:bg-white/5 text-foreground-muted">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {ticket.agentResponse && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-1.5 flex items-center gap-1.5">
                <Bot size={14} /> AI Agent Response
              </h3>
              <p className="text-sm text-foreground-secondary bg-purple-500/5 rounded-lg p-3 border border-purple-500/10 whitespace-pre-wrap">
                {ticket.agentResponse}
              </p>
            </div>
          )}
          {ticket.resolution && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Resolution
              </h3>
              <p className="text-sm text-emerald-400 bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10 whitespace-pre-wrap">
                {ticket.resolution}
              </p>
            </div>
          )}
          {ticket.resolvedAt && (
            <p className="text-xs text-foreground-muted text-center">
              Resolved on {new Date(ticket.resolvedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Create Ticket Form ──────────────────────────────────

function CreateTicketForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("TECHNICAL");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 5) {
      setSubmitError("Subject must be at least 5 characters");
      return;
    }
    if (description.trim().length < 10) {
      setSubmitError("Description must be at least 10 characters");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/v1/support/ticket", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          category,
          priority,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          route: typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      onCreated();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-1 border border-border-subtle rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <h2 className="text-lg font-semibold text-foreground">Submit a Support Ticket</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-foreground-muted">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-1.5 block">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your issue"
              maxLength={200}
              className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:border-accent-light"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-1.5 block">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-light"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-1.5 block">Priority *</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-light"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-1.5 block">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe your issue in detail. Include any error messages, steps to reproduce, etc."
              maxLength={10000}
              className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:border-accent-light resize-y"
            />
          </div>
          {submitError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertTriangle size={14} /> {submitError}</p>
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface-2 border border-border-subtle rounded-lg text-sm font-medium text-foreground-muted hover:bg-surface-3 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-accent-base text-white rounded-lg text-sm font-semibold hover:bg-accent-light transition-colors disabled:opacity-50"
            >
              {submitting ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────

export default function UserSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/support/ticket?limit=50", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setTickets(json.data.tickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LifeBuoy size={24} className="text-accent-light" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Support Center</h1>
            <p className="text-xs text-foreground-muted">Get help with billing, orders, technical issues, and more</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTickets}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-border-subtle rounded-lg text-xs font-medium text-foreground-secondary hover:bg-surface-3 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent-base text-white rounded-lg text-xs font-semibold hover:bg-accent-light transition-colors"
          >
            <Plus size={14} />
            New Ticket
          </button>
        </div>
      </div>

      {/* Tickets list */}
      {loading ? (
        <LoadingTable rows={4} />
      ) : error ? (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-center">
          <AlertTriangle size={24} className="text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={fetchTickets} className="mt-3 text-xs text-foreground-muted underline">Try again</button>
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No support tickets yet"
          description="Need help? Create a support ticket and our AI agent will respond immediately."
          icon="inbox"
          action={
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-base text-white rounded-lg text-sm font-semibold hover:bg-accent-light transition-colors"
            >
              <Plus size={16} />
              Create Your First Ticket
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="bg-surface-1 border border-border-subtle rounded-xl p-4 hover:border-border-visible cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                    <span className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted px-1.5 py-0.5 bg-surface-2 rounded">
                      {ticket.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-foreground truncate">{ticket.subject}</h3>
                  {ticket.agentResponse && (
                    <p className="text-xs text-foreground-muted mt-1.5 flex items-center gap-1.5 line-clamp-1">
                      <Bot size={12} className="shrink-0" />
                      {ticket.agentResponse.slice(0, 120)}
                      {ticket.agentResponse.length > 120 ? "..." : ""}
                    </p>
                  )}
                  {ticket.resolution && (
                    <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1.5 line-clamp-1">
                      <CheckCircle2 size={12} className="shrink-0" />
                      {ticket.resolution.slice(0, 120)}
                      {ticket.resolution.length > 120 ? "..." : ""}
                    </p>
                  )}
                </div>
                <span className="text-xs text-foreground-muted whitespace-nowrap shrink-0">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <CreateTicketForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            fetchTickets();
          }}
        />
      )}

      {/* Detail modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}

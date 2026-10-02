"use client";

import { CalendarDays, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";

interface CalendarEvent {
  id: string;
  title: string;
  date: number;
  status: "draft" | "scheduled" | "published";
  channel: string;
}

const DAYS_IN_JULY = 31;
const START_DAY = 2; // Wednesday (0=Sun, 2=Tue... wait, July 1 2026 is Wednesday)
const MONTH_NAME = "July 2026";
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENTS: CalendarEvent[] = [
  { id: "1", title: "Supplier Onboarding Email", date: 3, status: "published", channel: "Email" },
  { id: "2", title: "LinkedIn: Shark-Breaker Post", date: 5, status: "published", channel: "LinkedIn" },
  { id: "3", title: "Blog: ETA Compliance Guide", date: 8, status: "scheduled", channel: "Blog" },
  { id: "4", title: "Twitter Thread: Storage-to-Revenue", date: 10, status: "scheduled", channel: "Twitter" },
  { id: "5", title: "Hotel Partner Newsletter", date: 12, status: "draft", channel: "Email" },
  { id: "6", title: "LinkedIn: Case Study Carousel", date: 15, status: "draft", channel: "LinkedIn" },
  { id: "7", title: "Facebook Ad: Coastal Cluster", date: 18, status: "draft", channel: "Facebook" },
  { id: "8", title: "SME Supplier Summit Announcement", date: 20, status: "scheduled", channel: "LinkedIn + Email" },
  { id: "9", title: "Blog: Factoring for Hotels", date: 22, status: "draft", channel: "Blog" },
  { id: "10", title: "Twitter: Platform Milestone", date: 25, status: "draft", channel: "Twitter" },
  { id: "11", title: "Monthly Performance Report", date: 28, status: "draft", channel: "Internal" },
  { id: "12", title: "Q3 Content Review", date: 30, status: "draft", channel: "Internal" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  published: { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  scheduled: { bg: "bg-blue-500/15", text: "text-blue-400", dot: "bg-blue-400" },
  draft: { bg: "bg-surface-2", text: "text-foreground-muted", dot: "bg-surface-1" },
};

export default function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const eventsOnDay = (day: number) => EVENTS.filter((e) => e.date === day);
  const selectedEvents = selectedDay !== null ? eventsOnDay(selectedDay) : [];

  const publishedCount = EVENTS.filter((e) => e.status === "published").length;
  const scheduledCount = EVENTS.filter((e) => e.status === "scheduled").length;
  const draftCount = EVENTS.filter((e) => e.status === "draft").length;

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      <PageHeader
        title="Content Calendar"
        description="Schedule and manage content across all channels"
        action={
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-500)] text-white text-sm font-medium hover:bg-[var(--accent-600)] transition-colors">
            <Plus className="w-4 h-4" />
            Add Content
          </button>
        }
      />

      {/* Status Summary */}
      <div className="flex items-center gap-4 text-[12px]">
        {[
          { label: "Published", count: publishedCount, style: STATUS_STYLES.published },
          { label: "Scheduled", count: scheduledCount, style: STATUS_STYLES.scheduled },
          { label: "Draft", count: draftCount, style: STATUS_STYLES.draft },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${s.style.dot}`} />
            <span className="text-foreground-muted">
              {s.label}: <span className="text-foreground-secondary font-medium">{s.count}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* Calendar Grid */}
        <SectionCard title={MONTH_NAME}>
          <div className="flex items-center justify-between mb-4">
            <button className="p-1.5 rounded-lg hover:bg-surface-2 text-foreground-muted hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[13px] font-semibold text-white">{MONTH_NAME}</span>
            <button className="p-1.5 rounded-lg hover:bg-surface-2 text-foreground-muted hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[10px] text-foreground-muted uppercase py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: START_DAY }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Day cells */}
            {Array.from({ length: DAYS_IN_JULY }).map((_, i) => {
              const day = i + 1;
              const dayEvents = eventsOnDay(day);
              const isSelected = selectedDay === day;
              const isToday = day === 27; // July 27, 2026

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-start gap-0.5 transition-all text-left w-full ${
                    isSelected
                      ? "bg-[var(--accent-500)]/20 border border-[var(--accent-500)]/40"
                      : isToday
                        ? "bg-surface-2 border border-border-subtle"
                        : "hover:bg-surface-2 border border-transparent"
                  }`}
                >
                  <span className={`text-[11px] font-medium ${isToday ? "text-[var(--accent-400)]" : "text-foreground-tertiary"}`}>
                    {day}
                  </span>
                  <div className="flex gap-0.5 flex-wrap justify-center">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div key={e.id} className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[e.status].dot}`} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* Selected Day Events */}
        <SectionCard title={selectedDay ? `July ${selectedDay}` : "Select a Day"}>
          {selectedEvents.length > 0 ? (
            <div className="space-y-2.5">
              {selectedEvents.map((event) => {
                const style = STATUS_STYLES[event.status];
                return (
                  <div key={event.id} className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-white">{event.title}</p>
                        <p className="text-[11px] text-foreground-muted mt-0.5">{event.channel}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${style.bg} ${style.text}`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="w-8 h-8 text-foreground-muted mb-3" />
              <p className="text-[12px] text-foreground-muted">
                {selectedDay ? "No content scheduled" : "Click a date to see content"}
              </p>
            </div>
          )}

          {/* Upcoming Items */}
          <div className="mt-6 pt-4 border-t border-border-subtle">
            <h4 className="text-[11px] text-foreground-muted uppercase tracking-wider mb-3">Upcoming This Week</h4>
            <div className="space-y-2">
              {EVENTS.filter((e) => e.date >= 27 && e.date <= 31).map((event) => {
                const style = STATUS_STYLES[event.status];
                return (
                  <div key={event.id} className="flex items-center gap-2.5 py-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-foreground-secondary truncate">{event.title}</p>
                    </div>
                    <span className="text-[10px] text-foreground-muted">Jul {event.date}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

import type { PhoneProposal, PhoneTask } from "../api/hovin";

export function hrefForProposal(proposal: PhoneProposal) {
  if (proposal.action === "receive" && proposal.targetId) return `/receive/${proposal.targetId}`;
  if ((proposal.action === "confirm-code" || proposal.action === "track") && proposal.targetId) return `/order/${proposal.targetId}`;
  if (proposal.action === "respond" && proposal.targetId) return `/respond/${proposal.targetId}`;
  if (proposal.action === "compare") return "/quotes";
  if (proposal.action === "request") return "/catalog";
  if (proposal.action === "desk") return "/desk";
  return null;
}

export function hrefForTask(task: PhoneTask) {
  if (task.module === "receive") return `/receive/${task.targetId}`;
  if (task.module === "quotes") return "/quotes";
  if (task.module === "respond") return `/respond/${task.targetId}`;
  if (task.module === "tracking" || task.module === "code" || task.module === "fulfill") return `/order/${task.targetId}`;
  return null;
}

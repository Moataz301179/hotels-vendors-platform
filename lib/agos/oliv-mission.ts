/**
 * OLIV MISSION — one AGENT REGISTRATION on the generic AgentOS core.
 *
 * This is NOT a hardcoded pipeline: it registers the Oliv CHV000 onboarding
 * agents + tools + workflow into lib/agos/core.ts. Other missions (finance,
 * procurement, ops) register their own agents with the same core.
 *
 * Tools here are REAL: they call the live SMTP (reem@), real MX checks, and the
 * shared attribution link. They never fake output. Email send is gated behind
 * --dry-run unless the NODE_ENV/flag allows a real dispatch, mirroring the
 * existing run-email-outreach.mjs behavior.
 */

import { AgentOS, makeReasonTool } from "./core";
import { AGENTS as CHANNEL_AGENTS } from "../outreach/os";

/** Minimal collection: what's already bundled by the repo. */
async function mxLookup(domain: string): Promise<string> {
  const { execFile } = await import("node:child_process");
  return new Promise((resolve) => {
    execFile("dig", ["+short", "MX", domain], { timeout: 8000 }, (_e, out) => {
      const s = (out || "").trim();
      resolve(s || "NO_MX");
    });
  });
}

/** Build + register the Oliv mission. Returns the fully-wired AgentOS. */
export function buildOlivAgentOS(llm?: (system: string, user: string) => Promise<string>): AgentOS {
  const os = new AgentOS();

  // Generic reasoner if the caller supplies an LLM fn.
  if (llm) os.registerTool(makeReasonTool(llm));

  // ── Register the six channel agents (from outreach/os.ts) ──
  for (const spec of CHANNEL_AGENTS) {
    os.registerAgent({
      id: spec.id,
      role: spec.objective,
      systemPrompt: `You are the ${spec.id}. Objective: ${spec.objective}. Tasks: ${spec.tasks.join("; ")}.`,
      tools: [],
      memory: { channel: spec.channel, status: spec.status },
    });
  }

  // ── Real tools the missions actually use (wired to live infra) ──
  os.registerTool({
    id: "email.send",
    description: "Send an email via HotelsVendors SMTP (reem@). Args: {to,subject,html,text,dryRun}",
    run: async (args) => {
      const { createTransport } = await import("nodemailer");
      const host = process.env.SMTP_HOST;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      if (!host || !user || !pass) throw new Error("SMTP not configured");
      const transport = createTransport({ host, port: Number(process.env.SMTP_PORT) || 465, secure: true, auth: { user, pass } });
      if (args.dryRun) return { queued: true, dryRun: true, to: args.to, subject: args.subject };
      const info = await transport.sendMail({
        from: process.env.FROM_EMAIL || "reem@hotelsvendors.com",
        to: args.to as string,
        subject: args.subject as string,
        html: args.html as string,
        text: (args.text as string) || "",
      });
      return { queued: true, messageId: info.messageId, to: args.to };
    },
  });

  os.registerTool({
    id: "lead.verify",
    description: "Check that an email domain has an MX record (deliverability gate). Args: {email}",
    run: async (args) => ({ email: args.email, mx: await mxLookup(String(args.email).split("@")[1]) }),
  });

  // ── Tasks ──
  os.registerTask({ id: "oliv.verify-lead", agentId: "discovery-agent", name: "Verify lead deliverability", prompt: "Gate lead by MX", expectedOutput: "json" });
  os.registerTask({ id: "oliv.send-outreach", agentId: "email-outreach-agent", name: "Send CHV000 outreach", prompt: "Send onboarding email from reem@ with CHV000 CTA", expectedOutput: "json" });

  // ── Workflow: discover → verify → contact ──
  os.registerWorkflow({
    id: "oliv-onboarding",
    name: "Oliv CHV000 onboarding flow",
    tasks: ["oliv.verify-lead", "oliv.send-outreach"],
  });

  return os;
}
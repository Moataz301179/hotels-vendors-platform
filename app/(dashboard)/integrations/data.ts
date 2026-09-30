// Stub data for integrations page — imported locally so the page no longer depends
// on lib/stubs-export. This data is hardcoded for demonstration of the UI layout.
// In production, replace with data from the real /api/v1/integrations/providers endpoint.

export const INTEGRATIONS = [
  { id: "oracle-opera", name: "Oracle OPERA", type: "erp", status: "disconnected", description: "Property Management System — occupancy, minibar, consumption tracking" },
  { id: "sap", name: "SAP S/4HANA", type: "erp", status: "disconnected", description: "Enterprise ERP — budget checks, 3-way matching, GL tagging" },
  { id: "dynamics", name: "Microsoft Dynamics 365", type: "erp", status: "disconnected", description: "ERP & CRM — PO sync, invoice automation, financial reporting" },
  { id: "coupa", name: "Coupa", type: "punchout", status: "disconnected", description: "Procurement platform — cXML/OCI punchout, catalog integration" },
  { id: "eta", name: "ETA e-Invoicing", type: "eta", status: "disconnected", description: "Egyptian Tax Authority e-invoicing compliance bridge" },
  { id: "webhook", name: "Webhooks", type: "webhook", status: "connected", description: "Real-time event notifications dispatched to registered endpoints" },
  { id: "csv", name: "CSV / FTP Portal", type: "csv", status: "disconnected", description: "Legacy system bulk data exchange without REST APIs" },
];

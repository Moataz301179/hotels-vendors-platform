export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type LeadSource = 'website' | 'referral' | 'cold-outreach' | 'trade-show' | 'partner' | 'advertisement';

export interface Lead {
  id: string;
  companyName: string;
  companyNameAr: string;
  contactName: string;
  contactNameAr: string;
  email: string;
  phone: string;
  city: string;
  cityAr: string;
  type: 'hotel' | 'supplier' | 'partner' | 'carrier';
  status: LeadStatus;
  source: LeadSource;
  estimatedValue: number;
  assignedTo: string;
  notes: string;
  createdAt: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
}

export interface Campaign {
  id: string;
  name: string;
  nameAr: string;
  type: 'email' | 'whatsapp' | 'cold-call' | 'event';
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetSegment: string;
  totalLeads: number;
  contacted: number;
  responded: number;
  converted: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  nameAr: string;
  order: number;
  probability: number;
  color: string;
}

export interface CRMDashboardStats {
  totalLeads: number;
  newLeadsThisMonth: number;
  conversionRate: number;
  pipelineValue: number;
  wonValueThisMonth: number;
  activeCampaigns: number;
  leadsByStatus: Record<LeadStatus, number>;
  leadsByType: Record<string, number>;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'new', name: 'New', nameAr: 'جديد', order: 0, probability: 10, color: '#6B7280' },
  { id: 'contacted', name: 'Contacted', nameAr: 'تم التواصل', order: 1, probability: 25, color: '#3B82F6' },
  { id: 'qualified', name: 'Qualified', nameAr: 'مؤهل', order: 2, probability: 40, color: '#8B5CF6' },
  { id: 'proposal', name: 'Proposal Sent', nameAr: 'تم إرسال العرض', order: 3, probability: 60, color: '#F59E0B' },
  { id: 'negotiation', name: 'Negotiation', nameAr: 'تفاوض', order: 4, probability: 75, color: '#EF4444' },
  { id: 'won', name: 'Won', nameAr: 'مغلق - ناجح', order: 5, probability: 100, color: '#10B981' },
  { id: 'lost', name: 'Lost', nameAr: 'مغلق - خاسر', order: 6, probability: 0, color: '#6B7280' },
];

export const SAMPLE_LEADS: Lead[] = [
  { id: 'lead_001', companyName: 'Pyramids View Hotel', companyNameAr: 'فندق إطلالة الأهرامات', contactName: 'Ahmed Hassan', contactNameAr: 'أحمد حسن', email: 'ahmed@pyramidsview.com', phone: '+20 10 1234 5678', city: 'Giza', cityAr: 'الجيزة', type: 'hotel', status: 'qualified', source: 'website', estimatedValue: 750000, assignedTo: 'Sales Team', notes: 'Interested in full F&B supply chain. 280 rooms.', createdAt: '2026-09-10', lastContactedAt: '2026-09-17' },
  { id: 'lead_002', companyName: 'Red Sea Resorts Group', companyNameAr: 'مجموعة منتجعات البحر الأحمر', contactName: 'Sara Mohamed', contactNameAr: 'سارة محمد', email: 'sara@redsearesorts.com', phone: '+20 10 9876 5432', city: 'Hurghada', cityAr: 'الغردقة', type: 'hotel', status: 'proposal', source: 'referral', estimatedValue: 1200000, assignedTo: 'Sales Team', notes: '5 properties, looking for consolidated supplier network.', createdAt: '2026-09-05', lastContactedAt: '2026-09-15' },
  { id: 'lead_003', companyName: 'Cairo Fresh Produce Co.', companyNameAr: 'شركة القاهرة للمنتجات الطازجة', contactName: 'Mohamed Ali', contactNameAr: 'محمد علي', email: 'mohamed@cairofresh.com', phone: '+20 2 2345 6789', city: 'Cairo', cityAr: 'القاهرة', type: 'supplier', status: 'contacted', source: 'trade-show', estimatedValue: 500000, assignedTo: 'Supplier Relations', notes: 'Premium organic produce supplier, 15 years experience.', createdAt: '2026-09-12', lastContactedAt: '2026-09-18' },
  { id: 'lead_004', companyName: 'Alexandria Palace Hotel', companyNameAr: 'فندق الإسكندرية بالاس', contactName: 'Fatma Ibrahim', contactNameAr: 'فاطمة إبراهيم', email: 'fatma@alexpalace.com', phone: '+20 3 4567 8901', city: 'Alexandria', cityAr: 'الإسكندرية', type: 'hotel', status: 'new', source: 'cold-outreach', estimatedValue: 450000, assignedTo: 'Sales Team', notes: 'Historic 200-room hotel, currently using manual procurement.', createdAt: '2026-09-19' },
  { id: 'lead_005', companyName: 'Nile Logistics Express', companyNameAr: 'نيل لوجستكس إكسبرس', contactName: 'Karim Saeed', contactNameAr: 'كريم سعيد', email: 'karim@nilelogistics.com', phone: '+20 10 5555 6666', city: 'Cairo', cityAr: 'القاهرة', type: 'carrier', status: 'negotiation', source: 'partner', estimatedValue: 300000, assignedTo: 'Logistics Team', notes: 'Refrigerated fleet of 25 trucks, nationwide coverage.', createdAt: '2026-08-28', lastContactedAt: '2026-09-16' },
  { id: 'lead_006', companyName: 'Marina Bay Resort', companyNameAr: 'مارينا باي ريزورت', contactName: 'Laila Mansour', contactNameAr: 'ليلى منصور', email: 'laila@marinabay.com', phone: '+20 65 345 678', city: 'Hurghada', cityAr: 'الغردقة', type: 'hotel', status: 'won', source: 'website', estimatedValue: 680000, assignedTo: 'Sales Team', notes: 'Signed contract for F&B and housekeeping supplies.', createdAt: '2026-08-15', lastContactedAt: '2026-09-10' },
];

export const SAMPLE_CAMPAIGNS: Campaign[] = [
  { id: 'camp_001', name: 'Q3 Hotel Acquisition - Upper Egypt', nameAr: 'اكتساب فنادق صعيد مصر - الربع الثالث', type: 'email', status: 'active', targetSegment: 'Hotels in Luxor, Aswan, Asyut with 100+ rooms', totalLeads: 45, contacted: 32, responded: 12, converted: 3, startDate: '2026-07-01', createdAt: '2026-06-25' },
  { id: 'camp_002', name: 'Supplier Onboarding - 6th October', nameAr: 'تسجيل الموردين - مدينة 6 أكتوبر', type: 'whatsapp', status: 'active', targetSegment: 'F&B manufacturers in 6th October Industrial Zone', totalLeads: 120, contacted: 85, responded: 34, converted: 8, startDate: '2026-08-01', createdAt: '2026-07-28' },
  { id: 'camp_003', name: 'Coastal Resort Chain Outreach', nameAr: 'تواصل مع سلاسل المنتجعات الساحلية', type: 'cold-call', status: 'completed', targetSegment: 'Resort chains in Red Sea and Mediterranean coast', totalLeads: 28, contacted: 28, responded: 15, converted: 5, startDate: '2026-04-01', endDate: '2026-06-30', createdAt: '2026-03-25' },
];

export function getCRMDashboardStats(): CRMDashboardStats {
  const leads = SAMPLE_LEADS;
  const won = leads.filter((l) => l.status === 'won').length;
  const total = leads.length;
  
  const leadsByStatus: Record<LeadStatus, number> = {
    new: 0, contacted: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0,
  };
  const leadsByType: Record<string, number> = { hotel: 0, supplier: 0, partner: 0, carrier: 0 };
  
  for (const lead of leads) {
    leadsByStatus[lead.status]++;
    leadsByType[lead.type]++;
  }

  return {
    totalLeads: total,
    newLeadsThisMonth: leadsByStatus.new + leadsByStatus.contacted,
    conversionRate: total > 0 ? Math.round((won / total) * 100) : 0,
    pipelineValue: leads.filter((l) => !['won', 'lost'].includes(l.status)).reduce((sum, l) => sum + l.estimatedValue, 0),
    wonValueThisMonth: leads.filter((l) => l.status === 'won').reduce((sum, l) => sum + l.estimatedValue, 0),
    activeCampaigns: SAMPLE_CAMPAIGNS.filter((c) => c.status === 'active').length,
    leadsByStatus,
    leadsByType,
  };
}

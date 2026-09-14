'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CashflowData {
  summary: {
    totalOrderValue: number;
    totalPaid: number;
    totalPending: number;
    totalFactored: number;
    totalPlatformFees: number;
    orderCount: number;
    period: string;
    periodStart: string;
  };
  creditFacility: {
    limit: number;
    utilized: number;
    available: number;
    utilizationRate: number;
    interestRate: number;
    advanceRate: number;
  } | null;
  factoring: {
    totalFactored: number;
    totalFactoringFee: number;
    totalFundingPartnerFee: number;
    totalHubRevenue: number;
    activeFactoring: number;
    settledFactoring: number;
  };
  paymentSchedule: PaymentItem[];
  overduePayments: PaymentItem[];
  upcomingPayments: PaymentItem[];
  costReductions: CostReduction[];
}

interface PaymentItem {
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  hotelName: string;
  supplierName: string;
  amountEgp: number;
  platformFee: number;
  netAmount: number;
  dueDate: string | null;
  paidDate: string | null;
  paymentStatus: string;
  factoringStatus: string;
  status: string;
  products: Array<{
    name: string;
    sku: string;
    category: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface CostReduction {
  type: string;
  description: string;
  potentialSavingsEgp: number;
  confidence: number;
}

export default function CashflowDashboard() {
  const [data, setData] = useState<CashflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'overdue' | 'factoring' | 'savings'>('overview');
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchCashflowData();
  }, [period]);

  const fetchCashflowData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/fintech/cashflow?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch cashflow data');
      const result = await res.json();
      setData(result.data);
    } catch (err) {
      console.error('Cashflow fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatEgp = (amount: number) =>
    new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr: string | null) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-EG', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PAID: 'bg-accent-base/20 text-accent-base',
      UNPAID: 'bg-orange-base/20 text-orange-base',
      FACTORING: 'bg-purple-base/20 text-purple-base',
      SETTLED: 'bg-accent-base/20 text-accent-base',
      OVERDUE: 'bg-red-500/20 text-red-400',
    };
    return <Badge className={variants[status] || 'bg-surface-2 text-white'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-base" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cashflow Management</h1>
          <p className="text-gray-400 text-sm">All orders, payments, invoices & cost analysis (EGP)</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'quarter', 'year'].map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              className={period === p ? 'bg-accent-base/20 text-accent-base' : 'border-border-subtle text-white'}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-surface-1 border-border-subtle">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">Total Orders</p>
            <p className="text-xl font-bold text-white">{data.summary.orderCount}</p>
            <p className="text-xs text-gray-500">{formatEgp(data.summary.totalOrderValue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-1 border-border-subtle">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">Paid</p>
            <p className="text-xl font-bold text-accent-base">{formatEgp(data.summary.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-1 border-border-subtle">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">Pending</p>
            <p className="text-xl font-bold text-orange-base">{formatEgp(data.summary.totalPending)}</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-1 border-border-subtle">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">Factored</p>
            <p className="text-xl font-bold text-purple-base">{formatEgp(data.summary.totalFactored)}</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-1 border-border-subtle">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">Platform Fees</p>
            <p className="text-xl font-bold text-[#64b5f6]">{formatEgp(data.summary.totalPlatformFees)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Credit Facility */}
      {data.creditFacility && (
        <Card className="bg-surface-1 border-border-subtle">
          <CardHeader>
            <CardTitle className="text-white text-lg">Credit Facility (Oliv)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface-2 rounded-xl p-4">
                <p className="text-xs text-gray-400">Credit Limit</p>
                <p className="text-lg font-bold text-accent-base">{formatEgp(data.creditFacility.limit)}</p>
              </div>
              <div className="bg-surface-2 rounded-xl p-4">
                <p className="text-xs text-gray-400">Available</p>
                <p className="text-lg font-bold text-[#64b5f6]">{formatEgp(data.creditFacility.available)}</p>
              </div>
              <div className="bg-surface-2 rounded-xl p-4">
                <p className="text-xs text-gray-400">Utilized</p>
                <p className="text-lg font-bold text-purple-base">{formatEgp(data.creditFacility.utilized)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>Utilization: {data.creditFacility.utilizationRate.toFixed(1)}%</span>
              <span>Interest: {(data.creditFacility.interestRate * 100).toFixed(2)}%</span>
              <span>Advance Rate: {(data.creditFacility.advanceRate * 100).toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-subtle pb-2">
        {[
          { id: 'overview', label: 'Payment Schedule' },
          { id: 'overdue', label: `Overdue (${data.overduePayments.length})` },
          { id: 'factoring', label: 'Factoring' },
          { id: 'savings', label: 'Cost Reduction' },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            className={activeTab === tab.id ? 'text-accent-base bg-accent-base/10' : 'text-gray-400'}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Payment Schedule */}
      {activeTab === 'overview' && (
        <Card className="bg-surface-1 border-border-subtle">
          <CardContent className="p-0">
            <div className="overflow-x-auto table-scroll-wrapper">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left">
                    <th className="p-3 text-gray-400 font-medium">Order</th>
                    <th className="p-3 text-gray-400 font-medium">Supplier</th>
                    <th className="p-3 text-gray-400 font-medium">Hotel</th>
                    <th className="p-3 text-gray-400 font-medium text-right">Amount (EGP)</th>
                    <th className="p-3 text-gray-400 font-medium text-right">Platform Fee</th>
                    <th className="p-3 text-gray-400 font-medium">Due Date</th>
                    <th className="p-3 text-gray-400 font-medium">Status</th>
                    <th className="p-3 text-gray-400 font-medium">Factoring</th>
                  </tr>
                </thead>
                <tbody>
                  {data.paymentSchedule.slice(0, 50).map((item, idx) => (
                    <tr key={idx} className="border-b border-border-subtle hover:bg-surface-1">
                      <td className="p-3 text-white font-medium">{item.orderNumber}</td>
                      <td className="p-3 text-gray-300">{item.supplierName}</td>
                      <td className="p-3 text-gray-300">{item.hotelName}</td>
                      <td className="p-3 text-white text-right font-mono">{formatEgp(item.amountEgp)}</td>
                      <td className="p-3 text-[#64b5f6] text-right font-mono">{formatEgp(item.platformFee)}</td>
                      <td className="p-3 text-gray-300">{formatDate(item.dueDate)}</td>
                      <td className="p-3">{getStatusBadge(item.paymentStatus)}</td>
                      <td className="p-3">{getStatusBadge(item.factoringStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue */}
      {activeTab === 'overdue' && (
        <Card className="bg-surface-1 border-border-subtle">
          <CardContent>
            {data.overduePayments.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No overdue payments</p>
            ) : (
              <div className="space-y-3">
                {data.overduePayments.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{item.orderNumber}</p>
                      <p className="text-sm text-gray-400">{item.supplierName} → {item.hotelName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-400">{formatEgp(item.amountEgp)}</p>
                      <p className="text-xs text-gray-400">Due: {formatDate(item.dueDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Factoring */}
      {activeTab === 'factoring' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-surface-1 border-border-subtle">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">Total Factored</p>
                <p className="text-lg font-bold text-purple-base">{formatEgp(data.factoring.totalFactored)}</p>
              </CardContent>
            </Card>
            <Card className="bg-surface-1 border-border-subtle">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">Factoring Fees</p>
                <p className="text-lg font-bold text-orange-base">{formatEgp(data.factoring.totalFactoringFee)}</p>
              </CardContent>
            </Card>
            <Card className="bg-surface-1 border-border-subtle">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">Hub Revenue (2%)</p>
                <p className="text-lg font-bold text-accent-base">{formatEgp(data.factoring.totalHubRevenue)}</p>
              </CardContent>
            </Card>
            <Card className="bg-surface-1 border-border-subtle">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">Active / Settled</p>
                <p className="text-lg font-bold text-white">{data.factoring.activeFactoring} / {data.factoring.settledFactoring}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Cost Reduction */}
      {activeTab === 'savings' && (
        <div className="space-y-4">
          {data.costReductions.map((reduction, idx) => (
            <Card key={idx} className="bg-surface-1 border-border-subtle">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{reduction.type.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-400 mt-1">{reduction.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-accent-base">{formatEgp(reduction.potentialSavingsEgp)}</p>
                    <p className="text-xs text-gray-400">{(reduction.confidence * 100).toFixed(0)}% confidence</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

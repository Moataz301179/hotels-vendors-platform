'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CreditFacility {
  hasFacility: boolean;
  facility?: {
    id: string;
    olivFacilityId: string;
    creditLimitEgp: number;
    utilizedEgp: number;
    availableEgp: number;
    utilizationRate: number;
    interestRate: number;
    advanceRate: number;
    discountRate: number;
    settlementDays: number;
    status: string;
    approvedAt: string;
    expiresAt: string | null;
    olivRiskScore: number | null;
    olivRiskTier: string | null;
    paymentSchedule: Array<{
      dueDate: string;
      amountEgp: number;
      status: string;
      invoiceNumber?: string;
    }>;
    upcomingPayments: number;
    totalUpcomingEgp: number;
    lastSyncedAt: string;
    supplier: {
      id: string;
      name: string;
      legalName: string;
      taxId: string;
      olivStatus: string;
    };
  };
}

interface PaymentSummary {
  totalEgp: number;
  paidEgp: number;
  pendingEgp: number;
  overdueEgp: number;
  totalPayments: number;
  paidCount: number;
  pendingCount: number;
}

export default function OlivCreditFacilityDashboard() {
  const [facility, setFacility] = useState<CreditFacility | null>(null);
  const [schedule, setSchedule] = useState<{ payments: Array<Record<string, unknown>>; summary: PaymentSummary } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFacilityData();
  }, []);

  const fetchFacilityData = async () => {
    try {
      setLoading(true);
      const facilityRes = await fetch('/api/v1/fintech/oliv-facility');
      if (!facilityRes.ok) throw new Error('Failed to fetch facility');
      const facilityData = await facilityRes.json();
      setFacility(facilityData.data);

      if (facilityData.data?.hasFacility) {
        const scheduleRes = await fetch('/api/v1/fintech/oliv-facility/schedule');
        if (scheduleRes.ok) {
          const scheduleData = await scheduleRes.json();
          setSchedule(scheduleData.data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatEgp = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
      ACTIVE: 'success',
      PENDING: 'warning',
      SUSPENDED: 'error',
      EXPIRED: 'error',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-base mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading credit facility...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-surface-1 border-border-subtle">
        <CardContent className="p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchFacilityData} variant="outline">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!facility?.hasFacility) {
    return (
      <Card className="bg-surface-1 border-border-subtle">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">No Oliv Credit Facility</h3>
          <p className="text-gray-400 mb-6">
            Activate Oliv financing to access working capital for your business.
          </p>
          <Button className="bg-[var(--success)] hover:bg-[var(--success)]/80 text-white">
            Activate Oliv Financing
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { facility: data } = facility;
  if (!data) return null;
  const upcomingPayments = data.paymentSchedule
    ?.filter(p => p.status === 'PENDING' && new Date(p.dueDate) > new Date())
    .slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Credit Overview */}
      <Card className="bg-surface-1 border-border-subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">Oliv Credit Facility</CardTitle>
            {getStatusBadge(data.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Credit Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-2 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Credit Limit</p>
              <p className="text-2xl font-bold text-accent-base">{formatEgp(data.creditLimitEgp)}</p>
            </div>
            <div className="bg-surface-2 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-[#64b5f6]">{formatEgp(data.availableEgp)}</p>
            </div>
            <div className="bg-surface-2 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Utilized</p>
              <p className="text-2xl font-bold text-purple-base">{formatEgp(data.utilizedEgp)}</p>
            </div>
          </div>

          {/* Utilization Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Credit Utilization</span>
              <span className="text-white">{data.utilizationRate.toFixed(1)}%</span>
            </div>
            <Progress
              value={data.utilizationRate}
              className="h-2 bg-surface-2"
              indicatorClassName="bg-accent-base"
            />
          </div>

          {/* Terms Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border-subtle">
            <div>
              <p className="text-xs text-gray-400">Interest Rate</p>
              <p className="text-sm font-medium text-white">{(data.interestRate * 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Advance Rate</p>
              <p className="text-sm font-medium text-white">{(data.advanceRate * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Discount Rate</p>
              <p className="text-sm font-medium text-white">{(data.discountRate * 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Settlement</p>
              <p className="text-sm font-medium text-white">{data.settlementDays} days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Schedule */}
      {schedule && (
        <Card className="bg-surface-1 border-border-subtle">
          <CardHeader>
            <CardTitle className="text-white text-lg">Payment Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-surface-2 rounded-lg">
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-lg font-bold text-white">{formatEgp(schedule.summary.totalEgp)}</p>
              </div>
              <div className="text-center p-3 bg-surface-2 rounded-lg">
                <p className="text-xs text-gray-400">Paid</p>
                <p className="text-lg font-bold text-accent-base">{formatEgp(schedule.summary.paidEgp)}</p>
              </div>
              <div className="text-center p-3 bg-surface-2 rounded-lg">
                <p className="text-xs text-gray-400">Pending</p>
                <p className="text-lg font-bold text-[#64b5f6]">{formatEgp(schedule.summary.pendingEgp)}</p>
              </div>
              <div className="text-center p-3 bg-surface-2 rounded-lg">
                <p className="text-xs text-gray-400">Overdue</p>
                <p className="text-lg font-bold text-red-400">{formatEgp(schedule.summary.overdueEgp)}</p>
              </div>
            </div>

            {/* Upcoming Payments */}
            {upcomingPayments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">Upcoming Payments</h4>
                <div className="space-y-2">
                  {upcomingPayments.map((payment, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-surface-2 rounded-lg"
                    >
                      <div>
                        <p className="text-sm text-white">
                          {payment.invoiceNumber || `Payment ${idx + 1}`}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(payment.dueDate as string)}</p>
                      </div>
                      <p className="text-sm font-medium text-[#64b5f6]">
                        {formatEgp(payment.amountEgp as number)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Risk Assessment */}
      {data.olivRiskScore && (
        <Card className="bg-surface-1 border-border-subtle">
          <CardHeader>
            <CardTitle className="text-white text-lg">Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-2 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-400 mb-1">Risk Score</p>
                <p className="text-3xl font-bold text-accent-base">{data.olivRiskScore}</p>
              </div>
              <div className="bg-surface-2 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-400 mb-1">Risk Tier</p>
                <p className="text-3xl font-bold text-purple-base">{data.olivRiskTier || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Status */}
      <div className="text-xs text-gray-500 text-right">
        Last synced: {formatDate(data.lastSyncedAt)}
      </div>
    </div>
  );
}

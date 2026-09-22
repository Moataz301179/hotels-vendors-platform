'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ConsentItem {
  id: string;
  category: string;
  description: string;
  required: boolean;
  examples: string[];
}

const consentItems: ConsentItem[] = [
  {
    id: 'company_info',
    category: 'Company Information',
    description: 'Basic company registration and identification data',
    required: true,
    examples: ['Company name', 'Commercial Register (CR)', 'Tax ID', 'Address'],
  },
  {
    id: 'financial_data',
    category: 'Financial Data',
    description: 'Banking and financial account information',
    required: true,
    examples: ['Bank account number', 'Bank name', 'Account holder name'],
  },
  {
    id: 'eta_invoices',
    category: 'ETA Invoice History',
    description: 'Your invoice data from the Egyptian Tax Authority',
    required: true,
    examples: ['Invoice amounts', 'Buyer/seller details', 'Tax calculations'],
  },
  {
    id: 'credit_assessment',
    category: 'Credit Assessment',
    description: 'Data used to evaluate your creditworthiness',
    required: true,
    examples: ['Revenue history', 'Payment patterns', 'I-Score check'],
  },
];

export default function OlivConsentScreen() {
  const router = useRouter();
  const [agreedItems, setAgreedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allRequiredAgreed = consentItems
    .filter((item) => item.required)
    .every((item) => agreedItems.has(item.id));

  const handleToggle = (id: string) => {
    setAgreedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleActivate = async () => {
    if (!allRequiredAgreed) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Record consent
      const consentRes = await fetch('/api/v1/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentType: 'OLIV_CREDIT_ASSESSMENT',
          partnerId: 'oliv_finance',
          consentVersion: '1.0',
          dataCategories: Array.from(agreedItems),
        }),
      });

      if (!consentRes.ok) {
        const errData = await consentRes.json();
        throw new Error(errData.error || 'Failed to record consent');
      }

      // 2. Generate pre-fill data package and redirect URL
      const prefillRes = await fetch('/api/v1/fintech/oliv-prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirectTo: '/supplier/credit-facility',
        }),
      });

      if (!prefillRes.ok) {
        const errData = await prefillRes.json();
        throw new Error(errData.error || 'Failed to generate Oliv redirect');
      }

      const prefillData = await prefillRes.json();
      const { redirectUrl } = prefillData.data;

      // 3. Redirect to Oliv app
      window.location.href = redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation failed');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[var(--success)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Activate Oliv Financing</h1>
        <p className="text-gray-400">
          Grant consent to share your data with Oliv Finance for credit assessment and working capital access.
        </p>
      </div>

      {/* Consent Card */}
      <Card className="bg-surface-1 border-border-subtle">
        <CardHeader>
          <CardTitle className="text-white text-lg">Data Sharing Consent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {consentItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border transition-colors ${
                agreedItems.has(item.id)
                  ? 'bg-[var(--success)]/10 border-[var(--success)]/50'
                  : 'bg-surface-2 border-border-subtle'
              }`}
            >
              <div className="flex items-start space-x-3">
                <Checkbox
                  id={item.id}
                  checked={agreedItems.has(item.id)}
                  onCheckedChange={() => handleToggle(item.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={item.id} className="text-white font-medium cursor-pointer">
                      {item.category}
                    </Label>
                    {item.required && (
                      <span className="text-xs text-orange-base">(Required)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.examples.map((example, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-surface-2 text-gray-300 px-2 py-1 rounded"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {/* Error message */}
          {error && (
            <div className="w-full p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Terms notice */}
          <p className="text-xs text-gray-500 text-center">
            By activating, you agree to Oliv Finance's{' '}
            <a href="https://olivfinance.com/terms" target="_blank" rel="noopener noreferrer" className="text-[#64b5f6] hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="https://olivfinance.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#64b5f6] hover:underline">
              Privacy Policy
            </a>
            .
          </p>

          {/* Action buttons */}
          <div className="flex space-x-4 w-full">
            <Button
              variant="outline"
              className="flex-1 border-border-subtle text-white hover:bg-surface-2"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[var(--success)] hover:bg-[var(--success)]/80 text-white disabled:opacity-50"
              onClick={handleActivate}
              disabled={!allRequiredAgreed || loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Activating...
                </span>
              ) : (
                'Activate Oliv Financing'
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Info box */}
      <Card className="bg-surface-1 border-border-subtle">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-[#64b5f6] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-gray-400">
              <p className="font-medium text-white mb-1">What happens next?</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Your data will be securely shared with Oliv Finance</li>
                <li>You'll be redirected to complete Oliv's KYC process</li>
                <li>Oliv will run a credit assessment (typically 24-48 hours)</li>
                <li>Once approved, your credit facility will appear in your dashboard</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Mail, Send, Zap, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function InviteSupplierPage() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [formData, setFormData] = useState({
    hotelOrgName: "",
    supplierCompanyName: "",
    supplierTaxId: "",
    supplierEmail: "",
    supplierPhone: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.hotelOrgName.trim()) newErrors.hotelOrgName = "Hotel organization name is required";
    if (!formData.supplierCompanyName.trim()) newErrors.supplierCompanyName = "Supplier company name is required";
    if (!formData.supplierTaxId.trim()) newErrors.supplierTaxId = "Supplier Tax ID is required";
    if (!formData.supplierEmail.trim()) newErrors.supplierEmail = "Supplier email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.supplierEmail)) newErrors.supplierEmail = "Invalid email format";
    if (!formData.supplierPhone.trim()) newErrors.supplierPhone = "Supplier phone is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setStep("success");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  if (step === "success") {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full">
          <Card className="bg-white border" style={{ borderColor: "rgba(171,162,148,0.5)" }}>
            <CardContent className="pt-8 pb-10 px-6 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "rgba(200,168,107,0.15)" }}>
                <CheckCircle2 size={32} style={{ color: "#314B43" }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#c8a86b" }}>Invitation Sent</h2>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: "rgba(49,75,67,0.75)" }}>
                An automated email has been sent to <strong style={{ color: "#314B43" }}>{formData.supplierEmail}</strong> with the HOVIN mobile app download link and onboarding instructions.
              </p>
              <div className="text-left rounded-lg p-4 mb-6" style={{ backgroundColor: "rgba(171,162,148,0.14)", border: "1px solid rgba(171,162,148,0.3)" }}>
                <p className="text-xs mb-3 font-semibold uppercase tracking-wide" style={{ color: "#314B43" }}>What happens next:</p>
                <ul className="space-y-3 text-sm" style={{ color: "#314B43" }}>
                  <li className="flex items-start gap-2 leading-relaxed"><CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: "#c8a86b" }} /> Supplier receives invite email with HOVIN download link</li>
                  <li className="flex items-start gap-2 leading-relaxed"><CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: "#c8a86b" }} /> Supplier downloads HOVIN from App Store / Google Play</li>
                  <li className="flex items-start gap-2 leading-relaxed"><CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: "#c8a86b" }} /> Supplier completes KYC &amp; bank details in-app</li>
                  <li className="flex items-start gap-2 leading-relaxed"><CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: "#c8a86b" }} /> You receive notification when supplier is live</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register?type=supplier">
                  <Button className="w-full sm:w-auto px-6 py-2.5" style={{ backgroundColor: "#314B43", color: "#ffffff" }}>
                    Invite Another Supplier <ArrowRight size={14} />
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full sm:w-auto px-6 py-2.5" style={{ borderColor: "rgba(49,75,67,0.35)", color: "#314B43" }}>
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pt-32">
      <div className="max-w-3xl mx-auto px-5 lg:px-8 pb-16">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center mb-6">
            <Image src="/logo-nav-black.svg" alt="HotelsVendors" width={150} height={34} className="h-10 w-auto" />
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3" style={{ color: "#c8a86b" }}>
            Invite a Supplier
          </h1>
          <p className="text-lg max-w-xl mx-auto leading-relaxed" style={{ color: "rgba(49,75,67,0.8)" }}>
            Send an automated invitation with the HOVIN app download link. Your supplier gets onboarded in minutes — not weeks.
          </p>
        </div>

        {/* Form Card */}
        <Card className="bg-white border" style={{ borderColor: "rgba(171,162,148,0.5)" }}>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold" style={{ color: "#314B43" }}>Supplier Details</CardTitle>
            <CardDescription style={{ color: "rgba(49,75,67,0.6)" }}>
              Fill in your supplier&apos;s information. We&apos;ll send them an invite email with the HOVIN mobile app download link for accelerated onboarding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hotel Org Name */}
              <div>
                <Label htmlFor="hotelOrgName" className="text-sm font-medium" style={{ color: "#314B43" }}>Your Hotel Organization Name</Label>
                <Input
                  id="hotelOrgName"
                  name="hotelOrgName"
                  value={formData.hotelOrgName}
                  onChange={handleChange}
                  placeholder="e.g., Meridian Hospitality Group"
                  className={errors.hotelOrgName ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.hotelOrgName && <p className="mt-1 text-sm text-red-600">{errors.hotelOrgName}</p>}
              </div>

              <Separator />

              {/* Supplier Company Name */}
              <div>
                <Label htmlFor="supplierCompanyName" className="text-sm font-medium" style={{ color: "#314B43" }}>Supplier Company Name</Label>
                <Input
                  id="supplierCompanyName"
                  name="supplierCompanyName"
                  value={formData.supplierCompanyName}
                  onChange={handleChange}
                  placeholder="e.g., Nile Linen Co."
                  className={errors.supplierCompanyName ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.supplierCompanyName && <p className="mt-1 text-sm text-red-600">{errors.supplierCompanyName}</p>}
              </div>

              {/* Supplier Tax ID */}
              <div>
                <Label htmlFor="supplierTaxId" className="text-sm font-medium" style={{ color: "#314B43" }}>Supplier Tax ID (Egypt)</Label>
                <Input
                  id="supplierTaxId"
                  name="supplierTaxId"
                  value={formData.supplierTaxId}
                  onChange={handleChange}
                  placeholder="e.g., 123456789"
                  className={errors.supplierTaxId ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.supplierTaxId && <p className="mt-1 text-sm text-red-600">{errors.supplierTaxId}</p>}
                <p className="mt-1 text-xs" style={{ color: "rgba(49,75,67,0.6)" }}>Required for ETA e-invoicing compliance</p>
              </div>

              {/* Supplier Email */}
              <div>
                <Label htmlFor="supplierEmail" className="text-sm font-medium" style={{ color: "#314B43" }}>Supplier Email</Label>
                <Input
                  id="supplierEmail"
                  name="supplierEmail"
                  type="email"
                  value={formData.supplierEmail}
                  onChange={handleChange}
                  placeholder="procurement@supplier.com"
                  className={errors.supplierEmail ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.supplierEmail && <p className="mt-1 text-sm text-red-600">{errors.supplierEmail}</p>}
              </div>

              {/* Supplier Phone */}
              <div>
                <Label htmlFor="supplierPhone" className="text-sm font-medium" style={{ color: "#314B43" }}>Supplier Phone (WhatsApp preferred)</Label>
                <Input
                  id="supplierPhone"
                  name="supplierPhone"
                  value={formData.supplierPhone}
                  onChange={handleChange}
                  placeholder="+20 10 1234 5678"
                  className={errors.supplierPhone ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.supplierPhone && <p className="mt-1 text-sm text-red-600">{errors.supplierPhone}</p>}
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-sm font-medium" style={{ color: "#314B43" }}>Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any specific categories, volume expectations, or special instructions..."
                  rows={3}
                  className="resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* What happens next info */}
              <div className="rounded-lg p-4" style={{ backgroundColor: "rgba(171,162,148,0.14)", border: "1px solid rgba(171,162,148,0.3)" }}>
                <div className="flex items-start gap-3">
                  <Mail size={20} className="mt-0.5 shrink-0" style={{ color: "#c8a86b" }} />
                  <div className="min-w-0">
                    <h4 className="font-semibold mb-3" style={{ color: "#314B43" }}>What the supplier receives:</h4>
                    <ul className="space-y-3 text-sm leading-relaxed" style={{ color: "#314B43" }}>
                      <li className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: "#c8a86b" }} /> Automated email with HOVIN App Store &amp; Google Play download links</li>
                      <li className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: "#c8a86b" }} /> 48h factoring eligibility on verified invoices</li>
                      <li className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: "#c8a86b" }} /> Step-by-step KYC &amp; bank onboarding guide</li>
                      <li className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: "#c8a86b" }} /> Your hotel&apos;s contact as their dedicated account manager</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t" style={{ borderColor: "rgba(171,162,148,0.4)" }}>
                <Button type="submit" className="w-full sm:w-auto px-8 py-3" style={{ backgroundColor: "#314B43", color: "#ffffff" }} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending Invitation...
                    </>
                  ) : (
                    <>
                      <Send size={15} className="mr-2" />
                      Send Invitation Email
                    </>
                  )}
                </Button>
                <Link href="/">
                  <Button type="button" variant="outline" className="w-full sm:w-auto px-8 py-3" style={{ borderColor: "rgba(49,75,67,0.4)", color: "#314B43" }}>
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Benefits reminder */}
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {[
            { icon: Zap, title: "48-Hour Payout", desc: "Reverse factoring via Oliv Finance" },
            { icon: ShieldCheck, title: "ETA Compliant", desc: "Phase 2 e-invoicing ready" },
            { icon: Smartphone, title: "Mobile-First", desc: "HOVIN app for field operations" },
          ].map((b, i) => (
            <div key={i} className="rounded-xl p-5 text-center border" style={{ backgroundColor: "rgba(171,162,148,0.10)", borderColor: "rgba(171,162,148,0.35)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "rgba(200,168,107,0.18)" }}>
                <b.icon size={20} style={{ color: "#c8a86b" }} />
              </div>
              <h4 className="font-semibold mb-1" style={{ color: "#314B43" }}>{b.title}</h4>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(49,75,67,0.6)" }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
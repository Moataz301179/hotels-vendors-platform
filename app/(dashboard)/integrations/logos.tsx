"use client";
export function WebhookLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 7 L10 7 L10 17 L4 17 Z" rx="1" />
      <path d="M10 12 L20 12" strokeLinecap="round" />
      <circle cx="16" cy="9" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="15" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function SapLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M6 6 L18 18 M6 18 L18 6" strokeLinecap="round" opacity="0.3" />
      <path d="M8 8 L8 16 M12 8 L12 16 M16 8 L16 16" strokeLinecap="round" />
      <path d="M6 6 L6 18 M18 6 L18 18" strokeLinecap="round" />
    </svg>
  );
}
export function OracleOperaLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 72" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="26" cy="26" r="6" fill="currentColor" stroke="none" />
      <circle cx="50" cy="26" r="6" fill="currentColor" stroke="none" opacity="0.4" />
      <circle cx="174" cy="26" r="6" fill="currentColor" stroke="none" />
      <circle cx="148" cy="26" r="6" fill="currentColor" stroke="none" opacity="0.4" />
      <rect x="12" y="38" width="47" height="20" rx="3" stroke="currentColor" fill="none" />
      <rect x="133" y="38" width="55" height="20" rx="3" stroke="currentColor" fill="none" />
      <rect x="74" y="40" width="35" height="16" rx="1" fill="currentColor" stroke="none" />
      <rect x="40" y="60" width="120" height="6" rx="3" stroke="currentColor" fill="none" />
    </svg>
  );
}
export function MicrosoftDynamicsLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="6" height="18" rx="1" />
      <rect x="10.5" y="3" width="6" height="18" rx="1" />
      <rect x="18" y="3" width="3" height="18" rx="1" />
    </svg>
  );
}
export function CoupaLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 172 48" fill="none" stroke="currentColor" strokeWidth="1.2">
      <text x="8" y="28" fontSize="22" fontWeight="700" fontFamily="sans-serif" fill="currentColor" stroke="none">C</text>
      <text x="30" y="28" fontSize="22" fontWeight="400" fontFamily="sans-serif" fill="currentColor" stroke="none" opacity="0.4">oupa</text>
      <path d="M8 40 L162 40" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
export function CsvPortalLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="2 2" />
      <path d="M3 9 L12 6 L21 9" />
      <path d="M3 15 L12 12 L21 15" strokeLinecap="round" />
      <rect x="6" y="10" width="4" height="4" rx="1" fill="currentColor" stroke="none" opacity="0.4" />
      <rect x="14" y="10" width="4" height="4" rx="1" fill="currentColor" stroke="none" opacity="0.4" />
    </svg>
  );
}

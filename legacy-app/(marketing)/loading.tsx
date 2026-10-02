export default function MarketingLoading() {
  return (
    <div className="min-h-screen bg-[#0c0c12]">
      {/* Nav skeleton */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-accent-base h-8" />
        <div className="bg-[#0c0c12] border-b border-white/[0.06] h-[68px] flex items-center justify-between px-6 max-w-7xl mx-auto">
          <div className="w-40 h-8 bg-white/10 rounded-lg animate-pulse" />
          <div className="hidden lg:flex items-center gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-16 h-6 bg-white/10 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="w-24 h-8 bg-white/10 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="min-h-[640px] md:min-h-[720px] flex items-center bg-[#0c0c12]">
        <div className="mx-auto max-w-7xl px-6 pt-[120px] pb-20 w-full">
          <div className="max-w-2xl space-y-6">
            <div className="w-48 h-6 bg-white/10 rounded-full animate-pulse" />
            <div className="w-full h-12 bg-white/10 rounded-lg animate-pulse" />
            <div className="w-full h-12 bg-white/10 rounded-lg animate-pulse" />
            <div className="w-3/4 h-6 bg-white/10 rounded-lg animate-pulse" />
            <div className="flex gap-4">
              <div className="w-40 h-10 bg-white/10 rounded-lg animate-pulse" />
              <div className="w-32 h-10 bg-white/10 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

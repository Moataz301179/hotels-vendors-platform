"use client";

import { Share2, Globe, Hash, MessageSquare, CheckCircle2, XCircle, Clock, Heart, MessageCircle, Repeat2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  publishedAt: string;
  likes: number;
  comments: number;
  shares: number;
}

interface PlatformStatus {
  name: string;
  icon: typeof Globe;
  connected: boolean;
  followers: number;
  postsThisMonth: number;
  engagementRate: string;
  color: string;
}

const PLATFORMS: PlatformStatus[] = [
  { name: "LinkedIn", icon: Globe, connected: true, followers: 2340, postsThisMonth: 12, engagementRate: "4.2%", color: "#0a66c2" },
  { name: "Twitter / X", icon: Hash, connected: true, followers: 1890, postsThisMonth: 28, engagementRate: "2.8%", color: "#1da1f2" },
  { name: "Facebook", icon: MessageSquare, connected: false, followers: 0, postsThisMonth: 0, engagementRate: "—", color: "#1877f2" },
];

const RECENT_POSTS: SocialPost[] = [
  { id: "1", platform: "LinkedIn", content: "New: 6th of October City supplier onboarding program — 1,853 factories, one platform.", publishedAt: "2h ago", likes: 47, comments: 12, shares: 8 },
  { id: "2", platform: "Twitter", content: "Hotels waste 30% of storage on inventory. Our shared-route logistics model fixes that.", publishedAt: "5h ago", likes: 23, comments: 5, shares: 14 },
  { id: "3", platform: "LinkedIn", content: "ETA e-invoicing compliance is mandatory. HotelsVendors makes it invisible.", publishedAt: "1d ago", likes: 89, comments: 21, shares: 31 },
  { id: "4", platform: "Twitter", content: "SME suppliers compete with big distributors when logistics overhead drops. That's our Shark-Breaker model.", publishedAt: "2d ago", likes: 56, comments: 8, shares: 19 },
  { id: "5", platform: "LinkedIn", content: "Case study: How a 15-property hotel chain saves EGP 780K/year through daily ordering.", publishedAt: "3d ago", likes: 134, comments: 42, shares: 57 },
];

const PLATFORM_ICON_MAP: Record<string, typeof Globe> = { LinkedIn: Globe, Twitter: Hash };

export default function SocialPage() {
  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      <PageHeader
        title="Social Media"
        description="Manage presence across LinkedIn, Twitter/X, and Facebook"
        action={
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-500)] text-white text-sm font-medium hover:bg-[var(--accent-600)] transition-colors">
            <Share2 className="w-4 h-4" />
            Schedule Post
          </button>
        }
      />

      {/* Platform Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLATFORMS.map((platform) => (
          <div key={platform.name} className="p-5 rounded-xl bg-surface-1 border border-border-subtle">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${platform.color}22` }}>
                  <platform.icon className="w-4 h-4" style={{ color: platform.color }} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">{platform.name}</p>
                  <div className="flex items-center gap-1">
                    {platform.connected ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-foreground-muted" />
                    )}
                    <span className={`text-[10px] ${platform.connected ? "text-emerald-400" : "text-foreground-muted"}`}>
                      {platform.connected ? "Connected" : "Not Connected"}
                    </span>
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-foreground-muted" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-[14px] font-bold text-white">{platform.followers.toLocaleString()}</p>
                <p className="text-[9px] text-foreground-muted uppercase">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-[14px] font-bold text-white">{platform.postsThisMonth}</p>
                <p className="text-[9px] text-foreground-muted uppercase">Posts/mo</p>
              </div>
              <div className="text-center">
                <p className="text-[14px] font-bold text-white">{platform.engagementRate}</p>
                <p className="text-[9px] text-foreground-muted uppercase">Engagement</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Posts */}
      <SectionCard title="Recent Posts" description="Latest social media content">
        <div className="space-y-3">
          {RECENT_POSTS.map((post) => {
            const Icon = PLATFORM_ICON_MAP[post.platform] || Share2;
            return (
              <div key={post.id} className="p-3.5 rounded-lg bg-surface-1 border border-border-invisible">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-md bg-surface-2 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-foreground-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-foreground-secondary leading-relaxed">{post.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-foreground-muted" />
                        <span className="text-[11px] text-foreground-muted">{post.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3 text-foreground-muted" />
                        <span className="text-[11px] text-foreground-muted">{post.comments}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Repeat2 className="w-3 h-3 text-foreground-muted" />
                        <span className="text-[11px] text-foreground-muted">{post.shares}</span>
                      </div>
                      <span className="text-[10px] text-foreground-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.publishedAt}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

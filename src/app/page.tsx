'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Business, Campaign } from '@/types';
import { PIPELINE_STAGES } from '@/types';
import {
  LayoutDashboard,
  DollarSign,
  MessageSquare,
  Mail,
  TrendingUp,
  Users,
  Target,
  Briefcase,
  ArrowRight,
  Building2,
  Plus,
  BarChart3,
} from 'lucide-react';

interface DashboardStats {
  totalBusinesses: number;
  totalPipelineValue: number;
  activeCampaigns: number;
  messagesGenerated: number;
  emailsSent: number;
  repliesReceived: number;
  dealsClosedValue: number;
  avgProjectValue: number;
}

interface PipelineData {
  stage: string;
  label: string;
  count: number;
  value: number;
  color: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBusinesses: 0,
    totalPipelineValue: 0,
    activeCampaigns: 0,
    messagesGenerated: 0,
    emailsSent: 0,
    repliesReceived: 0,
    dealsClosedValue: 0,
    avgProjectValue: 0,
  });
  const [pipelineData, setPipelineData] = useState<PipelineData[]>([]);
  const [recentBusinesses, setRecentBusinesses] = useState<Business[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);

    try {
      const [businessesRes, campaignsRes] = await Promise.all([
        supabase.from('businesses').select('*'),
        supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      ]);

      const businesses = (businessesRes.data || []) as Business[];
      const campaigns = (campaignsRes.data || []) as Campaign[];

      // Calculate stats
      const totalPipelineValue = businesses.reduce((sum, b) => sum + (b.total_project_value || 0), 0);
      const activeCampaigns = campaigns.filter(c => ['active', 'generating', 'ready'].includes(c.status)).length;
      const messagesGenerated = businesses.filter(b => b.personalized_message || b.outreach_message).length;
      const emailsSent = campaigns.reduce((sum, c) => sum + (c.emails_sent || 0), 0);
      const repliesReceived = campaigns.reduce((sum, c) => sum + (c.replies_received || 0), 0);
      const dealsClosedValue = campaigns.reduce((sum, c) => sum + (c.total_revenue || 0), 0);
      const avgProjectValue = businesses.length > 0 ? totalPipelineValue / businesses.length : 0;

      setStats({
        totalBusinesses: businesses.length,
        totalPipelineValue,
        activeCampaigns,
        messagesGenerated,
        emailsSent,
        repliesReceived,
        dealsClosedValue,
        avgProjectValue,
      });

      // Calculate pipeline data
      const pipelineCounts = PIPELINE_STAGES.map(stage => {
        const stageBusinesses = businesses.filter(b => b.pipeline_stage === stage.stage);
        return {
          stage: stage.stage,
          label: stage.label,
          count: stageBusinesses.length,
          value: stageBusinesses.reduce((sum, b) => sum + (b.total_project_value || 0), 0),
          color: stage.color,
        };
      }).filter(p => p.count > 0);

      setPipelineData(pipelineCounts);

      // Recent items
      setRecentBusinesses(businesses.slice(0, 5));
      setRecentCampaigns(campaigns.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 shadow-xl">
          <div className="h-8 w-48 bg-white/20 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-white/20 rounded-lg animate-pulse"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline Skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
            <div className="h-6 w-48 bg-white/20 rounded animate-pulse"></div>
          </div>
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <LayoutDashboard className="w-8 h-8 text-white" />
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        </div>
        <p className="text-white/90 text-lg">Overview of your reputation management pipeline</p>
      </div>

      {/* Stats Grid with Enhanced Styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pipeline Value"
          value={`$${stats.totalPipelineValue.toLocaleString()}`}
          subtitle={`${stats.totalBusinesses} businesses`}
          icon={<DollarSign className="w-6 h-6" />}
          gradient="from-blue-500 to-cyan-500"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Messages Generated"
          value={stats.messagesGenerated.toString()}
          subtitle={`${stats.activeCampaigns} active campaigns`}
          icon={<MessageSquare className="w-6 h-6" />}
          gradient="from-purple-500 to-pink-500"
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Emails Sent"
          value={stats.emailsSent.toString()}
          subtitle={`${stats.repliesReceived} replies received`}
          icon={<Mail className="w-6 h-6" />}
          gradient="from-green-500 to-emerald-500"
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Avg Project Value"
          value={`$${Math.round(stats.avgProjectValue).toLocaleString()}`}
          subtitle="per business"
          icon={<TrendingUp className="w-6 h-6" />}
          gradient="from-amber-500 to-orange-500"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      {/* Pipeline Overview with Enhanced Styling */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-white" />
            <h2 className="text-lg font-semibold text-white">Pipeline Overview</h2>
          </div>
          <Link href="/pipeline" className="text-sm text-white hover:text-white/80 font-medium flex items-center gap-1 transition-colors">
            View Pipeline
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {pipelineData.length > 0 ? (
          <div className="p-6 space-y-4">
            {pipelineData.slice(0, 6).map((stage) => (
              <div key={stage.stage} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-gray-700 truncate">
                  {stage.label}
                </div>
                <div className="flex-1">
                  <div className="h-10 bg-gray-100 rounded-xl overflow-hidden relative shadow-inner">
                    <div
                      className="h-full rounded-xl transition-all duration-700 ease-out relative overflow-hidden"
                      style={{
                        width: `${Math.max((stage.count / stats.totalBusinesses) * 100, 5)}%`,
                        backgroundColor: stage.color,
                      }}
                    >
                      {/* Animated shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center px-4">
                      <span className="text-sm font-semibold text-gray-800">
                        {stage.count} {stage.count === 1 ? 'business' : 'businesses'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-32 text-right">
                  <div className="text-sm font-bold text-gray-900">
                    ${stage.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round((stage.count / stats.totalBusinesses) * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8">
            <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-1">No businesses in pipeline</p>
              <p className="text-gray-500 text-sm">Import a CSV to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout with Enhanced Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Businesses */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-white" />
              <h2 className="text-lg font-semibold text-white">Recent Businesses</h2>
            </div>
            <Link href="/businesses" className="text-sm text-white hover:text-white/80 font-medium flex items-center gap-1 transition-colors">
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="space-y-0">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="px-6 py-4">
                    <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : recentBusinesses.length > 0 ? (
              recentBusinesses.map((business) => (
                <div
                  key={business.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{business.business_name}</p>
                      <p className="text-sm text-gray-500">{business.city || 'No location'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${business.total_project_value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{business.total_media_reviews} reviews</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No businesses yet</p>
                <p className="text-gray-500 text-sm mt-1">Import your first CSV to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-white" />
              <h2 className="text-lg font-semibold text-white">Recent Campaigns</h2>
            </div>
            <Link href="/campaigns" className="text-sm text-white hover:text-white/80 font-medium flex items-center gap-1 transition-colors">
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="space-y-0">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="px-6 py-4">
                    <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : recentCampaigns.length > 0 ? (
              recentCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 block group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{campaign.name}</p>
                      <p className="text-sm text-gray-500">{campaign.total_count} businesses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={campaign.status} />
                    <p className="text-xs text-gray-500 mt-1">{campaign.generated_count} generated</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No campaigns yet</p>
                <p className="text-gray-500 text-sm mt-1">Create your first campaign to start outreach</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions with Enhanced Styling */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/businesses"
              className="group relative overflow-hidden flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-200">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Import Businesses</p>
                <p className="text-sm text-gray-600">Upload a CSV file</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </Link>

            <Link
              href="/campaigns/new"
              className="group relative overflow-hidden flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-200">
                <Plus className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-gray-900">New Campaign</p>
                <p className="text-sm text-gray-600">Create AI outreach</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </Link>

            <Link
              href="/pipeline"
              className="group relative overflow-hidden flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-400 hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-200">
                <BarChart3 className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-gray-900">View Pipeline</p>
                <p className="text-sm text-gray-600">Manage leads</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-105 relative overflow-hidden">
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-200`}></div>

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} ${iconColor} group-hover:scale-110 group-hover:rotate-6 transition-all duration-200`}>
          {icon}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200`}></div>
    </div>
  );
}

// Enhanced Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
    generating: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    ready: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    exported: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    active: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    paused: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    completed: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize border ${config.bg} ${config.text} ${config.border}`}>
      {status}
    </span>
  );
}

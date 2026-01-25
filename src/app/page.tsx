'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Business, Campaign } from '@/types';
import { PIPELINE_STAGES } from '@/types';

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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your reputation management pipeline</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pipeline Value"
          value={`$${stats.totalPipelineValue.toLocaleString()}`}
          subtitle={`${stats.totalBusinesses} businesses`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="blue"
        />
        <StatCard
          title="Messages Generated"
          value={stats.messagesGenerated.toString()}
          subtitle={`${stats.activeCampaigns} active campaigns`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          }
          color="purple"
        />
        <StatCard
          title="Emails Sent"
          value={stats.emailsSent.toString()}
          subtitle={`${stats.repliesReceived} replies received`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          color="green"
        />
        <StatCard
          title="Avg Project Value"
          value={`$${Math.round(stats.avgProjectValue).toLocaleString()}`}
          subtitle="per business"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          color="amber"
        />
      </div>

      {/* Pipeline Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Pipeline Overview</h2>
          <Link href="/pipeline" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View Pipeline →
          </Link>
        </div>

        {pipelineData.length > 0 ? (
          <div className="space-y-4">
            {pipelineData.slice(0, 6).map((stage) => (
              <div key={stage.stage} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-gray-700 truncate">
                  {stage.label}
                </div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full rounded-lg transition-all duration-500"
                      style={{
                        width: `${Math.max((stage.count / stats.totalBusinesses) * 100, 5)}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-sm font-medium text-gray-700">
                        {stage.count} businesses
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-28 text-right text-sm font-medium text-gray-900">
                  ${stage.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No businesses in pipeline. Import a CSV to get started.
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Businesses */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Businesses</h2>
            <Link href="/businesses" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentBusinesses.length > 0 ? (
              recentBusinesses.map((business) => (
                <div key={business.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{business.business_name}</p>
                    <p className="text-sm text-gray-500">{business.city || 'No location'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${business.total_project_value.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{business.total_media_reviews} media reviews</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No businesses yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Campaigns</h2>
            <Link href="/campaigns" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentCampaigns.length > 0 ? (
              recentCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors block"
                >
                  <div>
                    <p className="font-medium text-gray-900">{campaign.name}</p>
                    <p className="text-sm text-gray-500">{campaign.total_count} businesses</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={campaign.status} />
                    <p className="text-sm text-gray-500 mt-1">{campaign.generated_count} generated</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No campaigns yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/businesses"
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Import Businesses</p>
              <p className="text-sm text-gray-500">Upload a CSV file</p>
            </div>
          </Link>

          <Link
            href="/campaigns/new"
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">New Campaign</p>
              <p className="text-sm text-gray-500">Create AI outreach</p>
            </div>
          </Link>

          <Link
            href="/pipeline"
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">View Pipeline</p>
              <p className="text-sm text-gray-500">Manage leads</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'green' | 'amber';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    generating: 'bg-yellow-100 text-yellow-700',
    ready: 'bg-green-100 text-green-700',
    exported: 'bg-blue-100 text-blue-700',
    active: 'bg-purple-100 text-purple-700',
    paused: 'bg-orange-100 text-orange-700',
    completed: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[status] || statusColors.draft}`}>
      {status}
    </span>
  );
}

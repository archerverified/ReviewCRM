'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Business, Campaign } from '@/types';
import { PIPELINE_STAGES } from '@/types';
import { StatCard, Badge, Avatar } from '@/components/ui';

interface DashboardStats {
  totalBusinesses: number;
  totalPipelineValue: number;
  activeCampaigns: number;
  messagesGenerated: number;
  emailsSent: number;
  repliesReceived: number;
}

interface PipelineData {
  stage: string;
  label: string;
  count: number;
  value: number;
  color: string;
}

// Sample campaigns data for demo
const sampleCampaigns = [
  { id: 1, name: 'DFW Apartments', status: 'Ready', variant: 'green' as const, leads: 281 },
  { id: 2, name: 'Casino Test', status: 'Ready', variant: 'green' as const, leads: 383 },
  { id: 3, name: 'Test 2', status: 'Draft', variant: 'gray' as const, leads: 342 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBusinesses: 0,
    totalPipelineValue: 0,
    activeCampaigns: 0,
    messagesGenerated: 0,
    emailsSent: 0,
    repliesReceived: 0,
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

      const totalPipelineValue = businesses.reduce((sum, b) => sum + (b.total_project_value || 0), 0);
      const activeCampaigns = campaigns.filter(c => ['active', 'generating', 'ready'].includes(c.status)).length;
      const messagesGenerated = businesses.filter(b => b.personalized_message || b.outreach_message).length;
      const emailsSent = campaigns.reduce((sum, c) => sum + (c.emails_sent || 0), 0);
      const repliesReceived = campaigns.reduce((sum, c) => sum + (c.replies_received || 0), 0);

      setStats({
        totalBusinesses: businesses.length,
        totalPipelineValue,
        activeCampaigns,
        messagesGenerated,
        emailsSent,
        repliesReceived,
      });

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
      setRecentBusinesses(businesses.slice(0, 3));
      setRecentCampaigns(campaigns.slice(0, 3));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-clay-200 rounded animate-pulse" />
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-1 h-24 bg-clay-100 border border-clay-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-clay-900">Dashboard</h1>

      {/* Stats Row */}
      <div className="flex gap-4 flex-wrap">
        <StatCard label="Total Pipeline Value" value={`$${stats.totalPipelineValue.toLocaleString()}`} icon="💰" />
        <StatCard label="Messages Generated" value={stats.messagesGenerated.toString()} icon="📝" />
        <StatCard label="Emails Sent" value={stats.emailsSent.toString()} icon="✉️" />
        <StatCard label="Active Campaigns" value={stats.activeCampaigns.toString()} icon="📧" />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Businesses */}
        <div className="bg-white border border-clay-200 rounded-lg p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[15px] font-semibold text-clay-800">Recent Businesses</span>
            <Link href="/contacts" className="text-[13px] text-clay-500 hover:text-clay-700">
              View All →
            </Link>
          </div>
          {recentBusinesses.length > 0 ? (
            recentBusinesses.map((biz, i) => (
              <div
                key={biz.id}
                className={`flex items-center justify-between py-3 ${
                  i < recentBusinesses.length - 1 ? 'border-b border-clay-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={biz.business_name} size="md" />
                  <div>
                    <div className="text-sm font-medium text-clay-800">{biz.business_name}</div>
                    <div className="text-xs text-clay-500">{biz.city || 'Unknown'}, {biz.state || ''}</div>
                  </div>
                </div>
                <Badge variant={biz.pipeline_stage === 'warm' ? 'yellow' : 'gray'}>
                  {biz.pipeline_stage || 'Cold'}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-clay-500 text-sm">
              No businesses yet. Import a CSV to get started.
            </div>
          )}
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white border border-clay-200 rounded-lg p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[15px] font-semibold text-clay-800">Recent Campaigns</span>
            <Link href="/campaigns" className="text-[13px] text-clay-500 hover:text-clay-700">
              View All →
            </Link>
          </div>
          {recentCampaigns.length > 0 ? (
            recentCampaigns.map((campaign, i) => (
              <div
                key={campaign.id}
                className={`flex items-center justify-between py-3 ${
                  i < recentCampaigns.length - 1 ? 'border-b border-clay-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={campaign.name} size="md" />
                  <div>
                    <div className="text-sm font-medium text-clay-800">{campaign.name}</div>
                    <div className="text-xs text-clay-500">{campaign.total_count || 0} leads</div>
                  </div>
                </div>
                <Badge variant={campaign.status === 'ready' ? 'green' : 'gray'}>
                  {campaign.status}
                </Badge>
              </div>
            ))
          ) : (
            // Show sample data if no campaigns
            sampleCampaigns.map((campaign, i) => (
              <div
                key={campaign.id}
                className={`flex items-center justify-between py-3 ${
                  i < sampleCampaigns.length - 1 ? 'border-b border-clay-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={campaign.name} size="md" />
                  <div>
                    <div className="text-sm font-medium text-clay-800">{campaign.name}</div>
                    <div className="text-xs text-clay-500">{campaign.leads} leads</div>
                  </div>
                </div>
                <Badge variant={campaign.variant}>{campaign.status}</Badge>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-clay-200 rounded-lg p-5">
        <div className="text-[15px] font-semibold text-clay-800 mb-4">Quick Actions</div>
        <div className="flex gap-4">
          {[
            { icon: '📤', label: 'Import Businesses', sublabel: 'Upload a CSV file', href: '/contacts' },
            { icon: '➕', label: 'New Campaign', sublabel: 'Create AI outreach', href: '/campaigns/new' },
            { icon: '👥', label: 'Add Contact', sublabel: 'Manual entry', href: '/contacts' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex-1 flex items-center gap-3 p-4 border border-clay-200 rounded-lg hover:bg-clay-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-clay-100 flex items-center justify-center text-lg">
                {action.icon}
              </div>
              <div>
                <div className="text-sm font-medium text-clay-800">{action.label}</div>
                <div className="text-xs text-clay-500">{action.sublabel}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

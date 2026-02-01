'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { StatCard, Badge } from '@/components/ui';
import { emailAccountQueries } from '@/lib/supabase';
import type { EmailAccount, EmailAccountProvider, EmailAccountStatus } from '@/types';
import { EMAIL_ACCOUNT_PROVIDERS, EMAIL_ACCOUNT_STATUSES } from '@/types';
import { toast } from 'sonner';

export default function EmailAccountsPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<EmailAccountStatus | 'all'>('all');
  const [metrics, setMetrics] = useState({
    total: 0,
    domains: 0,
    warmup: 0,
    errors: 0,
    active: 0,
    paused: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [accountsData, metricsData] = await Promise.all([
        emailAccountQueries.getAll(),
        emailAccountQueries.getMetrics(),
      ]);
      setAccounts(accountsData);
      setMetrics(metricsData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load email accounts: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  const filteredAccounts = filterStatus === 'all'
    ? accounts
    : accounts.filter(a => a.status === filterStatus);

  function toggleSelection(id: string) {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredAccounts.length && filteredAccounts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAccounts.map(a => a.id)));
    }
  }

  async function handleStatusChange(id: string, status: EmailAccountStatus) {
    try {
      await emailAccountQueries.updateStatus(id, status);
      setAccounts(accounts.map(a => a.id === id ? { ...a, status } : a));
      const metricsData = await emailAccountQueries.getMetrics();
      setMetrics(metricsData);
      toast.success(`Account status updated to ${status}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update status: ${errorMessage}`);
    }
  }

  async function handleBulkStatusChange(status: EmailAccountStatus) {
    const ids = Array.from(selectedIds);
    try {
      await emailAccountQueries.bulkUpdateStatus(ids, status);
      setAccounts(accounts.map(a => selectedIds.has(a.id) ? { ...a, status } : a));
      const metricsData = await emailAccountQueries.getMetrics();
      setMetrics(metricsData);
      setSelectedIds(new Set());
      toast.success(`Updated ${ids.length} accounts to ${status}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update status: ${errorMessage}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this email account?')) {
      return;
    }

    try {
      await emailAccountQueries.delete(id);
      setAccounts(accounts.filter(a => a.id !== id));
      const metricsData = await emailAccountQueries.getMetrics();
      setMetrics(metricsData);
      toast.success('Account deleted');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to delete account: ${errorMessage}`);
    }
  }

  function getHealthColor(score: number): string {
    if (score >= 80) return 'text-status-green-text';
    if (score >= 60) return 'text-status-yellow-text';
    return 'text-status-red-text';
  }

  function calculateWarmupDay(account: EmailAccount): number {
    if (!account.warmup_enabled || !account.created_at) return 0;
    const createdDate = new Date(account.created_at);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(diffDays, 14);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clay-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-clay-900">Email Accounts</h1>
          <p className="text-[13px] text-clay-500 mt-0.5">
            Manage your email sending accounts and warmup
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Account
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total"
          value={metrics.total}
          icon={
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          }
        />
        <StatCard
          label="Domains"
          value={metrics.domains}
          icon={
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
            </svg>
          }
        />
        <StatCard
          label="Active"
          value={metrics.active}
          icon={
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          }
        />
        <StatCard
          label="Warmup"
          value={metrics.warmup}
          icon={
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
          }
        />
        <StatCard
          label="Paused"
          value={metrics.paused}
          icon={
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          }
        />
        <StatCard
          label="Errors"
          value={metrics.errors}
          icon={
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          }
        />
      </div>

      {/* Filter & Actions Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <span className="text-[13px] font-medium text-clay-700">Your accounts ({filteredAccounts.length})</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as EmailAccountStatus | 'all')}
            className="px-3 py-1.5 rounded-md border border-clay-200 text-[13px] bg-white hover:border-clay-300 focus:border-clay-400 focus:ring-1 focus:ring-clay-200 transition-colors"
          >
            <option value="all">All Status</option>
            {EMAIL_ACCOUNT_STATUSES.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-3 py-2 bg-clay-50 rounded-lg border border-clay-200">
            <span className="text-[13px] font-medium text-clay-700">{selectedIds.size} selected</span>
            <select
              onChange={(e) => e.target.value && handleBulkStatusChange(e.target.value as EmailAccountStatus)}
              className="px-2 py-1 rounded border border-clay-200 text-[12px] bg-white hover:border-clay-300 transition-colors"
              defaultValue=""
            >
              <option value="" disabled>Change status...</option>
              {EMAIL_ACCOUNT_STATUSES.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg border border-clay-200 overflow-hidden">
        <table className="min-w-full divide-y divide-clay-200">
          <thead className="bg-clay-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredAccounts.length && filteredAccounts.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-clay-300 text-clay-600 focus:ring-clay-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-clay-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-clay-500 uppercase tracking-wider">Provider</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-clay-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-clay-500 uppercase tracking-wider">Sent / Quota</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-clay-500 uppercase tracking-wider">Health</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-clay-500 uppercase tracking-wider">Verification</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-clay-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clay-100 bg-white">
            {filteredAccounts.map((account, index) => {
              const warmupDay = calculateWarmupDay(account);
              return (
                <tr
                  key={account.id}
                  className={`hover:bg-clay-50 transition-colors ${index % 2 === 1 ? 'bg-row-alt' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(account.id)}
                      onChange={() => toggleSelection(account.id)}
                      className="h-4 w-4 rounded border-clay-300 text-clay-600 focus:ring-clay-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-clay-100 flex items-center justify-center text-clay-600 font-medium text-[13px]">
                        {account.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-[13px] text-clay-900">{account.email}</div>
                        <div className="text-[11px] text-clay-500">{account.domain}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ProviderBadge provider={account.provider} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <StatusBadge status={account.status} />
                      {account.warmup_enabled && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-clay-100 rounded-full overflow-hidden max-w-[60px]">
                            <div
                              className="h-full bg-status-yellow-dot rounded-full transition-all"
                              style={{ width: `${(warmupDay / 14) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-medium text-clay-500 whitespace-nowrap">
                            Day {warmupDay}/14
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="text-[13px]">
                        <span className="font-medium text-clay-900">{account.daily_sent}</span>
                        <span className="text-clay-400"> / </span>
                        <span className="text-clay-600">{account.daily_quota}</span>
                      </div>
                      <div className="w-20 h-1.5 bg-clay-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-clay-400 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (account.daily_sent / account.daily_quota) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-clay-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              account.health_score >= 80
                                ? 'bg-status-green-dot'
                                : account.health_score >= 60
                                ? 'bg-status-yellow-dot'
                                : 'bg-status-red-dot'
                            }`}
                            style={{ width: `${account.health_score}%` }}
                          />
                        </div>
                        <span className={`text-[12px] font-medium ${getHealthColor(account.health_score)}`}>
                          {account.health_score}%
                        </span>
                      </div>
                      {(account.spam_rate > 0 || account.bounce_rate > 0) && (
                        <div className="flex gap-1.5 text-[10px]">
                          {account.spam_rate > 0 && (
                            <span className="px-1.5 py-0.5 bg-status-red-bg text-status-red-text rounded">
                              Spam: {(account.spam_rate * 100).toFixed(1)}%
                            </span>
                          )}
                          {account.bounce_rate > 0 && (
                            <span className="px-1.5 py-0.5 bg-status-yellow-bg text-status-yellow-text rounded">
                              Bounce: {(account.bounce_rate * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <VerificationBadge label="DKIM" verified={account.dkim_verified} />
                      <VerificationBadge label="SPF" verified={account.spf_verified} />
                      <VerificationBadge label="DMARC" verified={account.dmarc_verified} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={account.status}
                        onChange={(e) => handleStatusChange(account.id, e.target.value as EmailAccountStatus)}
                        className="px-2 py-1 rounded border border-clay-200 text-[11px] bg-white hover:border-clay-300 transition-colors"
                      >
                        {EMAIL_ACCOUNT_STATUSES.map(status => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-1.5 rounded text-clay-400 hover:bg-status-red-bg hover:text-status-red-text transition-colors"
                        title="Delete account"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty State */}
        {filteredAccounts.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-clay-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-clay-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-[15px] font-medium text-clay-900 mb-1">No email accounts yet</h3>
            <p className="text-[13px] text-clay-500 mb-6 max-w-sm mx-auto">
              Add your first email account to start sending campaigns and warming up your domain reputation.
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Account
            </Button>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={async () => {
          await loadData();
          setShowAddModal(false);
        }}
      />
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: EmailAccountStatus }) {
  const statusConfig: Record<EmailAccountStatus, { variant: 'green' | 'blue' | 'yellow' | 'red' | 'gray'; label: string }> = {
    active: { variant: 'green', label: 'Active' },
    paused: { variant: 'yellow', label: 'Paused' },
    warming: { variant: 'blue', label: 'Warming' },
    error: { variant: 'red', label: 'Error' },
  };

  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Provider Badge Component
function ProviderBadge({ provider }: { provider: EmailAccountProvider }) {
  const providerConfig: Record<EmailAccountProvider, { name: string; icon: React.ReactNode }> = {
    google: {
      name: 'Google',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
    },
    microsoft: {
      name: 'Outlook',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
          <path fill="#f25022" d="M1 1h10v10H1z"/>
          <path fill="#00a4ef" d="M13 1h10v10H13z"/>
          <path fill="#7fba00" d="M1 13h10v10H1z"/>
          <path fill="#ffb900" d="M13 13h10v10H13z"/>
        </svg>
      ),
    },
    smtp: {
      name: 'SMTP',
      icon: (
        <svg className="w-3.5 h-3.5 text-clay-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
        </svg>
      ),
    },
  };

  const config = providerConfig[provider];

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-clay-50 border border-clay-200 text-[11px] font-medium text-clay-700">
      {config.icon}
      {config.name}
    </span>
  );
}

// Verification Badge Component
function VerificationBadge({ label, verified }: { label: string; verified: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
        verified
          ? 'bg-status-green-bg text-status-green-text'
          : 'bg-clay-100 text-clay-400'
      }`}
      title={`${label} ${verified ? 'verified' : 'not verified'}`}
    >
      {verified ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )}
      {label}
    </span>
  );
}

// Add Account Modal Component with OAuth and Bulk CSV
type ImportMethod = 'google' | 'microsoft' | 'smtp' | 'csv';

function AddAccountModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
}) {
  const [importMethod, setImportMethod] = useState<ImportMethod>('smtp');
  const [email, setEmail] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<Array<{email: string; smtp_host: string; smtp_port: string}>>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (importMethod === 'csv' && csvFile) {
        const accounts = await handleCsvImport();
        toast.success(`Successfully imported ${accounts.length} email accounts`);
        onAdd();
      } else if (importMethod === 'smtp') {
        const accountData: Partial<EmailAccount> = {
          email,
          provider: 'smtp',
          status: 'active',
          warmup_enabled: false,
          daily_quota: 50,
          health_score: 100,
          smtp_host: smtpHost,
          smtp_port: parseInt(smtpPort),
          smtp_username: smtpUsername,
          smtp_password: smtpPassword,
        };

        await emailAccountQueries.create(accountData);
        toast.success('Email account added successfully');
        onAdd();
      }

      resetForm();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to add account: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setEmail('');
    setSmtpHost('');
    setSmtpPort('587');
    setSmtpUsername('');
    setSmtpPassword('');
    setCsvFile(null);
    setCsvPreview([]);
  }

  async function handleCsvImport(): Promise<EmailAccount[]> {
    if (!csvFile) throw new Error('No CSV file selected');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

          const accounts: EmailAccount[] = [];
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });

            if (row.email) {
              const accountData: Partial<EmailAccount> = {
                email: row.email,
                provider: 'smtp' as EmailAccountProvider,
                status: 'active' as EmailAccountStatus,
                warmup_enabled: false,
                daily_quota: 50,
                health_score: 100,
                smtp_host: row.smtp_host || '',
                smtp_port: parseInt(row.smtp_port || '587'),
                smtp_username: row.smtp_username || row.email,
                smtp_password: row.smtp_password || row.password || '',
              };

              const newAccount = await emailAccountQueries.create(accountData);
              accounts.push(newAccount);
            }
          }

          resolve(accounts);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read CSV file'));
      reader.readAsText(csvFile);
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const preview: Array<{email: string; smtp_host: string; smtp_port: string}> = [];

        for (let i = 1; i < Math.min(4, lines.length); i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          preview.push({
            email: row.email || '',
            smtp_host: row.smtp_host || '',
            smtp_port: row.smtp_port || '587',
          });
        }
        setCsvPreview(preview);
      };
      reader.readAsText(file);
    }
  }

  function handleGoogleOAuth() {
    toast.info('Google OAuth integration coming soon! Please use SMTP for now.');
  }

  function handleMicrosoftOAuth() {
    toast.info('Microsoft OAuth integration coming soon! Please use SMTP for now.');
  }

  const importOptions = [
    {
      value: 'google',
      name: 'Google OAuth',
      description: 'Connect with Gmail/Google Workspace',
      recommended: true,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
    },
    {
      value: 'microsoft',
      name: 'Microsoft OAuth',
      description: 'Connect with Outlook/Microsoft 365',
      recommended: true,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#f25022" d="M1 1h10v10H1z"/>
          <path fill="#00a4ef" d="M13 1h10v10H13z"/>
          <path fill="#7fba00" d="M1 13h10v10H1z"/>
          <path fill="#ffb900" d="M13 13h10v10H13z"/>
        </svg>
      ),
    },
    {
      value: 'smtp',
      name: 'Manual SMTP',
      description: 'Configure SMTP settings manually',
      recommended: false,
      icon: (
        <svg className="w-5 h-5 text-clay-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      value: 'csv',
      name: 'Bulk CSV Upload',
      description: 'Import multiple accounts from CSV',
      recommended: false,
      icon: (
        <svg className="w-5 h-5 text-clay-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Email Accounts">
      <div className="space-y-5">
        {/* Import Method Selection */}
        <div>
          <label className="block text-[13px] font-medium text-clay-700 mb-2">Select an import method</label>
          <div className="grid grid-cols-1 gap-2">
            {importOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setImportMethod(option.value as ImportMethod)}
                className={`relative p-3 rounded-lg border text-left transition-colors ${
                  importMethod === option.value
                    ? 'border-clay-400 bg-clay-50'
                    : 'border-clay-200 hover:border-clay-300 hover:bg-clay-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">{option.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-clay-900">{option.name}</span>
                      {option.recommended && (
                        <span className="px-1.5 py-0.5 bg-clay-200 text-clay-600 text-[10px] rounded font-medium">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-clay-500 mt-0.5">{option.description}</p>
                  </div>
                  {importMethod === option.value && (
                    <svg className="w-4 h-4 text-clay-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Google OAuth Section */}
        {importMethod === 'google' && (
          <div className="space-y-3">
            <div className="p-3 bg-clay-50 rounded-lg border border-clay-200">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-clay-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-[12px] text-clay-600">
                  Your credentials will be securely shared with our integration partner. We never store your password.
                </p>
              </div>
            </div>
            <Button
              onClick={handleGoogleOAuth}
              variant="secondary"
              className="w-full justify-center"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Connect with Google
            </Button>
          </div>
        )}

        {/* Microsoft OAuth Section */}
        {importMethod === 'microsoft' && (
          <div className="space-y-3">
            <div className="p-3 bg-clay-50 rounded-lg border border-clay-200">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-clay-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-[12px] text-clay-600">
                  Your credentials will be securely shared with our integration partner. We never store your password.
                </p>
              </div>
            </div>
            <Button
              onClick={handleMicrosoftOAuth}
              variant="secondary"
              className="w-full justify-center"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#f25022" d="M1 1h10v10H1z"/>
                <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                <path fill="#7fba00" d="M1 13h10v10H1z"/>
                <path fill="#ffb900" d="M13 13h10v10H13z"/>
              </svg>
              Connect with Microsoft
            </Button>
          </div>
        )}

        {/* SMTP Form */}
        {importMethod === 'smtp' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-clay-700 mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-3 p-3 bg-clay-50 rounded-lg border border-clay-200">
              <h4 className="text-[13px] font-medium text-clay-900">SMTP Configuration</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-clay-600 mb-1">SMTP Host</label>
                  <Input
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-clay-600 mb-1">SMTP Port</label>
                  <Input
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="587"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-clay-600 mb-1">SMTP Username</label>
                <Input
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                  placeholder="Username or email"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-clay-600 mb-1">SMTP Password</label>
                <Input
                  type="password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder="Password or app password"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-clay-200">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Account'}
              </Button>
            </div>
          </form>
        )}

        {/* CSV Upload Section */}
        {importMethod === 'csv' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-clay-50 rounded-lg border border-clay-200">
              <p className="text-[12px] text-clay-600">
                CSV should have columns: <code className="bg-clay-100 px-1 rounded text-[11px]">email</code>, <code className="bg-clay-100 px-1 rounded text-[11px]">smtp_host</code>, <code className="bg-clay-100 px-1 rounded text-[11px]">smtp_port</code>, <code className="bg-clay-100 px-1 rounded text-[11px]">smtp_username</code>, <code className="bg-clay-100 px-1 rounded text-[11px]">smtp_password</code>
              </p>
            </div>

            <div className="border-2 border-dashed border-clay-200 rounded-lg p-6 text-center hover:border-clay-300 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <svg className="mx-auto h-10 w-10 text-clay-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-[13px] text-clay-600">
                  <span className="font-medium text-clay-700">Click to upload</span> or drag and drop
                </p>
                <p className="text-[11px] text-clay-400 mt-1">CSV file only</p>
              </label>
            </div>

            {csvFile && (
              <div className="p-3 bg-clay-50 rounded-lg border border-clay-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-status-green-text" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[13px] font-medium text-clay-900">{csvFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCsvFile(null); setCsvPreview([]); }}
                    className="text-clay-400 hover:text-clay-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {csvPreview.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-clay-600 mb-1.5">Preview:</p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-clay-200 text-[11px]">
                        <thead>
                          <tr>
                            <th className="px-2 py-1.5 text-left font-medium text-clay-500">Email</th>
                            <th className="px-2 py-1.5 text-left font-medium text-clay-500">SMTP Host</th>
                            <th className="px-2 py-1.5 text-left font-medium text-clay-500">Port</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-clay-100">
                          {csvPreview.map((row, i) => (
                            <tr key={i}>
                              <td className="px-2 py-1.5 text-clay-900">{row.email}</td>
                              <td className="px-2 py-1.5 text-clay-600">{row.smtp_host}</td>
                              <td className="px-2 py-1.5 text-clay-600">{row.smtp_port}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-clay-200">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !csvFile}>
                {isSubmitting ? 'Importing...' : 'Import Accounts'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

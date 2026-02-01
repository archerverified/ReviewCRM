'use client';

import { Business, getStageInfo, PIPELINE_STAGES } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Pencil, Save, X } from 'lucide-react';

interface BusinessDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business | null;
  onDelete?: (businessId: string) => void;
  onEdit?: (business: Business) => void;
  onStageChange?: (businessId: string, newStage: string) => void;
  onBusinessUpdated?: (business: Business) => void;
}

export function BusinessDetailModal({
  isOpen,
  onClose,
  business,
  onDelete,
  onEdit,
  onStageChange,
  onBusinessUpdated,
}: BusinessDetailModalProps) {
  const [isChangingStage, setIsChangingStage] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedBusiness, setEditedBusiness] = useState<Partial<Business>>({});

  // Reset edit mode when modal closes or business changes
  useEffect(() => {
    if (!isOpen || !business) {
      setIsEditMode(false);
      setEditedBusiness({});
    } else {
      setEditedBusiness({
        business_name: business.business_name,
        contact_name: business.contact_name,
        email: business.email,
        phone: business.phone,
        city: business.city,
        state: business.state,
        industry: business.industry,
        website_url: business.website_url,
        notes: business.notes,
      });
    }
  }, [isOpen, business]);

  if (!business) return null;

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          ...editedBusiness,
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id);

      if (error) throw error;

      const updatedBusiness = { ...business, ...editedBusiness };
      if (onBusinessUpdated) {
        onBusinessUpdated(updatedBusiness as Business);
      }
      setIsEditMode(false);
      toast.success('Contact updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedBusiness({
      business_name: business.business_name,
      contact_name: business.contact_name,
      email: business.email,
      phone: business.phone,
      city: business.city,
      state: business.state,
      industry: business.industry,
      website_url: business.website_url,
      notes: business.notes,
    });
  };

  const updateField = (field: keyof Business, value: string | null) => {
    setEditedBusiness(prev => ({ ...prev, [field]: value }));
  };

  const stageInfo = getStageInfo(business.pipeline_stage);

  const handleDelete = () => {
    if (onDelete && confirm(`Are you sure you want to delete ${business.business_name}?`)) {
      onDelete(business.id);
      onClose();
    }
  };

  const handleStageChange = async (newStage: string) => {
    if (onStageChange) {
      setIsChangingStage(true);
      await onStageChange(business.id, newStage);
      setIsChangingStage(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center justify-between w-full">
          <span>{isEditMode ? 'Edit Contact' : business.business_name}</span>
          {!isEditMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditMode(true)}
              className="ml-4"
            >
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      }
      size="xl"
      footer={
        isEditMode ? (
          <>
            <Button variant="ghost" onClick={handleCancelEdit} disabled={isSaving}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            {onDelete && (
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            )}
          </>
        )
      }
    >
      <div className="space-y-6">
        {/* Contact & Location */}
        <section className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact & Location</h3>
          {isEditMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Business Name</label>
                <Input
                  value={editedBusiness.business_name || ''}
                  onChange={(e) => updateField('business_name', e.target.value)}
                  placeholder="Business name"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Contact Name</label>
                <Input
                  value={editedBusiness.contact_name || ''}
                  onChange={(e) => updateField('contact_name', e.target.value)}
                  placeholder="Contact name"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <Input
                  type="email"
                  value={editedBusiness.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="Email address"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phone</label>
                <Input
                  value={editedBusiness.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">City</label>
                <Input
                  value={editedBusiness.city || ''}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">State</label>
                <Input
                  value={editedBusiness.state || ''}
                  onChange={(e) => updateField('state', e.target.value)}
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Industry</label>
                <Input
                  value={editedBusiness.industry || ''}
                  onChange={(e) => updateField('industry', e.target.value)}
                  placeholder="Industry"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Website</label>
                <Input
                  value={editedBusiness.website_url || ''}
                  onChange={(e) => updateField('website_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Contact Name" value={business.contact_name} />
              <InfoField label="Email" value={business.email} copyable />
              <InfoField label="Phone" value={business.phone} copyable />
              <InfoField label="Location" value={business.city && business.state ? `${business.city}, ${business.state}` : business.city || business.state} />
              <InfoField label="Industry" value={business.industry} />
              <div className="md:col-span-2">
                <InfoField label="Website" value={business.website_url} link />
              </div>
              {business.gmaps_url && (
                <div className="md:col-span-2">
                  <InfoField label="Google Maps" value={business.gmaps_url} link />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Review Metrics */}
        <section className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Review Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Rating</span>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-gray-900">
                    {business.google_rating?.toFixed(1) || 'N/A'}
                  </span>
                  <StarIcon filled />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Reviews</span>
                <span className="text-lg font-bold text-gray-900">{business.total_reviews}</span>
              </div>
              {business.projected_rating && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-blue-600">Projected Rating</span>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-blue-600">
                      {business.projected_rating.toFixed(1)}
                    </span>
                    <StarIcon filled className="text-blue-600" />
                  </div>
                </div>
              )}
            </div>

            {/* Star Breakdown */}
            <div className="space-y-1.5">
              <StarBreakdown stars={5} count={business.five_star_reviews} total={business.total_reviews} />
              <StarBreakdown stars={4} count={business.four_star_reviews} total={business.total_reviews} />
              <StarBreakdown stars={3} count={business.three_star_reviews} total={business.total_reviews} />
              <StarBreakdown stars={2} count={business.two_star_reviews} total={business.total_reviews} />
              <StarBreakdown stars={1} count={business.one_star_reviews} total={business.total_reviews} />
            </div>
          </div>

          {/* Media Reviews Highlight */}
          {business.total_media_reviews > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-900">Media Reviews Found</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {business.one_star_media_reviews} one-star + {business.two_star_media_reviews} two-star
                  </p>
                </div>
                <div className="text-2xl font-bold text-amber-900">
                  {business.total_media_reviews}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Pricing & Value */}
        <section className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Pricing & Value</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Pricing Tier</p>
              <p className="text-lg font-bold text-gray-900 capitalize">
                {business.pricing_tier || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Price per Review</p>
              <p className="text-lg font-bold text-gray-900">
                ${business.price_per_review}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Project Value</p>
              <p className="text-lg font-bold text-blue-600">
                ${business.total_project_value.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* Pipeline & Status */}
        <section className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Pipeline & Status</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-2">Current Stage</p>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${stageInfo.color}20`,
                    color: stageInfo.color,
                  }}
                >
                  {stageInfo.label}
                </span>
                {onStageChange && (
                  <select
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={business.pipeline_stage}
                    onChange={(e) => handleStageChange(e.target.value)}
                    disabled={isChangingStage}
                  >
                    {PIPELINE_STAGES.map((stage) => (
                      <option key={stage.stage} value={stage.stage}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Email Verification</p>
                <StatusBadge status={business.email_verification_status} type="verification" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email Outreach</p>
                <StatusBadge status={business.email_outreach_status} type="outreach" />
              </div>
            </div>

            {business.last_contacted_at && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Last Contacted</p>
                <p className="text-sm text-gray-900">
                  {new Date(business.last_contacted_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Outreach Message */}
        {(business.personalized_message || business.outreach_message) && (
          <section className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Outreach Message</h3>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {business.personalized_message || business.outreach_message}
              </p>
            </div>
          </section>
        )}

        {/* Notes */}
        {(business.notes || isEditMode) && (
          <section className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Notes</h3>
            {isEditMode ? (
              <textarea
                value={editedBusiness.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Add notes about this contact..."
              />
            ) : (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{business.notes}</p>
              </div>
            )}
          </section>
        )}

        {/* Metadata */}
        <section className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {new Date(business.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <div>
              <span className="font-medium">Updated:</span>{' '}
              {new Date(business.updated_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}

// Helper Components
function InfoField({ label, value, copyable, link }: { label: string; value: string | null; copyable?: boolean; link?: boolean }) {
  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
    }
  };

  if (!value) {
    return (
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm text-gray-400">Not provided</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        {link ? (
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 underline truncate"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-gray-900">{value}</p>
        )}
        {copyable && (
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Copy to clipboard"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function StarIcon({ filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg
      className={`w-5 h-5 ${className || 'text-yellow-400'}`}
      fill={filled ? 'currentColor' : 'none'}
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
}

function StarBreakdown({ stars, count, total }: { stars: number; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-6">{stars}★</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 w-8 text-right">{count}</span>
    </div>
  );
}

function StatusBadge({ status, type }: { status: string; type: 'verification' | 'outreach' }) {
  const verificationColors: Record<string, string> = {
    unverified: 'bg-gray-100 text-gray-700',
    good: 'bg-green-100 text-green-700',
    risky: 'bg-yellow-100 text-yellow-700',
    bad: 'bg-red-100 text-red-700',
  };

  const outreachColors: Record<string, string> = {
    not_sent: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    opened: 'bg-purple-100 text-purple-700',
    clicked: 'bg-indigo-100 text-indigo-700',
    replied: 'bg-green-100 text-green-700',
    bounced: 'bg-red-100 text-red-700',
    unsubscribed: 'bg-orange-100 text-orange-700',
  };

  const colors = type === 'verification' ? verificationColors : outreachColors;

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] || colors.unverified || colors.not_sent}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

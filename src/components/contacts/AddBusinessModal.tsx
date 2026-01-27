'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { businessQueries } from '@/lib/supabase';
import type { Business } from '@/types';
import { calculatePricing } from '@/types';
import { toast } from 'sonner';
import { Building2, Globe, Star, Hash } from 'lucide-react';

interface AddBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBusinessAdded: (business: Business) => void;
}

export function AddBusinessModal({
  isOpen,
  onClose,
  onBusinessAdded,
}: AddBusinessModalProps) {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [googleRating, setGoogleRating] = useState('');
  const [totalReviews, setTotalReviews] = useState('');
  const [oneStarReviews, setOneStarReviews] = useState('0');
  const [twoStarReviews, setTwoStarReviews] = useState('0');
  const [threeStarReviews, setThreeStarReviews] = useState('0');
  const [fourStarReviews, setFourStarReviews] = useState('0');
  const [fiveStarReviews, setFiveStarReviews] = useState('0');
  const [oneStarMediaReviews, setOneStarMediaReviews] = useState('0');
  const [twoStarMediaReviews, setTwoStarMediaReviews] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate totals
  const totalMediaReviews = parseInt(oneStarMediaReviews || '0') + parseInt(twoStarMediaReviews || '0');
  const pricing = calculatePricing(totalMediaReviews);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!businessName.trim()) {
      toast.error('Please enter a business name');
      return;
    }

    setIsSubmitting(true);

    try {
      const business = await businessQueries.create({
        business_name: businessName,
        email: email || null,
        phone: phone || null,
        website_url: website || null,
        city: city || null,
        state: state || null,
        google_rating: googleRating ? parseFloat(googleRating) : null,
        total_reviews: parseInt(totalReviews || '0'),
        one_star_reviews: parseInt(oneStarReviews || '0'),
        two_star_reviews: parseInt(twoStarReviews || '0'),
        three_star_reviews: parseInt(threeStarReviews || '0'),
        four_star_reviews: parseInt(fourStarReviews || '0'),
        five_star_reviews: parseInt(fiveStarReviews || '0'),
        one_star_media_reviews: parseInt(oneStarMediaReviews || '0'),
        two_star_media_reviews: parseInt(twoStarMediaReviews || '0'),
        total_media_reviews: totalMediaReviews,
        pricing_tier: pricing.tier,
        price_per_review: pricing.pricePerReview,
        total_project_value: pricing.totalValue,
        contact_type: 'business',
        category: 'business',
        pipeline_stage: 'lead_scraped',
        email_verification_status: 'unverified',
        email_outreach_status: 'not_sent',
        contacted: 'no',
      });

      onBusinessAdded(business);
      toast.success('Business added successfully');
      resetForm();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to add business: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setBusinessName('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setCity('');
    setState('');
    setGoogleRating('');
    setTotalReviews('');
    setOneStarReviews('0');
    setTwoStarReviews('0');
    setThreeStarReviews('0');
    setFourStarReviews('0');
    setFiveStarReviews('0');
    setOneStarMediaReviews('0');
    setTwoStarMediaReviews('0');
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Business" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Building2 className="w-4 h-4" />
            Basic Information
          </div>

          <Input
            label="Business Name *"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="ABC Restaurant"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@business.com"
            />
            <Input
              label="Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input
                label="Website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="New York"
              />
              <Input
                label="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="NY"
              />
            </div>
          </div>
        </div>

        {/* Review Metrics */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Star className="w-4 h-4" />
            Review Metrics
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Google Rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={googleRating}
              onChange={(e) => setGoogleRating(e.target.value)}
              placeholder="4.5"
            />
            <Input
              label="Total Reviews"
              type="number"
              min="0"
              value={totalReviews}
              onChange={(e) => setTotalReviews(e.target.value)}
              placeholder="150"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-3">Star Distribution</div>
            <div className="grid grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">1 Star</label>
                <input
                  type="number"
                  min="0"
                  value={oneStarReviews}
                  onChange={(e) => setOneStarReviews(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-gray-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">2 Star</label>
                <input
                  type="number"
                  min="0"
                  value={twoStarReviews}
                  onChange={(e) => setTwoStarReviews(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-gray-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">3 Star</label>
                <input
                  type="number"
                  min="0"
                  value={threeStarReviews}
                  onChange={(e) => setThreeStarReviews(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-gray-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">4 Star</label>
                <input
                  type="number"
                  min="0"
                  value={fourStarReviews}
                  onChange={(e) => setFourStarReviews(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-gray-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">5 Star</label>
                <input
                  type="number"
                  min="0"
                  value={fiveStarReviews}
                  onChange={(e) => setFiveStarReviews(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-gray-300 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-800 mb-3">Media Reviews (The Product)</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-blue-600 mb-1">1 Star w/ Media</label>
                <input
                  type="number"
                  min="0"
                  value={oneStarMediaReviews}
                  onChange={(e) => setOneStarMediaReviews(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-blue-200 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-blue-600 mb-1">2 Star w/ Media</label>
                <input
                  type="number"
                  min="0"
                  value={twoStarMediaReviews}
                  onChange={(e) => setTwoStarMediaReviews(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-blue-200 text-sm bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Calculated Values */}
        {totalMediaReviews > 0 && (
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm font-medium text-green-800 mb-3">Calculated Project Value</div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-green-600">Total Media Reviews:</span>
                <span className="font-bold text-green-800 ml-2">{totalMediaReviews}</span>
              </div>
              <div>
                <span className="text-green-600">Pricing Tier:</span>
                <span className="font-bold text-green-800 ml-2 capitalize">{pricing.tier || 'N/A'}</span>
              </div>
              <div>
                <span className="text-green-600">Project Value:</span>
                <span className="font-bold text-green-800 ml-2">${pricing.totalValue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Business'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

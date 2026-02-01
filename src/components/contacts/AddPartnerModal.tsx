'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { businessQueries } from '@/lib/supabase';
import type { Business } from '@/types';
import { toast } from 'sonner';
import { Handshake, User, Briefcase, Sparkles } from 'lucide-react';

interface AddPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPartnerAdded: (partner: Business) => void;
}

export function AddPartnerModal({
  isOpen,
  onClose,
  onPartnerAdded,
}: AddPartnerModalProps) {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resource, setResource] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a partner name');
      return;
    }

    setIsSubmitting(true);

    try {
      const partner = await businessQueries.create({
        business_name: name,
        contact_name: contactPerson || null,
        email: email || null,
        phone: phone || null,
        website_url: website || null,
        resource: resource || null,
        speciality: speciality || null,
        notes: notes || null,
        contact_type: 'partner',
        category: 'partner',
        pipeline_stage: 'lead_scraped',
        email_verification_status: 'unverified',
        email_outreach_status: 'not_sent',
        contacted: 'no',
        total_reviews: 0,
        one_star_reviews: 0,
        two_star_reviews: 0,
        three_star_reviews: 0,
        four_star_reviews: 0,
        five_star_reviews: 0,
        one_star_media_reviews: 0,
        two_star_media_reviews: 0,
        total_media_reviews: 0,
        price_per_review: 0,
        total_project_value: 0,
      });

      onPartnerAdded(partner);
      toast.success('Partner added successfully');
      resetForm();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to add partner: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setResource('');
    setSpeciality('');
    setWebsite('');
    setNotes('');
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Partner">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Partner Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-purple-700 font-medium">
            <Handshake className="w-4 h-4" />
            Partner Information
          </div>

          <Input
            label="Partner/Company Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Partner Company LLC"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="John Smith"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@partner.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
            <Input
              label="Website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://partner.com"
            />
          </div>
        </div>

        {/* Partnership Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-purple-700 font-medium">
            <Briefcase className="w-4 h-4" />
            Partnership Details
          </div>

          <div className="bg-purple-50 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-800 mb-1">
                Resource Type
              </label>
              <select
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select resource type...</option>
                <option value="referral">Referral Partner</option>
                <option value="reseller">Reseller</option>
                <option value="affiliate">Affiliate</option>
                <option value="integration">Integration Partner</option>
                <option value="agency">Agency Partner</option>
                <option value="technology">Technology Partner</option>
                <option value="consultant">Consultant</option>
                <option value="other">Other</option>
              </select>
            </div>

            <Input
              label="Speciality/Focus Area"
              value={speciality}
              onChange={(e) => setSpeciality(e.target.value)}
              placeholder="e.g., Restaurant Industry, Healthcare, Local SEO"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes about this partnership..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? 'Adding...' : 'Add Partner'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

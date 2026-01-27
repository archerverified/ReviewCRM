'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase, businessQueries } from '@/lib/supabase';
import type { Business, ContactCategory } from '@/types';
import { CONTACT_CATEGORIES } from '@/types';
import { toast } from 'sonner';
import { Search, X, Plus } from 'lucide-react';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded: (contact: Business) => void;
  defaultCategory?: ContactCategory;
}

export function AddContactModal({
  isOpen,
  onClose,
  onContactAdded,
  defaultCategory,
}: AddContactModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessSearch, setBusinessSearch] = useState('');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [categories, setCategories] = useState<ContactCategory[]>(
    defaultCategory ? [defaultCategory] : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  useEffect(() => {
    if (defaultCategory) {
      setCategories([defaultCategory]);
    }
  }, [defaultCategory]);

  // Debounced business search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (businessSearch.length >= 2) {
        const { data } = await supabase
          .from('businesses')
          .select('id, business_name, city, email')
          .or(`business_name.ilike.%${businessSearch}%,email.ilike.%${businessSearch}%`)
          .limit(5);

        if (data) {
          setSearchResults(data as Business[]);
          setShowSearchResults(true);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [businessSearch]);

  function selectBusiness(business: Business) {
    setSelectedBusinessId(business.id);
    setSelectedBusinessName(business.business_name);
    setBusinessSearch(business.business_name);
    setShowSearchResults(false);
  }

  function clearBusinessSelection() {
    setSelectedBusinessId(null);
    setSelectedBusinessName('');
    setBusinessSearch('');
  }

  function toggleCategory(category: ContactCategory) {
    if (categories.includes(category)) {
      setCategories(categories.filter(c => c !== category));
    } else {
      setCategories([...categories, category]);
    }
  }

  function addCustomCategory() {
    if (newCategory && !customCategories.includes(newCategory)) {
      setCustomCategories([...customCategories, newCategory]);
      setNewCategory('');
      setShowAddCategory(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!firstName && !lastName) {
      toast.error('Please enter at least a first or last name');
      return;
    }

    if (categories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    setIsSubmitting(true);

    try {
      const contactName = `${firstName} ${lastName}`.trim();
      const contact = await businessQueries.create({
        business_name: contactName || email || 'Unnamed Contact',
        first_name: firstName || null,
        last_name: lastName || null,
        contact_name: contactName || null,
        email: email || null,
        phone: phone || null,
        contact_type: 'contact',
        category: categories[0], // Primary category
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
        price_per_review: 125,
        total_project_value: 0,
      });

      onContactAdded(contact);
      toast.success('Contact added successfully');
      resetForm();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to add contact: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setBusinessSearch('');
    setSelectedBusinessId(null);
    setSelectedBusinessName('');
    setCategories(defaultCategory ? [defaultCategory] : []);
    setCustomCategories([]);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Contact">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
          />
          <Input
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
          />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
          />
          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        {/* Business Association */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Associated Business
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={businessSearch}
              onChange={(e) => setBusinessSearch(e.target.value)}
              placeholder="Search businesses..."
              className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {selectedBusinessId && (
              <button
                type="button"
                onClick={clearBusinessSelection}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((business) => (
                <button
                  key={business.id}
                  type="button"
                  onClick={() => selectBusiness(business)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex flex-col"
                >
                  <span className="font-medium text-gray-900">{business.business_name}</span>
                  <span className="text-sm text-gray-500">
                    {business.city && `${business.city} • `}{business.email}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Categories (Multi-select, Mandatory) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTACT_CATEGORIES.filter(c => c !== 'contact').map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  categories.includes(category)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
            {customCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  if (categories.includes(category as ContactCategory)) {
                    setCategories(categories.filter(c => c !== category));
                  } else {
                    setCategories([...categories, category as ContactCategory]);
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  categories.includes(category as ContactCategory)
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                {category}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowAddCategory(true)}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add New
            </button>
          </div>

          {/* Add New Category Input */}
          {showAddCategory && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name"
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-sm"
              />
              <button
                type="button"
                onClick={addCustomCategory}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddCategory(false)}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          )}

          {categories.length === 0 && (
            <p className="text-sm text-red-500 mt-1">Please select at least one category</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

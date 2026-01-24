# Business Modals - Code Reference Guide

## Component Architecture

```
BusinessDetailModal
├── Modal (base)
│   ├── Header (title + close button)
│   ├── Content (scrollable)
│   │   ├── Contact Section
│   │   ├── Review Metrics Section
│   │   ├── Pricing Section
│   │   ├── Pipeline Section
│   │   ├── Message Section
│   │   └── Notes Section
│   └── Footer (action buttons)

DeleteConfirmationModal
├── Modal (base)
│   ├── Header (title + close button)
│   ├── Content (scrollable)
│   │   ├── Warning Box
│   │   ├── Business List
│   │   └── Impact Summary
│   └── Footer (cancel + confirm)
```

---

## Code Snippets

### 1. Basic Setup

```typescript
// Import dependencies
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Business } from '@/types';
import { BusinessDetailModal } from '@/components/BusinessDetailModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';

// Initialize state in your component
const [businesses, setBusinesses] = useState<Business[]>([]);
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
```

---

### 2. Load Businesses Data

```typescript
// Load businesses from Supabase
async function loadBusinesses() {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load businesses:', error);
  } else {
    setBusinesses((data || []) as Business[]);
  }
}

// Call on component mount
useEffect(() => {
  loadBusinesses();
}, []);
```

---

### 3. Selection Handlers

```typescript
// Select all checkbox
const handleSelectAll = (checked: boolean) => {
  if (checked) {
    setSelectedIds(new Set(businesses.map(b => b.id)));
  } else {
    setSelectedIds(new Set());
  }
};

// Select individual checkbox
const handleSelectOne = (id: string, checked: boolean) => {
  const newSelected = new Set(selectedIds);
  if (checked) {
    newSelected.add(id);
  } else {
    newSelected.delete(id);
  }
  setSelectedIds(newSelected);
};

// Computed values for UI
const allSelected = businesses.length > 0 && selectedIds.size === businesses.length;
const someSelected = selectedIds.size > 0 && selectedIds.size < businesses.length;
```

---

### 4. Row Click Handler

```typescript
// Open detail modal when clicking a row
const handleRowClick = (business: Business, event: React.MouseEvent) => {
  // Don't open modal if clicking on checkbox
  const target = event.target as HTMLElement;
  if (target.type === 'checkbox' || target.closest('input[type="checkbox"]')) {
    return;
  }

  setSelectedBusiness(business);
  setIsDetailModalOpen(true);
};
```

---

### 5. Delete Handlers

```typescript
// Open delete modal
const handleDeleteClick = () => {
  setIsDeleteModalOpen(true);
};

// Confirm and execute delete
const handleDeleteConfirm = async () => {
  setIsDeleting(true);

  const idsToDelete = Array.from(selectedIds);

  try {
    const { error } = await supabase
      .from('businesses')
      .delete()
      .in('id', idsToDelete);

    if (error) {
      console.error('Failed to delete businesses:', error);
      alert('Failed to delete businesses. Please try again.');
    } else {
      // Remove deleted businesses from state
      setBusinesses(prev => prev.filter(b => !selectedIds.has(b.id)));
      setSelectedIds(new Set());
      setIsDeleteModalOpen(false);

      // Optional: Show success message
      console.log(`Successfully deleted ${idsToDelete.length} businesses`);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    alert('An unexpected error occurred.');
  } finally {
    setIsDeleting(false);
  }
};

// Delete from detail modal
const handleDeleteFromDetail = (businessId: string) => {
  setSelectedIds(new Set([businessId]));
  setIsDetailModalOpen(false);
  setIsDeleteModalOpen(true);
};
```

---

### 6. Stage Change Handler

```typescript
// Handle pipeline stage change
const handleStageChange = async (businessId: string, newStage: string) => {
  try {
    const { error } = await supabase
      .from('businesses')
      .update({
        pipeline_stage: newStage,
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId);

    if (error) {
      console.error('Failed to update stage:', error);
      alert('Failed to update stage. Please try again.');
      return;
    }

    // Update local state
    setBusinesses(prev => prev.map(b =>
      b.id === businessId
        ? { ...b, pipeline_stage: newStage as any, updated_at: new Date().toISOString() }
        : b
    ));

    // Update selected business if it's the one being changed
    if (selectedBusiness?.id === businessId) {
      setSelectedBusiness({
        ...selectedBusiness,
        pipeline_stage: newStage as any,
        updated_at: new Date().toISOString()
      });
    }

    // Optional: Show success message
    console.log(`Stage updated to ${newStage}`);
  } catch (error) {
    console.error('Unexpected error:', error);
    alert('An unexpected error occurred.');
  }
};
```

---

### 7. Edit Handler (Optional)

```typescript
// Handle edit business
const handleEdit = (business: Business) => {
  // Option 1: Navigate to edit page
  // router.push(`/businesses/${business.id}/edit`);

  // Option 2: Open edit modal
  // setEditingBusiness(business);
  // setIsEditModalOpen(true);

  // Option 3: Inline editing in detail modal
  console.log('Edit business:', business);
};
```

---

### 8. Table with Checkboxes

```typescript
<table className="w-full">
  <thead className="bg-gray-50 border-b border-gray-200">
    <tr>
      {/* Select all checkbox */}
      <th className="px-6 py-3 text-left">
        <input
          type="checkbox"
          checked={allSelected}
          ref={input => {
            if (input) input.indeterminate = someSelected;
          }}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-label="Select all businesses"
        />
      </th>
      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
        Business
      </th>
      {/* Add more columns */}
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-100">
    {businesses.map((business) => (
      <tr
        key={business.id}
        onClick={(e) => handleRowClick(business, e)}
        className="hover:bg-gray-50 cursor-pointer transition-colors"
      >
        {/* Individual checkbox */}
        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedIds.has(business.id)}
            onChange={(e) => handleSelectOne(business.id, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            aria-label={`Select ${business.business_name}`}
          />
        </td>
        <td className="px-6 py-4">
          <div>
            <p className="font-medium text-gray-900">{business.business_name}</p>
            {business.contact_name && (
              <p className="text-sm text-gray-500">{business.contact_name}</p>
            )}
          </div>
        </td>
        {/* Add more cells */}
      </tr>
    ))}
  </tbody>
</table>
```

---

### 9. Bulk Actions Toolbar

```typescript
{selectedIds.size > 0 && (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
    {/* Selection info */}
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-blue-900">
        {selectedIds.size} {selectedIds.size === 1 ? 'business' : 'businesses'} selected
      </span>
      <button
        onClick={() => setSelectedIds(new Set())}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        Clear selection
      </button>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm">
        Export Selected
      </Button>
      <Button variant="secondary" size="sm">
        Change Stage
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={handleDeleteClick}
      >
        Delete Selected
      </Button>
    </div>
  </div>
)}
```

---

### 10. Business Detail Modal Usage

```typescript
<BusinessDetailModal
  isOpen={isDetailModalOpen}
  onClose={() => setIsDetailModalOpen(false)}
  business={selectedBusiness}
  onDelete={handleDeleteFromDetail}
  onEdit={handleEdit}
  onStageChange={handleStageChange}
/>
```

**Minimal usage (view only):**
```typescript
<BusinessDetailModal
  isOpen={isDetailModalOpen}
  onClose={() => setIsDetailModalOpen(false)}
  business={selectedBusiness}
/>
```

**Without delete button:**
```typescript
<BusinessDetailModal
  isOpen={isDetailModalOpen}
  onClose={() => setIsDetailModalOpen(false)}
  business={selectedBusiness}
  onEdit={handleEdit}
  onStageChange={handleStageChange}
  // onDelete omitted
/>
```

---

### 11. Delete Confirmation Modal Usage

```typescript
<DeleteConfirmationModal
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  businesses={businesses.filter(b => selectedIds.has(b.id))}
  onConfirm={handleDeleteConfirm}
  isDeleting={isDeleting}
/>
```

**For single business:**
```typescript
const selectedBusinesses = selectedBusiness ? [selectedBusiness] : [];

<DeleteConfirmationModal
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  businesses={selectedBusinesses}
  onConfirm={handleDeleteConfirm}
  isDeleting={isDeleting}
/>
```

---

### 12. Complete Component Example

```typescript
export default function BusinessesPage() {
  // State
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    setLoading(true);
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setBusinesses((data || []) as Business[]);
    }
    setLoading(false);
  }

  // Handlers (see snippets above)
  const handleSelectAll = (checked: boolean) => { /* ... */ };
  const handleSelectOne = (id: string, checked: boolean) => { /* ... */ };
  const handleRowClick = (business: Business, e: React.MouseEvent) => { /* ... */ };
  const handleDeleteClick = () => { /* ... */ };
  const handleDeleteConfirm = async () => { /* ... */ };
  const handleStageChange = async (id: string, stage: string) => { /* ... */ };

  // Computed values
  const allSelected = businesses.length > 0 && selectedIds.size === businesses.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < businesses.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Bulk actions toolbar */}
      {/* Table */}

      {/* Modals */}
      <BusinessDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        business={selectedBusiness}
        onDelete={(id) => {
          setSelectedIds(new Set([id]));
          setIsDetailModalOpen(false);
          setIsDeleteModalOpen(true);
        }}
        onStageChange={handleStageChange}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        businesses={businesses.filter(b => selectedIds.has(b.id))}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
```

---

## TypeScript Types Reference

### Business Type (from @/types)

```typescript
export interface Business {
  id: string;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  gmaps_url: string | null;
  city: string | null;
  state: string | null;
  industry: string | null;
  google_rating: number | null;
  total_reviews: number;
  one_star_reviews: number;
  two_star_reviews: number;
  three_star_reviews: number;
  four_star_reviews: number;
  five_star_reviews: number;
  one_star_media_reviews: number;
  two_star_media_reviews: number;
  total_media_reviews: number;
  projected_rating: number | null;
  pricing_tier: PricingTier | null;
  price_per_review: number;
  total_project_value: number;
  pipeline_stage: PipelineStage;
  email_verification_status: EmailVerificationStatus;
  email_outreach_status: EmailOutreachStatus;
  personalized_message: string | null;
  outreach_message: string | null;
  notes: string | null;
  campaign_id: string | null;
  created_at: string;
  updated_at: string;
  last_contacted_at: string | null;
}
```

### Modal Props Types

```typescript
// BusinessDetailModal
interface BusinessDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business | null;
  onDelete?: (businessId: string) => void;
  onEdit?: (business: Business) => void;
  onStageChange?: (businessId: string, newStage: string) => void;
}

// DeleteConfirmationModal
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: Business[];
  onConfirm: () => void;
  isDeleting?: boolean;
}
```

---

## Common Patterns

### Pattern: Optimistic UI Updates

```typescript
// Update UI immediately, revert on error
const handleStageChange = async (id: string, newStage: string) => {
  // Save old value
  const oldBusiness = businesses.find(b => b.id === id);
  if (!oldBusiness) return;

  // Update UI optimistically
  setBusinesses(prev => prev.map(b =>
    b.id === id ? { ...b, pipeline_stage: newStage as any } : b
  ));

  // Make API call
  const { error } = await supabase
    .from('businesses')
    .update({ pipeline_stage: newStage })
    .eq('id', id);

  // Revert on error
  if (error) {
    setBusinesses(prev => prev.map(b =>
      b.id === id ? oldBusiness : b
    ));
    alert('Failed to update stage');
  }
};
```

### Pattern: Debounced Stage Change

```typescript
import { useCallback, useRef } from 'react';

// Debounce stage changes to avoid rapid API calls
const debounceTimeout = useRef<NodeJS.Timeout>();

const handleStageChange = useCallback((id: string, newStage: string) => {
  // Clear existing timeout
  if (debounceTimeout.current) {
    clearTimeout(debounceTimeout.current);
  }

  // Update UI immediately
  setBusinesses(prev => prev.map(b =>
    b.id === id ? { ...b, pipeline_stage: newStage as any } : b
  ));

  // Debounce API call
  debounceTimeout.current = setTimeout(async () => {
    await supabase
      .from('businesses')
      .update({ pipeline_stage: newStage })
      .eq('id', id);
  }, 500);
}, []);
```

### Pattern: Toast Notifications

```typescript
// Add success/error toasts for better UX
const showToast = (message: string, type: 'success' | 'error') => {
  // Use your toast library (react-hot-toast, react-toastify, etc.)
  console.log(`[${type}] ${message}`);
};

const handleDeleteConfirm = async () => {
  setIsDeleting(true);

  const { error } = await supabase
    .from('businesses')
    .delete()
    .in('id', Array.from(selectedIds));

  setIsDeleting(false);

  if (error) {
    showToast('Failed to delete businesses', 'error');
  } else {
    setBusinesses(prev => prev.filter(b => !selectedIds.has(b.id)));
    setSelectedIds(new Set());
    setIsDeleteModalOpen(false);
    showToast(
      `Successfully deleted ${selectedIds.size} ${selectedIds.size === 1 ? 'business' : 'businesses'}`,
      'success'
    );
  }
};
```

---

## Utility Functions

### Filter Selected Businesses

```typescript
const getSelectedBusinesses = () => {
  return businesses.filter(b => selectedIds.has(b.id));
};
```

### Calculate Summary Stats

```typescript
const calculateSummary = (businesses: Business[]) => {
  return {
    count: businesses.length,
    totalValue: businesses.reduce((sum, b) => sum + (b.total_project_value || 0), 0),
    totalMediaReviews: businesses.reduce((sum, b) => sum + (b.total_media_reviews || 0), 0),
    withMessages: businesses.filter(b => b.personalized_message || b.outreach_message).length,
  };
};
```

### Format Currency

```typescript
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
};
```

---

## Error Handling Patterns

### Try-Catch with User Feedback

```typescript
const handleDeleteConfirm = async () => {
  setIsDeleting(true);

  try {
    const idsToDelete = Array.from(selectedIds);

    const { error } = await supabase
      .from('businesses')
      .delete()
      .in('id', idsToDelete);

    if (error) throw error;

    // Success
    setBusinesses(prev => prev.filter(b => !selectedIds.has(b.id)));
    setSelectedIds(new Set());
    setIsDeleteModalOpen(false);

  } catch (error) {
    console.error('Delete failed:', error);
    alert('Failed to delete businesses. Please try again.');
  } finally {
    setIsDeleting(false);
  }
};
```

### Validation Before Delete

```typescript
const handleDeleteClick = () => {
  if (selectedIds.size === 0) {
    alert('Please select at least one business to delete');
    return;
  }

  // Check for businesses in critical stages
  const criticalBusinesses = businesses.filter(
    b => selectedIds.has(b.id) &&
    ['deal_closed', 'in_service_delivery', 'payment_collected'].includes(b.pipeline_stage)
  );

  if (criticalBusinesses.length > 0) {
    if (!confirm(
      `Warning: ${criticalBusinesses.length} businesses are in critical stages. ` +
      'Are you sure you want to delete them?'
    )) {
      return;
    }
  }

  setIsDeleteModalOpen(true);
};
```

---

This code reference provides all the essential snippets you need to integrate the Business modals into your application. Copy and adapt these patterns to your specific needs.

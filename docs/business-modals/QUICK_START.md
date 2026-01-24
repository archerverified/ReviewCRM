# Business Modals - Quick Start Guide

## 5-Minute Integration

### 1. Copy Files
Ensure these files are in your project:
- `src/components/BusinessDetailModal.tsx`
- `src/components/DeleteConfirmationModal.tsx`

### 2. Add Imports
```typescript
import { BusinessDetailModal } from '@/components/BusinessDetailModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { useState } from 'react';
```

### 3. Add State (in your businesses page component)
```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
```

### 4. Add Handlers
```typescript
// Open detail modal when clicking a row
const handleRowClick = (business: Business, e: React.MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.type === 'checkbox') return; // Don't open on checkbox click

  setSelectedBusiness(business);
  setIsDetailModalOpen(true);
};

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  setIsDeleting(true);

  const idsToDelete = Array.from(selectedIds);
  const { error } = await supabase
    .from('businesses')
    .delete()
    .in('id', idsToDelete);

  if (!error) {
    setBusinesses(prev => prev.filter(b => !selectedIds.has(b.id)));
    setSelectedIds(new Set());
    setIsDeleteModalOpen(false);
  }

  setIsDeleting(false);
};

// Handle stage change
const handleStageChange = async (id: string, newStage: string) => {
  await supabase
    .from('businesses')
    .update({ pipeline_stage: newStage })
    .eq('id', id);

  // Update local state
  setBusinesses(prev => prev.map(b =>
    b.id === id ? { ...b, pipeline_stage: newStage as any } : b
  ));
};
```

### 5. Add to JSX (at end of component)
```typescript
{/* Detail Modal */}
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

{/* Delete Modal */}
<DeleteConfirmationModal
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  businesses={businesses.filter(b => selectedIds.has(b.id))}
  onConfirm={handleDeleteConfirm}
  isDeleting={isDeleting}
/>
```

### 6. Add Delete Button (in your toolbar)
```typescript
{selectedIds.size > 0 && (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
    <Button
      variant="danger"
      onClick={() => setIsDeleteModalOpen(true)}
    >
      Delete Selected ({selectedIds.size})
    </Button>
  </div>
)}
```

---

## Common Patterns

### Pattern: Select All Checkbox
```typescript
const allSelected = businesses.length > 0 && selectedIds.size === businesses.length;

<input
  type="checkbox"
  checked={allSelected}
  onChange={(e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(businesses.map(b => b.id)));
    } else {
      setSelectedIds(new Set());
    }
  }}
/>
```

### Pattern: Individual Row Checkbox
```typescript
<input
  type="checkbox"
  checked={selectedIds.has(business.id)}
  onChange={(e) => {
    const newSet = new Set(selectedIds);
    if (e.target.checked) {
      newSet.add(business.id);
    } else {
      newSet.delete(business.id);
    }
    setSelectedIds(newSet);
  }}
  onClick={(e) => e.stopPropagation()} // Prevent row click
/>
```

### Pattern: Clickable Table Row
```typescript
<tr
  onClick={(e) => handleRowClick(business, e)}
  className="hover:bg-gray-50 cursor-pointer"
>
  {/* cells */}
</tr>
```

---

## Props Reference

### BusinessDetailModal
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | ✅ | Controls visibility |
| `onClose` | function | ✅ | Close handler |
| `business` | Business \| null | ✅ | Business to display |
| `onDelete` | function | ❌ | Delete handler |
| `onEdit` | function | ❌ | Edit handler |
| `onStageChange` | function | ❌ | Stage change handler |

### DeleteConfirmationModal
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | ✅ | Controls visibility |
| `onClose` | function | ✅ | Close handler |
| `businesses` | Business[] | ✅ | Businesses to delete |
| `onConfirm` | function | ✅ | Confirmation handler |
| `isDeleting` | boolean | ❌ | Loading state |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Click row | Open detail modal |
| ESC | Close modal |
| Tab | Navigate between fields |
| Shift+Tab | Navigate backwards |
| Enter | Confirm action (on buttons) |

---

## Customization Options

### Change Modal Size
```typescript
<BusinessDetailModal
  size="lg"  // sm, md, lg, xl (default: xl)
  {...props}
/>
```

### Hide Delete Button
```typescript
<BusinessDetailModal
  onDelete={undefined}  // Don't pass delete handler
  {...props}
/>
```

### Disable Stage Changing
```typescript
<BusinessDetailModal
  onStageChange={undefined}  // Don't pass stage change handler
  {...props}
/>
```

---

## Troubleshooting

### Modal doesn't open
✅ Check `isOpen` state is set to `true`
✅ Check business data is not null
✅ Verify Modal component is imported

### Delete doesn't work
✅ Check Supabase RLS policies allow delete
✅ Verify `selectedIds` contains correct IDs
✅ Check error handling in console

### Row click opens modal on checkbox
✅ Add `e.stopPropagation()` to checkbox
✅ Add type check in `handleRowClick`

### Stage dropdown doesn't update
✅ Verify `onStageChange` is implemented
✅ Check Supabase update query
✅ Ensure local state updates

---

## Best Practices

1. **Always provide onClose handler** - Users need escape routes
2. **Show loading states** - Use `isDeleting` prop
3. **Handle errors gracefully** - Show user-friendly messages
4. **Validate before delete** - Check for dependencies
5. **Update UI optimistically** - Don't wait for server response
6. **Preserve scroll position** - When closing modals
7. **Test keyboard navigation** - Ensure accessibility

---

## File Locations

📁 **Components**
- `C:\Users\OxGh0\ReviewCRM\src\components\BusinessDetailModal.tsx`
- `C:\Users\OxGh0\ReviewCRM\src\components\DeleteConfirmationModal.tsx`

📁 **Documentation**
- `C:\Users\OxGh0\ReviewCRM\BUSINESS_MODALS_IMPLEMENTATION.md` (Full guide)
- `C:\Users\OxGh0\ReviewCRM\BUSINESS_MODALS_DESIGN.md` (Design specs)
- `C:\Users\OxGh0\ReviewCRM\BUSINESS_MODALS_QUICK_START.md` (This file)

📁 **Example**
- `C:\Users\OxGh0\ReviewCRM\src\components\BusinessesPageExample.tsx` (Complete example)

---

## Next Steps

1. ✅ Copy the components into your project
2. ✅ Add state management to your page
3. ✅ Implement handlers
4. ✅ Add modals to JSX
5. ✅ Test all interactions
6. ✅ Review accessibility
7. ✅ Deploy to staging

**Estimated time to integrate: 15-30 minutes**

For complete implementation details, see `BUSINESS_MODALS_IMPLEMENTATION.md`.

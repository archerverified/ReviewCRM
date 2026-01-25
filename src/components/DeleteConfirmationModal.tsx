'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Business } from '@/types';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: Business[];
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  businesses,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  const count = businesses.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Businesses"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={isDeleting}>
            {isDeleting ? 'Deleting...' : `Delete ${count} ${count === 1 ? 'Business' : 'Businesses'}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Warning Message */}
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-900 mb-1">
              This action cannot be undone
            </h4>
            <p className="text-sm text-red-700">
              You are about to permanently delete {count === 1 ? 'this business' : `${count} businesses`} from your database.
              All associated data including notes, outreach messages, and pipeline history will be lost.
            </p>
          </div>
        </div>

        {/* Business List */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            {count === 1 ? 'Business to be deleted:' : `Businesses to be deleted (${count}):`}
          </h4>
          <div className="max-h-64 overflow-y-auto bg-gray-50 rounded-xl border border-gray-200">
            <ul className="divide-y divide-gray-200">
              {businesses.map((business) => (
                <li key={business.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {business.business_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {business.city && business.state
                          ? `${business.city}, ${business.state}`
                          : business.city || business.state || 'No location'}
                        {business.total_media_reviews > 0 && (
                          <span className="ml-2 text-amber-600 font-medium">
                            • {business.total_media_reviews} media reviews
                          </span>
                        )}
                      </p>
                    </div>
                    {business.total_project_value > 0 && (
                      <div className="ml-4 flex-shrink-0">
                        <p className="text-sm font-medium text-gray-900">
                          ${business.total_project_value.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Summary Stats */}
        {count > 1 && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Impact Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total Businesses</p>
                <p className="text-lg font-bold text-gray-900">{count}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Value</p>
                <p className="text-lg font-bold text-gray-900">
                  ${businesses.reduce((sum, b) => sum + (b.total_project_value || 0), 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Media Reviews</p>
                <p className="text-lg font-bold text-gray-900">
                  {businesses.reduce((sum, b) => sum + (b.total_media_reviews || 0), 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">With Messages</p>
                <p className="text-lg font-bold text-gray-900">
                  {businesses.filter(b => b.personalized_message || b.outreach_message).length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

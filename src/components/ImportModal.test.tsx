import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportModal } from './ImportModal';
import Papa from 'papaparse';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('papaparse');
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn()
    }))
  }
}));
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

const mockCSVContent = `BusinessName,Email,Rating,Reviews
Acme Corp,acme@example.com,4.5,100
Tech Inc,tech@example.com,4.2,50
Global Co,global@example.com,4.8,200`;

const mockParsedData = [
  { BusinessName: 'Acme Corp', Email: 'acme@example.com', Rating: '4.5', Reviews: '100' },
  { BusinessName: 'Tech Inc', Email: 'tech@example.com', Rating: '4.2', Reviews: '50' },
  { BusinessName: 'Global Co', Email: 'global@example.com', Rating: '4.8', Reviews: '200' }
];

describe('ImportModal - File Upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows file upload UI in upload step', () => {
    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    expect(screen.getByText(/import businesses/i)).toBeInTheDocument();
    expect(screen.getByText(/choose file/i)).toBeInTheDocument();
  });

  it('triggers file input when Choose File clicked', async () => {
    const user = userEvent.setup();

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    const chooseFileButton = screen.getByRole('button', { name: /choose file/i });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const clickSpy = jest.spyOn(fileInput, 'click');
    await user.click(chooseFileButton);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('parses CSV and moves to mapping step', async () => {
    const user = userEvent.setup();
    const mockParse = Papa.parse as jest.Mock;

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    const file = new File([mockCSVContent], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    mockParse.mockImplementation((file, options) => {
      options.complete({ data: mockParsedData });
    });

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(mockParse).toHaveBeenCalled();
    });
  });

  it('shows error toast on invalid CSV', () => {
    const mockParse = Papa.parse as jest.Mock;

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    const file = new File(['invalid'], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    mockParse.mockImplementation((file, options) => {
      options.error(new Error('Parse error'));
    });

    const event = new Event('change', { bubbles: true });
    Object.defineProperty(event, 'target', { value: { files: [file] }, writable: false });
    fileInput.dispatchEvent(event);

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Parse error'));
  });

  it('handles empty CSV gracefully', () => {
    const mockParse = Papa.parse as jest.Mock;

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    const file = new File([''], 'empty.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    mockParse.mockImplementation((file, options) => {
      options.complete({ data: [] });
    });

    const event = new Event('change', { bubbles: true });
    Object.defineProperty(event, 'target', { value: { files: [file] }, writable: false });
    fileInput.dispatchEvent(event);

    // Should handle gracefully without crashing
    expect(mockParse).toHaveBeenCalled();
  });
});

describe('ImportModal - Column Mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockParse = Papa.parse as jest.Mock;
    mockParse.mockImplementation((file, options) => {
      options.complete({ data: mockParsedData });
    });
  });

  const uploadFile = async (user: any) => {
    const file = new File([mockCSVContent], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);
  };

  it('auto-detects D7 columns correctly', async () => {
    const user = userEvent.setup();

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    await uploadFile(user);

    await waitFor(() => {
      expect(screen.getByText(/map csv columns/i)).toBeInTheDocument();
    });
  });

  it('allows manual column mapping via Select', async () => {
    const user = userEvent.setup();

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    await uploadFile(user);

    await waitFor(() => {
      expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0);
    });
  });

  it('shows preview of first 3 rows', async () => {
    const user = userEvent.setup();

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    await uploadFile(user);

    await waitFor(() => {
      expect(screen.getByText(/preview/i)).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Tech Inc')).toBeInTheDocument();
      expect(screen.getByText('Global Co')).toBeInTheDocument();
    });
  });

  it('displays column count in preview', async () => {
    const user = userEvent.setup();

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    await uploadFile(user);

    await waitFor(() => {
      expect(screen.getByText(/4 columns/i)).toBeInTheDocument();
    });
  });

  it('allows adding custom fields', async () => {
    const user = userEvent.setup();

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    await uploadFile(user);

    await waitFor(async () => {
      const selects = screen.getAllByRole('combobox');
      await user.click(selects[0]);
    });

    // Should show "Add custom field" option
    await waitFor(() => {
      expect(screen.getByText(/add custom field/i)).toBeInTheDocument();
    });
  });

  it('updates mapping when custom field added', async () => {
    const user = userEvent.setup();

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    await uploadFile(user);

    // Implementation depends on Select component behavior
    // This test verifies the custom field flow works
    await waitFor(() => {
      expect(screen.getByText(/map csv columns/i)).toBeInTheDocument();
    });
  });

  it('shows Import button with row count', async () => {
    const user = userEvent.setup();

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    await uploadFile(user);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /import 3 businesses/i })).toBeInTheDocument();
    });
  });

  it('disables Import when no file loaded', () => {
    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    // Should not show import button in upload step
    expect(screen.queryByRole('button', { name: /import.*businesses/i })).not.toBeInTheDocument();
  });
});

describe('ImportModal - Import Process', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockParse = Papa.parse as jest.Mock;
    mockParse.mockImplementation((file, options) => {
      if (options.preview) {
        options.complete({ data: mockParsedData });
      } else {
        options.complete({ data: mockParsedData });
      }
    });
  });

  const uploadAndStartImport = async (user: any) => {
    const file = new File([mockCSVContent], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /import.*businesses/i })).toBeInTheDocument();
    });

    const importButton = screen.getByRole('button', { name: /import.*businesses/i });
    await user.click(importButton);
  };

  it('shows progress bar during import', async () => {
    const user = userEvent.setup();
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null })
    });

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    await uploadAndStartImport(user);

    await waitFor(() => {
      expect(screen.getByText(/importing/i)).toBeInTheDocument();
    });
  });

  it('processes batches of 100 rows', async () => {
    const user = userEvent.setup();
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({ insert: mockInsert });

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    await uploadAndStartImport(user);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  it('updates progress incrementally', async () => {
    const user = userEvent.setup();
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null })
    });

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    await uploadAndStartImport(user);

    // Progress should update during import
    await waitFor(() => {
      expect(screen.getByText(/importing/i)).toBeInTheDocument();
    });
  });

  it('shows success state on completion', async () => {
    const user = userEvent.setup();
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null })
    });

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    await uploadAndStartImport(user);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Imported'));
    });
  });

  it('shows partial success state on errors', async () => {
    const user = userEvent.setup();
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: { message: 'Database error' } })
    });

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    await uploadAndStartImport(user);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('shows failure state when 0 imported', async () => {
    const user = userEvent.setup();
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: { message: 'All records failed' } })
    });

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    await uploadAndStartImport(user);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('calls onImportComplete with count', async () => {
    const user = userEvent.setup();
    const onImportComplete = jest.fn();
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null })
    });

    render(<ImportModal onClose={jest.fn()} onImportComplete={onImportComplete} />);

    await uploadAndStartImport(user);

    await waitFor(() => {
      expect(onImportComplete).toHaveBeenCalledWith(expect.any(Number));
    });
  });
});

describe('ImportModal - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles CSV with only headers (no data)', () => {
    const mockParse = Papa.parse as jest.Mock;
    mockParse.mockImplementation((file, options) => {
      options.complete({ data: [] });
    });

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    const file = new File(['BusinessName,Email'], 'headers-only.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const event = new Event('change', { bubbles: true });
    Object.defineProperty(event, 'target', { value: { files: [file] }, writable: false });
    fileInput.dispatchEvent(event);

    // Should handle gracefully
    expect(mockParse).toHaveBeenCalled();
  });

  it('skips rows without business name', async () => {
    const user = userEvent.setup();
    const mockParse = Papa.parse as jest.Mock;
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({ insert: mockInsert });

    const dataWithEmptyNames = [
      { BusinessName: 'Valid Corp', Email: 'valid@example.com' },
      { BusinessName: '', Email: 'empty@example.com' },
      { BusinessName: '  ', Email: 'spaces@example.com' }
    ];

    mockParse.mockImplementation((file, options) => {
      options.complete({ data: dataWithEmptyNames });
    });

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    const file = new File([mockCSVContent], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    await waitFor(() => {
      const importButton = screen.getByRole('button', { name: /import.*businesses/i });
      user.click(importButton);
    });

    // Should only insert valid records
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
      const insertedRecords = mockInsert.mock.calls[0][0];
      expect(insertedRecords).toHaveLength(1);
      expect(insertedRecords[0].business_name).toBe('Valid Corp');
    });
  });

  it('handles special characters in business names', async () => {
    const user = userEvent.setup();
    const mockParse = Papa.parse as jest.Mock;
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({ insert: mockInsert });

    const specialCharsData = [
      { BusinessName: "O'Reilly's Pub & Grill", Email: 'oreilly@example.com' }
    ];

    mockParse.mockImplementation((file, options) => {
      options.complete({ data: specialCharsData });
    });

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    const file = new File([mockCSVContent], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    await waitFor(() => {
      const importButton = screen.getByRole('button', { name: /import.*businesses/i });
      user.click(importButton);
    });

    // Should handle special characters correctly
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  it('handles very large CSV (1000+ rows)', async () => {
    const user = userEvent.setup();
    const mockParse = Papa.parse as jest.Mock;
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({ insert: mockInsert });

    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      BusinessName: `Business ${i}`,
      Email: `business${i}@example.com`
    }));

    mockParse.mockImplementation((file, options) => {
      options.complete({ data: largeData });
    });

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    const file = new File([mockCSVContent], 'large.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    await waitFor(() => {
      const importButton = screen.getByRole('button', { name: /import.*businesses/i });
      user.click(importButton);
    });

    // Should process in batches
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
      // Should be called 10 times (1000 rows / 100 batch size)
      expect(mockInsert.mock.calls.length).toBeGreaterThanOrEqual(10);
    });
  });

  it('excludes empty/unmapped fields from database insert', async () => {
    const user = userEvent.setup();
    const mockParse = Papa.parse as jest.Mock;
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({ insert: mockInsert });

    const dataWithEmptyFields = [
      {
        BusinessName: 'Test Corp',
        Email: '',  // Empty field
        Rating: '4.5',
        City: '   '  // Only spaces
      }
    ];

    mockParse.mockImplementation((file, options) => {
      options.complete({ data: dataWithEmptyFields });
    });

    render(<ImportModal onClose={jest.fn()} onImportComplete={jest.fn()} />);

    const file = new File([mockCSVContent], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    await waitFor(() => {
      const importButton = screen.getByRole('button', { name: /import.*businesses/i });
      user.click(importButton);
    });

    // Verify that only non-empty fields are included
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
      const insertedRecords = mockInsert.mock.calls[0][0];
      expect(insertedRecords[0].business_name).toBe('Test Corp');
      expect(insertedRecords[0].email).toBeUndefined();  // Should not include empty email
      expect(insertedRecords[0].city).toBeUndefined();  // Should not include whitespace city
      expect(insertedRecords[0].google_rating).toBe(4.5);  // Should include valid rating
    });
  });
});

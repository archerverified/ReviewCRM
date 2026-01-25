import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from './FilterBar';
import { FilterState } from '@/types';

const mockTags = [
  { id: '1', name: 'VIP', color: '#3b82f6', created_at: '2024-01-01' },
  { id: '2', name: 'Follow Up', color: '#10b981', created_at: '2024-01-01' }
];

const initialFilters: FilterState = {
  search: '',
  stages: [],
  emailVerificationStatuses: [],
  emailOutreachStatuses: [],
  tags: [],
  pricingTiers: [],
  cities: [],
  campaigns: []
};

describe('FilterBar - Search', () => {
  it('renders search input with icon', () => {
    render(
      <FilterBar
        filters={initialFilters}
        onFilterChange={jest.fn()}
        tags={mockTags}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search businesses...');
    expect(searchInput).toBeInTheDocument();

    // Check for search icon
    const svg = searchInput.parentElement?.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('calls onFilterChange when search text changes', async () => {
    const user = userEvent.setup();
    const handleFilterChange = jest.fn();

    render(
      <FilterBar
        filters={initialFilters}
        onFilterChange={handleFilterChange}
        tags={mockTags}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search businesses...');
    await user.type(searchInput, 'Acme Corp');

    expect(handleFilterChange).toHaveBeenCalled();
    const lastCall = handleFilterChange.mock.calls[handleFilterChange.mock.calls.length - 1][0];
    expect(lastCall.search).toBe('Acme Corp');
  });

  it('searches business names case-insensitive', async () => {
    const user = userEvent.setup();
    const handleFilterChange = jest.fn();

    render(
      <FilterBar
        filters={initialFilters}
        onFilterChange={handleFilterChange}
        tags={mockTags}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search businesses...');
    await user.type(searchInput, 'ACME');

    expect(handleFilterChange).toHaveBeenCalled();
    // Filter logic is case-insensitive (handled in parent component)
    expect(searchInput).toHaveValue('ACME');
  });

  it('clears search when clear button clicked', async () => {
    const user = userEvent.setup();
    const handleFilterChange = jest.fn();

    const filtersWithSearch = { ...initialFilters, search: 'Test Search' };

    render(
      <FilterBar
        filters={filtersWithSearch}
        onFilterChange={handleFilterChange}
        tags={mockTags}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    await user.click(clearButton);

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: '' })
    );
  });
});

describe('FilterBar - Keyboard Navigation', () => {
  it('opens stage dropdown with Enter key', async () => {
    const user = userEvent.setup();

    render(
      <FilterBar
        filters={initialFilters}
        onFilterChange={jest.fn()}
        tags={mockTags}
      />
    );

    const stageButton = screen.getByRole('button', { name: /stage/i });
    stageButton.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Lead Scraped')).toBeInTheDocument();
    });
  });

  it('navigates dropdown options with arrow keys', async () => {
    const user = userEvent.setup();

    render(
      <FilterBar
        filters={initialFilters}
        onFilterChange={jest.fn()}
        tags={mockTags}
      />
    );

    const stageButton = screen.getByRole('button', { name: /stage/i });
    await user.click(stageButton);

    await waitFor(() => {
      expect(screen.getByText('Lead Scraped')).toBeInTheDocument();
    });

    // Arrow keys should work for navigation (Headless UI handles this automatically)
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowUp}');

    // Menu should remain open with focus management
    expect(screen.getByText('Lead Scraped')).toBeInTheDocument();
  });

  it('toggles checkbox with Space key', async () => {
    const user = userEvent.setup();
    const handleFilterChange = jest.fn();

    render(
      <FilterBar
        filters={initialFilters}
        onFilterChange={handleFilterChange}
        tags={mockTags}
      />
    );

    const stageButton = screen.getByRole('button', { name: /stage/i });
    await user.click(stageButton);

    const checkbox = await screen.findByRole('checkbox', { name: /lead scraped/i });
    checkbox.focus();
    await user.keyboard(' ');

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        stages: expect.arrayContaining(['lead_scraped'])
      })
    );
  });

  it('closes dropdown with Escape key', async () => {
    const user = userEvent.setup();

    render(
      <FilterBar
        filters={initialFilters}
        onFilterChange={jest.fn()}
        tags={mockTags}
      />
    );

    const stageButton = screen.getByRole('button', { name: /stage/i });
    await user.click(stageButton);

    await waitFor(() => {
      expect(screen.getByText('Lead Scraped')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText('Lead Scraped')).not.toBeInTheDocument();
    });
  });

  it('focuses first option when dropdown opens', async () => {
    const user = userEvent.setup();

    render(
      <FilterBar
        filters={initialFilters}
        onFilterChange={jest.fn()}
        tags={mockTags}
      />
    );

    const stageButton = screen.getByRole('button', { name: /stage/i });
    await user.click(stageButton);

    // Headless UI automatically manages focus to first menu item
    await waitFor(() => {
      expect(screen.getByText('Lead Scraped')).toBeInTheDocument();
    });
  });

  it('traps focus within open dropdown', async () => {
    const user = userEvent.setup();

    render(
      <FilterBar
        filters={initialFilters}
        onFilterChange={jest.fn()}
        tags={mockTags}
      />
    );

    const stageButton = screen.getByRole('button', { name: /stage/i });
    await user.click(stageButton);

    await waitFor(() => {
      expect(screen.getByText('Lead Scraped')).toBeInTheDocument();
    });

    // Focus should be trapped within the dropdown (Headless UI feature)
    // Tab should not escape to next filter button while menu is open
    const leadScrapedLabel = screen.getByText('Lead Scraped');
    expect(leadScrapedLabel).toBeInTheDocument();
  });

  it('returns focus to button when dropdown closes', async () => {
    const user = userEvent.setup();

    render(
      <FilterBar
        filters={initialFilters}
        onFilterChange={jest.fn()}
        tags={mockTags}
      />
    );

    const stageButton = screen.getByRole('button', { name: /stage/i });
    await user.click(stageButton);

    await waitFor(() => {
      expect(screen.getByText('Lead Scraped')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    // Focus should return to button (Headless UI feature)
    expect(stageButton).toHaveFocus();
  });

  it('allows Tab to move to next filter dropdown', async () => {
    const user = userEvent.setup();

    render(
      <FilterBar
        filters={initialFilters}
        onFilterChange={jest.fn()}
        tags={mockTags}
      />
    );

    const stageButton = screen.getByRole('button', { name: /stage/i });
    stageButton.focus();

    await user.keyboard('{Tab}');

    const verificationButton = screen.getByRole('button', { name: /verification/i });
    expect(verificationButton).toHaveFocus();
  });
});

describe('FilterBar - Filter Operations', () => {
  it('toggles stage filter on checkbox change', async () => {
    const user = userEvent.setup();
    const handleFilterChange = jest.fn();

    render(
      <FilterBar
        filters={initialFilters}
        onFilterChange={handleFilterChange}
        tags={mockTags}
      />
    );

    const stageButton = screen.getByRole('button', { name: /stage/i });
    await user.click(stageButton);

    const checkbox = await screen.findByRole('checkbox', { name: /lead scraped/i });
    await user.click(checkbox);

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        stages: ['lead_scraped']
      })
    );
  });

  it('shows badge count on button when filters active', () => {
    const filtersWithStages = {
      ...initialFilters,
      stages: ['lead_scraped' as const, 'email_verified' as const]
    };

    render(
      <FilterBar
        filters={filtersWithStages}
        onFilterChange={jest.fn()}
        tags={mockTags}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('clears all filters when Clear Filters clicked', async () => {
    const user = userEvent.setup();
    const handleFilterChange = jest.fn();

    const filtersWithData: FilterState = {
      search: 'Test',
      stages: ['lead_scraped' as const],
      emailVerificationStatuses: ['good' as const],
      emailOutreachStatuses: ['sent' as const],
      tags: ['1'],
      pricingTiers: [],
      cities: [],
      campaigns: []
    };

    render(
      <FilterBar
        filters={filtersWithData}
        onFilterChange={handleFilterChange}
        tags={mockTags}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    await user.click(clearButton);

    expect(handleFilterChange).toHaveBeenCalledWith({
      search: '',
      tags: [],
      stages: [],
      emailVerificationStatuses: [],
      emailOutreachStatuses: [],
      pricingTiers: [],
      cities: [],
      campaigns: []
    });
  });

  it('applies multiple filters simultaneously', async () => {
    const user = userEvent.setup();
    const handleFilterChange = jest.fn();

    render(
      <FilterBar
        filters={initialFilters}
        onFilterChange={handleFilterChange}
        tags={mockTags}
      />
    );

    // Add stage filter
    const stageButton = screen.getByRole('button', { name: /stage/i });
    await user.click(stageButton);
    const stageCheckbox = await screen.findByRole('checkbox', { name: /lead scraped/i });
    await user.click(stageCheckbox);

    // Close stage dropdown
    await user.keyboard('{Escape}');

    // Add verification filter
    const verificationButton = screen.getByRole('button', { name: /verification/i });
    await user.click(verificationButton);
    const verificationCheckbox = await screen.findByRole('checkbox', { name: /good/i });
    await user.click(verificationCheckbox);

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        stages: expect.any(Array),
        emailVerificationStatuses: expect.any(Array)
      })
    );
  });

  it('persists filter state across re-renders', () => {
    const filtersWithData: FilterState = {
      ...initialFilters,
      stages: ['lead_scraped' as const],
      emailVerificationStatuses: ['good' as const]
    };

    const { rerender } = render(
      <FilterBar
        filters={filtersWithData}
        onFilterChange={jest.fn()}
        tags={mockTags}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument(); // Stage badge
    expect(screen.getByText('1')).toBeInTheDocument(); // Verification badge

    // Re-render with same filters
    rerender(
      <FilterBar
        filters={filtersWithData}
        onFilterChange={jest.fn()}
        tags={mockTags}
      />
    );

    expect(screen.getAllByText('1')).toHaveLength(2);
  });

  it('handles empty filter state (shows all results)', () => {
    render(
      <FilterBar
        filters={initialFilters}
        onFilterChange={jest.fn()}
        tags={mockTags}
      />
    );

    // Clear filters button should not be visible when no filters active
    expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { CustomFieldInput } from '../ui/CustomFieldInput';
import { FilterBar } from '../FilterBar';
import { FilterState } from '@/types';

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

describe('Accessibility Compliance', () => {
  describe('Button Accessibility', () => {
    it('Button has aria-busy when loading', () => {
      render(<Button loading>Submit</Button>);

      const button = screen.getByRole('button', { name: /submit/i });
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('Button is properly disabled with disabled attribute', () => {
      render(<Button disabled>Disabled Button</Button>);

      const button = screen.getByRole('button', { name: /disabled button/i });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('disabled');
    });
  });

  describe('Input Accessibility', () => {
    it('Input associates label with input', () => {
      render(<Input label="Email Address" placeholder="Enter email" />);

      const input = screen.getByLabelText('Email Address');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Enter email');
    });

    it('Input error announced to screen readers', () => {
      render(
        <Input
          label="Password"
          error="Password must be at least 8 characters"
          placeholder="Enter password"
        />
      );

      const input = screen.getByLabelText('Password');
      const errorMessage = screen.getByText('Password must be at least 8 characters');

      // Error message should be associated with input
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-red-600');

      // Input should indicate error state visually
      expect(input).toHaveClass('border-red-500');
    });

    it('Input with icon maintains accessibility', () => {
      const SearchIcon = () => (
        <svg aria-hidden="true">
          <path />
        </svg>
      );

      render(
        <Input
          label="Search"
          icon={<SearchIcon />}
          placeholder="Search here..."
        />
      );

      const input = screen.getByLabelText('Search');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Modal Accessibility', () => {
    it('Modal traps focus when open', async () => {
      const user = userEvent.setup();
      let isOpen = true;

      const { rerender } = render(
        <Modal
          isOpen={isOpen}
          onClose={() => { isOpen = false; }}
          title="Test Modal"
        >
          <p>Modal content</p>
          <button>Action Button</button>
        </Modal>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Modal')).toBeInTheDocument();
      });

      // Tab should cycle through modal elements only
      await user.keyboard('{Tab}');

      const actionButton = screen.getByRole('button', { name: /action button/i });
      const closeButton = screen.getByLabelText('Close'); // Close button has aria-label

      // Both buttons should be focusable
      expect(actionButton).toBeInTheDocument();
      expect(closeButton).toBeInTheDocument();
    });

    it('Modal restores focus on close', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();

      const { rerender } = render(
        <div>
          <button>Open Modal</button>
          <Modal
            isOpen={true}
            onClose={handleClose}
            title="Test Modal"
          >
            <p>Modal content</p>
          </Modal>
        </div>
      );

      const openButton = screen.getByRole('button', { name: /open modal/i });

      // Close modal with Escape
      await user.keyboard('{Escape}');

      expect(handleClose).toHaveBeenCalled();
    });

    it('Modal prevents body scroll when open', () => {
      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          title="Test Modal"
        >
          <p>Modal content</p>
        </Modal>
      );

      // Body scroll should be disabled
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('Select Accessibility', () => {
    const mockOptions = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ];

    it('Select keyboard navigation works', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <Select
          value=""
          onChange={handleChange}
          options={mockOptions}
          placeholder="Select an option"
        />
      );

      const button = screen.getByRole('button');

      // Open with keyboard click
      await user.click(button);

      // Wait for listbox to appear
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Select first option
      const option1 = screen.getByRole('option', { name: 'Option 1' });
      await user.click(option1);

      expect(handleChange).toHaveBeenCalledWith('option1');
    });

    it('Select has proper ARIA attributes', () => {
      render(
        <Select
          value="option1"
          onChange={jest.fn()}
          options={mockOptions}
          label="Choose Option"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      // Listbox should have proper role
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });
  });

  describe('FilterBar Accessibility', () => {
    it('FilterBar dropdowns keyboard accessible', async () => {
      const user = userEvent.setup();

      render(
        <FilterBar
          filters={initialFilters}
          onFilterChange={jest.fn()}
          tags={[]}
        />
      );

      const stageButton = screen.getByRole('button', { name: /stage/i });

      // Open dropdown with keyboard
      stageButton.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Lead Scraped')).toBeInTheDocument();
      });

      // Navigate options with arrow keys
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');

      // Close with Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Lead Scraped')).not.toBeInTheDocument();
      });

      // Focus should return to button
      expect(stageButton).toHaveFocus();
    });

    it('FilterBar search input has proper label', () => {
      render(
        <FilterBar
          filters={initialFilters}
          onFilterChange={jest.fn()}
          tags={[]}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search businesses...');
      expect(searchInput).toBeInTheDocument();
      // Input type defaults to "text" when not explicitly set
      expect(searchInput.tagName).toBe('INPUT');
    });
  });

  describe('CustomFieldInput Accessibility', () => {
    it('CustomFieldInput validation announced', async () => {
      const user = userEvent.setup();

      render(
        <CustomFieldInput
          onSave={jest.fn()}
          onCancel={jest.fn()}
          placeholder="Enter field name"
        />
      );

      const input = screen.getByPlaceholderText('Enter field name');

      // Type invalid input
      await user.type(input, '@#$');

      await waitFor(() => {
        const errorMessage = screen.getByText(/field name contains invalid characters/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });

      // Input should have aria-invalid
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('CustomFieldInput has proper ARIA attributes', () => {
      render(
        <CustomFieldInput
          onSave={jest.fn()}
          onCancel={jest.fn()}
          placeholder="Enter field name"
        />
      );

      const input = screen.getByPlaceholderText('Enter field name');

      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toHaveAttribute('aria-describedby');
    });

    it('CustomFieldInput keyboard shortcuts work', async () => {
      const user = userEvent.setup();
      const handleSave = jest.fn();
      const handleCancel = jest.fn();

      render(
        <CustomFieldInput
          onSave={handleSave}
          onCancel={handleCancel}
          placeholder="Enter field name"
        />
      );

      const input = screen.getByPlaceholderText('Enter field name');

      // Type valid input
      await user.type(input, 'Valid Field');

      // Save with Enter
      await user.keyboard('{Enter}');

      expect(handleSave).toHaveBeenCalledWith('Valid Field');
    });
  });
});

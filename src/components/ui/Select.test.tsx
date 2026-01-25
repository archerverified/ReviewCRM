import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('Select Component', () => {
  it('renders with placeholder when no value', () => {
    render(
      <Select
        value=""
        onChange={() => {}}
        options={mockOptions}
        placeholder="Choose an option"
      />
    );

    expect(screen.getByText('Choose an option')).toBeInTheDocument();
  });

  it('displays selected option label', () => {
    render(
      <Select
        value="option2"
        onChange={() => {}}
        options={mockOptions}
        placeholder="Choose an option"
      />
    );

    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('opens dropdown on button click', async () => {
    const user = userEvent.setup();

    render(
      <Select
        value=""
        onChange={() => {}}
        options={mockOptions}
        placeholder="Select..."
      />
    );

    const button = screen.getByRole('button', { name: /select/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument();
    });
  });

  it('closes dropdown on option select', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(
      <Select
        value=""
        onChange={handleChange}
        options={mockOptions}
        placeholder="Select..."
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    const option1 = await screen.findByRole('option', { name: 'Option 1' });
    await user.click(option1);

    expect(handleChange).toHaveBeenCalledWith('option1');
  });

  it('shows custom field input when "Add custom field" clicked', async () => {
    const user = userEvent.setup();
    const handleAddCustomField = jest.fn();

    render(
      <Select
        value=""
        onChange={() => {}}
        options={mockOptions}
        allowCustomFields={true}
        onAddCustomField={handleAddCustomField}
        placeholder="Select..."
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    const addCustomOption = await screen.findByText('Add custom field...');
    await user.click(addCustomOption);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g., Atlanta')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  it('saves custom field and updates value', async () => {
    const user = userEvent.setup();
    const handleAddCustomField = jest.fn();

    render(
      <Select
        value=""
        onChange={() => {}}
        options={mockOptions}
        allowCustomFields={true}
        onAddCustomField={handleAddCustomField}
        placeholder="Select..."
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    const addCustomOption = await screen.findByText('Add custom field...');
    await user.click(addCustomOption);

    const input = await screen.findByPlaceholderText('e.g., Atlanta');
    await user.type(input, 'Custom Field');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(handleAddCustomField).toHaveBeenCalledWith('Custom Field');
  });

  it('displays error message when error prop provided', () => {
    render(
      <Select
        value=""
        onChange={() => {}}
        options={mockOptions}
        error="This field is required"
        placeholder="Select..."
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass('text-red-600');
  });
});

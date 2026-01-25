import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';
import { createRef } from 'react';

describe('Input Component', () => {
  it('renders with label', () => {
    render(<Input label="Email Address" placeholder="Enter email" />);

    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('displays error message when error prop provided', () => {
    render(
      <Input
        label="Email"
        error="Email is required"
        placeholder="Enter email"
      />
    );

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toHaveClass('text-red-600');
  });

  it('applies error styling when error present', () => {
    render(
      <Input
        label="Email"
        error="Invalid email"
        placeholder="test@example.com"
      />
    );

    const input = screen.getByPlaceholderText('test@example.com');
    expect(input).toHaveClass('border-red-500');
    expect(input).toHaveClass('focus:ring-red-500');
  });

  it('renders icon on left side', () => {
    const SearchIcon = () => (
      <svg data-testid="search-icon">
        <path />
      </svg>
    );

    render(
      <Input
        icon={<SearchIcon />}
        placeholder="Search..."
      />
    );

    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('adds pl-10 padding when icon present', () => {
    const Icon = () => <svg data-testid="icon"><path /></svg>;

    render(
      <Input
        icon={<Icon />}
        placeholder="With icon"
      />
    );

    const input = screen.getByPlaceholderText('With icon');
    expect(input).toHaveClass('pl-10');
  });

  it('forwards ref correctly', () => {
    const ref = createRef<HTMLInputElement>();

    render(<Input ref={ref} placeholder="Test input" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.placeholder).toBe('Test input');
  });

  it('applies disabled styles', () => {
    render(<Input disabled placeholder="Disabled input" />);

    const input = screen.getByPlaceholderText('Disabled input');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:opacity-50');
    expect(input).toHaveClass('disabled:cursor-not-allowed');
  });

  it('handles onChange events', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(
      <Input
        placeholder="Type here"
        onChange={handleChange}
      />
    );

    const input = screen.getByPlaceholderText('Type here');
    await user.type(input, 'Hello');

    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('Hello');
  });
});

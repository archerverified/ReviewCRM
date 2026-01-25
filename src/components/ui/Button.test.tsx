import { render, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render with children text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('should render as a button element', () => {
      render(<Button>Button</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('should apply primary variant styles', () => {
      render(<Button variant="primary">Primary</Button>)
      const button = screen.getByText('Primary')
      expect(button).toHaveClass('bg-black', 'text-white')
    })

    it('should apply secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByText('Secondary')
      expect(button).toHaveClass('border-2', 'bg-white')
    })

    it('should apply ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByText('Ghost')
      expect(button).toHaveClass('text-blue-600')
    })

    it('should apply danger variant styles', () => {
      render(<Button variant="danger">Danger</Button>)
      const button = screen.getByText('Danger')
      expect(button).toHaveClass('bg-red-600')
    })
  })

  describe('Sizes', () => {
    it('should apply small size styles', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByText('Small')
      expect(button).toHaveClass('text-sm', 'px-3', 'py-1.5')
    })

    it('should apply medium size styles (default)', () => {
      render(<Button size="md">Medium</Button>)
      const button = screen.getByText('Medium')
      expect(button).toHaveClass('px-4', 'py-2')
    })

    it('should apply large size styles', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByText('Large')
      expect(button).toHaveClass('px-6', 'py-3', 'text-lg')
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      render(<Button loading>Loading</Button>)
      const button = screen.getByRole('button')
      expect(button.querySelector('svg.animate-spin')).toBeInTheDocument()
    })

    it('should hide left icon when loading', () => {
      render(
        <Button loading leftIcon={<span data-testid="left-icon">Icon</span>}>
          Loading
        </Button>
      )
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument()
    })

    it('should still show right icon when loading', () => {
      render(
        <Button loading rightIcon={<span data-testid="right-icon">Icon</span>}>
          Loading
        </Button>
      )
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })

    it('should be disabled when loading', () => {
      render(<Button loading>Loading</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('Icons', () => {
    it('should render left icon', () => {
      render(
        <Button leftIcon={<span data-testid="left-icon">Icon</span>}>
          With Icon
        </Button>
      )
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    })

    it('should render right icon', () => {
      render(
        <Button rightIcon={<span data-testid="right-icon">Icon</span>}>
          With Icon
        </Button>
      )
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })

    it('should render both icons simultaneously', () => {
      render(
        <Button
          leftIcon={<span data-testid="left-icon">L</span>}
          rightIcon={<span data-testid="right-icon">R</span>}
        >
          Both Icons
        </Button>
      )
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should apply disabled cursor style', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button')).toHaveClass('disabled:cursor-not-allowed')
    })

    it('should apply disabled opacity', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button')).toHaveClass('disabled:opacity-50')
    })
  })

  describe('Interactions', () => {
    it('should call onClick handler when clicked', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Click me</Button>)
      await user.click(screen.getByText('Click me'))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when disabled', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()

      render(<Button disabled onClick={handleClick}>Disabled</Button>)
      await user.click(screen.getByText('Disabled'))

      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should not call onClick when loading', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()

      render(<Button loading onClick={handleClick}>Loading</Button>)
      await user.click(screen.getByText('Loading'))

      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should be keyboard accessible with Enter key', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Press Enter</Button>)
      screen.getByText('Press Enter').focus()
      await user.keyboard('{Enter}')

      expect(handleClick).toHaveBeenCalled()
    })

    it('should be keyboard accessible with Space key', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Press Space</Button>)
      screen.getByText('Press Space').focus()
      await user.keyboard(' ')

      expect(handleClick).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have visible focus indicator', () => {
      render(<Button>Focus test</Button>)
      const button = screen.getByText('Focus test')
      expect(button).toHaveClass('focus:ring-2', 'focus:ring-blue-500')
    })

    it('should be focusable by default', () => {
      render(<Button>Focusable</Button>)
      const button = screen.getByText('Focusable')
      button.focus()
      expect(button).toHaveFocus()
    })

    it('should not be focusable when disabled', () => {
      render(<Button disabled>Not Focusable</Button>)
      const button = screen.getByText('Not Focusable')
      expect(button).toBeDisabled()
    })

    it('should forward ref correctly', () => {
      const ref = { current: null }
      render(<Button ref={ref}>With Ref</Button>)
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    })
  })

  describe('Custom Styling', () => {
    it('should merge custom className with base styles', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByText('Custom')
      expect(button).toHaveClass('custom-class')
      // Should still have base classes
      expect(button).toHaveClass('inline-flex', 'items-center')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long text', () => {
      const longText = 'This is a very long button text that should be handled properly'
      render(<Button>{longText}</Button>)
      expect(screen.getByText(longText)).toBeInTheDocument()
    })

    it('should handle empty children gracefully', () => {
      render(<Button>{''}</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should support custom HTML attributes', () => {
      render(<Button data-testid="custom-button" aria-label="Custom Label">Button</Button>)
      expect(screen.getByTestId('custom-button')).toBeInTheDocument()
      expect(screen.getByLabelText('Custom Label')).toBeInTheDocument()
    })
  })
})

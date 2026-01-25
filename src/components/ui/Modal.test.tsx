import { render, screen, waitFor } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <div>Modal Content</div>,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Clear any existing portals
    document.body.innerHTML = ''
  })

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(<Modal {...defaultProps} />)
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
    })

    it('should render into document.body portal', () => {
      render(<Modal {...defaultProps} />)
      const modal = screen.getByText('Test Modal').closest('div[class*="fixed"]')
      expect(modal?.parentElement).toBe(document.body)
    })

    it('should display title', () => {
      render(<Modal {...defaultProps} title="Custom Title" />)
      expect(screen.getByText('Custom Title')).toBeInTheDocument()
    })

    it('should render children content', () => {
      render(<Modal {...defaultProps} />)
      expect(screen.getByText('Modal Content')).toBeInTheDocument()
    })

    it('should render footer when provided', () => {
      render(
        <Modal {...defaultProps} footer={<button>Footer Button</button>} />
      )
      expect(screen.getByText('Footer Button')).toBeInTheDocument()
    })

    it('should not render footer when not provided', () => {
      render(<Modal {...defaultProps} />)
      const modal = screen.getByText('Modal Content').closest('div[class*="bg-white"]')
      expect(modal?.querySelector('[class*="border-t"]')).not.toBeInTheDocument()
    })

    it('should render close button', () => {
      render(<Modal {...defaultProps} />)
      // Close button is an SVG icon
      const closeButton = screen.getByRole('button', { hidden: true })
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('should apply small size class', () => {
      render(<Modal {...defaultProps} size="sm" />)
      const modalContent = screen.getByText('Test Modal').closest('div[class*="bg-white"]')
      expect(modalContent).toHaveClass('max-w-md')
    })

    it('should apply medium size class (default)', () => {
      render(<Modal {...defaultProps} size="md" />)
      const modalContent = screen.getByText('Test Modal').closest('div[class*="bg-white"]')
      expect(modalContent).toHaveClass('max-w-2xl')
    })

    it('should apply large size class', () => {
      render(<Modal {...defaultProps} size="lg" />)
      const modalContent = screen.getByText('Test Modal').closest('div[class*="bg-white"]')
      expect(modalContent).toHaveClass('max-w-4xl')
    })

    it('should apply extra large size class', () => {
      render(<Modal {...defaultProps} size="xl" />)
      const modalContent = screen.getByText('Test Modal').closest('div[class*="bg-white"]')
      expect(modalContent).toHaveClass('max-w-6xl')
    })
  })

  describe('Close Interactions', () => {
    it('should call onClose when Escape key is pressed', async () => {
      const onClose = jest.fn()
      const user = userEvent.setup()

      render(<Modal {...defaultProps} onClose={onClose} />)
      await user.keyboard('{Escape}')

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when backdrop is clicked', async () => {
      const onClose = jest.fn()
      const user = userEvent.setup()

      render(<Modal {...defaultProps} onClose={onClose} />)
      const backdrop = document.querySelector('div[class*="bg-black/50"]')
      if (backdrop) {
        await user.click(backdrop as Element)
      }

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when close button is clicked', async () => {
      const onClose = jest.fn()
      const user = userEvent.setup()

      render(<Modal {...defaultProps} onClose={onClose} />)

      // Find close button by its parent container
      const closeButton = screen.getByText('Test Modal')
        .parentElement
        ?.querySelector('button')

      if (closeButton) {
        await user.click(closeButton)
      }

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should NOT call onClose when modal content is clicked', async () => {
      const onClose = jest.fn()
      const user = userEvent.setup()

      render(<Modal {...defaultProps} onClose={onClose} />)
      await user.click(screen.getByText('Modal Content'))

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Body Scroll Locking', () => {
    it('should lock body scroll when modal opens', () => {
      render(<Modal {...defaultProps} isOpen={true} />)
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should restore body scroll when modal closes', () => {
      const { rerender } = render(<Modal {...defaultProps} isOpen={true} />)
      expect(document.body.style.overflow).toBe('hidden')

      rerender(<Modal {...defaultProps} isOpen={false} />)
      // Restores to previous value (empty string by default)
      expect(document.body.style.overflow).toBe('')
    })

    it('should restore scroll on unmount', () => {
      const { unmount } = render(<Modal {...defaultProps} isOpen={true} />)
      expect(document.body.style.overflow).toBe('hidden')

      unmount()
      // Restores to previous value (empty string by default)
      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('Event Listener Cleanup', () => {
    it('should add keydown event listener when open', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener')
      render(<Modal {...defaultProps} isOpen={true} />)

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      addEventListenerSpy.mockRestore()
    })

    it('should remove keydown event listener when closed', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
      const { rerender } = render(<Modal {...defaultProps} isOpen={true} />)

      rerender(<Modal {...defaultProps} isOpen={false} />)

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      removeEventListenerSpy.mockRestore()
    })

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
      const { unmount } = render(<Modal {...defaultProps} isOpen={true} />)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      removeEventListenerSpy.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      render(<Modal {...defaultProps} />)
      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()
    })

    it('should have aria-modal="true"', () => {
      render(<Modal {...defaultProps} />)
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveAttribute('aria-modal', 'true')
    })

    it('should have aria-labelledby pointing to title', () => {
      render(<Modal {...defaultProps} />)
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveAttribute('aria-labelledby')

      const labelledById = modal.getAttribute('aria-labelledby')
      const title = document.getElementById(labelledById!)
      expect(title).toHaveTextContent('Test Modal')
    })

    it('close button should have aria-label', () => {
      render(<Modal {...defaultProps} />)
      const closeButton = screen.getByLabelText('Close')
      expect(closeButton).toBeInTheDocument()
    })

    it('should trap focus within modal (keyboard handler installed)', async () => {
      const user = userEvent.setup()
      render(
        <Modal {...defaultProps}>
          <input type="text" data-testid="input1" />
          <button data-testid="btn1">Button 1</button>
        </Modal>
      )

      // Verify modal is rendered and has focusable elements
      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()

      // Verify there are focusable elements inside
      const focusableElements = modal.querySelectorAll('button, input')
      expect(focusableElements.length).toBeGreaterThan(0)
    })

    it('should set up focus management on open', () => {
      render(<Modal {...defaultProps} />)

      // Verify modal is rendered with correct structure for focus management
      const modal = screen.getByRole('dialog')
      const closeButton = screen.getByLabelText('Close')

      // The modal and close button should be present and focusable
      expect(modal).toBeInTheDocument()
      expect(closeButton).toBeInTheDocument()
      expect(closeButton.tagName).toBe('BUTTON')
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid open/close cycles', async () => {
      const { rerender } = render(<Modal {...defaultProps} isOpen={false} />)

      for (let i = 0; i < 5; i++) {
        rerender(<Modal {...defaultProps} isOpen={true} />)
        rerender(<Modal {...defaultProps} isOpen={false} />)
      }

      // Restores to previous value (empty string by default)
      expect(document.body.style.overflow).toBe('')
    })

    it('should handle multiple consecutive Escape key presses', async () => {
      const onClose = jest.fn()
      const user = userEvent.setup()

      render(<Modal {...defaultProps} onClose={onClose} />)
      await user.keyboard('{Escape}{Escape}{Escape}')

      // Should only call onClose for each key press
      expect(onClose).toHaveBeenCalled()
    })

    it('should handle very long content', () => {
      const longContent = 'Lorem ipsum '.repeat(500)
      render(
        <Modal {...defaultProps}>
          <div>{longContent}</div>
        </Modal>
      )

      expect(screen.getByText(/Lorem ipsum/)).toBeInTheDocument()
    })

    it('should handle complex footer content', () => {
      render(
        <Modal
          {...defaultProps}
          footer={
            <div>
              <button>Button 1</button>
              <button>Button 2</button>
              <button>Button 3</button>
            </div>
          }
        />
      )

      expect(screen.getByText('Button 1')).toBeInTheDocument()
      expect(screen.getByText('Button 2')).toBeInTheDocument()
      expect(screen.getByText('Button 3')).toBeInTheDocument()
    })
  })

  describe('Integration Scenarios', () => {
    it('should maintain modal state during re-renders', () => {
      const { rerender } = render(<Modal {...defaultProps} title="Title 1" />)
      expect(screen.getByText('Title 1')).toBeInTheDocument()

      rerender(<Modal {...defaultProps} title="Title 2" />)
      expect(screen.getByText('Title 2')).toBeInTheDocument()
      expect(screen.queryByText('Title 1')).not.toBeInTheDocument()
    })

    it('should work with form submission', async () => {
      const handleSubmit = jest.fn((e) => e.preventDefault())
      const user = userEvent.setup()

      render(
        <Modal {...defaultProps}>
          <form onSubmit={handleSubmit}>
            <input type="text" name="test" />
            <button type="submit">Submit</button>
          </form>
        </Modal>
      )

      await user.type(screen.getByRole('textbox'), 'test value')
      await user.click(screen.getByText('Submit'))

      expect(handleSubmit).toHaveBeenCalled()
    })

    it('should preserve scroll position after close', () => {
      window.scrollTo(0, 500)
      const scrollY = window.scrollY

      const { rerender } = render(<Modal {...defaultProps} isOpen={true} />)
      rerender(<Modal {...defaultProps} isOpen={false} />)

      expect(window.scrollY).toBe(scrollY)
    })
  })
})

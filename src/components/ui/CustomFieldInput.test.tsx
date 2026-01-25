import { render, screen, waitFor } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { CustomFieldInput } from './CustomFieldInput'

describe('CustomFieldInput Component', () => {
  const defaultProps = {
    onSave: jest.fn(),
    onCancel: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render input field', () => {
      render(<CustomFieldInput {...defaultProps} />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should auto-focus input on mount', () => {
      render(<CustomFieldInput {...defaultProps} />)
      expect(screen.getByRole('textbox')).toHaveFocus()
    })

    it('should render save and cancel buttons', () => {
      render(<CustomFieldInput {...defaultProps} />)
      expect(screen.getByText('Save')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should render placeholder text', () => {
      render(<CustomFieldInput {...defaultProps} placeholder="Enter city name" />)
      expect(screen.getByPlaceholderText('Enter city name')).toBeInTheDocument()
    })

    it('should render helper text', () => {
      render(<CustomFieldInput {...defaultProps} />)
      expect(screen.getByText('Enter the exact column name from your CSV')).toBeInTheDocument()
    })
  })

  describe('Validation - Valid Input', () => {
    it('should show success state with valid input', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'Atlanta')

      await waitFor(() => {
        expect(input).toHaveClass('border-green-400')
      })
    })

    it('should enable save button with valid input', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'ValidField')

      await waitFor(() => {
        expect(screen.getByText('Save')).not.toBeDisabled()
      })
    })

    it('should show checkmark icon with valid input', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'Valid123')

      await waitFor(() => {
        const svg = screen.getByRole('textbox').parentElement?.querySelector('svg')
        expect(svg).toHaveClass('text-green-600')
      })
    })

    it('should accept alphanumeric characters', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'Field123')

      await waitFor(() => {
        expect(screen.getByText('Save')).not.toBeDisabled()
      })
    })

    it('should accept spaces', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'Field Name')

      await waitFor(() => {
        expect(screen.getByText('Save')).not.toBeDisabled()
      })
    })

    it('should accept underscores and hyphens', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'field_name-test')

      await waitFor(() => {
        expect(screen.getByText('Save')).not.toBeDisabled()
      })
    })

    it('should accept dots and commas', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'field.name,test')

      await waitFor(() => {
        expect(screen.getByText('Save')).not.toBeDisabled()
      })
    })

    it('should accept parentheses and ampersands', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'field (name) & test')

      await waitFor(() => {
        expect(screen.getByText('Save')).not.toBeDisabled()
      })
    })
  })

  describe('Validation - Invalid Input', () => {
    it('should show error state with empty input', async () => {
      render(<CustomFieldInput {...defaultProps} />)
      const input = screen.getByRole('textbox')

      expect(screen.getByText('Save')).toBeDisabled()
    })

    it('should show error for input under 1 character', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, ' ')
      await user.clear(input)

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeDisabled()
      })
    })

    it('should show error for input over 100 characters', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      const longText = 'a'.repeat(101)
      await user.type(screen.getByRole('textbox'), longText)

      await waitFor(() => {
        expect(screen.getByText(/must be 1-100 characters/i)).toBeInTheDocument()
      })
    })

    it('should reject special characters like @', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'field@name')

      await waitFor(() => {
        expect(screen.getByText(/invalid characters/i)).toBeInTheDocument()
      })
    })

    it('should reject special characters like #$%', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'field#$%')

      await waitFor(() => {
        expect(screen.getByText(/invalid characters/i)).toBeInTheDocument()
      })
    })

    it('should show error icon with invalid input', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'invalid@field')

      await waitFor(() => {
        const svg = screen.getByRole('textbox').parentElement?.querySelector('svg')
        expect(svg).toHaveClass('text-red-600')
      })
    })

    it('should show error message with invalid input', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), '@invalid')

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('should disable save button with invalid input', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'invalid@')

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeDisabled()
      })
    })
  })

  describe('User Interactions', () => {
    it('should call onSave with valid input on save button click', async () => {
      const user = userEvent.setup()
      const onSave = jest.fn()
      render(<CustomFieldInput {...defaultProps} onSave={onSave} />)

      await user.type(screen.getByRole('textbox'), 'ValidField')
      await user.click(screen.getByText('Save'))

      expect(onSave).toHaveBeenCalledWith('ValidField')
    })

    it('should call onSave with trimmed value', async () => {
      const user = userEvent.setup()
      const onSave = jest.fn()
      render(<CustomFieldInput {...defaultProps} onSave={onSave} />)

      await user.type(screen.getByRole('textbox'), '  ValidField  ')
      await user.click(screen.getByText('Save'))

      expect(onSave).toHaveBeenCalledWith('  ValidField  ')
    })

    it('should call onCancel on cancel button click', async () => {
      const user = userEvent.setup()
      const onCancel = jest.fn()
      render(<CustomFieldInput {...defaultProps} onCancel={onCancel} />)

      await user.click(screen.getByText('Cancel'))

      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('should call onSave on Enter key with valid input', async () => {
      const user = userEvent.setup()
      const onSave = jest.fn()
      render(<CustomFieldInput {...defaultProps} onSave={onSave} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ValidField{Enter}')

      expect(onSave).toHaveBeenCalledWith('ValidField')
    })

    it('should NOT call onSave on Enter with invalid input', async () => {
      const user = userEvent.setup()
      const onSave = jest.fn()
      render(<CustomFieldInput {...defaultProps} onSave={onSave} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'invalid@{Enter}')

      expect(onSave).not.toHaveBeenCalled()
    })

    it('should call onCancel on Escape key', async () => {
      const user = userEvent.setup()
      const onCancel = jest.fn()
      render(<CustomFieldInput {...defaultProps} onCancel={onCancel} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'text{Escape}')

      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<CustomFieldInput {...defaultProps} />)
      const input = screen.getByRole('textbox')

      expect(input).toHaveAttribute('aria-required', 'true')
      expect(input).toHaveAttribute('aria-describedby')
    })

    it('should set aria-invalid when input is invalid', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'invalid@')

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('should have role="group" on container', () => {
      render(<CustomFieldInput {...defaultProps} />)
      expect(screen.getByRole('group')).toBeInTheDocument()
    })

    it('should have screen reader label', () => {
      render(<CustomFieldInput {...defaultProps} />)
      expect(screen.getByText('Enter custom field name')).toHaveClass('sr-only')
    })

    it('should announce errors with role="alert"', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'invalid@')

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid typing', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'RapidTyping123', { delay: 1 })

      await waitFor(() => {
        expect(screen.getByText('Save')).not.toBeDisabled()
      })
    })

    it('should handle backspace to empty input', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'Test')
      await user.clear(input)

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeDisabled()
      })
    })

    it('should handle paste events', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.paste('PastedField')

      await waitFor(() => {
        expect(screen.getByText('Save')).not.toBeDisabled()
      })
    })

    it('should handle 100 character boundary', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      const exactlyHundred = 'a'.repeat(100)
      await user.type(screen.getByRole('textbox'), exactlyHundred)

      await waitFor(() => {
        expect(screen.getByText('Save')).not.toBeDisabled()
      })
    })

    it('should handle 101 character boundary', async () => {
      const user = userEvent.setup()
      render(<CustomFieldInput {...defaultProps} />)

      const overHundred = 'a'.repeat(101)
      await user.type(screen.getByRole('textbox'), overHundred)

      await waitFor(() => {
        expect(screen.getByText(/must be 1-100 characters/i)).toBeInTheDocument()
      })
    })
  })
})

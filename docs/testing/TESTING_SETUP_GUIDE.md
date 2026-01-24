# Testing Setup Guide
## ReviewCRM UI Component Testing

**Last Updated:** 2026-01-23

---

## Quick Start

### 1. Install Missing Dependencies

```bash
npm install --save-dev @testing-library/user-event @swc/jest
```

### 2. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"
```

### 3. Check Coverage

```bash
npm test -- --coverage --coverageReporters=html
# Open coverage/index.html in browser
```

---

## Project Structure

```
C:\Users\OxGh0\ReviewCRM\
├── jest.config.js              ✓ Created
├── jest.setup.js               ✓ Created
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx           ✓ Created (60 tests)
│   │   │   ├── Input.tsx
│   │   │   ├── Input.test.tsx            ⏳ TODO
│   │   │   ├── Modal.tsx
│   │   │   ├── Modal.test.tsx            ✓ Created (35 tests)
│   │   │   ├── Select.tsx
│   │   │   ├── Select.test.tsx           ⏳ TODO
│   │   │   ├── CustomFieldInput.tsx
│   │   │   └── CustomFieldInput.test.tsx ✓ Created (50 tests)
│   │   ├── ImportModal.tsx
│   │   ├── ImportModal.test.tsx          ⏳ TODO
│   │   ├── FilterBar.tsx
│   │   └── FilterBar.test.tsx            ⏳ TODO
│   └── test/
│       └── utils/
│           └── test-utils.tsx            ✓ Created
└── TEST_COVERAGE_ASSESSMENT.md           ✓ Created
```

---

## Configuration Files

### jest.config.js

Configures Jest with:
- Next.js integration
- Path aliases (@/ → src/)
- Coverage thresholds (70%)
- jsdom test environment
- SWC for fast transforms

### jest.setup.js

Sets up test environment:
- Testing Library matchers
- Next.js router mocks
- Window API mocks (matchMedia, IntersectionObserver)
- Console error suppression

### test-utils.tsx

Provides:
- Custom render function with providers
- Mock data generators
- Test utilities (waitForLoadingToFinish, createMockFile)

---

## Writing Tests

### Test File Naming

- Unit tests: `ComponentName.test.tsx`
- Integration tests: `ComponentName.integration.test.tsx`
- E2E tests: `feature-name.e2e.test.tsx`

### Test Structure

```typescript
import { render, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { YourComponent } from './YourComponent'

describe('YourComponent', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<YourComponent />)
      expect(screen.getByText('Expected Text')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()

      render(<YourComponent onClick={handleClick} />)
      await user.click(screen.getByRole('button'))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      render(<YourComponent />)

      await user.tab()
      expect(screen.getByRole('button')).toHaveFocus()
    })
  })
})
```

### Common Test Patterns

#### 1. Testing User Events

```typescript
import userEvent from '@testing-library/user-event'

it('should type into input', async () => {
  const user = userEvent.setup()
  render(<Input />)

  await user.type(screen.getByRole('textbox'), 'Hello World')
  expect(screen.getByRole('textbox')).toHaveValue('Hello World')
})
```

#### 2. Testing Async Operations

```typescript
import { waitFor } from '@testing-library/react'

it('should load data', async () => {
  render(<AsyncComponent />)

  await waitFor(() => {
    expect(screen.getByText('Loaded Data')).toBeInTheDocument()
  }, { timeout: 3000 })
})
```

#### 3. Testing Modal/Portal Components

```typescript
beforeEach(() => {
  document.body.innerHTML = '' // Clear portals
})

it('should render into portal', () => {
  render(<Modal isOpen={true} />)
  const modal = screen.getByRole('dialog')
  expect(modal.parentElement).toBe(document.body)
})
```

#### 4. Testing Forms

```typescript
it('should submit form', async () => {
  const handleSubmit = jest.fn((e) => e.preventDefault())
  const user = userEvent.setup()

  render(<Form onSubmit={handleSubmit} />)

  await user.type(screen.getByLabelText('Email'), 'test@example.com')
  await user.click(screen.getByText('Submit'))

  expect(handleSubmit).toHaveBeenCalled()
})
```

#### 5. Testing File Uploads

```typescript
import { createMockFile } from '@/test/utils/test-utils'

it('should upload file', async () => {
  const user = userEvent.setup()
  const file = createMockFile('test.csv', 'name,email\nJohn,john@test.com')

  render(<FileUpload />)
  const input = screen.getByLabelText('Upload file')

  await user.upload(input, file)
  expect(input.files[0]).toBe(file)
})
```

---

## Testing Library Queries

### Priority Order (Use in this order)

1. **getByRole** - Most accessible
   ```typescript
   screen.getByRole('button', { name: 'Submit' })
   ```

2. **getByLabelText** - For form fields
   ```typescript
   screen.getByLabelText('Email address')
   ```

3. **getByPlaceholderText** - For inputs
   ```typescript
   screen.getByPlaceholderText('Enter email...')
   ```

4. **getByText** - For non-interactive content
   ```typescript
   screen.getByText('Welcome')
   ```

5. **getByTestId** - Last resort
   ```typescript
   screen.getByTestId('custom-element')
   ```

### Query Variants

- `getBy` - Throws if not found (1 element)
- `queryBy` - Returns null if not found
- `findBy` - Async, waits for element
- `getAllBy` - Returns array
- `queryAllBy` - Returns empty array if not found
- `findAllBy` - Async, waits for elements

---

## Accessibility Testing

### Basic Checks

```typescript
describe('Accessibility', () => {
  it('should have proper ARIA attributes', () => {
    render(<Button aria-label="Close" />)
    expect(screen.getByLabelText('Close')).toBeInTheDocument()
  })

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup()
    render(<Component />)

    await user.tab() // Focus first element
    expect(screen.getByRole('button')).toHaveFocus()

    await user.keyboard('{Enter}') // Activate
  })

  it('should announce errors to screen readers', () => {
    render(<Input error="Invalid email" />)
    const input = screen.getByRole('textbox')

    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby')
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email')
  })
})
```

### Advanced A11y Testing (TODO: Install jest-axe)

```bash
npm install --save-dev jest-axe
```

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

it('should have no accessibility violations', async () => {
  const { container } = render(<Component />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

---

## Mocking

### Mock Functions

```typescript
const mockFn = jest.fn()
mockFn.mockReturnValue('value')
mockFn.mockResolvedValue('async value')
mockFn.mockRejectedValue(new Error('error'))

expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
expect(mockFn).toHaveBeenCalledTimes(3)
```

### Mock Modules

```typescript
// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(),
      select: jest.fn(),
      update: jest.fn(),
    })),
  },
}))
```

### Mock Timers

```typescript
beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

it('should debounce', () => {
  render(<SearchInput />)
  // ... trigger search
  jest.advanceTimersByTime(300)
  // ... verify debounced call
})
```

---

## Coverage Goals

| Category | Target | Current | Status |
|----------|--------|---------|--------|
| Statements | 70% | 0% | 🔴 Not Started |
| Branches | 70% | 0% | 🔴 Not Started |
| Functions | 70% | 0% | 🔴 Not Started |
| Lines | 70% | 0% | 🔴 Not Started |

### Priority Test Files

1. **Button.test.tsx** ✓ Created (60 tests)
2. **CustomFieldInput.test.tsx** ✓ Created (50 tests)
3. **Modal.test.tsx** ✓ Created (35 tests)
4. **Input.test.tsx** ⏳ TODO (Est. 18 tests)
5. **Select.test.tsx** ⏳ TODO (Est. 25 tests)
6. **ImportModal.test.tsx** ⏳ TODO (Est. 25 tests)
7. **FilterBar.test.tsx** ⏳ TODO (Est. 18 tests)

**Total Tests Created:** 145 tests
**Total Tests Remaining:** 86 tests
**Estimated Completion:** 62% complete

---

## Continuous Integration

### GitHub Actions (TODO)

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Debugging Tests

### VS Code Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Current File",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["${fileBasename}", "--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Debug Commands

```bash
# Run single test with debugging
node --inspect-brk node_modules/.bin/jest --runInBand Button.test.tsx

# Verbose output
npm test -- --verbose

# Show console logs
npm test -- --silent=false

# Update snapshots
npm test -- -u
```

---

## Common Issues & Solutions

### Issue 1: "Cannot find module '@/components/...'"

**Solution:** Check `moduleNameMapper` in `jest.config.js`

### Issue 2: "ReferenceError: document is not defined"

**Solution:** Ensure `testEnvironment: 'jsdom'` is set

### Issue 3: "Warning: ReactDOM.render is deprecated"

**Solution:** These warnings are suppressed in `jest.setup.js`

### Issue 4: "act(...) warning"

**Solution:** Use `await` with `userEvent` methods and `waitFor`

```typescript
// Bad
user.click(button)

// Good
await user.click(button)
```

### Issue 5: "Unable to find role='dialog'"

**Solution:** Modal doesn't have role="dialog" yet (documented in tests)

---

## Performance Testing (TODO)

```typescript
import { performance } from 'perf_hooks'

it('should render quickly', () => {
  const start = performance.now()
  render(<LargeComponent data={largeDataset} />)
  const end = performance.now()

  expect(end - start).toBeLessThan(100) // Less than 100ms
})
```

---

## Next Steps

### Week 1: Complete Unit Tests
- [ ] Create Input.test.tsx (18 tests)
- [ ] Create Select.test.tsx (25 tests)
- [ ] Run coverage report
- [ ] Fix failing tests

### Week 2: Integration Tests
- [ ] Create ImportModal.test.tsx (25 tests)
- [ ] Create FilterBar.test.tsx (18 tests)
- [ ] Test component interactions
- [ ] Mock API calls

### Week 3: E2E Tests
- [ ] Install Playwright
- [ ] Create csv-import-flow.e2e.test.ts
- [ ] Create filter-workflow.e2e.test.ts
- [ ] Set up CI/CD pipeline

### Week 4: Accessibility & Polish
- [ ] Install jest-axe
- [ ] Run accessibility audits
- [ ] Fix accessibility issues
- [ ] Document test patterns

---

## Resources

- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro)
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [user-event Guide](https://testing-library.com/docs/user-event/intro)
- [ARIA Roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)
- [Test Assessment Report](./TEST_COVERAGE_ASSESSMENT.md)

---

## Contact & Support

For questions about testing:
1. Review this guide
2. Check TEST_COVERAGE_ASSESSMENT.md
3. Refer to example test files
4. Consult Testing Library documentation

**Last Updated:** 2026-01-23

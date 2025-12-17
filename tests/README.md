# Test Structure

This repository follows a layered testing approach with clear separation of concerns.

## Test Organization

### 1. Client Tests (`client/src/**/*.test.{ts,tsx}`)

**Location**: Inside the `client/` directory, co-located with source code

**Purpose**: Unit tests for React components, hooks, and UI logic

**Stack**:

- Vitest
- React Testing Library
- jsdom (for DOM simulation)

**Example locations**:

```
client/
  src/
    components/
      portfolio/
        PortfolioList.tsx
        PortfolioList.test.tsx    # Component test
    hooks/
      useCompanyFilters.ts
      useCompanyFilters.test.ts  # Hook test
    lib/
      utils.ts
      utils.test.ts              # Utility test
```

**Run**: `cd client && npm test`

### 2. Backend Tests (`backend/src/**/*.test.ts`)

**Location**: Inside the `backend/` directory, co-located with source code

**Purpose**: Unit tests for routes, services, and data layer

**Stack**:

- Vitest
- Supertest (for API route testing)

**Example locations**:

```
backend/
  src/
    routes/
      companies.ts
      companies.test.ts           # Route/integration test
    lib/
      gemini.ts
      gemini.test.ts              # Service test
    services/
      semanticSearch.ts
      semanticSearch.test.ts      # Pure unit test
```

**Run**: `cd backend && npm test`

### 3. E2E Tests (`tests/e2e/**/*.test.ts`)

**Location**: Root-level `tests/e2e/` directory

**Purpose**: End-to-end integration tests that cross layers

**Stack**: Vitest with fetch API

**Characteristics**:

- Hit real HTTP endpoints (e.g., `http://localhost:3001`)
- Test full request/response cycles
- Do NOT import React components or server internals directly
- Automatically skipped if server is not running

**Example**:

```
tests/
  e2e/
    api.test.ts                  # Full API integration tests
    chat-flow.test.ts            # Chat round-trip tests
```

**Run**: `npm run test:e2e` (requires server to be running)

## Running Tests

### From Root Directory

```bash
# Run all tests (client + backend + e2e)
npm run test

# Run by layer
npm run test:client        # Client unit/component tests
npm run test:backend       # Backend unit/integration tests
npm run test:e2e          # End-to-end API tests

# Coverage
npm run test:coverage      # All layers with coverage
npm run test:coverage:client
npm run test:coverage:backend
```

### From Individual Directories

```bash
# Client tests
cd client && npm test
cd client && npm run test:watch
cd client && npm run test:coverage

# Backend tests
cd backend && npm test
cd backend && npm run test:watch
cd backend && npm run test:coverage
```

## Test Configuration

Each layer has its own Vitest configuration:

- **Client**: `client/vitest.config.ts` (jsdom environment, React plugin)
- **Backend**: `backend/vitest.config.ts` (node environment)
- **E2E**: `vitest.config.ts` (root, node environment)

## Best Practices

1. **Co-location**: Keep tests close to the code they test
2. **Layer separation**: Client tests stay in `client/`, backend tests stay in `backend/`
3. **E2E scope**: Only use root `tests/e2e/` for cross-cutting integration tests
4. **No cross-imports**: E2E tests should not import React components or server internals
5. **Coverage**: Maintain 70% coverage threshold for all layers

## CI/CD

Tests run automatically in CI:

- Client tests: Unit and component tests
- Backend tests: Route and service tests
- E2E tests: Full integration tests (if server is available)

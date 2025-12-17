# Radical Portfolio Copilot

AI-native internal tool for Radical Ventures portfolio analysis, company insights, and investment intelligence.

## Project Structure

```
radical-demo/
├── client/          # React + Vite frontend
├── backend/         # Express + TypeScript backend
└── package.json     # Root package.json with CI scripts
```

## Quick Start

### Install Dependencies

```bash
npm run install:all
```

Or individually:
```bash
cd client && npm install
cd ../backend && npm install
```

### Development

**Frontend:**
```bash
cd client
npm run dev
```

**Backend:**
```bash
cd backend
npm run dev
```

## CI/CD Scripts

All scripts are run from the root directory:

### Type Safety
```bash
npm run typecheck          # Check both client and backend
npm run typecheck:client   # Check client only
npm run typecheck:backend  # Check backend only
```

### Linting
```bash
npm run lint              # Lint both client and backend
npm run lint:client        # Lint client only
npm run lint:backend       # Lint backend only
```

### Formatting
```bash
npm run format:check      # Check formatting
npm run format:write       # Auto-fix formatting
```

### Testing
```bash
npm run test              # Run tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage (70% threshold)
```

### Build
```bash
npm run build:client      # Build frontend
npm run build:backend      # Build backend
```

### Security
```bash
npm run audit             # Audit both client and backend
npm run audit:client       # Audit client only
npm run audit:backend     # Audit backend only
```

### Full CI Pipeline
```bash
npm run ci                # Runs all checks: typecheck, lint, format, test, build, audit
```

## CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

The CI pipeline runs:
1. Type checking
2. Linting (0 warnings allowed)
3. Format checking
4. Tests with coverage (70% threshold)
5. Build verification (client + backend)
6. Security audit

## Code Quality Standards

- **TypeScript**: Strict mode enabled with `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`
- **Linting**: ESLint with 0 warnings policy
- **Formatting**: Prettier with consistent style
- **Testing**: Vitest with 70% coverage threshold
- **Security**: Regular npm audit checks

## Additional Tools

### Check for unused dependencies
```bash
npx depcheck
```

### Dead code detection
TypeScript strict mode is enabled to catch unused code at compile time.

## Environment Setup

See individual READMEs:
- [Client README](./client/README.md) - Frontend setup
- [Backend README](./backend/README.md) - Backend setup and API documentation

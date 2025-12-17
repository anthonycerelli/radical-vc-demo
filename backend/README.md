# Radical Portfolio Copilot - Backend API

Backend API for the Radical Portfolio Copilot internal tool. Provides REST endpoints for portfolio company data, analytics, and AI-powered chat functionality.

## Tech Stack

- **Language**: TypeScript (Node.js)
- **Database**: Supabase PostgreSQL with pgvector extension
- **Vector Store**: pgvector for semantic search
- **LLM/Embeddings**: Google Gemini (gemini-pro and text-embedding-004)
- **Framework**: Express.js

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Google Gemini API key
- TypeScript 5.3+

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)
- `GEMINI_API_KEY`: Your Google Gemini API key
- `PORT`: Server port (default: 3001)

### 3. Run Database Migrations

Execute the migration files in order against your Supabase database:

1. **Enable pgvector extension**:
   ```sql
   -- Run migrations/001_init_pgvector.sql
   ```

2. **Create companies table**:
   ```sql
   -- Run migrations/002_create_companies.sql
   ```

3. **Create embeddings table**:
   ```sql
   -- Run migrations/003_create_company_embeddings.sql
   ```

4. **Create search function**:
   ```sql
   -- Run migrations/004_create_search_function.sql
   ```

5. **Enable RLS policies**:
   ```sql
   -- Run migrations/006_enable_rls_policies.sql
   ```

6. **Fix security warnings**:
   ```sql
   -- Run migrations/007_fix_security_warnings.sql
   ```

7. **Move vector extension** (if needed):
   ```sql
   -- Run migrations/008_move_vector_extension.sql
   ```

8. **Update for Gemini embeddings** (768 dimensions):
   ```sql
   -- Run migrations/009_update_for_gemini_embeddings.sql
   ```

You can run these migrations via:
- Supabase Dashboard SQL Editor
- Supabase CLI: `supabase db push`
- psql: `psql -h <host> -U <user> -d <database> -f migrations/001_init_pgvector.sql`

### 4. Import Portfolio Data

Place your `radical_portfolio_companies.json` file in the `data/` directory, then run:

```bash
npm run import
```

This script will:
- Read the JSON file
- Upsert companies into the database
- Generate embeddings for each company using Google Gemini (768 dimensions)
- Store embeddings in the `company_embeddings` table

The import is idempotent - you can run it multiple times safely.

### 5. Start the Server

**Development mode** (with hot reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001` (or your configured PORT).

## API Endpoints

### Health Check

```bash
GET /health
```

Returns server status.

### Companies

#### List Companies

```bash
GET /api/companies?q=search&category=AI&year=2023&limit=20&offset=0
```

**Query Parameters:**
- `q` (optional): Text search term (searches name and description)
- `category` (optional): Filter by category (comma-separated for multiple)
- `year` (optional): Filter by investment year
- `limit` (optional, default: 20, max: 100): Number of results
- `offset` (optional, default: 0): Pagination offset

**Response:**
```json
{
  "companies": [
    {
      "id": "uuid",
      "name": "Company Name",
      "slug": "company-slug",
      "radical_portfolio_url": "https://...",
      "radical_investment_year": 2023,
      "radical_all_categories": ["AI", "ML"],
      "radical_primary_category": "AI",
      "tagline": "Company tagline",
      "description": "Company description",
      ...
    }
  ],
  "total": 50
}
```

#### Get Company by Slug

```bash
GET /api/companies/:slug
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Company Name",
  "slug": "company-slug",
  ...
}
```

Returns 404 if company not found.

### Insights

#### Get Portfolio Summary

```bash
GET /api/insights/summary
```

**Response:**
```json
{
  "byCategory": [
    { "category": "AI", "count": 15 },
    { "category": "Climate", "count": 8 }
  ],
  "byYear": [
    { "year": 2023, "count": 10 },
    { "year": 2024, "count": 5 }
  ]
}
```

### Chat

#### Send Chat Message

```bash
POST /api/chat
Content-Type: application/json

{
  "message": "What AI companies are in the portfolio?",
  "selectedCompanySlug": "optional-company-slug",
  "topK": 5
}
```

**Request Body:**
- `message` (required): User's question
- `selectedCompanySlug` (optional): Currently selected company slug for context
- `topK` (optional, default: 5, max: 10): Number of similar companies to retrieve

**Response:**
```json
{
  "answer": "Based on the portfolio, there are several AI companies...",
  "sources": [
    {
      "name": "Company Name",
      "slug": "company-slug",
      "radical_primary_category": "AI"
    }
  ]
}
```

The chat endpoint:
1. Generates an embedding for the user's message
2. Performs semantic search over company embeddings
3. Retrieves top-k similar companies
4. Builds context including selected company (if provided) and similar companies
5. Calls Google Gemini (gemini-pro) to generate an answer
6. Returns the answer with cited sources

## Example Requests

### List all companies
```bash
curl http://localhost:3001/api/companies
```

### Search companies
```bash
curl "http://localhost:3001/api/companies?q=AI&category=Machine%20Learning&limit=10"
```

### Get company by slug
```bash
curl http://localhost:3001/api/companies/example-company
```

### Get portfolio insights
```bash
curl http://localhost:3001/api/insights/summary
```

### Chat with copilot
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the key trends in the portfolio?",
    "topK": 5
  }'
```

## Project Structure

```
backend/
├── src/
│   ├── lib/
│   │   ├── supabaseClient.ts    # Supabase client initialization
│   │   └── gemini.ts             # Google Gemini client and helpers
│   ├── routes/
│   │   ├── companies.ts          # Company endpoints
│   │   ├── insights.ts           # Analytics endpoints
│   │   └── chat.ts               # Chat endpoint with semantic search
│   ├── types/
│   │   └── database.ts           # TypeScript types
│   └── server.ts                 # Express server setup
├── scripts/
│   └── import_companies.ts       # Data import script
├── migrations/
│   ├── 001_init_pgvector.sql
│   ├── 002_create_companies.sql
│   ├── 003_create_company_embeddings.sql
│   └── 004_create_search_function.sql
├── data/
│   └── radical_portfolio_companies.json
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Type Checking

```bash
npm run typecheck
```

### Building

```bash
npm run build
```

Output will be in the `dist/` directory.

## Error Handling

All endpoints return JSON error responses in the format:

```json
{
  "error": {
    "message": "Error description"
  }
}
```

HTTP status codes:
- `200`: Success
- `400`: Bad request (validation errors)
- `404`: Not found
- `500`: Internal server error

## Notes

- The vector search uses cosine distance for similarity matching
- Embeddings are generated using Google Gemini's `text-embedding-004` model (768 dimensions)
- The chat endpoint uses Gemini Pro for generating responses
- The import script is idempotent and safe to run multiple times
- Category filtering supports both primary category and array overlap matching

## Troubleshooting

### Vector search not working

If you see errors about the RPC function, make sure you've run `migrations/004_create_search_function.sql`. The chat endpoint has a fallback that computes similarity client-side, but it's less efficient.

### Embedding generation fails

Check that your `GEMINI_API_KEY` is valid and has sufficient quota. The import script will skip companies that fail embedding generation.

### Database connection errors

Verify your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct. The service role key is required for admin operations like data import.


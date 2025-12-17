# Environment Variables Setup

## Required Environment Variables

Create a `.env` file in the `client` directory with the following:

```bash
# Backend API Base URL
# For production, set this to your deployed backend URL
# Example: https://your-backend-api.herokuapp.com or https://api.yourdomain.com
# For local development, defaults to http://localhost:3001
VITE_API_BASE_URL=http://localhost:3001
```

## Production Setup

When deploying to production, set the `VITE_API_BASE_URL` environment variable to your production backend URL.

### Netlify
1. Go to your site settings
2. Navigate to "Environment variables"
3. Add `VITE_API_BASE_URL` with your production backend URL

### Vercel
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `VITE_API_BASE_URL` with your production backend URL

### Other Platforms
Set the environment variable according to your platform's documentation. The variable must be prefixed with `VITE_` for Vite to expose it to the client.


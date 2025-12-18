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

1. Go to your site settings in Netlify Dashboard
2. Navigate to "Site configuration" → "Environment variables"
3. Click "Add variable"
4. Add `VITE_API_BASE_URL` with your production backend URL (e.g., `https://your-backend.onrender.com`)
5. **Important**: After adding the variable, you need to trigger a new deployment for the change to take effect
   - Go to "Deploys" tab
   - Click "Trigger deploy" → "Deploy site"

### Render (Backend)

If your backend is on Render, make sure:

1. Your backend service is running and accessible
2. The backend URL is something like: `https://your-service-name.onrender.com`
3. CORS is configured to allow requests from your frontend domain

### Vercel

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `VITE_API_BASE_URL` with your production backend URL
4. Redeploy your application

### Other Platforms

Set the environment variable according to your platform's documentation. The variable must be prefixed with `VITE_` for Vite to expose it to the client.

## Troubleshooting

### Connection Refused Error

If you see `ERR_CONNECTION_REFUSED` errors:

1. **Check environment variable is set**: Make sure `VITE_API_BASE_URL` is set in your deployment platform
2. **Verify backend URL**: Ensure your backend is running and accessible at the URL you specified
3. **Check CORS**: Make sure your backend allows requests from your frontend domain
4. **Redeploy**: After setting environment variables, you must redeploy for changes to take effect
5. **Check build logs**: Verify the environment variable is being read during build time

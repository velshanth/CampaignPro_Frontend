# CampaignPro Frontend

A simple, responsive web client for managing email campaigns, subscriber lists, and email templates. Built with React and Vite.

## Features

- **Campaigns**: Create drafts, schedule deliveries, and send campaigns.
- **Templates**: Rich email template creator with live mobile and desktop previews.
- **Contacts**: Organize contacts and subscriber groups with CSV import/export.
- **Analytics**: Track delivery stats, open rates, click rates, and bounces.
- **Backend Toggle**: Connects directly to your Spring Boot REST backend (`http://localhost:8080`) or runs in local offline mode for testing.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Redux Toolkit
- Lucide React

## Setup & Running Locally

### Prerequisites
- **Node.js**: v20.x or v22.x LTS recommended (check with `node -v`)
- **npm**: v10+ (comes bundled with Node)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview the production build**:
   ```bash
   npm run preview
   ```

## Deploying to Vercel

This project includes a `vercel.json` configured for single-page application routing:

1. Push your code to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Vercel automatically detects Vite:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**.

## Connecting to Backend

The app connects to your Spring Boot REST API.

### 1. In Local Development
Set the backend URL in your `.env` file at the root of the project:
```env
VITE_API_URL=http://localhost:8080
```

### 2. When Deploying to Vercel
In your Vercel project dashboard:
1. Go to **Settings** > **Environment Variables**.
2. Add a new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-production-backend-url.com`
3. Check all environments (**Production**, **Preview**, **Development**) and click **Save**.
4. Redeploy your project so Vite embeds the environment variable during build.

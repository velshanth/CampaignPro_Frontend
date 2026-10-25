# CampaignPro - Frontend

This is the frontend application for CampaignPro, an email campaign management web app. It allows users to create email templates, organize contacts into groups, and send or schedule email campaigns.

The app connects to a Spring Boot backend for authentication and data storage.

## Features

- User authentication (Login and Register with JWT)
- Create and manage email templates
- Add and edit contacts (assigning a group is mandatory)
- Create campaigns by selecting a template and a target contact group
- Send campaigns immediately or schedule them for a later time
- View campaign details and delivery reports (delivered, opened, clicked, bounced)
- Dashboard and analytics overview

## Demo Login

You can use these credentials to test the project:

- Username: testuser02
- Password: Password123!

Or you can register a new account from the Register tab.

## Technologies Used

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Redux Toolkit

## How to Run the Project Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Backend URL
Create a `.env` file in the root folder and add your backend address:
```env
VITE_API_URL=http://localhost:8080
```

### 3. Start the dev server
```bash
npm run dev
```
Open http://localhost:3000 in your browser.

### 4. Build for Production
```bash
npm run build
```

## Project Structure

- `src/components/auth`: Login and register screens
- `src/components/campaigns`: Campaign list, create modal, edit modal, and details page
- `src/components/contacts`: Contact management and group creation
- `src/components/templates`: Template creation, list, and preview
- `src/components/analytics`: Campaign performance and reports
- `src/components/dashboard`: Main dashboard summary
- `src/services/api.ts`: API service that handles HTTP requests to the backend
- `src/store`: Redux Toolkit store and state slices
- `src/types`: TypeScript types matching the backend DTOs

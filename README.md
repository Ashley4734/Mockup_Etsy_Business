# Etsy Mockup Listing Generator

An automated web application that generates and publishes Etsy listings for your mockup images stored in Google Drive, powered by AI.

## Features

- 🖼️ **Google Drive Integration** - Browse and select mockup images directly from your Google Drive
- 🤖 **AI-Powered Content Generation** - Automatically generate listing titles, descriptions, and tags using OpenAI
- 🏪 **Etsy API Integration** - Create listings directly on Etsy with one click
- 📄 **PDF Download Links** - Automatically generates PDFs with Google Drive share links for digital downloads
- 📝 **Custom Templates** - Create reusable content sections to include in all your listings
- 🎨 **Multi-Select Gallery** - Select single or multiple mockups to create listings
- 🚀 **One-Click Deploy** - Ready for deployment on Coolify with Docker

## Tech Stack

**Frontend:**
- React 18
- Vite
- TailwindCSS
- Zustand (state management)
- React Query (data fetching)
- React Router

**Backend:**
- Node.js / Express
- PostgreSQL
- Google Drive API
- Etsy API v3
- OpenAI API (GPT-4 Vision)
- PDFKit

**Deployment:**
- Docker & Docker Compose
- Coolify compatible

## Prerequisites

Before you begin, you need to set up API credentials for:

1. **Google Cloud Console** (for Google Drive API)
2. **Etsy Developer Portal** (for Etsy API)
3. **OpenAI** (for AI content generation)

### 1. Google Drive API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Drive API** and **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen (add your domain)
6. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://your-domain.com/api/auth/google/callback`
7. Save the Client ID and Client Secret

### 2. Etsy API Setup

1. Go to [Etsy Developers](https://www.etsy.com/developers/)
2. Create a new app
3. Get your API Key (Keystring)
4. Set up OAuth redirect URI: `http://your-domain.com/api/auth/etsy/callback`
5. Note: Etsy uses OAuth 2.0 with PKCE

### 3. OpenAI API Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Make sure you have access to GPT-4 with vision (gpt-4o model)

## Installation

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd Mockup_Etsy_Business
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API credentials:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3000
   FRONTEND_URL=http://localhost:5173

   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/etsy_mockup_db

   # Session
   SESSION_SECRET=your-super-secret-session-key

   # Google Drive OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

   # Etsy API
   ETSY_API_KEY=your-etsy-api-key
   ETSY_API_SECRET=your-etsy-api-secret
   ETSY_REDIRECT_URI=http://localhost:3000/api/auth/etsy/callback

   # OpenAI API
   OPENAI_API_KEY=your-openai-api-key
   ```

3. **Install dependencies:**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

4. **Set up the database:**
   ```bash
   # Make sure PostgreSQL is running
   cd backend
   npm run migrate
   ```

5. **Run in development mode:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

6. **Open your browser:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Docker Compose (Local)

```bash
# Copy and configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Build and run
docker-compose up --build
```

The app will be available at http://localhost:3000

## Deployment on Coolify

Coolify will automatically use environment variables you configure in the dashboard.

### Step 1: Prepare Your Environment Variables in Coolify

Add the following environment variables in your Coolify deployment settings:

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.com

# Database (Coolify will provide this if you add a PostgreSQL service)
DATABASE_URL=postgresql://user:password@postgres:5432/etsy_mockup_db

# Session Secret (generate a secure random string)
SESSION_SECRET=your-super-secret-session-key-change-this

# Google Drive OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback

# Etsy API
ETSY_API_KEY=your-etsy-api-key
ETSY_API_SECRET=your-etsy-api-secret
ETSY_REDIRECT_URI=https://your-domain.com/api/auth/etsy/callback

# OpenAI API
OPENAI_API_KEY=your-openai-api-key

# Optional - Specific Google Drive folder ID
GOOGLE_DRIVE_FOLDER_ID=

# Database credentials (if using Coolify PostgreSQL service)
DB_USER=etsyuser
DB_PASSWORD=your-secure-password
```

### Step 2: Deploy

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. In Coolify, create a new application
3. Connect your Git repository
4. Coolify will automatically detect the Dockerfile
5. Add a PostgreSQL database service
6. Set all environment variables
7. Deploy!

### Step 3: Run Database Migration

After the first deployment, run the migration:

```bash
# SSH into your container or use Coolify's terminal
npm run migrate
```

### Step 4: Update OAuth Redirect URIs

Make sure to update your redirect URIs in Google Cloud Console and Etsy Developer Portal to use your production domain:

- Google: `https://your-domain.com/api/auth/google/callback`
- Etsy: `https://your-domain.com/api/auth/etsy/callback`

## Usage

### 1. Authentication

1. Click "Sign in with Google Drive" on the login page
2. Authorize the app to access your Google Drive (read-only)
3. After successful Google authentication, connect your Etsy shop

### 2. Browse Mockups

- The dashboard displays all image files from your Google Drive
- You can optionally set a specific folder ID in the environment variables

### 3. Create Custom Templates (Optional)

- Go to the Templates page
- Create reusable content sections (e.g., shipping info, usage rights)
- Mark sections as "default" to include them in all listings automatically

### 4. Generate Listings

1. Select one or more mockups from the gallery
2. Click "Create Listing"
3. Click "Generate Content" - AI will analyze your mockup and create:
   - Optimized title
   - Detailed description
   - Relevant tags
   - Category suggestions
4. Review and edit the generated content
5. Set your price
6. Click "Create Listing"

### 5. What Happens Next

The app will:
1. Create shareable links for your mockup files in Google Drive
2. Generate a PDF with download instructions and links
3. Upload the PDF to Etsy as a digital download file
4. Upload the mockup image as the listing photo
5. Create a draft listing on Etsy
6. Return the Etsy listing URL for you to review and activate

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/          # Database and session config
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth middleware
│   │   ├── models/          # Database schema
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (Google, Etsy, OpenAI, PDF)
│   │   ├── utils/           # Utilities (migration script)
│   │   └── server.js        # Express app entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   ├── stores/          # Zustand stores
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/etsy` - Initiate Etsy OAuth
- `GET /api/auth/etsy/callback` - Etsy OAuth callback
- `GET /api/auth/status` - Get authentication status
- `POST /api/auth/logout` - Logout

### Mockups
- `GET /api/mockups` - List all mockup images from Google Drive
- `GET /api/mockups/:fileId` - Get specific mockup metadata

### Listings
- `POST /api/listings/generate` - Generate listing content with AI
- `POST /api/listings/create` - Create Etsy listing
- `GET /api/listings` - Get user's created listings
- `GET /api/listings/:id` - Get specific listing

### Templates
- `GET /api/templates` - Get all templates
- `POST /api/templates` - Create new template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in your `.env` file
- Run migrations: `npm run migrate`

### OAuth Errors
- Verify redirect URIs match exactly in Google/Etsy dashboards
- Check that OAuth credentials are correct
- Ensure cookies are enabled in your browser

### AI Generation Fails
- Verify OpenAI API key is valid
- Check that you have access to GPT-4 Vision (gpt-4o)
- Ensure sufficient API credits

### Etsy Listing Creation Fails
- Make sure you have connected your Etsy shop
- Verify your shop has shipping and return policies set up
- Check Etsy API rate limits

## Security Notes

- Never commit `.env` file to version control
- Use strong, random SESSION_SECRET in production
- Keep all API keys secure
- The app only requests read access to Google Drive
- OAuth tokens are stored encrypted in the database

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this for your own projects!

## Support

For issues and questions, please open an issue on GitHub.

---

**Happy listing! 🚀**

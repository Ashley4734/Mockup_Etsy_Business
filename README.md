# Etsy Mockup Listing Generator

A web application that generates AI-powered Etsy listing content for your mockup images stored in Google Drive. The app analyzes your mockups, creates optimized listing content, and generates a PDF with Google Drive download links - all ready to copy and paste into Etsy.

## Features

- 🖼️ **Google Drive Integration** - Browse and select mockup images directly from your Google Drive
- 🤖 **AI-Powered Content Generation** - Automatically generate listing titles, descriptions, and tags using OpenAI GPT-4 Vision
- 📄 **PDF Download Links** - Automatically generates PDFs with Google Drive share links for digital downloads
- 📋 **Copy-to-Clipboard** - Easy one-click copying of all listing content
- 📝 **Custom Templates** - Create reusable content sections to include in all your listings
- 🎨 **Multi-Select Gallery** - Select single or multiple mockups to create listings
- 🚀 **One-Click Deploy** - Ready for deployment on Coolify with Docker

## How It Works

1. **Connect Google Drive** - Sign in and grant read access to your mockup images
2. **Select Mockups** - Choose one or more mockups from your gallery
3. **Generate Content** - AI analyzes your mockup and creates optimized listing content
4. **Review & Edit** - Customize the title, description, price, and tags
5. **Download & Copy** - Get your PDF and copy each section to paste into Etsy

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
- OpenAI API (GPT-4 Vision)
- PDFKit

**Deployment:**
- Docker & Docker Compose
- Coolify compatible

## Prerequisites

You need API credentials for:

1. **Google Cloud Console** (for Google Drive API)
2. **OpenAI** (for AI content generation)

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

### 2. OpenAI API Setup

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

### Step 4: Update OAuth Redirect URI

Make sure to update your redirect URI in Google Cloud Console to use your production domain:

- Google: `https://your-domain.com/api/auth/google/callback`

## Usage

### 1. Authentication

1. Click "Sign in with Google Drive" on the login page
2. Authorize the app to access your Google Drive (read-only)

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
   - Optimized title (max 140 characters)
   - Detailed description
   - Relevant tags (13 tags)
   - Category suggestions
4. Review and edit the generated content
5. Set your price
6. Click "Finalize Listing"

### 5. Copy & Paste to Etsy

Once finalized, you'll see:
- **Title** - Click "Copy" to copy to clipboard
- **Description** - Click "Copy" to copy to clipboard
- **Price** - Click "Copy" to copy to clipboard
- **Tags** - Click "Copy" to copy comma-separated tags
- **PDF Download** - Download the PDF with Google Drive links

Then:
1. Go to Etsy and create a new digital listing
2. Paste the title, description, price, and tags
3. Upload your mockup image(s) from Google Drive as listing photos
4. Upload the downloaded PDF as the digital download file
5. Publish your listing!

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
│   │   ├── services/        # Business logic (Google, OpenAI, PDF)
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
- `GET /api/auth/status` - Get authentication status
- `POST /api/auth/logout` - Logout

### Mockups
- `GET /api/mockups` - List all mockup images from Google Drive
- `GET /api/mockups/:fileId` - Get specific mockup metadata

### Listings
- `POST /api/listings/generate` - Generate listing content with AI
- `POST /api/listings/create` - Create listing and generate PDF
- `GET /api/listings` - Get user's created listings
- `GET /api/listings/:id` - Get specific listing
- `GET /api/listings/:id/download-pdf` - Download PDF for listing

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
- Verify redirect URIs match exactly in Google Dashboard
- Check that OAuth credentials are correct
- Ensure cookies are enabled in your browser

### AI Generation Fails
- Verify OpenAI API key is valid
- Check that you have access to GPT-4 Vision (gpt-4o)
- Ensure sufficient API credits

### PDF Download Not Working
- Check that the uploads directory exists and is writable
- Verify the listing was created successfully
- Check server logs for errors

## Security Notes

- Never commit `.env` file to version control
- Use strong, random SESSION_SECRET in production
- Keep all API keys secure
- The app only requests read access to Google Drive
- OAuth tokens are stored encrypted in the database
- PDFs are stored temporarily on the server

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

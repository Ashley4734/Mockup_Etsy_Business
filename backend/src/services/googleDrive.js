const { google } = require('googleapis');
const axios = require('axios');

class GoogleDriveService {
  constructor(tokens) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    if (tokens) {
      this.oauth2Client.setCredentials(tokens);
    }

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Get authorization URL for OAuth flow
   */
  static getAuthUrl() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  static async getTokensFromCode(code) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Get user email from Google
   */
  async getUserEmail() {
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();
    return data.email;
  }

  /**
   * List image files from Google Drive (optionally from a specific folder)
   */
  async listMockupImages(folderId = null) {
    try {
      let query = "mimeType contains 'image/' and trashed = false";

      if (folderId) {
        query += ` and '${folderId}' in parents`;
      }

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, thumbnailLink, webViewLink, webContentLink, size, createdTime, modifiedTime)',
        orderBy: 'modifiedTime desc',
        pageSize: 100
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error listing Google Drive files:', error);
      throw new Error('Failed to fetch mockup images from Google Drive');
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, thumbnailLink, webViewLink, webContentLink, size, createdTime, modifiedTime'
      });
      return response.data;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new Error('Failed to get file metadata');
    }
  }

  /**
   * Create a shareable link for a file
   */
  async createShareableLink(fileId) {
    try {
      // First, set permissions to allow anyone with link to view
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });

      // Get the webViewLink
      const file = await this.drive.files.get({
        fileId,
        fields: 'webViewLink, webContentLink'
      });

      return file.data.webViewLink;
    } catch (error) {
      console.error('Error creating shareable link:', error);
      throw new Error('Failed to create shareable link');
    }
  }

  /**
   * Download file as buffer (for AI analysis)
   */
  async downloadFileAsBuffer(fileId) {
    try {
      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      );
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  }

  /**
   * Get direct download URL for a file
   */
  async getDirectDownloadUrl(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'webContentLink'
      });
      return response.data.webContentLink;
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw new Error('Failed to get download URL');
    }
  }

  /**
   * Refresh access token if needed
   */
  async refreshTokenIfNeeded() {
    try {
      const tokens = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(tokens.credentials);
      return tokens.credentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }
}

module.exports = GoogleDriveService;

const GoogleDriveService = require('../services/googleDrive');

/**
 * Get mockup images from Google Drive
 */
exports.getMockups = async (req, res) => {
  try {
    const driveService = new GoogleDriveService(req.session.googleTokens);
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || req.query.folderId;

    const mockups = await driveService.listMockupImages(folderId);

    res.json({
      success: true,
      count: mockups.length,
      mockups
    });
  } catch (error) {
    console.error('Error getting mockups:', error);
    res.status(500).json({
      error: 'Failed to fetch mockups from Google Drive',
      message: error.message
    });
  }
};

/**
 * Get specific mockup metadata
 */
exports.getMockupById = async (req, res) => {
  try {
    const { fileId } = req.params;
    const driveService = new GoogleDriveService(req.session.googleTokens);

    const mockup = await driveService.getFileMetadata(fileId);

    res.json({
      success: true,
      mockup
    });
  } catch (error) {
    console.error('Error getting mockup:', error);
    res.status(500).json({
      error: 'Failed to fetch mockup',
      message: error.message
    });
  }
};

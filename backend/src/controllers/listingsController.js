const pool = require('../config/database');
const GoogleDriveService = require('../services/googleDrive');
const OpenAIService = require('../services/openai');
const PDFGeneratorService = require('../services/pdfGenerator');
const fs = require('fs').promises;
const path = require('path');

/**
 * Generate listing content using AI
 */
exports.generateListingContent = async (req, res) => {
  try {
    const { fileIds, customSections } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'File IDs are required' });
    }

    const driveService = new GoogleDriveService(req.session.googleTokens);
    const openaiService = new OpenAIService();

    // For multiple files, analyze the first one and generate combined content
    const firstFileId = fileIds[0];

    // Download image as buffer
    const imageBuffer = await driveService.downloadFileAsBuffer(firstFileId);
    const imageBase64 = imageBuffer.toString('base64');

    // Get custom sections from database if not provided
    let sectionsToUse = customSections || [];
    if (!customSections || customSections.length === 0) {
      const templatesResult = await pool.query(
        'SELECT name, content FROM templates WHERE user_id = $1 AND is_default = true',
        [req.session.userId]
      );
      sectionsToUse = templatesResult.rows;
    }

    // Generate listing content with AI
    const generatedContent = await openaiService.analyzeImageAndGenerateListing(
      imageBase64,
      sectionsToUse
    );

    // If custom sections exist, enhance the description
    if (sectionsToUse.length > 0) {
      generatedContent.description = openaiService.enhanceDescriptionWithSections(
        generatedContent.description,
        sectionsToUse
      );
    }

    res.json({
      success: true,
      content: generatedContent,
      fileCount: fileIds.length
    });
  } catch (error) {
    console.error('Error generating listing content:', error);
    res.status(500).json({
      error: 'Failed to generate listing content',
      message: error.message
    });
  }
};

/**
 * Create listing with PDF download link
 */
exports.createListing = async (req, res) => {
  try {
    const {
      fileIds,
      title,
      description,
      price,
      tags
    } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'File IDs are required' });
    }

    if (!title || !description || !price) {
      return res.status(400).json({ error: 'Title, description, and price are required' });
    }

    const driveService = new GoogleDriveService(req.session.googleTokens);

    // Prepare mockup files array with shareable links
    const mockupFiles = [];
    for (const fileId of fileIds) {
      const fileMetadata = await driveService.getFileMetadata(fileId);
      const shareLink = await driveService.createShareableLink(fileId);

      mockupFiles.push({
        id: fileId,
        name: fileMetadata.name,
        shareLink: shareLink
      });
    }

    // Generate PDF with download links
    const pdfBuffer = await PDFGeneratorService.generateDownloadPDF(mockupFiles, {
      title: title
    });

    // Save PDF to uploads directory
    const uploadsDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const pdfFileName = `listing-${Date.now()}.pdf`;
    const pdfPath = path.join(uploadsDir, pdfFileName);
    await fs.writeFile(pdfPath, pdfBuffer);

    // Save listing to database
    const insertResult = await pool.query(
      `INSERT INTO listings
        (user_id, title, description, price, tags, mockup_files, pdf_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.session.userId,
        title,
        description,
        price,
        tags,
        JSON.stringify(mockupFiles),
        pdfFileName,
        'ready'
      ]
    );

    const savedListing = insertResult.rows[0];

    res.json({
      success: true,
      listing: {
        id: savedListing.id,
        title: savedListing.title,
        description: savedListing.description,
        price: savedListing.price,
        tags: savedListing.tags,
        mockupFiles: mockupFiles,
        pdfDownloadUrl: `/api/listings/${savedListing.id}/download-pdf`,
        status: 'ready'
      },
      message: 'Listing content generated! Copy and paste into Etsy.'
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({
      error: 'Failed to create listing',
      message: error.message
    });
  }
};

/**
 * Get user's created listings
 */
exports.getUserListings = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await pool.query(
      'SELECT * FROM listings WHERE user_id = $1 ORDER BY created_at DESC',
      [req.session.userId]
    );

    res.json({
      success: true,
      listings: result.rows
    });
  } catch (error) {
    console.error('Error getting user listings:', error);
    res.status(500).json({
      error: 'Failed to get listings',
      message: error.message
    });
  }
};

/**
 * Get specific listing by ID
 */
exports.getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await pool.query(
      'SELECT * FROM listings WHERE id = $1 AND user_id = $2',
      [id, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({
      success: true,
      listing: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting listing:', error);
    res.status(500).json({
      error: 'Failed to get listing',
      message: error.message
    });
  }
};

/**
 * Download PDF for a listing
 */
exports.downloadPDF = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await pool.query(
      'SELECT * FROM listings WHERE id = $1 AND user_id = $2',
      [id, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listing = result.rows[0];

    if (!listing.pdf_url) {
      return res.status(404).json({ error: 'PDF not found for this listing' });
    }

    const pdfPath = path.join(__dirname, '../../uploads', listing.pdf_url);

    // Check if file exists
    try {
      await fs.access(pdfPath);
    } catch (error) {
      return res.status(404).json({ error: 'PDF file not found on server' });
    }

    // Send the file
    res.download(pdfPath, 'mockup-download-links.pdf');
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({
      error: 'Failed to download PDF',
      message: error.message
    });
  }
};

const pool = require('../config/database');
const GoogleDriveService = require('../services/googleDrive');
const EtsyService = require('../services/etsy');
const OpenAIService = require('../services/openai');
const PDFGeneratorService = require('../services/pdfGenerator');

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
 * Create Etsy listing with digital download
 */
exports.createEtsyListing = async (req, res) => {
  try {
    const {
      fileIds,
      title,
      description,
      price,
      tags,
      taxonomyId,
      customSections
    } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'File IDs are required' });
    }

    if (!title || !description || !price) {
      return res.status(400).json({ error: 'Title, description, and price are required' });
    }

    if (!req.session.etsyShopId) {
      return res.status(400).json({ error: 'Etsy shop not found' });
    }

    const driveService = new GoogleDriveService(req.session.googleTokens);
    const etsyService = new EtsyService(req.session.etsyTokens);
    const shopId = req.session.etsyShopId;

    // Get shipping and return policies
    const shippingProfiles = await etsyService.getShippingProfiles(shopId);
    const returnPolicies = await etsyService.getReturnPolicies(shopId);

    // Create draft listing on Etsy
    const listingData = {
      title: title.substring(0, 140), // Etsy max title length
      description,
      price: parseFloat(price),
      tags: tags.slice(0, 13), // Etsy allows max 13 tags
      taxonomy_id: taxonomyId || 2322,
      shipping_profile_id: shippingProfiles[0]?.shipping_profile_id || null,
      return_policy_id: returnPolicies[0]?.return_policy_id || null
    };

    const listing = await etsyService.createDraftListing(shopId, listingData);
    const listingId = listing.listing_id;

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

      // Upload the mockup image to the Etsy listing
      try {
        const imageBuffer = await driveService.downloadFileAsBuffer(fileId);
        await etsyService.uploadListingImage(shopId, listingId, imageBuffer, mockupFiles.length);
      } catch (error) {
        console.error(`Error uploading image ${fileId}:`, error);
        // Continue even if image upload fails
      }
    }

    // Generate PDF with download links
    const pdfBuffer = await PDFGeneratorService.generateDownloadPDF(mockupFiles, {
      title: title
    });

    // Upload PDF as digital file to Etsy listing
    await etsyService.uploadDigitalFile(
      shopId,
      listingId,
      pdfBuffer,
      'mockup-download-links.pdf'
    );

    // Save listing to database
    const insertResult = await pool.query(
      `INSERT INTO listings
        (user_id, etsy_listing_id, title, description, price, tags, mockup_files, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.session.userId,
        listingId,
        title,
        description,
        price,
        tags,
        JSON.stringify(mockupFiles),
        'draft'
      ]
    );

    const savedListing = insertResult.rows[0];

    res.json({
      success: true,
      listing: {
        id: savedListing.id,
        etsyListingId: listingId,
        title: savedListing.title,
        status: 'draft',
        url: `https://www.etsy.com/listing/${listingId}`
      },
      message: 'Listing created successfully as draft. You can now review and activate it on Etsy.'
    });
  } catch (error) {
    console.error('Error creating Etsy listing:', error);
    res.status(500).json({
      error: 'Failed to create Etsy listing',
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

const pool = require('../config/database');

/**
 * Get all templates for the authenticated user
 */
exports.getTemplates = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM templates WHERE user_id = $1 ORDER BY created_at DESC',
      [req.session.userId]
    );

    res.json({
      success: true,
      templates: result.rows
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      error: 'Failed to get templates',
      message: error.message
    });
  }
};

/**
 * Create a new template
 */
exports.createTemplate = async (req, res) => {
  try {
    const { name, content, type, isDefault } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    // If setting as default, unset other defaults of the same type
    if (isDefault) {
      await pool.query(
        'UPDATE templates SET is_default = false WHERE user_id = $1 AND type = $2',
        [req.session.userId, type || 'section']
      );
    }

    const result = await pool.query(
      `INSERT INTO templates (user_id, name, content, type, is_default)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.session.userId, name, content, type || 'section', isDefault || false]
    );

    res.json({
      success: true,
      template: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      error: 'Failed to create template',
      message: error.message
    });
  }
};

/**
 * Update a template
 */
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content, type, isDefault } = req.body;

    // Verify ownership
    const checkResult = await pool.query(
      'SELECT * FROM templates WHERE id = $1 AND user_id = $2',
      [id, req.session.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // If setting as default, unset other defaults of the same type
    if (isDefault) {
      await pool.query(
        'UPDATE templates SET is_default = false WHERE user_id = $1 AND type = $2 AND id != $3',
        [req.session.userId, type || checkResult.rows[0].type, id]
      );
    }

    const result = await pool.query(
      `UPDATE templates
       SET name = COALESCE($1, name),
           content = COALESCE($2, content),
           type = COALESCE($3, type),
           is_default = COALESCE($4, is_default),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [name, content, type, isDefault, id, req.session.userId]
    );

    res.json({
      success: true,
      template: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      error: 'Failed to update template',
      message: error.message
    });
  }
};

/**
 * Delete a template
 */
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM templates WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      error: 'Failed to delete template',
      message: error.message
    });
  }
};

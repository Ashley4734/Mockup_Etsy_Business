require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigration() {
  try {
    console.log('🔄 Running database migrations...');

    const schemaPath = path.join(__dirname, '../models/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schema);

    console.log('✅ Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');

class PDFGeneratorService {
  /**
   * Generate a PDF with Google Drive download links
   * @param {Array} mockupFiles - Array of mockup file objects with name and shareLink
   * @param {Object} listingInfo - Optional listing information to include
   * @returns {Buffer} PDF buffer
   */
  static async generateDownloadPDF(mockupFiles, listingInfo = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header
        doc.fontSize(24)
          .fillColor('#1a1a1a')
          .text('Your Digital Mockup Files', { align: 'center' });

        doc.moveDown(0.5);

        // Subtitle
        doc.fontSize(12)
          .fillColor('#666666')
          .text('Thank you for your purchase!', { align: 'center' });

        doc.moveDown(2);

        // Instructions
        doc.fontSize(14)
          .fillColor('#1a1a1a')
          .text('How to Download Your Files:', { underline: true });

        doc.moveDown(0.5);

        doc.fontSize(11)
          .fillColor('#333333')
          .text('1. Click on the link(s) below', { continued: false })
          .text('2. Sign in to your Google account if prompted', { continued: false })
          .text('3. Click the "Download" button in Google Drive', { continued: false })
          .text('4. Save the file(s) to your computer', { continued: false });

        doc.moveDown(2);

        // Download Links Section
        doc.fontSize(16)
          .fillColor('#1a1a1a')
          .text('Download Links', { underline: true });

        doc.moveDown(1);

        // Add each mockup file link
        mockupFiles.forEach((file, index) => {
          doc.fontSize(12)
            .fillColor('#1a1a1a')
            .text(`File ${index + 1}: ${file.name}`, { continued: false });

          doc.fontSize(10)
            .fillColor('#0066cc')
            .text(file.shareLink, {
              link: file.shareLink,
              underline: true,
              continued: false
            });

          doc.moveDown(1);
        });

        doc.moveDown(2);

        // Additional Information
        doc.fontSize(14)
          .fillColor('#1a1a1a')
          .text('Important Information', { underline: true });

        doc.moveDown(0.5);

        doc.fontSize(10)
          .fillColor('#333333')
          .text('• These links will remain active and you can download your files anytime', { continued: false })
          .text('• Save this PDF for future reference', { continued: false })
          .text('• If you have any issues accessing your files, please contact the shop owner', { continued: false });

        if (listingInfo.title) {
          doc.moveDown(1);
          doc.fontSize(10)
            .fillColor('#666666')
            .text(`Product: ${listingInfo.title}`, { continued: false });
        }

        doc.moveDown(2);

        // Footer
        doc.fontSize(9)
          .fillColor('#999999')
          .text('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', { align: 'center' });

        doc.fontSize(8)
          .fillColor('#999999')
          .text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate a simple text file with links (alternative to PDF)
   * @param {Array} mockupFiles - Array of mockup file objects
   * @returns {string} Text content
   */
  static generateDownloadText(mockupFiles) {
    let content = 'YOUR DIGITAL MOCKUP FILES\n';
    content += '='.repeat(50) + '\n\n';
    content += 'Thank you for your purchase!\n\n';
    content += 'Download Links:\n';
    content += '-'.repeat(50) + '\n\n';

    mockupFiles.forEach((file, index) => {
      content += `File ${index + 1}: ${file.name}\n`;
      content += `Link: ${file.shareLink}\n\n`;
    });

    content += '\n' + '='.repeat(50) + '\n';
    content += 'Save this file for future reference.\n';
    content += `Generated on ${new Date().toLocaleString()}\n`;

    return content;
  }
}

module.exports = PDFGeneratorService;

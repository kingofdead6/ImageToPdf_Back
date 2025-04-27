const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const multer = require('multer');
const { imageSize: sizeOf } = require('image-size');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/convert', upload.array('images'), async (req, res) => {
  try {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    const invalidFiles = req.files.filter(file => !validImageTypes.includes(file.mimetype));
    if (invalidFiles.length > 0) {
      return res.status(400).json({
        error: 'Invalid file type detected. Only JPEG, PNG, GIF, BMP, and WebP files are allowed.'
      });
    }

    const doc = new PDFDocument({ autoFirstPage: false });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${req.body.filename || 'output'}.pdf`
      });
      res.send(pdfData);
    });

    for (const file of req.files) {
      const { width: imgWidth, height: imgHeight } = sizeOf(file.buffer);
      
      doc.addPage({ size: 'A4' });

      const pageWidth = doc.page.width;   
      const pageHeight = doc.page.height; 
      const scale = pageWidth / imgWidth;
      const scaledHeight = imgHeight * scale;

      if (scaledHeight > pageHeight) {
        doc.image(file.buffer, 0, 0, {
          width: pageWidth,
          height: pageHeight / scale
        });
      } else {
        doc.image(file.buffer, 0, 0, { width: pageWidth });
      }
    }

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;

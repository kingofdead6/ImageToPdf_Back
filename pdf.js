const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const multer = require('multer');
const fs = require('fs');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/convert', upload.array('images'), (req, res) => {
  try {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=output.pdf'
      });
      res.send(pdfData);
    });

    req.files.forEach((file, index) => {
      if (index > 0) doc.addPage();
      doc.image(file.buffer, 0, 0, { width: doc.page.width });
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;
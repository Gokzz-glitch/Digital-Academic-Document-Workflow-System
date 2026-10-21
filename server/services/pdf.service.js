const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { generateVerificationQR } = require('./qr.service');
const { getStoragePath } = require('../config/storage');

exports.generateDocument = async (request, documentType, student, documentUid) => {
  return new Promise(async (resolve, reject) => {
    try {
      const fileName = `${documentUid}.pdf`;
      const docsDir = getStoragePath('uploads', 'documents');
      
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }

      const filePath = path.join(docsDir, fileName);
      const relativePath = `/uploads/documents/${fileName}`;
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('EASWARI ENGINEERING COLLEGE', { align: 'center' });
      doc.fontSize(12).text('(Autonomous)', { align: 'center' });
      doc.moveDown();
      doc.fontSize(18).text(documentType.name.toUpperCase(), { align: 'center', underline: true });
      doc.moveDown(2);

      // Document Info
      doc.fontSize(12).text(`Document ID: ${request.documentId}`);
      doc.text(`Date: ${new Date().toLocaleDateString()}`);
      doc.moveDown(2);

      // Body
      doc.fontSize(14).text('To Whomsoever It May Concern,', { align: 'left' });
      doc.moveDown();

      let bodyText = `This is to certify that ${student.name}, Roll Number ${student.rollNumber}, is a bonafide student of the ${student.department} department, year ${student.year}, section ${student.section}.`;
      
      // Add custom form data
      if (request.formData && request.formData.size > 0) {
         bodyText += '\n\nAdditional Details:';
         for (const [key, value] of request.formData.entries()) {
             bodyText += `\n${key}: ${value}`;
         }
      }

      doc.fontSize(12).text(bodyText, { align: 'justify', lineGap: 5 });
      doc.moveDown(3);

      // Footer Signatures
      doc.text('Authorized Signatory', { align: 'right' });
      doc.moveDown(4);

      // QR Code
      const qrDataUrl = await generateVerificationQR(documentUid);
      const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
      doc.image(qrBuffer, 50, doc.page.height - 150, { width: 100 });
      doc.fontSize(10).text('Scan to verify', 60, doc.page.height - 40);

      doc.end();

      stream.on('finish', () => {
        resolve({ filePath: relativePath, qrCodeData: qrDataUrl });
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

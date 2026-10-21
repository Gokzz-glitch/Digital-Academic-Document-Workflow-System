const QRCode = require('qrcode');

exports.generateQRCode = async (data) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(data);
    return qrDataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
};

exports.generateVerificationQR = async (documentUid) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify/${documentUid}`;
  return await this.generateQRCode(verificationUrl);
};

/* jshint esversion: 8 */
const QRCode = require('qrcode');

// Generates a QR code with text being data inside code
const generateQRCode = async text => {
  try {
    const codeUrl = await QRCode.toDataURL(text, { errorCorrectionLevel: 'L' });
    return codeUrl;
  } catch (e) {
    console.error('error generating qr code => ', e);
    return '';
  }
}; // END generateQRCode

module.exports = generateQRCode;
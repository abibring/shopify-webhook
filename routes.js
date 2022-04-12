/* jshint esversion: 8 */

// Dependencies
const express = require('express');
const transporter = require('./nodemailer.js');
const QRCode = require('qrcode');

// Express Router
const router = express.Router();

router.get('/', (req, res) =>  res.send('Welcome to the Webhooks API'));

// webhook endpoint for orders created
router.post('/order-created-webhook', async (req, res) => {
  try {
    // // Grab needed data from reqeest object
    const { body: payload } = req;
    const { email, id: orderId, customer, line_items } = payload;
    const { first_name, last_name } = customer;

    console.log('payload:', payload);
    // console.log('orderId:', orderId);
    // console.log('line_items', line_items);

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

    const to = 'test@test.com';
    const from = 'omniparkingwebhook@gmail.com';
    const text = 'Thank you for your order. Please use the barcode attached to enter the parking lot.';
    const subject = 'Omni Parking Order Confirmation';
    const cc = ['alon.bibring@gmail.com'];
    // const first_name = 'Alon';
    // const orderId = '12345';
    const url = await generateQRCode(`{id: ${orderId}, }`);
    const html =  `
      <b style='font-size:1.5rem;'>Parking Confirmation Details:</b>
      <p style='color:orange;font-size:1.2rem'>Hi ${first_name}, thank you for using Omni Parking.  To enter the parking lot, please use the QR code below.</p>
      <br />
      <img style='width: 90%;, height: 90%;object=fit:contain;' src='${url}'/>
    `;

    console.log('url generated for barcode:', url);


    // Email Configuration Options
    const mailData = { from, to, cc, subject, text, html };

    // send email to user 
    const info = await transporter.sendMail(mailData);

    // const webhook_id = req.headers['x-shopify-webhook-id'] || '';
    // const total_items = payload.line_items.length || 0;
    // const time = payload.created_at || '';
  
    // // save webhook info to database
    // const save_webhook = await req.db.collection('webhooks').insertOne({ webhook_id, total_items, time });

    // console.log('save_webhook:', save_webhook);
    res.status(201).send({ message: 'Webhook Event successfully logged' });
  } catch (e) {
    console.error('Error from webhook => error:', e);
    res.status(201).send({ message: 'Webhook Event failed' });
  }

});

// router.get('/fetch-webhooks-logs', async (req, res) => {
//   console.log(req.body);
//   const webhooks = await req.db
//   .collection('webhooks')
//   .find()
//   .toArray();
//   res.status(200).send(webhooks);
// });

module.exports = router;

/* jshint esversion: 8 */

// Dependencies
const express = require('express');
const transporter = require('../helpers/nodemailer');
const generateQRCode = require('./qrcode');

// Express Router
const router = express.Router();

router.get('/', (req, res) =>  res.send('Welcome to the Webhooks API'));

// webhook endpoint for orders created
router.post('/api', async (req, res) => { // order-created-webhook
  try {
    // Grab needed data from reqeest object
    const { body: payload, headers } = req;
    const { email: to, order_number, customer, line_items, created_at, total_line_items_price } = payload;
    const { first_name, last_name } = customer;
    const startAndEndTimes = line_items && line_items[0] && line_items[0].properties || []; // start and end times should be here

    // set headers
    // res.setHeader('Content-Type', 'text/html');
    // describes lifetime of our resource telling CDN to serve from cache and update in background (at most once per second)
   //  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');

    console.log('\n\npayload:', payload, '\n\n');
    console.log('\n\nlines_items[0].properties', startAndEndTimes, '\n\n');
    console.log('\n\ncustomeer:', customer, '\n\n')
    console.log('\n\order_number:', order_number, '\n\n');
    console.log('\n\nline_items', line_items, '\n\n');

    // generate barcode with order information
    const url = await generateQRCode(`{order_number: ${order_number}}`);

    // generate HTML markup for email
    const html =  `
      <b style="font-size:1.5rem;">Parking Confirmation Details:</b>
      <p style="color:blue;font-size:1.2rem">Hi ${first_name}, thank you for using Omni Parking.  To enter the parking lot, please use the QR code below.</p>
      <p><span style="font-weight:bold;">Total Amount:</span> $${total_line_items_price}</p>
      <br />< br/>
      <img style="width: 90%;, height: 90%;object=fit:contain;" src="${url}"/>
    `;

    const new_webhook_id = headers['x-shopify-webhook-id'] || ''; // grab webhook_id from headers
    const total_items = line_items.length || 0;
    const time = created_at || '';

    const saved_webhooks = await req.db.collection('webhooks').find({}).toArray(); // get all previous webhooks

    let webhookExists = false;

    // compare saved webhook_ids to new webhook_id
    if (saved_webhooks && saved_webhooks.length > 0) {
      for (let i = 0; i < saved_webhooks.length; i++) {
        const { webhook_id } = saved_webhooks[i];
        if (webhook_id === new_webhook_id) {
          webhookExists = true;
          break;
        }
      }
    }
  
    // If webhook_id does not already exist in db
    if (!webhookExists) {
      await req.db.collection('webhooks').insertOne({ webhook_id: new_webhook_id, total_items, time }); // save webhook
      // Establish variables for email
      const from = 'omniparkingwebhook@gmail.com'; // sender
      const text = 'Thank you for your order. Please use the barcode attached to enter the parking lot.'; // backup text if html fails
      const subject = 'Omni Parking Order Confirmation'; // email subject
      const cc = ['alon.bibring@gmail.com']; // cc emails
      const mailData = { from, to, cc, subject, text, html }; // Establish Email Configuration Options
      try {
        await transporter.sendMail(mailData); // send email to user using nodemailer
      } catch (e) {
        await transporter.sendMail(mailData); // send email to user using nodemailer
      }
    }

    res.status(201).send({ message: 'Webhook Event successfully logged' }); // send 201 response to Shopify
  } catch (e) {
    console.error('Error from webhook =>:', e);
    res.status(201).send({ message: 'Webhook Event failed' }); // send 201 response to Shopify
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

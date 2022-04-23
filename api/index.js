/*jshint esversion: 8 */

// // Dependencies
// const dotenv = require('dotenv');
// const express = require('express');
// const routes = require('./routes');
// const bodyParser = require('body-parser');
// const { startDatabase } = require('../database');
// const crypto = require('crypto');
// dotenv.config();
const transporter = require('../helpers/nodemailer');
const generateQRCode = require('../helpers/qrcode');


// // App
// const app = express();

// const shopifySecretKey = process.env.SHOPIFY_SECRET_KEY;

// app.use(bodyParser.json({
//         verify: (req, res, buf, encoding) => {
//             if (buf && buf.length) {
//                 req.rawBody = buf.toString(encoding || 'utf8');
//             }
//         },
//     })
// );


// // Set port
// const port = process.env.PORT || '1337';
// app.set('port', port);

// //Database Setup
// // const dbSetup = async (req, res, next) => {
// //     if (!req.db) { req.db = await startDatabase(); }
// //         // const db = await startDatabase();
// //         // req.db = await startDatabase(); // db; 
// //     next();
// // }; // END dbSetup

// // app.use(dbSetup);

// /*
// * Validates payload by comparing x-shopify-hmac-sha256 header value to secret
// */
// const validatePayload = (req, res, next) => {
//     try {
//         if (req.method === 'POST' && !req.rawBody) { return next('Request body empty'); }

//         const { rawBody: body } = req;
//         const hmacHeader = req.get('x-shopify-hmac-sha256');

//         //Create a hash based on the parsed body
//         const hash = crypto.createHmac('sha256', shopifySecretKey).update(body, 'utf8', 'hex').digest('base64');

//         // Compare the created hash with the value of the X-Shopify-Hmac-Sha256 Header
//         if (hash !== hmacHeader) {
//             return next(`Request body digest (${hash}) did not match ${sigHeaderName} (${hmacHeader})`);
//         } 
//     } catch (e) {
//         console.error('validatePayload => error:', e);
//         next('There was an error validating the payload to the webhook.');
//     }

//     return next();
// }; // END validatePayload

// app.use(validatePayload);
// app.use('/', routes);

// // Server
// app.listen(port, () => console.log(`Server running on localhost: ${port}`));

module.exports = async (req, res) => {
    try {
        // Grab needed data from reqeest object
        const { body: payload, headers } = req;
        const { email: to, order_number, customer, line_items, created_at, total_line_items_price } = payload;
        const { first_name, last_name } = customer;
        const startAndEndTimes = line_items && line_items[0] && line_items[0].properties || []; // start and end times should be here
    
        // set headers
        res.setHeader('Content-Type', 'text/html');
        // describes lifetime of our resource telling CDN to serve from cache and update in background (at most once per second)
        res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    
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
    
        // const saved_webhooks = await req.db.collection('webhooks').find({}).toArray(); // get all previous webhooks
    
        // let webhookExists = false;
    
        // // compare saved webhook_ids to new webhook_id
        // if (saved_webhooks && saved_webhooks.length > 0) {
        //   for (let i = 0; i < saved_webhooks.length; i++) {
        //     const { webhook_id } = saved_webhooks[i];
        //     if (webhook_id === new_webhook_id) {
        //       webhookExists = true;
        //       break;
        //     }
        //   }
        // }
      
        // If webhook_id does not already exist in db
        // if (!webhookExists) {
        //   await req.db.collection('webhooks').insertOne({ webhook_id: new_webhook_id, total_items, time }); // save webhook
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
        // }
    
        res.status(201).send({ message: 'Webhook Event successfully logged' }); // send 201 response to Shopify
      } catch (e) {
        console.error('Error from webhook =>:', e);
        res.status(201).send({ message: 'Webhook Event failed' }); // send 201 response to Shopify
      }
};

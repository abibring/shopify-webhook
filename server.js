/*jshint esversion: 8 */

// Dependencies
const dotenv = require('dotenv');
const express = require('express');
const routes = require('./routes');
const bodyParser = require('body-parser');
const { startDatabase } = require('./database');
const crypto = require('crypto');
dotenv.config();

// App
const app = express();

const shopifySecretKey = process.env.SHOPIFY_SECRET_KEY;

app.use(bodyParser.json({
        verify: (req, res, buf, encoding) => {
            if (buf && buf.length) {
                req.rawBody = buf.toString(encoding || 'utf8');
            }
        },
    })
);


// Set port
const port = process.env.PORT || '1337';
app.set('port', port);

//Database Setup
const dbSetup = async (req, res, next) => {
    if (!req.db) { req.db = await startDatabase(); }
        // const db = await startDatabase();
        // req.db = await startDatabase(); // db; 
    next();
}; // END dbSetup

app.use(dbSetup);

/*
* Validates payload by comparing x-shopify-hmac-sha256 header value to secret
*/
const validatePayload = (req, res, next) => {
    try {
        if (req.method === 'POST' && !req.rawBody) { return next('Request body empty'); }

        const { rawBody: body } = req;
        const hmacHeader = req.get('x-shopify-hmac-sha256');

        //Create a hash based on the parsed body
        const hash = crypto.createHmac('sha256', shopifySecretKey).update(body, 'utf8', 'hex').digest('base64');

        // Compare the created hash with the value of the X-Shopify-Hmac-Sha256 Header
        if (hash !== hmacHeader) {
            return next(`Request body digest (${hash}) did not match ${sigHeaderName} (${hmacHeader})`);
        } 
    } catch (e) {
        console.error('validatePayload => error:', e);
        next('There was an error validating the payload to the webhook.');
    }

    return next();
}; // END validatePayload

app.use(validatePayload);
app.use('/', routes);

// Server
app.listen(port, () => console.log(`Server running on localhost: ${port}`));

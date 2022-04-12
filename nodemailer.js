/*jshint esversion: 8 */
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  port: 465,
  host: 'smtp.gmail.com',
  auth: {
    user: 'omniparkingwebhook@gmail.com',
    pass: 'Password432!'
  },
  secure: true
});

module.exports = transporter;


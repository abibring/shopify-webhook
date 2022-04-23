/*jshint esversion: 8 */
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
dotenv.config();

const transporter = nodemailer.createTransport({
  port: 465,
  host: 'smtp.gmail.com',
  auth: {
    user: 'omniparkingwebhook@gmail.com',
    pass: process.env.GMAIL_PASSWORD
  },
  secure: true
});

module.exports = transporter;


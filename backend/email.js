// Import necessary modules
const express = require('express');
const nodemailer = require('nodemailer');
const app = express.Router();
const bodyParser = require('body-parser'); // Import body-parser
const cors = require('cors'); // Import the cors package

app.use(cors());
app.use(bodyParser.json()); // Add this line to parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Add this line to parse URL-encoded bodies



// Create an Express app

// Define a POST endpoint to send confirmation emails
app.post('/send-email', (req, res) => {
  
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'ospisbooking@gmail.com',
          pass: 'dooh kaqb zsrl zmgi'
        },
        tls: {
          rejectUnauthorized: false // Add this line to disable SSL verification
        }
      });
    const mailOptions = {
      from: "OspisBooking@gmail.com",
      to: req.body.email,
      subject: req.body.subject,
      html: req.body.html,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Failed to send email');
      } else {
        console.log('Email sent:', info.response);
        res.status(200).send('Email sent successfully');
      }
    });
  });

module.exports = app;
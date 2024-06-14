const express = require('express');
require('dotenv').config();
const cors = require('cors');

const multer = require('multer');
const axios = require('axios');

const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

const path = require('path');
const fs = require('fs');

// Route path
const userRouter = require('./routes/users');
const clientRouter = require('./routes/client_profile');
const groupsRouter = require('./routes/my_groups');
const contactRouter = require('./routes/contacts');
const sentMessagesRouter = require('./routes/sent_messages');
const topUpRouter = require('./routes/topUp');
const contactGroupsRouter = require('./routes/contact_groups');
const registrationRouter = require('./routes/self_registration');
const mailerRouter = require('./routes/mailer');

const app = express();
app.use(express.json());
app.use(cors());


//App Route Usage
app.use('/users', userRouter);
app.use('/clients', clientRouter);
app.use('/groups', groupsRouter);
app.use('/contacts', contactRouter);
app.use('/sentmessages', sentMessagesRouter);
app.use('/topUp', topUpRouter);
app.use('/contactgroups', contactGroupsRouter);
app.use('/selftregistration', registrationRouter);
app.use('/mailer', mailerRouter);
  
//SMS ENDPOINT
app.get('/client/api/sendmessage/', async (req, res) => {
  try {
    const apikey = req.query.apikey;
    const mobiles = req.query.mobiles;
    const sms = req.query.sms;
    const senderid = req.query.senderid;

    const originalUrl = `http://sms.vas.co.zw/client/api/sendmessage?apikey=${apikey}&mobiles=${mobiles}&sms=${sms}&senderid=${senderid}`;

    // Make a request to the original URL
    const response = await axios.get(originalUrl);

    // Send the response from the original URL
    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

//FILE UPLOADS
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = function (req, file, cb) {
  cb(null, true); // Allow all file types
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

app.post('/upload', upload.single('pdfFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const uploadedFilename = req.file.filename;
  console.log('File uploaded:', uploadedFilename);

  res.status(200).send(`File uploaded successfully. Filename: ${uploadedFilename}`);
});
// Set up a route for file retrieval
app.get('/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found.');
  }

  // Stream the file as the response
  res.sendFile(filePath);
});


// Call the function to send the email and append it to the "Sent" folder
app.get('/sendemail', (req, res) => {
  res.send(sendEmailAndAppend());
});


// Send message
app.post('/sendSMS', (req, res) => {
  const { dest_phone, msgbody} = req.body;

  const originalUrl = `http://196.43.100.209:8901/teleoss/sendsms.jsp?user=Softwork&password=Soft@012&mobiles=${dest_phone}&sms=${msgbody}&unicode=1&clientsmsid=10001&senderid=Softwork`;

  axios.get(originalUrl)
    .then(() => {
      res.status(200).json({ status: 'success', message: 'SMS sent successfully' });
    })
    .catch((error) => {
      res.status(500).json({ error: error.message });
    });
});

app.listen(process.env.APPPORT || '3003', () => {
  console.log('app is listening to port' + process.env.APPPORT);
});
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const email = require('./email');


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());
app.use(cors());
app.use(email);


// Create MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'dali',
  database: 'idp',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database: ' + err.stack);
    return;
  }
  console.log(`Connected to MySQL database as id ` + connection.threadId);
});

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.body.token || req.query.token || req.headers['x-access-token'];
  if (!token) {
    return res.status(403).json({ error: 'Token is required' });
  }

  jwt.verify(token, 'secret', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Failed to authenticate token' });
    }
    req.decoded = decoded;
    next();
  });
}

const otplib = require('otplib');
const qrcode = require('qrcode');

// Store TOTP secrets (use a database in production)
let userSecrets = {};

app.get('/api/generate-2fa/:email', (req, res) => {
  const email = req.params.email;
  if (!userSecrets[email]) {
    userSecrets[email] = otplib.authenticator.generateSecret();
  }

  const secret = userSecrets[email];
  const otpauthUrl = otplib.authenticator.keyuri(email, 'MyApp', secret);

  qrcode.toDataURL(otpauthUrl, (err, imageUrl) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to generate QR code' });
    }
    res.json({ imageUrl, secret });
  });
});
app.post('/api/register/verify-2fa', (req, res) => {
  const { email, otp } = req.body;
  const secret = userSecrets[email]; // Retrieve the TOTP secret for the user
  console.log(secret, email, otp)
  if (!secret) {
    return res.status(400).json({ error: '2FA not set up for this user' });
  }

  const isValid = otplib.authenticator.verify({ token: otp, secret });

  if (isValid) {
    res.status(200).json({ message: '2FA verification successful' });
  } else {
    res.status(401).json({ error: 'Invalid OTP' });
  }
});
app.post('/api/verify-2fa', (req, res) => {
  const { email, otp } = req.body;
  
  connection.query('SELECT secretkey FROM idp.users WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const secret = results[0].secretkey; // Retrieve the secret from the database
    const isValid = otplib.authenticator.verify({ token: otp, secret });

    if (isValid) {
      res.status(200).json({ message: '2FA verification successful' });
    } else {
      res.status(401).json({ error: 'Invalid OTP' });
    }
  });
});





// Route to verify token
app.post('/api/verifyToken', (req, res) => {
  res.status(200).json({ user: req.decoded });
});

// Serve Angular app index.html
app.get('/', (req, res) => {
  res.sendFile(path.resolve('D:/Desktop/Cybersecurity/IDP NEW/src/index.html'));
});


// User login route
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log(`Received email: ${email}, password: ${password}`); // Add logging to check the values
  

  // Validate user credentials
  connection.query('SELECT * FROM idp.users WHERE email = ?', [email], (error, results) => {
    if (error) {
      console.log("0", error)
      return res.status(500).json({ error: 'Failed to authenticate user' });
    }
    if (results.length === 0) {
      console.log("1")
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare hashed password with the stored one

      // Generate a JWT token if passwords match
      const token = jwt.sign({ email: results[0].email }, 'secret', { expiresIn: '1h' });
      res.status(200).json({ token, user: results[0] });

  });
});

// Route to create a new user
app.post('/api/users', (req, res) => {
  const newUser = req.body; // Get user data from request body
  console.log(newUser)

  // Check if email already exists
  connection.query('SELECT * FROM idp.users WHERE email = ?', newUser.email, (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: 'Email already in use' }); // Return error if email already exists
    }

    // Hash the password before saving it to the database


   //   newUser.password = hashedPassword; // Replace plain password with hashed password
      connection.query('INSERT INTO idp.users SET ?', newUser, (error, results) => {
        if (error) {
          return res.status(500).json({ error: 'Failed to create user' });
        }

        // Generate JWT token after user creation
        const token = jwt.sign({ email: newUser.email }, 'secret', { expiresIn: '1h' });


        res.status(201).json({ message: 'User created successfully', userId: results.insertId, token });
      });
 
  });
});


// Update user data by ID
app.put('/api/users/email/:email', (req, res) => {
  const userId = req.params.email;
  const updatedUserData = req.body;
  
  connection.query('UPDATE idp.users SET ? WHERE email = ?', [updatedUserData, userId], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to update user' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully' });
  });
});
// Update user data by ID
app.put('/api/users/:id', verifyToken, (req, res) => {
  const userId = req.params.id;
  const updatedUserData = req.body;

  connection.query('UPDATE idp.users SET ? WHERE id = ?', [updatedUserData, userId], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to update user' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully' });
  });
});

// Route to retrieve a specific user by email (public access, no token required)
app.get('/api/users/:email', (req, res) => {
  const useremail = req.params.email;

  connection.query('SELECT * FROM idp.users WHERE email = ?', [useremail], (error, results) => {
    if (error) {
      console.error(`Error retrieving user: ${error.message}`);
      return res.status(500).json({ error: 'Failed to retrieve user' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(results[0]);
  });
});

// Route to retrieve a specific user by ID
app.get('/api/users/:id', verifyToken, (req, res) => {
  const userId = req.params.id;

  connection.query('SELECT * FROM idp.users WHERE id = ?', [userId], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to retrieve user' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(results[0]);
  });
});




// Delete a user by ID
app.delete('/api/users/:id', verifyToken, (req, res) => {
  const userId = req.params.id;

  connection.query('DELETE FROM idp.users WHERE id = ?', [userId], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
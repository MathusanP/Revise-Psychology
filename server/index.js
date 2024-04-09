require('dotenv').config({ path: 'secrets.env' });

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

const mailUser = process.env.MAIL_USER
const mailPass = process.env.MAIL_PASSWORD

const session_key = process.env.SESSION_KEY

// Client side required modules
const express = require('express');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet')

// Validation and sanitization modules
const validator = require('validator');
const bcrypt = require('bcrypt');

// MySQL server required modules
const fs = require('fs');
const mysql = require('mysql2');

// Email verificaiton required modules:
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const crypto = require('crypto');
const secret_key = crypto.randomBytes(32).toString('hex');
const path = require('path');

// Setting up MySQL connection:
const config = {
  user: dbUser,
  password: dbPassword,
  host: dbHost,
  port: "21152",
  database: "defaultdb",
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('ca.pem').toString(),
  },
};

// Using mysql2 to configure a connection:
const connection = mysql.createConnection(config);

// Test connection
connection.connect(function (err) {
  if (err) {
    console.log(`There was an error: ${err.stack}`)
    return;
  }
  console.log(`Connected as: ${connection.threadId}`);
});

//Setting up Express
const app = express();
const port = 3000;

app.use(cors())
app.use(bodyParser.json());

app.use((req, res, next) => {
  // Allow scripts only from the same origin
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});
// Initializing sessions:
app.use(cookieSession({
  name: 'session',
  secret: session_key,
  maxAge: 24 * 60 * 60 * 1000
}));

// Define route handler for POST requests to '/userData'
app.post('/userData', (req, res) => {
  const userData = req.body;
  console.log(userData);

  // Sanitization process

  // Object destructuring: 
  const { nickname, signupEmail, passwordValue } = userData;

  //Escaping to remove <> & / and more entities with html ones:
  const sanitizedNickname = validator.escape(nickname);
  const sanitizedSignupEmail = validator.escape(signupEmail);
  const sanitizedPasswordValue = validator.escape(passwordValue);

  // Bcrypt hashing algorithm

  // Defining how many cycles the algorithm should run.
  const saltRounds = 10;

  // Hashing method
  bcrypt.hash(sanitizedPasswordValue, saltRounds, function (err, hash) {
    console.log(`User's hashed password is: ${hash}`);

    // Checking if the email already exists.
    connection.query(`SELECT * FROM users WHERE email = '${sanitizedSignupEmail}'`, function (error, results) {
      if (error) throw error;
      console.log(results);
      // If the email does not exist:
      if (results.length === 0) {
        // Generating a random string for our JWT
        const verificationToken = crypto.randomBytes(20).toString('hex');

        // Signing the token for verification using JWT
        const token = jwt.sign({ email: sanitizedSignupEmail, verificationToken }, secret_key, { expiresIn: '1h' });

        // Inserting user details onto database:
        connection.query(`INSERT INTO users (email, nickname, hashed_password, isVerified) VALUES (?, ?, ?, FALSE);`, [sanitizedSignupEmail, sanitizedNickname, hash], function (error, results) {
          if (error) {
            console.error('Error inserting data: ', error);
            res.status(500).send('Error registering new user.');
          }
          sendVerificationEmail(sanitizedSignupEmail, token, res);
        });

      } else {
        res.json({ message: 'This email already exists, please try logging in.' });
      }
    });
  });
});

// Route handling user's login data:
app.post('/loginData', (req, res) => {
  const loginData = req.body;
  console.log(loginData);

  const { loginPassword, loginEmail } = loginData

  // Input Sanitization
  const sanitizedLoginEmail = validator.escape(loginEmail);
  const sanitizedLoginPassword = validator.escape(loginPassword);

  // Email verification - Authentication
  connection.query(' SELECT email, nickname, hashed_password FROM users WHERE email = ? AND isVerified = TRUE', [sanitizedLoginEmail], function (error, results) {
    if (error) throw error;

    // If nothing comes up:
    if (results.length === 0) {
      res.json({ message: "Email is not recognised." })
    } else {
      // Fetching user details:
      const email = results[0].email
      const hashedPassword = results[0].hashed_password
      const nickname = results[0].nickname

      console.log(`Checking: ${hashedPassword}`);
      // Checking if passwords match:
      var isMatch = bcrypt.compareSync(sanitizedLoginPassword, hashedPassword);
      if (isMatch) {
        // Test console log:
        console.log('Login Succesful!')
        req.session.user = { id: email, username: nickname };
        res.status(200).json({ message: 'Login successful' });
      } else {
        res.json({ message: "Invalid email password combination." })
        console.log('Wrong Password')
      }
    }
  }
  )
})


// Route protection
const redirectLogin = (req, res, next) => {
  // If user is undefined...
  if (!req.session) {
    console.log('Session Expired.')
    return res.status(401).json({ message: 'Unauthorized' });
  } else {
    next();
  }
};


app.get('/main', redirectLogin, (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '../src', 'main.html'));
  } catch (error) {
    console.error('Error sending file:', error);
    res.status(500).send('Internal Server Error');
  }
});



app.get('/verify-email', (req, res) => {
  const token = req.query.token;

  console.log('Query parameters:', req.query);
  console.log('Token:', token);

  const user = verifyATokenAndGetUser(token, secret_key);

  if (user) {
    connection.query(`UPDATE users SET isVerified = TRUE WHERE email = ?`, [user.email], (error, results) => {
      if (error) {
        console.log('Error Updating the user:', error)
        res.status(500).send('Error updating the user');
      } else {
        res.send('Email verified successfully!');
      }
    });
  } else {
    res.status(400).send(`Invalid or expired link: ${token}`);
  }
});

// Sending verification email

function sendVerificationEmail(email, token, res) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: mailUser,
      pass: mailPass
    }
  });


  const verificationLink = `http://localhost:3000/verify-email?token=${encodeURIComponent(token)}`;
  console.log(token)
  const mailOptions = {
    from: mailUser,
    to: email,
    subject: 'Verify your email!',
    html: `<p> Please click on the following link to verifiy your Revise Psychology email: <a href=${verificationLink}> Verify here! </a></p`
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log('Error sending email', error);
      res.status(500).send('Error sending email');
      return;
    }

    console.log('Email sent:', info.response);
    res.json({ message: 'User registered successfully, Verification email has been sent.' });
  });
}

function verifyATokenAndGetUser(token, secretKey) {
  try {
    const decoded = jwt.verify(token, secretKey);

    // Getting user information:
    const { userId, email } = decoded;

    //return user information
    return { userId, email };

  } catch (error) {
    console.log('Error verifying token:', error.message);
    return null;
  }
}


// To ensure express server is running.
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});



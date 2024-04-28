require('dotenv').config({ path: 'secrets.env' });

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

const mailUser = process.env.MAIL_USER
const mailPass = process.env.MAIL_PASS

const session_key = process.env.SESSION_KEY

const gptapi_key = process.env.OPENAI_KEY
const organisationID = process.env.ORG_ID
const projectID = process.env.PROJECT_ID

// Client side required modules
const express = require('express');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const cors = require('cors');


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

// Chatgpt required modules:
const OpenAI = require("openai");

// Making a new open ai model configuration:
const openai = new OpenAI({
  organization: organisationID,
  project: projectID,
  apiKey: gptapi_key
})

// required for session page:
const ejs = require('ejs');

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
const pool = mysql.createPool(config);
module.exports = pool;


//Setting up Express
const app = express();
const port = 3000;

const corsOptions = {
  origin: 'http://127.0.0.1:5500',
  credentials: true
}

app.use(cors(corsOptions))
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

app.set('view engine', 'ejs');

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
    pool.query(`SELECT * FROM users WHERE email = '${sanitizedSignupEmail}'`, function (error, results) {
      if (error) throw error;
      console.log(results);
      // If the email does not exist:
      if (results.length === 0) {
        // Generating a random string for our JWT
        const verificationToken = crypto.randomBytes(20).toString('hex');

        // Signing the token for verification using JWT
        const token = jwt.sign({ email: sanitizedSignupEmail, verificationToken }, secret_key, { expiresIn: '1h' });

        // Inserting user details onto database:
        pool.query(`INSERT INTO users (email, nickname, hashed_password, isVerified) VALUES (?, ?, ?, FALSE);`, [sanitizedSignupEmail, sanitizedNickname, hash], function (error, results) {
          if (error) {
            console.error('Error inserting data: ', error);
            res.status(500).send('Error registering new user.');
          }
          sendVerificationEmail(sanitizedSignupEmail, token, res);

          pool.query(`INSERT INTO statistic (email, \`Social Influence\`, \`Biopsychology\`, \`Attachment\`, \`total\`, \`Ai\`) VALUES (?, 0, 0, 0, 0, 0);`, [sanitizedSignupEmail], function (error, results) {
            if (error) {
              console.error('Error inserting data onto the statistics table', error);
              res.status(500).send('Error registering new user.');
            }
          });
          
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
  pool.query(' SELECT email, nickname, hashed_password FROM users WHERE email = ? AND isVerified = TRUE', [sanitizedLoginEmail], function (error, results) {
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
        // Signal to client side to redirect:
        console.log({ username: nickname, userId: email })
        res.status(200).json({ message: 'Login successful', email: email, nickname: nickname });
      } else {
        res.json({ message: "Invalid email password combination." })
        console.log('Wrong Password')
      }
    }
  }
  )
})

app.get('/verify-email', (req, res) => {
  const token = req.query.token;

  console.log('Query parameters:', req.query);
  console.log('Token:', token);

  const user = verifyATokenAndGetUser(token, secret_key);

  if (user) {
    pool.query(`UPDATE users SET isVerified = TRUE WHERE email = ?`, [user.email], (error, results) => {
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
    html: `<p> Please click on the following link to verifiy your Revise Psychology email: <a href=${verificationLink}> Verify here! </a></p>`
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

// Fetching user's requested topic.
app.post('/sessionData', (req, res) => {
  const selected_topic = req.body

  // Destructuring the object:
  const { topic } = selected_topic
  console.log(topic)


  // Fetching all the question ids based on the user's chosen topic:
  pool.query(`SELECT question_id FROM question_bank WHERE question_topic = ?`, [topic], (error, results) => {
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Log the mapped array:
    const question_list = results.map(row => row.question_id);

    // If no questions are found
    if (question_list.length === 0) {
      return res.status(404).json({ error: 'No questions found for the specified topic' });
    }

    // Fetching a random position from the array:
    const index = Math.floor(Math.random() * question_list.length);
    // Returning the question that gets selected form the random index:
    const question = question_list[index]

    // Fetching the question using the index:

    pool.query(`SELECT question_id,question_topic, question_text, option_a, option_b, option_c, option_d FROM question_bank WHERE question_id = ?`, [question], (error, results) => {
      if (error) {
        console.log('Database error:'. error);
        return res.status(500).json({ error: 'Internal server error'});
      }

      // Handle incase there are no results:

      if (results.length === 0) {
        return res.status(404).json({ error: 'Question not found '});
      }

      // Extracting the values:

      const questionData = results[0];

      // Inserting response values into a JSON:
      const responseData  = {
        topic: questionData.question_topic,
        question_id: questionData.question_id,
        question_text: questionData.question_text,
        option_a: questionData.option_a,
        option_b: questionData.option_b,
        option_c: questionData.option_c,
        option_d: questionData.option_d,
      };

      // Test log:
      console.log(responseData)
      res.json(responseData);

    })
  })
})

// Correction route:
app.post('/submitAnswer', (req, res) => {
  const userAnswer = req.body

  console.log(userAnswer);

  // Fetching user selected answer:
  const { selectedOption } = userAnswer;
  const { questionId } = userAnswer;
  const { email } = userAnswer;

  console.log(questionId)
  // Test log
  console.log(selectedOption)

  // Finding the correct answer from the database:
  pool.query(`SELECT correct_answer, question_topic, reason FROM question_bank WHERE question_id = ?`, [questionId], (error, results) => {
    if (error) {
      console.error('Database error', error);
      return res.status(500).json({ error: 'Internal server error. '});
    }

    // If no answer is found:
    if (results.length === 0) {
      console.log('No answer found.');
      return res.status(404).json({ error: 'An answer could not be found.'})
    }

    // If an answer is found:
    const correction = results[0];
    const incrementTopic = correction.question_topic
    console.log(incrementTopic)
    
    // If the user's answer is correct:
    if (selectedOption.trim().toLowerCase() === correction.correct_answer.trim().toLowerCase()) {
      console.log('The answer is correct!')
      const marking = {
        isCorrect: true,
        correctAnswer: selectedOption,
      }
      // Updating user statistics:
      pool.query(`UPDATE statistic SET total = total + 1 where email = ?`, [email], (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return;
        }
        console.log('Update successful:', results);
      });

      
      // Adding a correct answer to a topic
      pool.query(`UPDATE statistic SET \`${incrementTopic}\` = \`${incrementTopic}\` + 1 WHERE email = ?`, [email], (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return;
        }
        console.log('Update successful:', results);
      });

      res.json(marking);
    } else {
      // If the user's answer is incorrect:
      pool.query(`UPDATE statistic SET total = total + 1 where email = ?`, [email], (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return;
        }
        console.log('Update successful:', results);
      });
      console.log(`User answered ${selectedOption} but the actual answer was ${correction.correct_answer} because ${correction.reason}`)
      const marking = {
        isCorrect: false,
        userAnswer: selectedOption,
        correctAnswer: correction.correct_answer,
        reason: correction.reason
      }
      
      console.log(marking);
      res.json(marking);
    }
  })
})

app.post('/statistics', (req, res) => {
const requestedUser = req.body;

const { email } = requestedUser;

pool.query(`SELECT * FROM statistic WHERE email = ?`, [email], (error, results) => {
  if (error) {
    console.error('Database error:', error);
    return;
  }
  console.log(`Fetching ${email}'s statistics...`)

  const stats = results[0]
  const userStatistics = {
    socialInfluence: stats[`Social Influence`],
    biopsychology: stats.Biopsychology,
    attachment: stats.Attachment,
    totalAnswered: stats.total
  }

  console.log(userStatistics)
  res.json(userStatistics);

})

})

// Ai based questioning:
app.post('/ai', async (req, res) => {
  try {
  const requestedUser = req.body;

  const { email } = requestedUser;

  // Question prompt to give to the ai
  const question_prompt = "Referring to AQA British A Level Pyschology, write an Exam styled question for any topic, and try to model the question like an actual AQA exam question. Please append the text with the amount of marks this question is worth. Avoid 12 markers and 16 markers.";


  // Creating a new GPT chat:
  const chat_completion = await openai.chat.completions.create({
    messages: [{role: 'user', content: `${question_prompt}`}],
    model: `gpt-4-0125-preview`,
  })

  
  const reply =  chat_completion.choices[0].message

  console.log(reply)
  res.json(reply)


} catch(error) {
  console.log("Error fetching chat completion:", error);
  res.status(500).send("An error occured with the connection to open ai services.")
}})

app.post('/markAnswer', async (req, res) => {
  // Retrieving submission from user
  const question_content = req.body;

  // Destructuring the submission:
  const { email } = question_content;
  const { userAnswer } = question_content;
  const { question } = question_content;
    
  console.log(question_content);
  
  // Updating user statistics
  pool.query(`UPDATE statistic SET total = total + 1 where email = ?`, [email], (error, results) => {
      if (error) {
        console.error('Database error:', error);
        return;
      }
      console.log('Update successful:', results);
    });

  try {
    
    const markingPrompt = `You are an A level AQA Psychology examiner, a user has submitted their answer to this question: ${question}, here is the user answer ${userAnswer}. You are to strictly follow the following instructions. If the user's answer can be accepted ONLY reply with a 1, if it's incorrect ONLY reply with a 0`

    // Asking chatgpt to mark the question:
    const chat_completion = await openai.chat.completions.create({
      messages: [{role: 'user', content: `${markingPrompt}`}],
      model: `gpt-4-0125-preview`,
    })

    // Fetching the response:
    const response = chat_completion.choices[0].message
    const mark = response.content;
    console.log(mark);

    // If the question is correct.
    if(mark == "1") {
    res.json(`1`);
    }
    

    // 0 is if its incorrect.
    else if(mark == "0") {
      
      const feedbackprompt = `You are an A level AQA Psychology examiner, explain how this answer: ${userAnswer} can be improved for this question: ${question}`
      
      const chat_completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: `${feedbackprompt}`}],
        model: `gpt-4-0125-preview`,
      })

      // Sending feedback back to the user:
      const response = chat_completion.choices[0].message
      const feedback = response.content;
      console.log(feedback);

      res.json(feedback)
    }
  } catch(error) {  
    console.log("Error fetching chat completion:", error);
    res.status(500).send("An error occured with the connection to openai services.")
  }
})



// To ensure express server is running.
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});



import express from 'express';
import cors from 'cors';
import { db } from './config/db.js';
import jwt from 'jsonwebtoken';
import bodyParser  from 'body-parser';
import helmet from 'helmet';

import auth from './middleware/auth.js';


const app = express();

// Use Helmet to secure headers
app.use(helmet());

app.use(cors());
app.use(bodyParser.json());
const secretKey = '7828199257';

app.use('/auth', auth);

// router.get('/', auth, usersController.getAllUsers);
// router.get('/:id', auth, usersController.getUserById);
// router.post('/', auth, usersController.createUser);
// router.put('/:id', auth, usersController.updateUser);
// router.delete('/:id', auth, usersController.deleteUser);


app.post('/register', async (req, res) => {
  //const { book_name, isbn_code, book_author, book_title } = req.body;
try {
    const result = await db('book_user').insert({
      name: 'John Doe',
      email: 'johndoe@demo.com',
      password: 'securepassword123',
      created_at: new Date()
    }).returning('*');
    res.json({ result });
    console.log('Inserted user:', result);
  } catch (err) {
    console.error('Error inserting user:', err);
  }


});


app.post('/login', (req, res) => {
//  const { username, password } = req.body;
  // In a real application, you would verify the username and password
  db.select('*').where('email','johndoe@demo.com').where('password','securepassword123').from('book_user')
  .then(data => {
    console.log(" Login user data",data[0].email)
  if (data[0].email === 'johndoe@demo.com' && data[0].password === 'securepassword123') {
    // Generate a JWT token
    const token = jwt.sign({ email: data[0].email }, secretKey, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
})
})

const PORT = 3000;

let userRoute = express.Router();
let itemRoute = express.Router();

app.use('/user', userRoute);
app.use('/item', itemRoute);

userRoute.get("/about/:id", (req, res) => {
    res.send('User route',req.params.id);
});


app.get('/', (req, res) => {
    db.select('*').where('book_title','Don Quixote').from('book')
  .then(data => console.log(" Get all books based on title",data))
  .catch(err => console.error(err));
    console.log("req",req);
  res.send('Hello, World!');
});

// GET reviews for a specific book_id
app.get("/reviews/:bookId", async (req, res) => {
  const { bookId } = req.params;
  //write code tpo get comment from table book_review based on bookId and join table book and book_user to get book title and user name
  try {
    const reviews = await db('book_review')
      .join('book', 'book_review.book_id', 'book.id')
      .join('book_user', 'book_review.user_id', 'book_user.id')
      .select('book_review.id', 'book.book_title', 'book_user.name as user_name', 'book_review.comment', 'book_review.created_at')
      .where('book_review.book_id', bookId)
      
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/abc', (req, res) => {
  res.send('Hello, ABC!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

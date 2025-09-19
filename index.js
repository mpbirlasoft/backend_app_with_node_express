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



app.post('/book_review', async (req, res) => {
  const { book_id, user_id, comment } = req.body;
try {
    const result = await db('book_review').insert({
      book_id, user_id, comment,
      created_at: new Date()
    }).returning('*');
    res.json({ result });
    console.log('Inserted user:', result);
  } catch (err) {
    console.error('Error inserting user:', err);
  }

});

app.get('/getReview/:id', (req, res) => {
    db.select('*').where('book_id',req.book_id).from('book_review')
  .then(data => console.log(" Get all books based on title",data))
  .catch(err => console.error(err));
    console.log("req",req);
  res.send('Hello, World!');
});

// app.get('/getBooks', async(req, res) => {
//     try {
//     const reviews = await db('book')
//       .join('book', 'book_review.book_id', 'book.id')
//       .join('book_user', 'book_review.user_id', 'book_user.id')
//       .select('book_review.id', 'book.book_title', 'book_user.name as user_name', 'book_review.comment', 'book_review.created_at')
//       .where('book_review.book_id', bookId)
      
//     res.json(reviews);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

app.get('/books-with-reviews', async (req, res) => {
  try {
    const result = await db.raw(`
      SELECT 
        b.id AS book_id,
        b.book_title,
        b.isbn_code,
        b.book_author,
        br.id AS review_id,
        br.book_id,
        br.comment,
        br.user_id,
        br.created_at,
        br.updated_at
      FROM book b
      LEFT JOIN book_review br ON b.id = br.book_id
    `);

    const rows = result.rows;
    const booksMap = {};

    rows.forEach(row => {
      if (!booksMap[row.book_id]) {
        booksMap[row.book_id] = {
          id: row.book_id,
          book_title: row.book_title,
          isbn_code: row.isbn_code,
          book_author: row.book_author,
          review: []
        };
      }

      if (row.review_id) {
        booksMap[row.book_id].review.push({
          id: row.review_id,
          book_id: row.book_id,
          comment: row.comment,
          user_id: row.user_id,
          created_at: row.created_at,
          updated_at: row.updated_at
        });
      }
    });

    res.json(Object.values(booksMap));
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Internal Server Error');
  }
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

// Edit review
app.put('edit_review/:id', async (req, res) => {
  const reviewId = req.params.id;
  const { comment } = req.body;

  if (!comment || comment.trim() === '') {
    return res.status(400).json({ error: 'Comment is required' });
  }

  try {
    const updated = await db('book_review')
      .where({ id: reviewId })
      .update({
        comment,
        updated_at: new Date().toISOString()
      });

    if (updated) {
      const updatedReview = await db('book_review').where({ id: reviewId }).first();
      res.json(updatedReview);
    } else {
      res.status(404).json({ error: 'Review not found' });
    }
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Delete review
app.delete('delete_review/:id', async (req, res) => {
  const reviewId = req.params.id;

  try {
    const deleted = await db('book_review')
      .where({ id: reviewId })
      .del();

    if (deleted) {
      res.json({ message: 'Review deleted successfully' });
    } else {
      res.status(404).json({ error: 'Review not found' });
    }
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//Search by ISBN using promise
async function findBookByISBN(isbnCode) {
  try {
    const book = await db('book')
      .where({ isbn_code: isbnCode })
      .first(); // returns the first matching book

    return book;
  } catch (error) {
    console.error('Error fetching book by ISBN:', error);
    throw error;
  }
}
app.get("/book/isbn/:isbnCode", async (req, res) => {
  const { isbnCode } = req.params;
  try {
    const book = await findBookByISBN(isbnCode);
    if (book) {
      res.json(book);
    } else {
      res.status(404).json({ error: "Book not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});


// Find by author name
function findBooksByAuthor(authorName) {
  return db('book')
    .where('book_author', 'ilike', `%${authorName}%`) // case-insensitive search
    .then(books => {
      if (books.length > 0) {
        return books;
      } else {
        throw new Error('No books found for this author');
      }
    })
    .catch(err => {
      console.error('Error fetching books by author:', err);
      throw err;
    });
}


app.get('/books/author/:authorName', (req, res) => {
  const { authorName } = req.params;

  findBooksByAuthor(authorName)
    .then(books => {
      res.json(books);
    })
    .catch(err => {
      res.status(404).json({ error: err.message || 'Internal server error' });
    });
});

// Search by title
function findBooksByTitle(title) {
  return db('book')
    .where('book_title', 'ilike', `%${title}%`) // case-insensitive partial match
    .then(books => {
      if (books.length > 0) {
        return books;
      } else {
        throw new Error('No books found with this title');
      }
    })
    .catch(err => {
      console.error('Error fetching books by title:', err);
      throw err;
    });
}

app.get('/books/title/:title', (req, res) => {
  const { title } = req.params;

  findBooksByTitle(title)
    .then(books => {
      res.json(books);
    })
    .catch(err => {
      res.status(404).json({ error: err.message || 'Internal server error' });
    });
});



app.post('/abc', (req, res) => {
  res.send('Hello, ABC!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

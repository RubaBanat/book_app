'use strict';

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
const app = express();

require('dotenv').config();

app.set('view engine', 'ejs');
app.use(cors());
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

app.use(methodOverride('_method'));

app.get('/', handleHomeRoute);
app.get('/searches', handleSearchForm);
app.post('/searches/new', handleSearchResults);
app.get('/books/:bookID', getDetails);
app.post('/books', addBookHandler);
app.put('/updateBook/:bookID', updateHandler);
app.delete('/deleteBook/:bookID', deleteHandler);
app.use('*', notFoundRoute);


function handleHomeRoute(req, res) {
    let SQL = `SELECT * FROM book;`
    client.query(SQL)
        .then(result => {
            //   console.log(result.rows);
            countHandler().then(counter => {
                res.render('./pages/index', { bookList: result.rows, total: counter })

            })
        })
}

function countHandler() {

    let count = `SELECT COUNT(*) FROM book;`
    return client.query(count)
        .then(results => {
            return results.rows[0].count;
        })
}

function handleSearchForm(req, res) {
    res.render('pages/searches/new');
}

function notFoundRoute(req, res) {
    res.status(404).render('./pages/error');
}
function getDetails(req, res) {
    let SQL = `SELECT * from book WHERE id=$1;`;
    console.log(req.params);
    let value = [req.params.bookID];
    client.query(SQL, value)
        .then(result => {
            // console.log(result.rows);
            res.render('pages/books/detail', { book: result.rows[0] })
        })
}

function addBookHandler(req, res) {
    console.log(req.body);
    let SQL = `INSERT INTO book (author, title, isbn, image_url, description) VALUES ($1,$2,$3,$4,$5)RETURNING id;`;
    let value = req.body;
    let safeValues = [value.author, value.title, value.isbn, value.image_url, value.description];
    client.query(SQL, safeValues)
        .then((result) => {
            console.log(result.rows);
            // res.redirect('/');
            res.redirect(`/books/ ${result.rows[0].id}`)
        })
}

function handleSearchResults(req, res) {
    let searchKeyword = req.body.searched;
    let filterApplied = req.body.searchFilter;
    // console.log(req.body);
    let url = `https://www.googleapis.com/books/v1/volumes?q=${searchKeyword}:${filterApplied}`;

    superagent.get(url)
        .then(bookResults => {
            let result = bookResults.body.items.map(value => {
                // console.log(result);
                return new Book(value);

            })
            res.render('./pages/searches/show', { booksResult: result });
        }).catch(() => {
            res.status(500).render('./pages/error');
        });
}

function updateHandler(req, res) {
    console.log(req.body);

    let { title, author, isbn, description} = req.body;
    // console.log(title,status);
    let SQL = `UPDATE book SET author=$1,title=$2,isbn=$3,description=$4 WHERE id =$5;`;
    let values = [author, title, isbn, description, req.params.bookID];
    client.query(SQL, values)
      .then(() => {
        res.redirect(`/books/ ${req.params.bookID}`);
      }) .catch(() => {
            res.status(500).render('./pages/error');
        });
  
  }

  function deleteHandler(req,res) {
    let SQL = `DELETE FROM book WHERE id=$1;`;
    let value = [req.params.bookID];
    client.query(SQL,value)
    .then(()=>{
      res.redirect('/');
    })
  }

function Book(data) {
    let modifiedImg = data.volumeInfo.imageLinks.thumbnail.split(":")[1];

    this.title = data.volumeInfo.title;
    this.author = data.volumeInfo.authors ? data.volumeInfo.authors[0] : 'Unknown Book Authors';
    this.img = data.volumeInfo.imageLinks ? `https:${modifiedImg}` : 'https://i.imgur.com/J5LVHEL.jpg';
    this.description = data.volumeInfo.description ? data.volumeInfo.description : 'Description is not available';
    this.isbn = data && data.volumeInfo && data.volumeInfo.industryIdentifiers && data.volumeInfo.industryIdentifiers[0] && data.volumeInfo.industryIdentifiers[0].type + data.volumeInfo.industryIdentifiers[0].identifier || 'ISBN Missing';

}

client.connect()
    .then(() => {
        app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
    })

'use strict';

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const app = express();
require('dotenv').config();

app.set('view engine','ejs');
app.use(cors());
app.use(express.static('./public'));
app.use(express.urlencoded({extended:true}));

const PORT = process.env.PORT || 3000;

app.get('/', handleHomeRoute);
app.get('/searches/new' , handleSearchForm);
app.get('/searches/show' , handleSearchResults);


function handleHomeRoute(req, res) {
    res.render('./pages/index');
  }

  function handleSearchForm (req, res){
    res.render('pages/searches/new');
  }

  function errorHandler(err, req, res) {
    res.render('./pages/error');
};

  function handleSearchResults(req, res) {
    let searchKeyword = req.query.searched;
    let filterApplied = req.query.searchFilter;
    // console.log(req.body);
    let url = `https://www.googleapis.com/books/v1/volumes?q=${searchKeyword}:${filterApplied}`;

    superagent.get(url)
    .then (bookResults => {
        let result = bookResults.body.items.map(value => {
            // console.log(result);
            return new Book(value);
        
        })
        res.render('./pages/searches/show', {booksResult: result });
    }).catch((err) => {
        errorHandler(err, req, res);
    });
  }
  
  function Book(data){
      this.title = data.volumeInfo.title;
      this.author = data.volumeInfo.authors ? data.volumeInfo.authors : 'Unknown Book Authors';
      this.img = data.volumeInfo.imageLinks ? data.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
      this.description = data.volumeInfo.description ? data.volumeInfo.description : 'Description is not available';

  }
  
app.listen(PORT, ()=>{
    console.log(`Listening to Port ${PORT}`);
  });
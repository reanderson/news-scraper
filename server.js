var express = require("express");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();



// Parse request body as JSON
app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
  defaultLayout: "main"
}));
app.set("view engine", "handlebars");

// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true
});

// Routes

// A GET route for scraping the Bridgewater Patch website
app.get("/api/scrape", function (req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://patch.com/new-jersey/bridgewater").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("div.patch-news").each(function (i, element) {
      // Save an empty result object
      var result = {};

      // Add the title and link from the h2 with the slot-title class to the result object
      result.title = $(this)
        .find("h2.slot-title")
        .find("a")
        .attr("title");
      result.link = $(this)
        .find("h2.slot-title")
        .find("a")
        .attr("href");

      // Get the summary from the div with the slot-summary class, and trim white space, before adding it to the result object.
      result.summary = $(this)
        .find("div.slot-summary")
        .text()
        .trim()

      // Every article has an image, but for one reason or another, the src data comes up in different ways.
      // sometimes, just grabbing the src data will give a generic url to a white image. For those images, we need to use the data-src attribute
      // Images that don't have this issue have an undefined data-src
      // Therefore, we look for data-src first; if that's there, then we use that. If it isn't there, we go on to get the src.
      result.img = $(this)
        .find("div.slot-col-right")
        .find("img")
        .attr("data-src") || $(this)
        .find("div.slot-col-right")
        .children("a")
        .children("img")
        .attr("src")

      //Search the database for an article that matches the contents of result
      db.Article.find(result)
        .then(function (foundArticle) {

          // If nothing was found, go on to create the article in the database
          if (foundArticle.length === 0) {
            // Create a new Article using the `result` object built from scraping
            db.Article.create(result)
              .then(function (dbArticle) {
                // View the added result in the console
                console.log(dbArticle);
              })
              .catch(function (err) {
                // If an error occurred, send it to the client
                return res.json(err);
              });
          }
        })
        .catch(function (err) {
          return res.json(err)
        })


    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    res.send("Scrape Complete");
  });
});

//route to retrieve all entries from the database
app.get("/api/articles", function (req, res) {
  db.Article
    .find({})
    .then(function (articleData) {
      res.json(articleData)
    })
    .catch(function (err) {
      console.log(err)
      res.json(err)
    })
})

//route to get an article, populated with its notes
app.get("/api/articles/:id", function (req, res) {
  const id = req.params.id;
  db.Article.findById(id)
    .populate("note")
    .then(function (article) {
      res.json(article)
    })
    .catch(function (err) {
      console.log(err)
      res.json(err)
    })
});

//route to post a new note on an article
app.post("/api/articles/:id", function (req, res) {
  const id = req.params.id;
  db.Note.create(req.body)
    .then(function (note) {
      return db.Article.findByIdAndUpdate(id, {
        $push: {
          notes: note._id
        }
      })
    })
    .then(function (article) {
      res.json(article)
    })
    .catch(function (err) {
      console.log(err);
      res.json(err)
    })
});

//route to delete a note, and modify the article the note belonged to
//the front end should pass the id of the note as the body of the request
app.put("/api/articles/:id", function (req, res) {
  const articleId = req.params.id;
  const noteId = req.body.noteId;

  db.Note.findByIdAndRemove(noteId)
    .then(function (response) {
      return db.Article.findByIdAndUpdate(articleId, {
        $pull: {
          notes: noteId
        }
      })
    })
    .then(function (response) {
      res.json(true)
    })
    .catch(function (err) {
      console.log(err);
      res.json(err)
    })
})

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
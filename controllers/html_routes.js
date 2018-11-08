var db = require("../models");

// get moment for the handlebars helper I'm trying to make
var moment = require("moment")

module.exports = function (app) {
  //Root; displays up to 15 articles
  app.get("/", function (req, res) {
    db.Article
      .find({})
      .sort({
        timeAdded: -1
      })
      .then(function (articleData) {
        const hbs = {};

        if (articleData.length > 15) {
          hbs.articles = articleData.slice(0, 15);
          hbs.all = false;
        } else {
          hbs.articles = articleData;
          hbs.all = true;
        }

        res.render("index", hbs)
      })
      .catch(function (err) {
        console.log(err)
        res.json(err)
      })
  });

  //Shows all articles
  app.get("/all", function (req, res) {
    db.Article
      .find({})
      .sort({
        timeAdded: -1
      })
      .then(function (articleData) {
        const hbs = {};

        hbs.articles = articleData;
        hbs.all = true;

        res.render("index", hbs)
      })
      .catch(function (err) {
        console.log(err)
        res.json(err)
      })
  })

  //Page to see an article's comments & allow a new comment
  app.get("/comments/:articleId", function(req, res) {
    const id = req.params.articleId;

    db.Article.findById(id)
      .populate("notes")
      .then(function (article) {
        res.render("comments", {
          article: article,
          helpers: {
            parseDate: (date) => {
              return moment(date).format("MMM Do YYYY, h:mm a");
            }
          }
        })
      })
      .catch(function (err) {
        console.log(err)
        res.json(err)
      })

  })
}
const express = require('express');
const router = express.Router();
const unirest = require('unirest');
const { exists } = require('../models/Podcast');
const Podcast = require('../models/Podcast');
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const actions = require('../modules/actions');
const { default: Axios } = require('axios');
const itunes = require('itunes-web-api')
const https = require('https');

/* GET itunes search page */
router.get('/itunes', (req, res, next) => {
  res.render('itunes/search');
});


//GET itunes results page --> obsolete since integration with search in podcast.js
// router.get('/itunes/search-results', (req, res, next) => {
//   console.log("HERE IS THE QUERY to iTunes: " + req.query.podcast)

//   itunes.podcast(req.query.podcast, { limit: 20 }).then(data => {
//     console.log("Response from itunes", data) //podcast info in results array
//     res.render('itunes/search-results', { searchResults: data.results })
//   }).catch(error => {
//     res.render('itunes/search-results')
//   })
// })

// iTunes DETAILS page

router.get("/itunes/details/:showId", (req, res) => {
  console.log("Show ID: ", req.params.showId)

  https.get(`https://itunes.apple.com/lookup?id=${req.params.showId}&entity=podcastEpisode&limit=10`, (resp) => {
    console.log('Status Code', res.statusCode);
    let str = '';
    resp.on('data', (d) => {
      process.stdout.write(d);
      str += d;
    })
    resp.on('end', () => {
      let fromItunes = JSON.parse(str)
      console.log("From iTunes: ", fromItunes)
      
      let episodes = fromItunes.results.slice()
      episodes.shift()
      console.log("Episodes: ", episodes)


      res.render("itunes/details", {
        podcasts: fromItunes.results[0], episodes: episodes
      })

    })

  })

  // https.get(`https://itunes.apple.com/lookup?id=${req.params.showId}&entity=podcastEpisode&limit=10`, (resp) => {
  //   console.log('Status Code', res.statusCode);
  //   let str = '';
  //   resp.on('data', (d) => {
  //     process.stdout.write(d);
  //     str += d;
  //   })
  //   resp.on('end', () => {
  //     let episodesFromItunes = JSON.parse(str)
  //     console.log("Episodes From iTunes: ", episodesFromItunes)
  //     // res.render("itunes/details", {
  //     //   podcasts: fromItunes.results[0]
  //     // })

  //   })

 // })



})


// const fromDb = Podcast.exists({ podcastId: req.params.showId })
//   .then(podcastExists => {
//     if (podcastExists) {
//       return Podcast.findOne({ podcastId: req.params.showId })
//     } else {
//       return Podcast.create({ podcastId: req.params.showId, origin: "itunes" })
//     }
//   })
//   .catch(err => console.log('The error while searching show occurred: ', err));

// Promise.all([fromItunes, fromDb]).then(values => {


// Add episode to bookmarked playlist
router.post("/listennotes/details/:podcastid/:id/addtoplaylist", (req, res) => {

  if (!req.session.currentUser) {

    const requestedAction = {
      action: "addtoplaylist",
      podcastId: req.params.podcastid,
      episodeId: req.params.id,
      origin: "listennotes",
      message: "You need to login to bookmark episodes"
    }

    req.session.pendingRequest = requestedAction

    res.render("auth/login", { pendingRequest: requestedAction })

  } else {

    actions.addToPlaylistLN(req.params.id, req.session.currentUser._id)
      .then(() => res.redirect(`/listennotes/details/${req.params.podcastid}`));
  }
});


// Add Listen Notes Podcasts as favorites

router.post('/listennotes/:id/addtofavorite', (req, res) => {

  if (!req.session.currentUser) {

    const requestedAction = {
      action: "addtofavorite",
      podcastId: req.params.id,
      origin: "listennotes",
      message: "You need to login to add a favorite podcast"
    }

    req.session.pendingRequest = requestedAction

    res.render("auth/login", { pendingRequest: requestedAction })

  } else {

    actions.addToFavoritesLN(req.params.id, req.session.currentUser._id)
      .then(() => res.redirect("/userProfile"));

  }

})

router.post('listennotes/delete/:id', (req, res) => {
  Podcast.findOne({ podcastId: req.params.id })
    .then(podcast => {
      console.log("Podcast we want to delete", podcast)
      User.findOneAndUpdate({ _id: req.session.currentUser._id }, { $pull: { favoritePodcasts: podcast._id } }, { new: true })
    })
  res.redirect("/userProfile");

})

//  *********************COMMENTS SECTION***************************

// Add new comment to a podcast
router.post('/listennotes/details/:showId/newcomment', (req, res, next) => {

  if (!req.session.currentUser) {

    const requestedAction = {
      action: "comment",
      podcastId: req.params.showId,
      commentContent: req.body.content,
      origin: "listennotes",
      message: "You need to login to add a comment"
    }

    req.session.pendingRequest = requestedAction

    res.render("auth/login", { pendingRequest: requestedAction })

  } else {

    actions.addCommentLN(req.params.showId, req.body.content, req.session.currentUser._id)
      .then(() => res.redirect(`/listennotes/details/${req.params.showId}`));

  }
});

// +++++++++++++++++++++++++RATING SECTION++++++++++++++++++++++++++++

router.post('/listennotes/details/:showId/newrating', (req, res, next) => {

  if (!req.session.currentUser) {

    const requestedAction = {
      action: "rate",
      podcastId: req.params.showId,
      ratingContent: req.body.content,
      origin: "listennotes",
      message: "You need to login to rate a podcasts"
    }

    req.session.pendingRequest = requestedAction
    res.render("auth/login", { pendingRequest: requestedAction })

  } else {

    actions.ratePodcastLN(req.params.showId, req.body.content, req.session.currentUser._id)
      .then(() => res.redirect(`/listennotes/details/${req.params.showId}`));

  }
})

module.exports = router;
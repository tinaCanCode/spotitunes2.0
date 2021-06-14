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

router.get("/details/:showId", (req, res) => {
  console.log("Show ID: ", req.params.showId)

  https.get(`https://itunes.apple.com/lookup?id=${req.params.showId}&entity=podcastEpisode&limit=10`, (resp) => {
    //console.log('Status Code', res.statusCode);
    let str = '';
    resp.on('data', (d) => {
      //process.stdout.write(d);
      str += d;
    })
    resp.on('end', () => {
      let fromItunes = JSON.parse(str)
      //console.log("From iTunes: ", fromItunes)
      let episodes = fromItunes.results.slice()
      episodes.shift()
      //console.log("Episodes: ", episodes)

      res.render("itunes/details", { podcasts: fromItunes.results[0], episodes: episodes })

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

// Add iTunes Podcasts as favorites

router.post('/:id/addtofavorite', (req, res) => {

  //console.log("USER: ", req.session.currentUser)

  if (!req.session.currentUser) {

    const requestedAction = {
      action: "addtofavorite",
      podcastId: req.params.id,
      origin: "itunes",
      message: "You need to login to add a favorite podcast"
    }

    req.session.pendingRequest = requestedAction

    console.log("SESSION: ", req.session)

    res.render("auth/login", { pendingRequest: requestedAction })

  } else {

    actions.addToFavoritesIT(req.params.id, req.session.currentUser._id)
      .then(() => res.redirect("/userProfile"));

  }
})

//addtoplaylist
router.post("/details/:podcastid/:id/addtoplaylist", (req, res) => {

  if (!req.session.currentUser) {

    const requestedAction = {
      action: "addtoplaylist",
      podcastId: req.params.podcastid,
      episodeId: req.params.id,
      origin: "itunes",
      message: "You need to login to bookmark episodes"
    }

    req.session.pendingRequest = requestedAction

    res.render("auth/login", { pendingRequest: requestedAction })

  } else {

    actions.addToPlaylistIT(req.params.podcastid, req.params.id, req.session.currentUser._id)
      .then(() => res.redirect(`/itunes/details/${req.params.podcastid}`));
  }
});



module.exports = router;
const express = require('express');
const router = express.Router();
const Podcast = require('../models/Podcast');
const User = require('../models/User');
const axios = require('axios');
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

spotifyApi
  .clientCredentialsGrant()
  .then(data => spotifyApi.setAccessToken(data.body['access_token']))
  .catch(error => console.log('Something went wrong when retrieving an access token', error));

/* GET search page */
router.get('/search', (req, res, next) => {
  res.render('search', { user: req.session.currentUser });
});

// Query of search term to both APIs
router.get('/search-results', (req, res) => {
  //console.log("HERE IS THE QUERY: " + req.query.podcast)

  const itunesSearch = axios.get(`https://itunes.apple.com/search?term=${req.query.podcast}&entity=podcast&limit=6`)
  const spotifySearch = spotifyApi.searchShows(req.query.podcast, { market: "DE", limit: 6 })

  Promise.all([itunesSearch, spotifySearch]).then((response) => {
    // console.log("THIS IS THE SEARCH RESULT: " + response);
    // console.log("THIS IS THE SEARCH RESULT SPTFY: " + response[1]);
    // console.log("THIS IS THE SEARCH RESULT FOR ITUNES: ", response[0]);

    // Results stored into variables
    let allResults = []
    let itunesResults = response[0].data.results
    let spotifyResults = response[1].body.shows.items

    //Create smaller and uniformised itunes podcasts object
    for (let i = 0; i < itunesResults.length; i++) {
      let resultSummary = {
        id: itunesResults[i].collectionId,
        publisher: itunesResults[i].artistName,
        title: itunesResults[i].collectionName,
        imageURL: itunesResults[i].artworkUrl600,
        description: itunesResults[i].genres[0],
        origin: "itunes"
      }
      allResults.push(resultSummary)
    }

    // Create smaller and uniformised spotify podcasts object
    for (let i = 0; i < spotifyResults.length; i++) {
      let resultSummary = {
        id: spotifyResults[i].id,
        title: spotifyResults[i].name,
        publisher: spotifyResults[i].publisher,
        imageURL: spotifyResults[i].images[0].url,
        description: spotifyResults[i].description,
        origin: "spotify"
      }
      allResults.push(resultSummary)
    }

    // sort podcasts by title 
    function compare(a, b) {
      if (a.title < b.title) {
        return -1;
      }
      if (a.title > b.title) {
        return 1;
      }
      return 0;
    }

    // Delete duplicates from allResults
    let uniqueResults = []
    allResults.forEach((result) => {
      if (!uniqueResults.some(obj => obj.title === result.title)) {
        uniqueResults.push(result);
      }
    });

    res.render('search-results', { allResults: uniqueResults.sort(compare), user: req.session.currentUser })
  })
    .catch(err => console.log('The error while searching podcasts occurred: ', err))
})

// remove a podcast from the favorites Podcast array of user, keep podcast id in database

router.post('/delete/:id', (req, res) => {
  Podcast.findOne({ podcastId: req.params.id })
  .then(podcast => {
    console.log("Podcast we want to delete", podcast)
    return User.findOneAndUpdate({ _id: req.session.currentUser._id }, { $pull: { favoritePodcasts: podcast._id } }, { new: true })
  })
  res.redirect("/userProfile");
})

module.exports = router;

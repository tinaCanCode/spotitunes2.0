const express = require('express');
const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');
const actions = require('../modules/actions');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

spotifyApi
  .clientCredentialsGrant()
  .then(data => spotifyApi.setAccessToken(data.body['access_token']))
  .catch(error => console.log('Something went wrong when retrieving an access token', error));

router.get("/details/:showId", (req, res) => {
  // console.log(req.params.showId)
  spotifyApi.getShow(req.params.showId , { market: "DE", limit: '10' }).then(podcast => {
    res.render("spotify/details", { podcasts: podcast.body, user: req.session.currentUser })
  })
});

// Add Spotify Podcasts as favorites

router.post('/:id/addtofavorite', (req, res) => {

  //console.log("USER: ", req.session.currentUser)

  if (!req.session.currentUser) {

    const requestedAction = {
      action: "addtofavorite",
      podcastId: req.params.id,
      origin: "spotify",
      message: "You need to login to add a favorite podcast"
    }

    req.session.pendingRequest = requestedAction
    //console.log("SESSION: ", req.session)
    res.render("auth/login", { pendingRequest: requestedAction })

  } else {

    actions.addToFavorites(req.params.id, req.session.currentUser._id)
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
      origin: "spotify",
      message: "You need to login to bookmark episodes"
    }

    req.session.pendingRequest = requestedAction

    res.render("auth/login", { pendingRequest: requestedAction })

  } else {

    actions.addToPlaylist(req.params.id, req.session.currentUser._id)
      .then(() => res.redirect(`/spotify/details/${req.params.podcastid}`));
  }
});

module.exports = router;

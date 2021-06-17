// const { Router } = require('express');
const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist')
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

// display the signup form to users --> duplicate from auth.js

router.get('/signup', (req, res) => {
  res.render('auth/signup')
});


// display playlist

router.get('/playlists/:name', (req, res) => {
  Playlist.find({ ownerID: req.session.currentUser._id })
    .then((playlists) => {
      let currentPlaylist = playlists.find(playlist => playlist.playlistName.toLowerCase() == req.params.name.toLowerCase())
      let playlistsAll = playlists
      let playlistEpisodes = []
      let playlistObject = {
        name: currentPlaylist.playlistName,
        content: playlistEpisodes,
        default: currentPlaylist.default,
        id: currentPlaylist._id
      }
      let requestPromises = []
      console.log("THIS IS THE PLAYLIST: " + playlistsAll)
      for (let i = 0; i < currentPlaylist.episodes.length; i++) {
        if (currentPlaylist.episodes[i].source === "itunes") {
          console.log("IT Episode ID ", currentPlaylist.episodes[i].episodeID)
          let request = axios.get(`https://itunes.apple.com/lookup?id=${currentPlaylist.episodes[i].podcastId}&entity=podcastEpisode`)
            .then((resp) => {

              let allEpisodes = resp.data.results
              
              const bookmarkedEpisode = allEpisodes.filter(episode => episode.trackId === Number(currentPlaylist.episodes[i].episodeID))

              //console.log("Bookmarked Epsiode: ", bookmarkedEpisode)
              //console.log("THIS IS THE IT EPiSODE : " + bookmarkedEpisode[0].trackName)

              let episodeSummary = {
                id: bookmarkedEpisode[0].trackId,
                title: bookmarkedEpisode[0].trackName,
                link: bookmarkedEpisode[0].trackViewUrl,
                podcast: bookmarkedEpisode[0].collectionName,
                podcastID: bookmarkedEpisode[0].collectionId,
                source: "itunes"
              }
              playlistEpisodes.push(episodeSummary)
              //console.log("THIS IS THE PLAYLIST if : " + playlistEpisodes)

            })
          requestPromises.push(request)
        }
        else if (currentPlaylist.episodes[i].source === "spotify") {
          let request = spotifyApi
            .getEpisode(currentPlaylist.episodes[i].episodeID, { market: "DE" })
            .then((episode) => {
              console.log("THIS IS THE SP EPiSODE : " + episode.body.name)
              let episodeSummary = {
                id: episode.body.id,
                title: episode.body.name,
                link: episode.body.external_urls.spotify,
                podcast: episode.body.show.name,
                podcastID: episode.body.show.id,
                source: "spotify"
              }
              //WORKS console.log("THIS is THE EPOSIODE :" + episodeSummary.id)
              playlistEpisodes.push(episodeSummary)
              //console.log("THIS IS THE PLAYLIST else : " + playlistEpisodes)

            })
          requestPromises.push(request)
        }
      }

      Promise.all(requestPromises).then(() => {
        res.render('users/playlists', { playlistObject: playlistObject, playlistsAll: playlistsAll, user: req.session.currentUser })
      })
    })
})

router.post('/bookmarks/:name/:id/delete', (req, res) => {
  console.log("THIS IS THE PARAMS : " + req.params.id)

  Playlist.findOneAndUpdate(
    { $and: [{ ownerID: req.session.currentUser._id }, { playlistName: req.params.name }] },
    { $pull: { episodes: { episodeID: req.params.id } } })
    .then((playlist) => {
      console.log(playlist)
      res.redirect('/playlists/bookmarked')
    })
})

router.get("/bookmarks/new", (req, res) => {
  res.render("users/newplaylist")
})

router.post("/bookmarks/new", (req, res) => {
  Playlist.create({ ownerID: req.session.currentUser._id, userName: req.session.currentUser.username, playlistName: req.body.playlistname, default: false })
    .then(() => {
      res.redirect('/playlists/bookmarked')
    })
})

router.post("/bookmarks/:source/:episodeID", (req, res) => {
  console.log("2CHECKTHID OUTTOTUTOUT" + req.body.source)
  let addTo = Playlist.findOneAndUpdate(
    { $and: [{ ownerID: req.session.currentUser._id }, { playlistName: req.body.selectpicker }] },
    { $push: { episodes: { episodeID: req.params.episodeID, source: req.params.source } } })


  let deleteFrom =
    Playlist.findOneAndUpdate(
      { $and: [{ ownerID: req.session.currentUser._id }, { playlistName: "Bookmarked" }] },
      { $pull: { episodes: { episodeID: req.params.episodeID } } })

  Promise.all([addTo, deleteFrom]).then((response) => {
    res.redirect('/playlists/bookmarked')
  })
})

router.get("/playlist/:name/edit", (req, res) => {
  Playlist.find({ ownerID: req.session.currentUser._id })
    .then((playlists) => {
      let currentPLaylist = playlists.find(playlist => playlist.playlistName.toLowerCase() == req.params.name.toLowerCase())
      res.render("users/editplaylist", { playlist: currentPLaylist })
    })
})

router.post("/playlist/:id/edit", (req, res) => {
  Playlist.findOneAndUpdate(
    { _id: req.params.id },
    { playlistName: req.body.playlistname })
    .then((playlist) => {
      console.log("CHECK THISO OUT" + playlist)
      res.redirect('/playlists/bookmarked')
    })
})

router.post("/playlist/:id/delete", (req, res) => {
  Playlist.findByIdAndDelete(req.params.id).then(() => {
    res.redirect('/playlists/bookmarked')
  })
})

module.exports = router;
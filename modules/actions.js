const Podcast = require("../models/Podcast");
const User = require("../models/User");
const SpotifyWebApi = require('spotify-web-api-node');
const Playlist = require('../models/Playlist');
const axios = require('axios');
//const https = require('https');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

spotifyApi
  .clientCredentialsGrant()
  .then(data => spotifyApi.setAccessToken(data.body['access_token']))
  .catch(error => console.log('Something went wrong when retrieving an access token', error));


module.exports = {

  // Actions for spotify
  addToFavorites(podcastId, userId) { //rename to add favorites Spotify

    return Podcast.exists({ podcastId: podcastId })
      .then(podcastExists => {
        if (!podcastExists) {
          return Podcast.create({ podcastId: podcastId, origin: "spotify" })
        } else {
          return Podcast.findOne({ podcastId: podcastId })
        }
      })
      // Add ObjectId of Podcast object in database to Users favorite podcasts
      .then(podcastToAdd => {
        //console.log("Podcast you want to add:", podcastToAdd)

        // Check if podcast is already part of favorite podcasts
        User.findOne({ _id: userId })
          .then(user => {
            const userFavoritePodcasts = user.favoritePodcasts

            if (userFavoritePodcasts.includes(podcastToAdd._id.toString())) {
              res.send("You can't add podcasts twice")
            } else {
              return User.findOneAndUpdate({ _id: userId }, { $push: { favoritePodcasts: podcastToAdd._id } }, { new: true })
            }

          })

          .catch(err => console.log(`Err while creating the post in the DB: ${err}`));
      })

  },

  addToPlaylist(episodeId, userId) {
    return spotifyApi
      .getEpisode(episodeId, { market: "DE" })
      .then((episode) => {
        return Playlist.findOneAndUpdate(
          { $and: [{ ownerID: userId }, { playlistName: "Bookmarked" }] },
          { $push: { episodes: { episodeID: episode.body.id, source: "spotify" } } })
      })
  },


  // Actions for iTunes

  // One liner with axios --> keep as placeholder to write own https request with promise
  async lookupPodcastId(podcastId) {
    return await axios.get(`https://itunes.apple.com/lookup?id=${podcastId}&entity=podcast`)
  },

  async lookupPodcastEpisodes(podcastId) {
    return await axios.get(`https://itunes.apple.com/lookup?id=${podcastId}&entity=podcastEpisode`)
  },

  addToFavoritesIT(podcastId, userId) {
    return Podcast.exists({ podcastId: podcastId })
      .then(podcastExists => {
        if (!podcastExists) {
          return Podcast.create({ podcastId: podcastId, origin: "itunes" })
        } else {
          return Podcast.findOne({ podcastId: podcastId })
        }
      })
      // Add ObjectId of existing or newly created Podcast to Users favorite podcasts
      .then(resp => {
        //console.log("Response from mongo:", resp)
        return User.findOneAndUpdate({ _id: userId },
          { $push: { favoritePodcasts: resp._id } }, { new: true })
      })
  },

  addToPlaylistIT(podcastId, episodeId, userId) {

    return axios.get(`https://itunes.apple.com/lookup?id=${podcastId}&entity=podcastEpisode`)
      .then((resp) => {
        console.log("Here is the episode response from axios in addtoplaylistit: ", resp.data)
        let allEpisodes = resp.data.results

        console.log("PodcastID ", podcastId)
        console.log("episodeID ", episodeId)

        const episodeToBookmark = allEpisodes.filter(episode => episode.trackId === Number(episodeId))
        console.log("espisode to bookmark: ", episodeToBookmark)

        return Playlist.findOneAndUpdate(
          { $and: [{ ownerID: userId }, { playlistName: "Bookmarked" }] },
          { $push: { episodes: { podcastId: episodeToBookmark[0].collectionId, episodeID: episodeToBookmark[0].trackId, source: "itunes" } } })
      })
  },

}

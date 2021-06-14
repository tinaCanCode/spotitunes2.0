const Podcast = require("../models/Podcast");
const User = require("../models/User");
const SpotifyWebApi = require('spotify-web-api-node');
const Playlist = require('../models/Playlist');
const unirest = require('unirest');
const https = require('https');
const axios = require('axios');

// setting the spotify-api goes here:
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

// Retrieve an access token
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
      // Add ObjectId of newly created Podcast to Users favorite podcasts
      .then(podcastToAdd => {
        console.log("Podcast you want to add:", podcastToAdd)

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
          // Redirect to Homepage

          .catch(err => console.log(`Err while creating the post in the DB: ${err}`));
      })

  },

  addComment(showId, content, userId) {

    // const { showId } = ;
    // const { content } = req.body;


    const newComment = { content: content, author: userId }

    console.log(showId)
    // check if podcast with id is already in db
    return Podcast.exists({ podcastId: showId })
      .then(podcastExists => {
        if (!podcastExists) {
          return Podcast.create({ podcastId: showId, origin: "spotify" })
        } else {
          return Podcast.findOne({ podcastId: showId })
        }
      })
      // Add ObjectId of newly created Podcast 
      .then(resp => {
        let commentsArrToCheck = resp.comments
        let userToCheckCom = userId
        let hasCommented = commentsArrToCheck.some(commentsArrToCheck => commentsArrToCheck['author'] == `${userToCheckCom}`)
        console.log("=========>", hasCommented)

        if (!hasCommented) {
          return Podcast.findByIdAndUpdate(resp._id, { $push: { comments: newComment } })

        } else {
          let newCommentArr = commentsArrToCheck.filter(commentsArrToCheck => commentsArrToCheck['author'] != `${userToCheckCom}`)
          console.log("=========>", newCommentArr)
          newCommentArr.push(newComment);
          return Podcast.findByIdAndUpdate(resp._id, { comments: newCommentArr })

        }
      })
  },

  ratePodcast(showId, content, userId) {

    // const { showId } = req.params;
    //const { content } = req.body;

    const newRating = { content: content, author: userId }

    //console.log(showId)
    // check if podcast with id is already in db
    return Podcast.exists({ podcastId: showId })
      .then(podcastExists => {
        if (!podcastExists) {
          return Podcast.create({ podcastId: showId, origin: "spotify" })
        } else {
          return Podcast.findOne({ podcastId: showId })
        }
      })
      // Add rating to Podcast 
      .then(respond => {
        let arrayToCheck = respond.rating
        let userToCheck = userId

        let hasUser = arrayToCheck.some(arrayToCheck => arrayToCheck['author'] == `${userToCheck}`)
        console.log("=========>", hasUser)

        if (!hasUser) {
          return Podcast.findByIdAndUpdate(respond._id, { $push: { rating: newRating } })

        } else {

          let newRatingArr = arrayToCheck.filter(arrayToCheck => arrayToCheck['author'] != `${userToCheck}`)
          console.log("=========>", newRatingArr)
          newRatingArr.push(newRating);
          return Podcast.findByIdAndUpdate(respond._id, { rating: newRatingArr })
        }
      })


  },

  addToPlaylist(episodeId, userId) {
    return spotifyApi
      .getEpisode(episodeId, { market: "DE" })
      .then((episode) => {
        console.log("THE ID OF THE EISODEEE: " + episode.body.id)
        return Playlist.findOneAndUpdate(
          { $and: [{ ownerID: userId }, { playlistName: "Bookmarked" }] },
          { $push: { episodes: { episodeID: episode.body.id, source: "spotify" } } })
      })
  },

  // Actions for iTunes

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
        console.log("Response from mongo:", resp)
        return User.findOneAndUpdate({ _id: userId },
          { $push: { favoritePodcasts: resp._id } }, { new: true })
      })
  },

  addToPlaylistIT(podcastId, episodeId, userId) {

    return axios.get(`https://itunes.apple.com/lookup?id=${podcastId}&entity=podcastEpisode`)
      .then((resp) => {
        console.log("Here is the episode response from axios: ", resp.data)
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

  //Actions for LN (remove)

  addToFavoritesLN(podcastId, userId) {
    return Podcast.exists({ podcastId: podcastId })
      .then(podcastExists => {
        if (!podcastExists) {
          return Podcast.create({ podcastId: podcastId, origin: "listennotes" })
        } else {
          return Podcast.findOne({ podcastId: podcastId })
        }
      })
      // Add ObjectId of newly created Podcast to Users favorite podcasts
      .then(resp => {
        console.log("Response from mongo:", resp)
        return User.findOneAndUpdate({ _id: userId },
          { $push: { favoritePodcasts: resp._id } }, { new: true })
      })
  },

  addCommentLN(showId, content, userId) {
    const newComment = { content: content, author: userId }

    // check if podcast with id is already in db
    return Podcast.exists({ podcastId: showId })
      .then(podcastExists => {
        if (!podcastExists) {
          return Podcast.create({ podcastId: showId, origin: "listennotes" })
        } else {
          return Podcast.findOne({ podcastId: showId })
        }
      })
      // Add ObjectId of newly created Podcast 
      .then(resp => {
        let commentsArrToCheck = resp.comments
        let userToCheckCom = userId
        let hasCommented = commentsArrToCheck.some(commentsArrToCheck => commentsArrToCheck['author'] == `${userToCheckCom}`)
        console.log("=========>", hasCommented)

        if (!hasCommented) {
          return Podcast.findByIdAndUpdate(resp._id, { $push: { comments: newComment } })
        } else {
          let newCommentArr = commentsArrToCheck.filter(commentsArrToCheck => commentsArrToCheck['author'] != `${userToCheckCom}`)
          // console.log("=========>", newCommentArr)
          newCommentArr.push(newComment);
          return Podcast.findByIdAndUpdate(resp._id, { comments: newCommentArr })
        }
      })
  },

  ratePodcastLN(showId, content, userId) {

    const newRating = { content: content, author: userId }

    // check if podcast with id is already in db
    return Podcast.exists({ podcastId: showId })
      .then(podcastExists => {
        if (!podcastExists) {
          return Podcast.create({ podcastId: showId, origin: "listennotes" })
        } else {
          return Podcast.findOne({ podcastId: showId })
        }
      })
      // Add rating to Podcast 
      .then(respond => {
        let arrayToCheck = respond.rating
        let userToCheck = userId

        let hasUser = arrayToCheck.some(arrayToCheck => arrayToCheck['author'] == `${userToCheck}`)
        console.log("=========>", hasUser)

        if (!hasUser) {
          return Podcast.findByIdAndUpdate(respond._id, { $push: { rating: newRating } })
        } else {

          let newRatingArr = arrayToCheck.filter(arrayToCheck => arrayToCheck['author'] != `${userToCheck}`)
          console.log("=========>", newRatingArr)
          newRatingArr.push(newRating);
          return Podcast.findByIdAndUpdate(respond._id, { rating: newRatingArr })
        }
      })
  },

  addToPlaylistLN(episodeId, userId) {
    return unirest
      .get(`https://listen-api.listennotes.com/api/v2/episodes/${episodeId}`)
      .header('X-ListenAPI-Key', process.env.LISTENNOTES_APIKEY)
      .then((episode) => {
        console.log(episode)
        return Playlist.findOneAndUpdate(
          { $and: [{ ownerID: userId }, { playlistName: "Bookmarked" }] },
          { $push: { episodes: { episodeID: episode.body.id, source: "listennotes" } } })
      })
  }

}

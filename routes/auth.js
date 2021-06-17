// const { Router } = require('express');
const express = require('express');
const router = express.Router();
const User = require('../models/User')
const Playlist = require('../models/Playlist')
const mongoose = require('mongoose');
const Podcast = require('../models/Podcast');
const SpotifyWebApi = require('spotify-web-api-node');
const saltRounds = 10;
const bcryptjs = require('bcryptjs');
const actions = require('../modules/actions');
//const { findById } = require('../models/Podcast'); --> consider to remove

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

spotifyApi
  .clientCredentialsGrant()
  .then(data => spotifyApi.setAccessToken(data.body['access_token']))
  .catch(error => console.log('Something went wrong when retrieving an access token', error));


//////////// S I G N U P ///////////

router.get('/signup', (req, res) => {
  res.render('auth/signup')
});

router.post('/signup', (req, res) => {
  const { username, email, password, repeatpassword } = req.body;

  if (!username || !email || !password || !repeatpassword) {
    let preusername = username
    let preemail = email
    res.render('auth/signup', { errorMessage: 'All fields are mandatory. Please provide your username, email and password.', preusername: preusername, preemail: preemail });
    return;
  }
  else if (password != repeatpassword) {
    let preusername = username
    let preemail = email
    res.render('auth/signup', { errorMessage: 'The repeated password is not the same. Provide the password one more time', preusername: preusername, preemail: preemail });
    return;
  }

  // making sure that passwords are strong:

  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!regex.test(password)) {
    let preusername = username
    let preemail = email
    res
      .status(500)
      .render('auth/signup', { errorMessage: 'Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.', preusername: preusername, preemail: preemail });
    return;
  }

  bcryptjs
    .genSalt(saltRounds)
    .then(salt => bcryptjs.hash(password, salt))
    .then(hashedPassword => {
      return User.create({
        username,
        email,
        password: hashedPassword
      });
    })
    .then(createdUser => {
      //console.log('Newly created user is: ', createdUser);
      //Create a bookmark playlist 
      return Playlist.create({
        ownerID: createdUser._id,
        userName: createdUser.username,
        playlistName: "Bookmarked",
        episodes: [],
        default: true
      })
    })
    .then(() => {
      res.redirect('/login')
    })

    .catch(error => {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(500).render('auth/signup', { errorMessage: error.message });
      } else if (error.code === 11000) {
        res.status(500).render('auth/signup', {
          errorMessage: 'Username and email need to be unique. Either username or email is already used.'
        });
      } else {
        next(error);
      }
    });
});

//////////// L O G I N ///////////

router.get('/login', (req, res) => res.render('auth/login'));

router.post('/login', (req, res, next) => {
  const { email, password } = req.body;

  if (email === '' || password === '') {
    let preemaillog = email
    res.render('auth/login', {
      errorMessage: 'Please enter both, email and password to login.', preemaillog: preemaillog
    });
    return;
  }

  User.findOne({ email })
    .then(user => {
      if (!user) {
        let preemaillog = email
        res.render('auth/login', { errorMessage: 'Email is not registered. Try with other email.', preemaillog: preemaillog });
        return;
      } else if (bcryptjs.compareSync(password, user.password)) {
        req.session.currentUser = user;

        // Checking if there is a pending request before the user logged in
        if (req.session.pendingRequest) {
          if (req.session.pendingRequest.origin === "spotify") {
            // user tried to add podcast to favorite without being logged in
            if (req.session.pendingRequest.action === "addtofavorite") {
              actions.addToFavorites(req.session.pendingRequest.podcastId, req.session.currentUser._id)
                .then(() => {
                  req.session.pendingRequest = null;
                  res.redirect("/userProfile")
                });
              //user tried to add an episode without being logged in
            } else if (req.session.pendingRequest.action === "addtoplaylist") {
              actions.addToPlaylist(req.session.pendingRequest.episodeId, req.session.currentUser._id)
                .then(() => {
                  const showId = req.session.pendingRequest.podcastId;
                  req.session.pendingRequest = null;
                  res.redirect(`/spotify/details/${showId}`)
                })
            }
            else {
              console.log("This action is not defined for spotify")
            }
          } else {
            // executed when the origin in the pendingRequest is itunes
            // user tried to add podcast to favorite without being logged in
            if (req.session.pendingRequest.action === "addtofavorite") {
              actions.addToFavoritesIT(req.session.pendingRequest.podcastId, req.session.currentUser._id)
                .then(() => {
                  req.session.pendingRequest = null;
                  res.redirect("/userProfile")
                });
              //user tried to add an episode without being logged in
            } else if (req.session.pendingRequest.action === "addtoplaylist") {
              actions.addToPlaylistIT(req.session.pendingRequest.podcastId, req.session.pendingRequest.episodeId, req.session.currentUser._id)
                .then(() => {
                  const showId = req.session.pendingRequest.podcastId;
                  req.session.pendingRequest = null;
                  res.redirect(`/itunes/details/${showId}`)
                })
            } else {
              console.log("This action is not defined for itunes")
            }
          }
        } else {
          res.redirect("/userProfile");
        }

      } else {
        res.render('auth/login', { errorMessage: 'Incorrect password.' });
      }
    })
    .catch(error => next(error));
});

//logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Get user profile page and display favorite podcasts

router.get('/userProfile', (req, res) => {
  //console.log(req.session.currentUser)
  if (req.session.currentUser.favoritePodcasts !== null) {

    User.findOne({ _id: req.session.currentUser._id })
      .then(user => {
        const podcastDbIds = user.favoritePodcasts
        //console.log("DatabaseIDs: ", podcastDbIds)
        return Promise.all(podcastDbIds.map(async (id) => {
          return await Podcast.findOne({ _id: id })
        }))
      }).then(podcasts => {
        //console.log("After map: ", podcasts) // Array of podcast objects in Mongobd incl. origin
        return Promise.all(podcasts.map(async (podcast) => {
          //console.log("Podcast ID", podcast.podcastId)
          if (podcast.origin === "spotify") {
            return await spotifyApi.getShow(podcast.podcastId, { market: "DE" });
          }
          else if (podcast.origin === "itunes") {
            return await actions.lookupPodcastId(podcast.podcastId);
          }
        }))
      })
      .then(allPodcasts => {
        //console.log("All podcasts :", allPodcasts)
        //console.log("iTunes response in auth: ", allPodcasts[1].data.results[0].collectionId);
        res.render('users/user-profile', { user: req.session.currentUser, podcasts: allPodcasts })
      })
  }
  else {
    res.render('users/user-profile', { user: req.session.currentUser })
  }
});

router.get('/userProfile/episodes', (req, res) => {
  //console.log(req.session.currentUser)
  if (req.session.currentUser.favoritePodcasts !== null) {

    User.findOne({ _id: req.session.currentUser._id })
      .then(user => {
        const podcastDbIds = user.favoritePodcasts
        //console.log("DatabaseIDs: ", podcastDbIds)
        return Promise.all(podcastDbIds.map(async (id) => {
          return await Podcast.findOne({ _id: id })
        }))
      }).then(podcasts => {
        console.log("After map: ", podcasts) // Array of podcast objects in Mongobd incl. origin
        return Promise.all(podcasts.map(async (podcast) => {
          //console.log("Podcast ID", podcast.podcastId)
          if (podcast.origin === "spotify") {
            return await spotifyApi.getShow(podcast.podcastId, { market: "DE" });
          }
          else if (podcast.origin === "itunes") {
            return await actions.lookupPodcastEpisodes(podcast.podcastId);
          }
        }))
      })
      .then(allPodcasts => {
        //console.log("All podcasts :", allPodcasts)
        let today = new Date().getTime()
        let allEpisodes = []

        allPodcasts.forEach(podcast => {
          // Processing spotify response
          if (podcast.body && podcast.body.episodes) {
            console.log("Podcast body", podcast.body)
            let latestEpisodes = podcast.body.episodes.items.filter(episode => {
              let releaseDate = new Date(episode.release_date).getTime()
              let daysElapsed = (today - releaseDate) / 86400000
              return daysElapsed < 30
            })
            latestEpisodes.forEach(episode => {
              episode.podcastId = podcast.body.id;
              episode.podcastName = podcast.body.name;
              //console.log("Episode: ", episode)
              allEpisodes.push(episode)
            })
          }
          // Processing itunes reponse
          else {
            let episodes = podcast.data.results
            episodes.shift()
            let latestEpisodes = episodes.filter(episode => {
              let releaseDate = new Date(episode.releaseDate).getTime()
              let daysElapsed = (today - releaseDate) / 86400000
              return daysElapsed < 30
            })
            latestEpisodes.forEach(episode => {
              allEpisodes.push(episode)
            })
          }
        })
        //console.log("All Episodes: ", allEpisodes)
        res.render('users/episodes', { user: req.session.currentUser, episodes: allEpisodes })
      })

  }
  else {
    res.render('users/user-profile', { user: req.session.currentUser })
  }

});

module.exports = router;










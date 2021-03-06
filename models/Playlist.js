const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const playlistSchema = new Schema({
  ownerID: { type: String, required: true },
  userName : String,
  playlistName : String,
  episodes: [{
    episodeID : String,
    podcastId: String,
    source : String
  }],
  default : Boolean
})

const Playlist = mongoose.model("Playlist", playlistSchema);
module.exports = Playlist;
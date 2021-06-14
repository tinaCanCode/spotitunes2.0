const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const podcastSchema = new Schema({
    title: String,
    description: String,
    podcastId: { type: String, unique: true, require: true },
    //Remove rating, comments and duplicate PodcastID
    rating: [{
        author: { type: Schema.Types.ObjectId, ref: 'User' },
        content: Number
    }],
    comments: [{
        author: { type: Schema.Types.ObjectId, ref: 'User' },
        content: String
    }],
    podcastId: {type: String, unique: true, require: true},
    origin: String
})

const Podcast = mongoose.model("Podcast", podcastSchema);
module.exports = Podcast;
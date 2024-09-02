const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    text: String,
    created_on: Date,
    bumped_on: Date,
    board: String,
    replycount: Number,
});

const Thread = mongoose.model('Thread', schema);

module.exports = Thread;
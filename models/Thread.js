const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    text: String,
    created_on: {
        type: Date,
        default: new Date(),
    },
    bumped_on: Date,
    board: String,
    replycount: { 
        type: Number,
        default: 0,
    }
});

const Thread = mongoose.model('Thread', schema);

module.exports = Thread;
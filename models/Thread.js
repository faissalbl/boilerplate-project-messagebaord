const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    text: String,
    created_on: {
        type: Date,
        default: () => new Date(),
    },
    delete_password: String,
    reported: {
        type: Boolean,
        default: false,
    }
});

const threadSchema = new mongoose.Schema({
    text: String,
    created_on: {
        type: Date,
        default: () => new Date(),
    },
    bumped_on: {
        type: Date,
        default: function () {
            return this.created_on
        },
    },
    board: {
        type: String,
        index: true,
    },
    replies: [replySchema],
    replycount: { 
        type: Number,
        default: 0,
    },
    reported: {
        type: Boolean,
        default: false,
    },
    delete_password: String,
});

const Thread = mongoose.model('Thread', threadSchema);

module.exports = Thread;
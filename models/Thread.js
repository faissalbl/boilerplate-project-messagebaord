const mongoose = require('mongoose');

const schema = new mongoose.Schema({
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
    replies: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Reply' } ],
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

const Thread = mongoose.model('Thread', schema);

module.exports = Thread;
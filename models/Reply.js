const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    thread_id: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Thread',
        index: true
    },
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

const Reply = mongoose.model('Reply', schema);

module.exports = Reply;
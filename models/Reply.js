const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    text: String,
    created_on: {
        type: Date,
        default: new Date(),
    },
});

const Reply = mongoose.model('Reply', schema);

module.exports = Reply;
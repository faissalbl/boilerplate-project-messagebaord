const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    text: String,
    created_on: Date,
});

const Reply = mongoose.model('Reply', schema);

module.exports = Reply;
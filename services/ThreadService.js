const Thread = require('../models/Thread');

module.exports.createThread = async function(board, text) {
    thread = new Thread({
        board,
        text,
    });

    return await thread.save();
};
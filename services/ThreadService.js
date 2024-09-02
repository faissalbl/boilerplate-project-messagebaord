const Thread = require('../models/Thread');

const BcryptService = require('./BcryptService');

module.exports.createThread = async function(board, text, deletePassword) {
    let deletePasswordHash;
    if (deletePassword) {
        deletePasswordHash = await BcryptService.hash(deletePassword);
    }

    thread = new Thread({
        board,
        text,
        delete_password: deletePasswordHash,
    });

    return await thread.save();
};
const Thread = require('../models/Thread');
const Reply = require('../models/Reply');

const BcryptService = require('./BcryptService');

async function hash(value) {
    let result;
    if (value) {
        result = await BcryptService.hash(value);
    }
    return result;
}

module.exports.createThread = async function(boardId, text, deletePassword) {
    const deletePasswordHash = await hash(deletePassword);

    const thread = new Thread({
        board: boardId,
        text,
        delete_password: deletePasswordHash,
    });

    return await thread.save();
};

module.exports.createReply = async function(threadId, text, deletePassword) {
    const deletePasswordHash = await hash(deletePassword);

    let reply = new Reply({
        text,
        delete_password: deletePasswordHash,
    });

    reply = await reply.save();

    await Thread.findByIdAndUpdate(threadId, { 
        $push: { replies: reply._id },
        $inc: { replycount: 1 },
        bumped_on: new Date()},
        { new: true, useFindAndModify: false });

    return reply;
}

module.exports.getRecentThreadsAndReplies = async function(boardId) {
    let threads = await Thread.find({ board: boardId })
        .sort({ bumped_on: -1 })
        .limit(10)
        .populate({
            path: 'replies',
            options: {
                sort: { created_on: -1 },
                limit: 3,
            },
            select: '-reported -delete_password',
        })
        .select('-reported -delete_password')
        .exec();
 
    return threads;
}
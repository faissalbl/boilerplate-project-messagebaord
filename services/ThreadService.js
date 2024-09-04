const mongoose = require('mongoose');
const Thread = require('../models/Thread');
const InvalidPasswordError = require('../errors/InvalidPasswordError');

const BcryptService = require('./BcryptService');

async function hash(value) {
    let result;
    if (value) {
        result = await BcryptService.hash(value);
    }
    return result;
}

module.exports.createThread = async function(boardId, text, deletePassword, replies) {
    const deletePasswordHash = await hash(deletePassword);

    const thread = new Thread({
        board: boardId,
        text,
        delete_password: deletePasswordHash,
        replies,
    });

    return await thread.save();
};

module.exports.createReply = async function(threadId, text, deletePassword) {
    const deletePasswordHash = await hash(deletePassword);

    let reply = {
        thread_id: threadId,
        text,
        delete_password: deletePasswordHash,
    };

    const thread = await Thread.findByIdAndUpdate(threadId, { 
        $push: { replies: reply },
        $inc: { replycount: 1 },
        bumped_on: new Date()},
        { new: true, useFindAndModify: false });

    // updated reply with _id
    reply = thread.replies[thread.replies.length - 1];

    return reply;
}

module.exports.getRecentThreadsAndReplies = async function(boardId) {
    const threads = await Thread.find({ board: boardId })
        .sort({ bumped_on: -1 })
        .limit(10)
        .select('-reported -delete_password -replies.reported -replies.delete_password');
    
    // as the limit option is not working for the subdocuments, then manually trim them.

    const threadsTrimmedReplies = [];
    threads.forEach(t => {
        // sorted by created_on descending
        const sortedReplies = t.replies.toSorted((a, b) => {
            if (b.created_on < a.created_on) return -1;
            if (b.created_on > a.created_on) return 1;
            return 0;
        });

        threadsTrimmedReplies.push({
            ...t._doc,
            replies: sortedReplies.slice(0, 3),
        });
    });

    return threadsTrimmedReplies;
}

module.exports.getThread = async function(threadId) {
    const thread = await Thread.findById(threadId, ['-reported', '-delete_password', '-replies.reported', '-replies.delete_password']);
    return thread;
}

module.exports.deleteThread = async function(threadId, deletePassword) {
    const thread = await Thread.findById(threadId, ['_id', 'delete_password']);
    const validPassword = await BcryptService.compare(deletePassword, thread.delete_password);
    if (!validPassword) throw new InvalidPasswordError();
    await Thread.findByIdAndDelete(thread._id);
}

module.exports.deleteReply = async function(threadId, replyId, deletePassword) {
    let thread = await Thread.findById(threadId, ['_id', 'delete_password', 'replies._id', 'replies.delete_password']);
    const reply = thread.replies.find(r => r._id.toString() === replyId.toString());
    const validPassword = await BcryptService.compare(deletePassword, reply.delete_password);
    if (!validPassword) throw new InvalidPasswordError();
    thread = await Thread.findOneAndUpdate(
        {  
            _id: new mongoose.Types.ObjectId(threadId),
            'replies._id': new mongoose.Types.ObjectId(replyId),
        }, 
        { 
            $set: { 'replies.$.text': '[deleted]' },
            $inc: { replycount: -1 },
        },
        {
            new: true,
        }
    );
}

module.exports.reportThread = async function(threadId) {
    await Thread.findByIdAndUpdate(threadId, { reported: true }, { useFindAndModify: false });
}

module.exports.reportReply = async function(threadId, replyId) {
    await Thread.findOneAndUpdate(
        {  
            _id: new mongoose.Types.ObjectId(threadId),
            'replies._id': new mongoose.Types.ObjectId(replyId),
        }, 
        { 
            $set: { 'replies.$.reported': true },
        }
    );
}
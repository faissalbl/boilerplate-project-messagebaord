const Thread = require('../models/Thread');
const Reply = require('../models/Reply');
const InvalidPasswordError = require('../errors/InvalidPasswordError');

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
        thread_id: threadId,
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
    const threads = await Thread.find({ board: boardId })
        .sort({ bumped_on: -1 })
        .limit(10)
        .populate({
            path: 'replies',
            options: {
                sort: { created_on: -1 },
                //limit: 3,
                //perDocumentLimit: 3, <<<<<---- this would be the correct property
                // but it generated one populate query per document, which is not desirable as performance is bad.
            },
            select: '-reported -delete_password',
        })
        .select('-reported -delete_password')
    
    // as the limit option is not working for the subdocuments, then manually trim them.
    const threadsTrimmedReplies = [];
    threads.forEach(t => {
        threadsTrimmedReplies.push({
            ...t._doc,
            replies: t._doc.replies.slice(0, 3),
        });
    });

    return threadsTrimmedReplies;
}

module.exports.getThread = async function(threadId) {
    const thread = await Thread.findById(threadId, ['-reported', '-delete_password']);
    await thread.populate({ path: 'replies', select: '-reported -delete_password' });
    return thread;
}

module.exports.deleteThread = async function(threadId, deletePassword) {
    const thread = await Thread.findById(threadId, ['_id', 'delete_password']);
    const validPassword = await BcryptService.compare(deletePassword, thread.delete_password);
    if (!validPassword) throw new InvalidPasswordError();
    await Thread.findByIdAndDelete(thread._id);
    await Reply.deleteMany({ thread_id: threadId });
}

module.exports.deleteReply = async function(replyId, deletePassword) {
    const reply = await Reply.findById(replyId, ['_id', 'delete_password']);
    const validPassword = await BcryptService.compare(deletePassword, reply.delete_password);
    if (!validPassword) throw new InvalidPasswordError();
    await Reply.findByIdAndUpdate(replyId, { text: '[deleted]' }, { useFindAndModify: false })
}

module.exports.reportThread = async function(threadId) {
    await Thread.findByIdAndUpdate(threadId, { reported: true }, { useFindAndModify: false });
}

module.exports.reportReply = async function(replyId) {
    await Reply.findByIdAndUpdate(replyId, { reported: true }, { useFindAndModify: false });
}
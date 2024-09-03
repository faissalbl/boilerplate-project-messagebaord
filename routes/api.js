'use strict';

const { createThread, createReply, getRecentThreadsAndReplies } = require('../services/ThreadService');

module.exports = function (app) {
  
    app.route('/api/threads/:board')
        .post(async (req, res) => {
            const board = req.params.board;
            const text = req.body.text;
            const deletePassword = req.body.delete_password;
            const thread = await createThread(board, text, deletePassword);
            res.json(thread);
        })
        .get(async (req, res) => {
            const board = req.params.board;
            const threads = await getRecentThreadsAndReplies(board);
            res.json(threads);
        });
      
    app.route('/api/replies/:board')
        .post(async (req, res) => {
            const { thread_id: threadId, text, delete_password: deletePassword } = req.body;
            const reply = await createReply(threadId, text, deletePassword);
            res.json(reply);
        });

};

'use strict';

const { createThread } = require('../services/ThreadService');

module.exports = function (app) {
  
    app.route('/api/threads/:board')
        .post(async (req, res) => {
            const board = req.params.board;
            const text = req.body.text;
            const deletePassword = req.body.delete_password;
            const thread = await createThread(board, text, deletePassword);
            res.json(thread);
        });
      
    app.route('/api/replies/:board');

};

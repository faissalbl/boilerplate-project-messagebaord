'use strict';

const { createThread } = require('../services/ThreadService');

module.exports = function (app) {
  
    app.route('/api/threads/:board')
        .post(async (req, res) => {
            const board = req.params.board;
            const text = req.body.text;
            const thread = await createThread(board, text);
            res.json(thread);
        });
      
    app.route('/api/replies/:board');

};

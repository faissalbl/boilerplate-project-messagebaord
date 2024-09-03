const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const Thread = require('../models/Thread');
const Reply = require('../models/Reply');
const { createThread } = require('../services/ThreadService');
const BcryptService = require('../services/BcryptService');

chai.use(chaiHttp);

let req;

suite('Functional Tests', function() {

    const boardId = 'general';

    suiteSetup(async () => {
        await Reply.deleteMany();
        await Thread.deleteMany();
    });

    beforeEach(async () => {
        console.log('creating chai request');
        req = chai.request(server);
    });

    test('Creating a new thread: POST request to /api/threads/{board}', async () => {
        const boardId = 'general';
        const text = 'Test Thread 1';
        const deletePassword = '123';
        const res = await req.post(`/api/threads/${boardId}`).send({ text, delete_password: deletePassword });
        const thread = res.body;
        
        assert.isDefined(thread);
        assert.isDefined(thread._id);
        assert.isString(thread.text);
        assert.isDefined(thread.created_on);
        assert.isDefined(thread.bumped_on);
        assert.equal(thread.created_on, thread.bumped_on);
        assert.isFalse(thread.reported);
        assert.isTrue(await BcryptService.compare(deletePassword, thread.delete_password));
        assert.isEmpty(thread.replies);
    });

    test('Creating a new reply: POST request to /api/replies/{board}', async () => {
        const boardId = 'general';
        let text = 'Test Thread for Reply 1';
        const deletePassword = '123';

        let thread = await createThread(boardId, text, deletePassword);

        const threadId = thread._id;
        text = 'Test Reply 1';
        const res = await req.post(`/api/replies/${boardId}`).send({ thread_id: threadId, text, delete_password: deletePassword });
        const reply = res.body;

        thread = await Thread.findById(threadId);

        assert.isDefined(reply);
        assert.isDefined(reply._id);
        assert.isString(reply.text);
        assert.isDefined(reply.created_on);
        assert.isFalse(reply.reported);
        assert.isTrue(await BcryptService.compare(deletePassword, reply.delete_password));

        assert.equal(thread.replycount, 1);
        assert.equal(thread.replies.length, 1);

        assert.isAbove(new Date(thread.bumped_on), new Date(reply.created_on));
    });

    afterEach(async () => {
        console.log('closing chai request');
        req.close();
    });
});

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const Thread = require('../models/Thread');
const Reply = require('../models/Reply');
const { createThread, createReply } = require('../services/ThreadService');
const BcryptService = require('../services/BcryptService');

chai.use(chaiHttp);

const boardId = 'general';

async function createThreadsAndReplies() {
    // create threads in parallel
    const deletePassword = 'abc123';

    const threadPromises = [];
    for (let i = 1; i <= 12; i++) {
        let text = `Thread ${i}`;
        const threadPromise = createThread(boardId, text, deletePassword);
        threadPromises.push(threadPromise);
    }
    const threads = await Promise.all(threadPromises);
    
    // create replies in parallel
    const replyPromises = [];
    threads.forEach(t => {
        for (let i = 1; i <= 5; i++) {
            text = `Reply ${i}`;
            const replyPromise =  createReply(t._id, text, deletePassword);
            replyPromises.push(replyPromise);
        }
    });
    await Promise.all(replyPromises);

    console.log('createThreadsAndRepliesEnd');
}

function sleep(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

let req;

suite('Functional Tests', function() {

    suiteSetup(async () => {
        await Reply.deleteMany();
        await Thread.deleteMany();
    });

    beforeEach(async () => {
        console.log('creating chai request');
        req = chai.request(server);
    });

    test('Creating a new thread: POST request to /api/threads/{board}', async () => {       
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

        assert.isAtLeast(new Date(thread.bumped_on), new Date(reply.created_on));
    });

    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', async () => {
        await createThreadsAndReplies();
        console.log('after create threads and replies');
        const res = await req.get(`/api/threads/${boardId}`);
        const threads = res.body;

        console.log(threads);

        assert.isArray(threads);
        assert.equal(threads.length, 10);
        assert.isAbove(new Date(threads[0].bumped_on), new Date(threads[1].bumped_on));
        assert.isAbove(new Date(threads[8].bumped_on), new Date(threads[9].bumped_on));
        threads.forEach(t => {
            assert.isDefined(t._id);
            assert.isString(t.text);
            assert.isDefined(t.created_on);
            assert.isDefined(t.bumped_on);
            assert.isUndefined(t.reported);
            assert.isUndefined(t.delete_password);
            assert.equal(t.replies.length, 3);
            assert.isDefined(t.replycount);
            let lastCreatedOn;
            t.replies.forEach(r => {
                assert.isDefined(r._id);
                assert.isString(r.text);
                assert.isDefined(r.created_on);
                assert.isUndefined(r.reported);
                assert.isUndefined(r.delete_password);
        
                if (!lastCreatedOn) lastCreatedOn = r.created_on;
                else {
                    assert.isBelow(new Date(r.created_on), new Date(lastCreatedOn));
                }
            });
        }); 
    }).timeout(60000);

    afterEach(async () => {
        console.log('closing chai request');
        req.close();
    });
});

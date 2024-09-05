const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const Thread = require('../models/Thread');
const { createThread, createReply } = require('../services/ThreadService');
const BcryptService = require('../services/BcryptService');

chai.use(chaiHttp);

const boardId = 'general';

async function createThreadsAndReplies() {
    // create threads in parallel
    const deletePassword = 'abc123';

    const replies = [];
    for (let i = 1; i <= 5; i++) {
        text = `Reply ${i}`;
        replies.push({
            text, 
            delete_password: deletePassword
        });
    }

    const threadPromises = [];
    for (let i = 1; i <= 12; i++) {
        let text = `Thread ${i}`;
        const threadPromise = createThread(boardId, text, deletePassword, replies);
        threadPromises.push(threadPromise);
    }
    await Promise.all(threadPromises);
}

let req;

suite('Functional Tests', function() {

    suiteSetup(async () => {
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

        assert.equal(new Date(reply.created_on).getTime(), new Date(thread.bumped_on).getTime());
    });

    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', async () => {
        await createThreadsAndReplies();
        const res = await req.get(`/api/threads/${boardId}`);
        const threads = res.body;

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
                    assert.isAtMost(new Date(r.created_on), new Date(lastCreatedOn));
                }
            });
        }); 
    });

    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', async () => {
        const deletePassword = '123';
        const thread = await createThread(boardId, 'Thread 1', deletePassword);
        const reply = await createReply(thread._id, 'Reply 1', deletePassword);
        const res = await req.delete(`/api/threads/${boardId}`).send({ thread_id: thread._id, delete_password: '456' });        
        assert.equal(res.text, 'incorrect password');

        const persistedThread = await Thread.findById(thread._id, [ '_id', 'replies' ]);
        assert.isNotNull(persistedThread);
    });

    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', async () => {
        const deletePassword = '123';
        const thread = await createThread(boardId, 'Thread 1', deletePassword);
        const reply = await createReply(thread._id, 'Reply 1', deletePassword);
        const res = await req.delete(`/api/threads/${boardId}`).send({ thread_id: thread._id, delete_password: deletePassword });        
        assert.equal(res.text, 'success');

        const persistedThread = await Thread.findById(thread._id, [ '_id' ]);
        assert.isNull(persistedThread);
    });

    test('Reporting a thread: PUT request to /api/threads/{board}', async () => {
        let thread = await createThread(boardId, 'Thread 5', '123');
        const res = await req.put(`/api/threads/${boardId}`).send({ thread_id: thread._id });        
        
        thread = await Thread.findById(thread._id, ['_id', 'reported']);

        assert.equal(res.text, 'reported');
        assert.isTrue(thread.reported);
    });
    
    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', async () => {
        const deletePassword = '123';
        let thread = await createThread(boardId, 'Thread 7', deletePassword);
        const reply1 = createReply(thread._id, 'Reply 1', deletePassword);
        const reply2 = createReply(thread._id, 'Reply 2', deletePassword);
        const reply3 = createReply(thread._id, 'Reply 3', deletePassword);
        const reply4 = createReply(thread._id, 'Reply 4', deletePassword);
        const reply5 = createReply(thread._id, 'Reply 5', deletePassword);

        await Promise.all([reply1, reply2, reply3, reply4, reply5]);

        const res = await req.get(`/api/replies/${boardId}?thread_id=${thread._id}`);
        thread = res.body;

        assert.isDefined(thread._id);
        assert.isString(thread.text);
        assert.isDefined(thread.created_on);
        assert.isDefined(thread.bumped_on);
        assert.isUndefined(thread.reported);
        assert.isUndefined(thread.delete_password);
        assert.equal(thread.replies.length, 5);
        assert.equal(thread.replycount, 5);
        let lastCreatedOn;
        thread.replies.forEach(r => {
            assert.isDefined(r._id);
            assert.isString(r.text);
            assert.isDefined(r.created_on);
            assert.isUndefined(r.reported);
            assert.isUndefined(r.delete_password);
        });
    });

    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', async () => {
        const deletePassword = '123';
        let thread = await createThread(boardId, 'Thread 1', deletePassword);
        const reply = await createReply(thread._id, 'Reply 1', deletePassword);
        const res = await req.delete(`/api/replies/${boardId}`).send({ thread_id: thread._id, reply_id: reply._id, delete_password: '456' });        
        assert.equal(res.text, 'incorrect password');

        thread = await Thread.findById(thread._id, [ '_id', 'replies' ]);

        const persistedReply = thread.replies.find(r => r._id.toString() === reply._id.toString());
        assert.isNotNull(persistedReply);
        assert.equal(persistedReply.text, 'Reply 1');
    });

    test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', async () => {
        const deletePassword = '123';
        let thread = await createThread(boardId, 'Thread 1', deletePassword);
        const reply = await createReply(thread._id, 'Reply 1', deletePassword);
        const res = await req.delete(`/api/replies/${boardId}`).send({ thread_id: thread._id, reply_id: reply._id, delete_password: deletePassword });        
        assert.equal(res.text, 'success');

        thread = await Thread.findById(thread._id, [ '_id', 'replies' ]);

        const persistedReply = thread.replies.find(r => r._id.toString() === reply._id.toString());
        assert.isNotNull(persistedReply);
        assert.equal(persistedReply.text, '[deleted]');
    });

    test('Reporting a reply: PUT request to /api/replies/{board}', async () => {
        const deletePassword = '123';
        let thread = await createThread(boardId, 'Thread 5', deletePassword);
        let reply = await createReply(thread._id, 'Reply 1', deletePassword);
        const res = await req.put(`/api/replies/${boardId}`).send({ thread_id: thread._id, reply_id: reply._id });        
        
        thread = await Thread.findById(thread._id, [ '_id', 'replies' ]);

        reply = thread.replies.find(r => r._id.toString() === reply._id.toString());
        assert.equal(res.text, 'reported');
        assert.isTrue(reply.reported);
    });
    
    afterEach(async () => {
        console.log('closing chai request');
        req.close();
    });

    suiteTeardown(async () => {
        await Thread.deleteMany();
    });
});

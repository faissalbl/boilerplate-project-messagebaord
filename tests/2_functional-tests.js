const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const Thread = require('../models/Thread');
const Reply = require('../models/Reply');
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
        const text = 'Test Thread 1'
        const deletePassword = '123';
        const res = await req.post('/api/threads/general').send({ text, delete_password: deletePassword });
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

    afterEach(async () => {
        console.log('closing chai request');
        req.close();
    });
});

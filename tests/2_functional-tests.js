const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const Thread = require('../models/Thread');
const Reply = require('../models/Reply');

chai.use(chaiHttp);

let req;

suite('Functional Tests', function() {
    suiteSetup(async () => {
        // await Reply.deleteMany();
        // await Thread.deleteMany();
    });

    beforeEach(async () => {
        console.log('creating chai request');
        req = chai.request(server);
    });

    test('Creating a new thread: POST request to /api/threads/{board}', async () => {
        assert.isTrue(true);
    });
});

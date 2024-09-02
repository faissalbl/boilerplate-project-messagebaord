const mongoose = require('mongoose');

class DatabaseService {
    constructor() {
        const mongoURI = process.env.DB;
        this.mongoURI = mongoURI;
    }

    connect() {
        mongoose.connect(
            this.mongoURI, 
            { useNewUrlParser: true, useUnifiedTopology: true }
        );
    }
}

module.exports = new DatabaseService();
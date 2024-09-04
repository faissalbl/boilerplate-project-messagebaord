class InvalidPasswordError extends Error {
    constructor(message) {
        super(message);
        if (!message) this.message = 'incorrect password';
        this.name = 'InvalidPasswordError';
    }
}

module.exports = InvalidPasswordError;
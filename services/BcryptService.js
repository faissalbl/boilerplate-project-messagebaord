const bcrypt = require('bcrypt');

const saltRounds = 12;

module.exports.hash = async (str) => {
    return await bcrypt.hash(str, saltRounds);
}

module.exports.compare = async (str, hash) => {
    return await bcrypt.compare(str, hash);
}
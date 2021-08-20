const {Schema, model, Types} = require('mongoose');

const userSchema = new Schema({
    email: {type: String, required: true, unique: true},
    name: {type: String, required: true},
    password: {type: String, required: true},
    chats: {type: Array, required: true},
})

module.exports = model('User', userSchema);
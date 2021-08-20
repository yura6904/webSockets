const {Schema, model, Types} = require('mongoose');

const chatsSchema = new Schema({
    users: [{type: Types.ObjectId, required: true}],
    messages: {type: Array, required: true},
    name: {type: String, required: true}
})

module.exports = model('Chats', chatsSchema);
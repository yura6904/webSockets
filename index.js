const express = require('express');
const mongoose = require('mongoose');
const config = require('config');

const PORT = config.PORT || 5000;
const app = express();

app.use(express.json({extended: true}));
app.use('/api/auth', require('./routes/auth.routes'));

const server = require('http').createServer(app);
const io = require('socket.io')(server, {cors:{origin:"*"}});

async function start() {
    try {
        await mongoose.connect(config.get('mongoUri'), {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false
        });
        io.on('connection', (socket) => {
            console.log('socket started', socket.id);
            
            socket.on('send message', (data) => {
                io.emit('save chat message', {
                    message: data.message,
                    userId: data.userId,
                    chatId: data.chatId
                });
            });
        });
        server.listen(PORT, () => {
            console.log('server started');
        });

    } catch (e) {
        console.log(e)
    }
}
start();

const {Router} = require('express');
const jwt = require('jsonwebtoken');
const {check, validationResult} = require('express-validator');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const config = require('config');
const Chats = require('../models/Chats');

const router = Router();

router.post(
    '/register', 
    [
        check('email', 'Некорректный email').isEmail(),
        check('password', 'Минимальная длина пароля 6 символов')
            .isLength({min: 6})
    ],
    async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
                message: 'Некорректные данные при регистрации'
            });
        }

        const {email, password, name} = req.body;
        const candidate = await User.findOne({email});

        if (candidate) {
            return res.status(400).json({message: 'Такой пользователь уже существует'});
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({email, password: hashedPassword, name: name});

        await user.save();
        res.status(201).json({message: 'Пользователь создан'});
        
    } catch (e) {
        res.status(500).json({message: 'Something wrong with server'});
    }
});

router.post(
    '/login',
    [
        check('email', 'Введите корректный email').normalizeEmail().isEmail(),
        check('password', 'Введите пароль').exists()
    ],
    async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
                message: 'Некорректные данные при входе в систему'
            });
        }

        const {email, password} = req.body;
        const user = await User.findOne({email});

        if (!user) {
            return res.status(400).json({message: 'Пользователь не найден'});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({message: 'Неверный пароль, попробуйте снова'});
        }

        const token = jwt.sign(
            {userId: user.id},
            config.get('jwtSecret'),
            {expiresIn: '1h'}
        )

        res.json({token, userId: user.id});

    } catch (e) {
        res.status(500).json({message: 'Something wrong with server'});
    }
});

router.post(
    '/getChatsData', 
    async (req, res) => {
    try {
        const {userId} = req.body;
        const user = await User.findById(userId);
        const chats = [];
        for (let i = 0; i < user.chats.length; i++) {
            chats.push(await Chats.findById(user.chats[i]));
        }
        
        res.json({chats: chats});
    } catch (e) {
        res.status(500).json({message: 'Something wrong with server'});
    }
});

router.get(
    '/getUsersData', 
    async (req, res) => {
    try {
        const users = await User.find();
        res.json({users: users});
    } catch (e) {
        res.status(500).json({message: 'Something wrong with server'});
    }
});

router.post(
    '/createNewChat', 
    async (req, res) => {
    try {
        const {usersId, mainUser, chatName} = req.body;
        //заполнили массив айди пользователей
        let users = [];
        usersId.forEach(u => {
            users.push(u);
        });
        users.push(mainUser);

        //создали новый чат
        const newChat = await new Chats({
            users: users,
            messages: [
                {}
            ],
            name: chatName !== '' ? chatName : 'NewChat'
        }).save();
        console.log('All users',users);

        for (let i = 0; i < users.length; i++) {
            console.log('iteration', i);

            //нашли юзера
            const user = await User.findById(users[i]);
            console.log('user',user);

            //обновили массив чатов у юзеров
            let userChatsList = user.chats;
            userChatsList.push(newChat._id);

            let updatedUser = await User.findByIdAndUpdate(users[i], {chats: userChatsList});
            console.log('updatedUser',updatedUser);
        }
        
        const user = await User.findById(mainUser);
        const chats = [];
        for (let i = 0; i < user.chats.length; i++) {
            chats.push(await Chats.findById(user.chats[i]));
        }
        
        res.json({chats: chats});
    } catch (e) {
        res.status(500).json({message: e.message});
    }
});

router.post(
    '/saveMessage', 
    async (req, res) => {
    try {
        const {chatId, message, userId} = req.body;
        const user = await User.findById(userId);
        //нашли чат
        const chat = await Chats.findById(chatId);
        const newMsg = {
            message: message,
            userId: userId,
            userName: user.name,
        };
        const updatedMsgs = chat.messages;
        updatedMsgs.push(newMsg);
        //сохраняем новое сообщение в чате
        await Chats.findByIdAndUpdate(chatId, {messages: updatedMsgs});
        const result = await Chats.findById(chatId);
        console.log(result);
        res.json(result);
    } catch (e) {
        res.status(500).json({message: e.message});
    }
});

module.exports = router
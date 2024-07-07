const VersionBot = `Version Bot v1 | Worked | Started at (Kyiv time) - ${new Date().toLocaleString('en-US', { timeZone: 'Europe/Kiev' })}`;
const InfoBot = `Made by Farrew | Help - @developer_telegram_bots (telegram) or farrew (discord)`;
const TelegramApi = require('node-telegram-bot-api')
const Token = '7371351845:AAHeM4gOn8YLcvsyNYhpUo9Nu6KNQz5p94w'
const bot = new TelegramApi(Token, {polling: true})
const { MongoClient, ObjectId } = require('mongodb')
console.log(VersionBot + `\n` + InfoBot)
const chatIdChannel = -1002014360743
const cron = require('node-cron');
let adminChatId
let menegerChatId
const uri = "mongodb+srv://feegff1:m2ekJMnzxpx5GvaB@resellerbot.mge61yy.mongodb.net/?retryWrites=true&w=majority&appName=reSellerBot";
const client = new MongoClient(uri);
const state = {}
let db

async function connectToMongoDB() {
    try {
        await client.connect();
        db = client.db("bot-Reseller");
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error(`Ошибка подключения к MongoDB: ${error}`);
    }
}
connectToMongoDB().then(()=> {

loadManagers()
loadAdmins()
checkHostingDates()
bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id
    const chatUn = msg.chat.username
    const referrerId = match[1].trim();
    if (referrerId) {
        if (!isNaN(referrerId) && referrerId !== '') {
            await addReferral(referrerId, chatId, chatUn);
        }
    }
    await createNewUser(chatId, chatUn)
    let language = await languageUser(chatId)
    let keyboard
    let message
    if (language === 'ru') {
        message = `👊Приветствуем Вас *${msg.from.first_name}* в сервисе - @BuckCreatorBot

*🦾 Наш проект представляет вам возможность:*

🙌Создать своего коммерческого бота, в несколько кликов.
💻Наши боты созданые с нуля, все идеи для ботов придумываем сами.

_📊 Мы разрабатываем максимально понятный интерфейс у нас максимально приятная тех поддержка. 🦾 Не оставим вас без регулярных обновлениях системы, всё только для вас)_`
        keyboard = [['🧑‍🏫 Заказать бота', '🔑 Админ панель'], ['👤 Мой профиль', '🦾 Партнёры'], ['🗽 Другое']]
    } else if (language === 'ua') {
        message = `👊 Вітаємо Вас *${msg.from.first_name}* у сервісі - @BuckCreatorBot

 *🦾 Наш проект представляє вам можливість:*

 🙌Створити свого комерційного бота в кілька кліків.
 💻Наші боти створені з нуля, всі ідеї для ботів вигадуємо самі.

 _📊 Ми розробляємо максимально зрозумілий інтерфейс у нас максимально приємна підтримка.  🦾 Не залишимо вас без регулярних оновлень системи, все тільки для вас)_`
        keyboard = [['🧑‍🏫 Замовити бот', '🔑 Адмін панель'], ['👤 Мій профіль', '🦾 Партнери'], ['🗽 Інше']]
    }
    bot.sendMessage(chatId, message, {
        reply_markup: {
            keyboard: keyboard,
            resize_keyboard : true
        },
        parse_mode: 'Markdown'
    })
})

bot.onText(/🧑‍🏫 Заказать бота|🧑‍🏫 Замовити бот/, async (msg) => {
    const chatId = msg.chat.id;
    let language = await languageUser(chatId);
    let inlineKeyboard = [];
    let message;
    const bots = await db.collection('bots').find({}).toArray();
    let row = [];
    if (language === 'ru') {
        message = '🔍 Выберите бот из нашего списка :\n' +
            '❗️ После выбора бота, вы сможете сами через "админ панель", производить настройку бота, оплачивать хостинг, заказать обновление которые вам нужны, управлять им,  и многое другое.';
        for (let i = 0; i < bots.length; i += 1) {
            const bot = bots[i];
            row.push({
                text: bot.botName, // Название заказа для отображения на кнопке
                callback_data: `bot_${bot._id}` // Callback данные, содержащие идентификатор заказа
            });
            if (row.length === 2) {
                inlineKeyboard.push(row);
                row = [];
            }
        }
        if (row.length > 0) {
            inlineKeyboard.push(row);
        }

    } else if (language === 'ua') {
        message = ' 🔍 Виберіть бот з нашого списку:\n' +
            ' ❗️ Після вибору бота, ви зможете самі через "адмін панель", проводити налаштування бота, оплачувати хостинг, замовити оновлення які вам потрібні, керувати ним, та багато іншого.';

        for (let i = 0; i < bots.length; i += 1) {
            const bot = bots[i];
            row.push({
                text: bot.botName, // Название заказа для отображения на кнопке
                callback_data: `bot_${bot._id}` // Callback данные, содержащие идентификатор заказа
            });
            if (row.length === 2) {
                inlineKeyboard.push(row);
                row = [];
            }
        }
        if (row.length > 0) {
            inlineKeyboard.push(row);
        }
    }
    bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: inlineKeyboard,
        }
    });
});
bot.onText(/🔑 Админ панель|🔑 Адмін панель/, async (msg) => {
    const chatId = msg.chat.id;
    let language = await languageUser(chatId);
    let inlineKeyboard = [];
    let message
    if (await haveBots(chatId)) {
        const user = await db.collection('users').findOne({ chatId: chatId });
        const bots = await db.collection('botsUser').find({ _id: { $in: user.bots.map(id => new ObjectId(id)) } }).toArray();
        const userBots = await db.collection('botsUser').find({ buyerId: chatId }).toArray();

        if (language === 'ru') {
            message = "Вы попали в раздел *🔑 Админ панель*!\nВ этом разделе вы можете управлять своими ботами\n\nВыберите бота, которому вы хотите поменять настройки:";
        } else if (language === "ua") {
            message = "Ви потрапили до розділу *🔑 Адмін панель*!\nУ цьому розділі ви можете керувати своїми ботами\n\nВиберіть бота, якому ви хочете змінити налаштування:";
        }

        let row = [];
        let inlineKeyboard = [];
        let addedBots = new Set();

        bots.forEach(bot => {
            userBots.filter(ub => ub.botName === bot.botName).forEach(userBot => {
                if (!addedBots.has(userBot.BID)) {
                    row.push({ text: bot.botName + ' | ' + userBot.BID, callback_data: `manage_bot_${userBot.BID}` });
                    addedBots.add(userBot.BID);
                    if (row.length === 2) {
                        inlineKeyboard.push(row);
                        row = [];
                    }
                }
            });
        });

        if (row.length > 0) inlineKeyboard.push(row);

        if (inlineKeyboard.length > 0) {
            bot.sendMessage(chatId, message, {
                reply_markup: {
                    inline_keyboard: inlineKeyboard
                },
                parse_mode: 'Markdown'
            });
        }

    } else {
        if (language === 'ru') {
            message = '👀 У вас куплено 0 ботов.\n' +
                '🔑 После покупки одного или более ботов, вам откроется "админ панель" а так же закритый чат клиентов, чтоб решать ваши проблемы напрямую при настройке ботов или других вопросов вам помогут наши менеджеры в чате 24/7.'
        } else if (language === 'ua') {
            message = '👀 У вас куплено 0 ботів.\n' +
                '🔑 Після покупки одного або більше ботів, вам відкриється "адмін панель" і закритий чат клієнтів, щоб вирішувати ваші проблеми безпосередньо при налаштуванні ботів або інших питань вам допоможуть наші менеджери в чаті 24/7.'
        }
        bot.sendMessage(chatId, message);
    }
})
bot.onText(/👤 Мой профиль|👤 Мій профіль/, async (msg)=> {
    const chatId = msg.chat.id;
    let language = await languageUser(chatId);
    let inlineKeyboard = [];
    let message
    const user = await db.collection('users').findOne({chatId: chatId})
    if (language === 'ru') {
        message = '*👤 Мой профиль:*\n' +
            '\n' +
            `🆔 Ваш ID: \`${chatId}\`
` +
            `🤖 Куплено ботов: *${user.bots.length}*
` +
            '\n' +
            `🌞 Ваш баланс: *${user.balance}$*
`
        inlineKeyboard = [
            [{text: 'Пополнить', callback_data: 'upToAccountBalance'}, {text: 'Конвертировать', callback_data: 'convertRefBalance'}],
            [{text: 'Изменить язык', callback_data: 'changeLanguage'}]
        ]
    } else if (language === 'ua') {
        message = ' *👤 Мій профіль :*\n' +
            '\n' +
            `🆔 Ваш ID: \`${chatId}\`
`+
            `🤖 Куплено ботів: *${user.bots.length}*
`+
            '\n' +
            `🌞 Ваш баланс: *${user.balance}$*
`
        inlineKeyboard = [
            [{text: 'Поповнити', callback_data: 'upToAccountBalance'}, {text: 'Конвертувати', callback_data: 'convertRefBalance'}],
            [{text: 'Змінити мову', callback_data: 'changeLanguage'}]
        ]
    }
    bot.sendMessage(chatId, message, {reply_markup: {inline_keyboard: inlineKeyboard}, parse_mode: 'Markdown'});
})
bot.onText(/🦾 Партнёры|🦾 Партнери/, async (msg)=> {
    const chatId = msg.chat.id;
    let language = await languageUser(chatId);
    let message
    let inlineKeyboard
    const user = await db.collection('users').findOne({chatId: chatId})
    const userInvited = user.usersInvited.length
    let lvl
    if (userInvited < 5) {
        lvl = 1
    } else if (userInvited > 5 || userInvited < 10) {
        lvl = 2
    } else if (userInvited > 10) {
        lvl = 3
    }
    if (language === 'ru') {
        message = `👥 Партнёрская программа:
Даёт возможность хорошо заработать, с каждого потенциального клиента который купил себе бот вы получаете от 4% от заказа. Так же если вы хотите стать Медиа нашего проекта мы сможете получать ещё дополнительные 4%. \n\n
👤 Ваши партнёры:

1 уровень - ${user.usersInvited.length} партнёров - ${user.statusRefBalance}$ заработано

🔗 Ваша индивидуальная партнёрская ссылка: https://t.me/BuckCreatorBot?start=${chatId}`
        inlineKeyboard = [[{text: 'Активировать промокод', callback_data: 'activatePromocode'}]]
    } else if (language === 'ua') {
        message = `👥 Партнерська програма:
Дає можливість добре заробити, з кожного потенційного клієнта, який купив собі бот ви отримуєте від 4% від замовлення.\n\n
👤 Ваші партнери:

1 рівень - ${user.usersInvited.length} партнерів - ${user.statusRefBalance}$ зароблено

🔗 Ваше індивідуальне партнерське посилання: https://t.me/BuckCreatorBot?start=${chatId}`
        inlineKeyboard = [[{text: 'Активувати промокод', callback_data: 'activatePromocode'}]]
    }
    bot.sendMessage(chatId, message, {reply_markup: {inline_keyboard: inlineKeyboard}});
})
    bot.onText(/🗽 Інше|🗽 Другое/, async (msg)=> {
    const chatId = msg.chat.id;
    let language = await languageUser(chatId);
    let message
    let inlineKeyboard
            await db.collection('users').findOne({chatId: chatId});
            if (language === 'ru') {
                message = '🗽 Другое :'
                inlineKeyboard = [
                    [{text: '✈️ Статистика проекта', callback_data: 'statusProject'}],
                    [{text: '📚 Обновление и Новости', url: 'https://t.me/NewsBuckCreator'}, {text: '🔍 Отзывы клиентов', url: 'https://t.me/+h6Vbn9oXN5tiZDRi'}],
                    [{text: '🔑 Закритый чат клиентов', callback_data: 'clientChat'}, {text: '🤖 Discussion Chat', url: 'https://t.me/+jdrAX6izAAU2YjVi'}],
                    [{text: '🛑 Главные правила проекта', url: 'https://telegra.ph/Glavnye-Pravila-Proekta-05-24'}, {text: '👥 Общый чат проекта', url: 'https://t.me/ForumBuckCreator'}],
                    [{text: '🆘 Помощь', callback_data: 'createTiketHelpManager'}, {text: '😈 Если спам', url: 'https://t.me/HelpersBuckCreatorBot'}],
                ]
            } else if (language === 'ua') {
                message = '🗽 Інше :'
                inlineKeyboard = [
                    [{text: '✈️ Статистика проекту', callback_data: 'statusProject'}],
                    [{text: '📚 Оновлення та Новини', url: 'https://t.me/NewsBuckCreator'}, {text: '🔍 Відгуки клієнтів', url: 'https://t.me/+h6Vbn9oXN5tiZDRi'}],
                    [{text: '🔑 Закритий чат клієнтів', callback_data: 'clientChat'}, {text: '🤖 Discussion Chat', url: 'https://t.me/+jdrAX6izAAU2YjVi'}],
                    [{text: '🛑 Головні правила проекту', url: 'https://telegra.ph/Golovn%D1%96-Pravila-Proektu-05-24'}, {text: '👥 Загальний чат проекту', url: 'https://t.me/ForumBuckCreator'}],
                    [{text: '🆘 Допомога', callback_data: 'createTiketHelpManager'}, {text: '😈 Якщо спам', url: 'https://t.me/HelpersBuckCreatorBot'}],
                ]
            }
            bot.sendMessage(chatId, message, {reply_markup: {inline_keyboard: inlineKeyboard}});

        }
    )
    if (data === 'upToAccountBalance') {
        let message
        if (language === 'ru') {
            message = '💳 Введите сумму пополнения в UAH'
        } else if (language === "ua") {
            message = '💳 Введіть сумму поповнення в UAH'
        }
        bot.sendMessage(chatId, message)
        state[chatId] = {awaitingAmountupToAccountBalance: true}
    }
    if (data === 'convertRefBalance') {
        const user = await db.collection('users').findOne({chatId: chatId})
        const refBalance = user.refBalance
        let message
        if (refBalance === 0) {
            if (language === "ru") {
                message = '*🚫 На вашем реф-балансе - 0*'
            } else if (language === "ua") {
                message = '*🚫 На вашому реф-балансі - 0*'
            }
            bot.sendMessage(chatId, message, {parse_mode: 'Markdown'})
            return
        }
        await db.collection('users').findOneAndUpdate({chatId: chatId}, {$inc: {refBalance: -refBalance, balance: +refBalance}})
        if (language === 'ru') {
            message = `*✅ Успешно!*\n\n_Зайдите в кошелёк что бы проверить баланс!_`
        } else if (language === "ua") {
            message = `*✅ Успішно!*\n\n_Зайдіть в гаманець щоб перевірити баланс!_`
        }
        bot.sendMessage(chatId, message, {parse_mode: 'Markdown'})
    }
    if (data === 'byUkrBanks') {
        const amount = state[chatId].amountUpToPay
        state[chatId].currencyByPay = 'Bank Ukraine'
        let message
        let inlineKeyboard
        if (language === "ru") {
            message = `💳 Оплатите - *${amount} UAH*, на карту \`4441111130506680\`\n\n_После оплаты, нажмите на кнопку оплатил и в течении 24 часов вашу заявку обработают_`
            inlineKeyboard = [[{text: 'Я оплатил', callback_data: 'IHavePaid'}]]
        } else if (language === 'ua') {
            message = `💳 Оплатіть - *${amount} UAH*, на карту \`4441111130506680\`\n\n_Після оплати, натисніть на кнопку сплатив та протягом 24 годин вашу заявку опрацюють_`
            inlineKeyboard = [[{text: 'Я оплатив', callback_data: 'IHavePaid'}]]
        }
        bot.sendMessage(chatId, message, {reply_markup: {
            inline_keyboard: inlineKeyboard
        }, parse_mode: 'Markdown'})
    }
    if (data === 'byUsdtErc20') {
        const amount = state[chatId].amountUpToPay
        state[chatId].currencyByPay = 'USDT ERC-20'
        let message
        let inlineKeyboard
        if (language === "ru") {
            message = `💳 Оплатите - *${amount} UAH*, на USDT ERC-20 \`0x26bcf456cef7f4bbe4d2bb0a4f792327e8e677fd\`\n\n_После оплаты, нажмите на кнопку оплатил и в течении 24 часов вашу заявку обработают_`
            inlineKeyboard = [[{text: 'Я оплатил', callback_data: 'IHavePaid'}]]
        } else if (language === 'ua') {
            message = `💳 Оплатіть - *${amount} UAH*, на USDT ERC-20 \`0x26bcf456cef7f4bbe4d2bb0a4f792327e8e677fd\`\n\n_Після оплати, натисніть на кнопку сплатив та протягом 24 годин вашу заявку опрацюють_`
            inlineKeyboard = [[{text: 'Я оплатив', callback_data: 'IHavePaid'}]]
        }
        bot.sendMessage(chatId, message, {reply_markup: {
                inline_keyboard: inlineKeyboard
            }, parse_mode: 'Markdown'})
    }
    if (data === 'byUsdtTrc20') {
        const amount = state[chatId].amountUpToPay
        state[chatId].currencyByPay = 'USDT TRC-20'
        let message
        let inlineKeyboard
        if (language === "ru") {
            message = `💳 Оплатите - *${amount} UAH*, на USDT TRC-20 \`TC1m31tMa6CHomw2NaFk31XAotMniZjPw2\`\n\n_После оплаты, нажмите на кнопку оплатил и в течении 24 часов вашу заявку обработают_`
            inlineKeyboard = [[{text: 'Я оплатил', callback_data: 'IHavePaid'}]]
        } else if (language === 'ua') {
            message = `💳 Оплатіть - *${amount} UAH*, на USDT TRC-20 \`TC1m31tMa6CHomw2NaFk31XAotMniZjPw2\`\n\n_Після оплати, натисніть на кнопку сплатив та протягом 24 годин вашу заявку опрацюють_`
            inlineKeyboard = [[{text: 'Я оплатив', callback_data: 'IHavePaid'}]]
        }
        bot.sendMessage(chatId, message, {reply_markup: {
                inline_keyboard: inlineKeyboard
            }, parse_mode: 'Markdown'})
    }
    if (data === 'IHavePaid') {
        const amount = state[chatId].amountUpToPay
        const currencyByPay = state[chatId].currencyByPay
        let message
        if (language === 'ru') {
            message = '*⏱ Ваша заявка отправлена в оброботку.*'
        } else if (language === 'ua') {
            message = '*⏱ Ваша заявка відправлена в обробку.*'
        }
        bot.sendMessage(chatId, message, {parse_mode: 'Markdown'})
        const botOptions = await db.collection('botOptions').findOne({});
        const admins = botOptions.admins;
        for (let i = 0; i < admins.length; i += 1) {
            const adminId = admins[i];
            bot.sendMessage(adminId, `_Новая заявка на пополнение аккаунта:_ \n\nChat Id - *${chatId}*\nAmount - *${amount} UAH*\nPayment method - *${currencyByPay}*`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{text: `Подтвердить оплату`, callback_data: `ConfirmPayment_${chatId}`}, {text: `Отклонить оплату`, callback_data: `DeclinePayment_${chatId}`}]
                    ]
                }
            });
        }
    }
    if (data.startsWith('ConfirmPayment_')) {
        const userId = data.split('_')[1]
        const amount = state[userId].amountUpToPay
        await db.collection('users').findOneAndUpdate({chatId: parseFloat(userId)}, {$inc: {balance: amount}})
        bot.editMessageText('Заявка одобрена.', {chat_id: chatId, message_id: messageId})
        let language = await languageUser(parseFloat(userId))
        let message
        if (language === 'ru') {
            message = '*✅ Ваша заявка на пополнение счёта была одобрена!*\n\n_Перейдите в кошелёк что бы проверить ваш баланс_'
        } else if (language === 'ua') {
            message = '*✅ Ваша заявка на поповнення рахунку була схвалена!*\n\n_Перійдіть в гаманець щоб перевірити ваш баланс_'
        }
        bot.sendMessage(userId, message, {parse_mode: 'Markdown'})
    }
    if (data.startsWith('DeclinePayment_')){
        const userId = data.split('_')[1]
        bot.editMessageText('Заявка отклонена.', {chat_id: chatId, message_id: messageId})
        let language = await languageUser(parseFloat(userId))
        let message
        if (language === 'ru') {
            message = '*❌ Ваша заявка на пополнение счёта была отклонена!*\n\n_Напишите в "Помощь", чтобы узнать причину._'
        } else if (language === 'ua') {
            message = '*❌ Ваша заявка на поповнення рахунку була відхилина!*\n\n_Напишіть в "Допомога" щоб дізнатися причину._'
        }
        bot.sendMessage(userId, message, {parse_mode: 'Markdown'})
    }
    if (data.startsWith('bot_')){
        let message
        let inlineKeyboard
        const botInfo = await db.collection('bots').findOne({ _id: new ObjectId(data.split('_')[1]) })
        if (!botInfo) {
            return
        }
        if (language === "ru"){
            message = `🚀☝️Пожалуйста перепроверьте несколько раз перед покупкой, правильно ли вы выбрали бот который хотите приобрести. В случаи если вы купите не того бота которого хотели, возврат средств будет не возможен! Так же советуем вам прочитать правила проекта.

❔Вы хотите приобрести бота: ${botInfo.botName} 

💳 Цена: ${botInfo.priceUAH} UAH | ${botInfo.priceUSD} USD

 🤖 ${botInfo.botName} - это бот который позволяет:
${botInfo.description}

♦️ Пример бота: ${botInfo.linkTestBot}`
            inlineKeyboard = [
                [{text: `Заказать за ${botInfo.priceUAH} UAH | ${botInfo.priceUSD} USD`, callback_data: `BotBuy_${botInfo._id}`}],
                [{text: 'Назад', callback_data: 'goBackToListBot'}]
            ]
        } else if (language === 'ua') {
            message = `☝️ Будь ласка перевірте ще раз кілька разів перед покупкою, чи правильно ви вибрали бот який хочете придбати.  Якщо ви купите не того бота якого хотіли, повернення коштів буде не можливим!  Також радимо вам прочитати правила проекту.

 ❔Ви хочете придбати бота: ${botInfo.botName}

 💳 Ціна: ${botInfo.priceUAH} UAH |  ${botInfo.priceUSD} USD

  🤖 ${botInfo.botName} - це бот, який дозволяє:
 ${botInfo.description}

 ♦️ Приклад бота: ${botInfo.linkTestBot}`
            inlineKeyboard = [
                [{text: 'Придбати бота', callback_data: `BotBuy_${botInfo._id}`}],
                [{text: 'Назад', callback_data: 'goBackToListBot'}]
            ]
        }
        bot.editMessageText(message, {chat_id: chatId, message_id: messageId, reply_markup: {inline_keyboard: inlineKeyboard}})
    }
    if (data === 'goBackToListBot') {
        let inlineKeyboard = [];
        let message;
        const bots = await db.collection('bots').find({}).toArray();
        let row = [];
        if (language === 'ru') {
            message = '🔍 Выберите бот из нашего списка :\n' +
                '❗️ После выбора бота, вы сможете сами через "админ панель", производить настройку бота, оплачивать хостинг, заказать обновление которые вам нужны, управлять им,  и многое другое.';
            for (let i = 0; i < bots.length; i += 1) {
                const bot = bots[i];
                row.push({
                    text: bot.botName, // Название заказа для отображения на кнопке
                    callback_data: `bot_${bot._id}` // Callback данные, содержащие идентификатор заказа
                });
                if (row.length === 2) {
                    inlineKeyboard.push(row);
                    row = [];
                }
            }
            if (row.length > 0) {
                inlineKeyboard.push(row);
            }

        } else if (language === 'ua') {
            message = ' 🔍 Виберіть бот з нашого списку:\n' +
                ' ❗️ Після вибору бота, ви зможете самі через "адмін панель", проводити налаштування бота, оплачувати хостинг, замовити оновлення які вам потрібні, керувати ним, та багато іншого.';

            for (let i = 0; i < bots.length; i += 1) {
                const bot = bots[i];
                row.push({
                    text: bot.botName, // Название заказа для отображения на кнопке
                    callback_data: `bot_${bot._id}` // Callback данные, содержащие идентификатор заказа
                });
                if (row.length === 2) {
                    inlineKeyboard.push(row);
                    row = [];
                }
            }
            if (row.length > 0) {
                inlineKeyboard.push(row);
            }
        }
        bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: inlineKeyboard,
            }
        });
    }
    if (data.startsWith('BotBuy_')) {
        const id = data.split('_')[1];
        const botInfo = await db.collection('bots').findOne({_id: new ObjectId(id)});
        const user = await db.collection('users').findOne({chatId: chatId});
        const language = await languageUser(chatId)
        if (user.balance < botInfo.priceUAH) {
            try {
                if (language === 'ru') {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: '🚫 У вас недостаточный баланс.\nПополните и попробуйте еще раз.',
                        show_alert: true
                    });
                } else if (language === 'ua') {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: '🚫 У вас недостатній баланс.\nПоповніть і спробуйте ще раз.',
                        show_alert: true
                    });
                }
            } catch (error) {
                console.error('Ошибка при ответе на недостаточный баланс:', error);
            }
            return
        } else {
            if (language === 'ru') {
                bot.editMessageText(`Вы уверены в покупке бота - *${botInfo.botName}*?`, {chat_id: chatId, message_id: messageId ,reply_markup: {inline_keyboard: [[{text: 'Да', callback_data: `yesBuyBot_${botInfo._id}`}], [{text: '🚫 Отмена', callback_data: `bot_${botInfo._id}`}]]}, parse_mode: 'Markdown'})
            } else if (language === 'ua') {
                bot.editMessageText(`Ви впевнені у покупці бота - *${botInfo.botName}*?`, {chat_id: chatId, message_id: messageId ,reply_markup: {inline_keyboard: [[{text: 'Так', callback_data: `yesBuyBot_${botInfo._id}`}], [{text: '🚫 Скасувати', callback_data: `bot_${botInfo._id}`}]]}, parse_mode: 'Markdown'})
            }
        }
    }
    if (data === 'goBackToListBot') {

    }
    if (data.startsWith('yesBuyBot_')) {
        const id = data.split('yesBuyBot_')[1]
        const botInfo = await db.collection('bots').findOne({_id: new ObjectId(id)})
        await db.collection('users').findOne({chatId: chatId});
        const language = await languageUser(chatId)
        const priceBot = 0 - botInfo.priceUAH
        db.collection('users').updateOne({ chatId: chatId }, { $inc: { balance: Math.round(priceBot) } })
        db.collection('bots').updateOne({_id: new ObjectId(id)}, { $inc: { buys: 1 }})
        const BID = await generateBotIdOnly()
        const botName = botInfo.botName
        const buyerId = chatId
        const token = ''
        const adminId = chatId
        const price = botInfo.priceUAH
        const balanceBot = 0
        const registrationDate = new Date().toLocaleString('en-US', { timeZone: 'Europe/Kiev' })
        const hostingDate = new Date();
        hostingDate.setMonth(hostingDate.getMonth() + 1);
        const hosting = hostingDate.toLocaleDateString('en-GB', { timeZone: 'Europe/Kiev' });
        await db.collection('botsUser').insertOne({
            BID,
            botName,
            balanceBot,
            buyerId,
            token,
            adminId,
            hosting,
            price,
            registrationDate,
        });
        const newBot = await db.collection('botsUser').findOne({BID: BID})
        db.collection('users').updateOne({ chatId: chatId }, { $push: { bots: newBot._id.toString() } })
        let message
        if (language === "ru") {
            message = 'Спасибо что преобрели у нас бота! \nТеперь вы можете управлять им в разделе *🔑 Админ панель*'
        } else if (language === 'ua') {
            message = 'Дякую що придбали у нас бота!\n Тепер ви можете керувати ним у розділі *🔑 Адмін панель*'
        }
        const refferInfo = await db.collection('users').findOne({usersInvited: chatId})
        if (refferInfo) {
            await db.collection('users').findOneAndUpdate({usersInvited: chatId}, {$inc: {refBalance: (botInfo.priceUAH * 0.04)}})
            await db.collection('users').findOneAndUpdate({usersInvited: chatId}, {$inc: {statusRefBalance: (botInfo.priceUAH * 0.04)}})

        }
        bot.editMessageText(message, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown'})
    }
    if (data.startsWith('manage_bot_')) {
        delete state[chatId]
        const BID = data.split('manage_bot_')[1]
        const botInfo = await db.collection('botsUser').findOne({BID: BID})
        const language = await languageUser(chatId)
        let token = botInfo.token
        if (token) {
            token = botInfo.token
        } else {
            if (language === "ru") {
                token = 'Токен отсутстует'
            } else if (language === 'ua') {
                token = 'Токен відсутній'
            }
        }
        let message
        let inlineKeyboard = []
        if (language === 'ru') {
            message = `_Вы выбрали бота_ - *${botInfo.botName} | ${botInfo.BID}*\n\n_Баланс бота_ - *${botInfo.balanceBot}*\n\n_Токен_ - *${token}*\n_Админ бота_ - *${botInfo.adminId}*\n_Окончание хостинга_ - *${botInfo.hosting}*\n\n*Выберите действие :*`
            inlineKeyboard = [
                [{text: 'Balance Bot', callback_data: `updateBalanceBot_${botInfo.BID}`}],
                [{text: 'Name Bot', callback_data: `changeNameBot_${botInfo.BID}`}, {text: 'Admin ID', callback_data: `changeAdminIdBot_${botInfo.BID}`},{text: 'Token Bot', callback_data: `changeTokenBot_${botInfo.BID}`}],
                [{text: 'Назад', callback_data: 'backToListOfBuyBots'}]
            ]
        } else if (language === 'ua') {
            message = `_Ви обрали бота_ - *${botInfo.botName} | ${botInfo.BID}*\n\n_Баланс бота_ - *${botInfo.balanceBot}*\n\n_Токен_ - *${token}*\n_Адмін бота_ - *${botInfo.adminId}*\n_Закінчення хостингу_ - *${botInfo.hosting}*\n\n*Виберіть дію :*`
            inlineKeyboard = [
                [{text: 'Balance Bot', callback_data: `updateBalanceBot_${botInfo.BID}`}],
                [{text: 'Name Bot', callback_data: `changeNameBot_${botInfo.BID}`}, {text: 'Admin ID', callback_data: `changeAdminIdBot_${botInfo.BID}`},{text: 'Token Bot', callback_data: `changeTokenBot_${botInfo.BID}`}],
                [{text: 'Назад', callback_data: 'backToListOfBuyBots'}]
            ]
        }
        bot.editMessageText(message, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: inlineKeyboard}})
    }
    if (data === 'backToListOfBuyBots') {
        const user = await db.collection('users').findOne({ chatId: chatId });
        const bots = await db.collection('botsUser').find({ _id: { $in: user.bots.map(id => new ObjectId(id)) } }).toArray();
        const userBots = await db.collection('botsUser').find({ buyerId: chatId }).toArray();
        let message
        let inlineKeyboard = []
        if (language === 'ru') {
            message = "Вы попали в раздел *🔑 Админ панель*!\nВ этом разделе вы можете управлять своими ботами\n\nВыберите бота, которому вы хотите поменять настройки:";
        } else if (language === "ua") {
            message = "Ви потрапили до розділу *🔑 Адмін панель*!\nУ цьому розділі ви можете керувати своїми ботами\n\nВиберіть бота, якому ви хочете змінити налаштування:";
        }

        let row = [];
        let addedBots = new Set();

        bots.forEach(bot => {
            userBots.filter(ub => ub.botName === bot.botName).forEach(userBot => {
                if (!addedBots.has(userBot.BID)) {
                    row.push({ text: bot.botName + ' | ' + userBot.BID, callback_data: `manage_bot_${userBot.BID}` });
                    addedBots.add(userBot.BID);
                    if (row.length === 2) {
                        inlineKeyboard.push(row);
                        row = [];
                    }
                }
            });
        });

        if (row.length > 0) inlineKeyboard.push(row);

        if (inlineKeyboard.length > 0) {
            bot.editMessageText(message, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: inlineKeyboard
                },
                parse_mode: 'Markdown'
            });
        }
    }
    if (data === 'activatePromocode') {
        let message
        let inlineKeyboard

        if (language === 'ru') {
            message = 'Введите промокод чтобы получить бонусы :'
            inlineKeyboard = [[{text: 'Отмена', callback_data: 'cancelActivatePromocode'}]]
        } else if (language === 'ua') {
            message = 'Введіть промокод, щоб отримати бонуси :'
            inlineKeyboard = [[{text: 'Відмінити', callback_data: 'cancelActivatePromocode'}]]
        }
        state[chatId] = { awaitingActivaatePromocode: true }
        bot.editMessageText(message, {chat_id: chatId, message_id: messageId, reply_markup: {inline_keyboard: inlineKeyboard}})
    }
    if (data === 'cancelActivatePromocode') {
        state[chatId].awaitingActivaatePromocode = false
        let message
        if (language === 'ru') {
            message = 'Отменено.'
        } else if (language === 'ua') {
            message = 'Відмінено.'
        }
        bot.sendMessage(chatId, message)
    }
    if (data === 'cancelNewsletter') {
        state[chatId].awaitingTextNewsletter = false
        bot.sendMessage(chatId, 'Отменено.')
    }
    if (data.startsWith('updateBalanceBot_')) {
        const BID = data.split('updateBalanceBot_')[1]
        const user = await db.collection('users').findOne({chatId: chatId})
        if (language === 'ru') {
            bot.editMessageText(`_Ваш баланс_ - *${user.balance}*\n*Введите сумму какую Вы хотите перевести на баланс бота :*`, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: [[{text: '🔙 Назад', callback_data: `manage_bot_${BID}`}]]}})
        } else if (language === 'ua') {
            bot.editMessageText( `_Ваш баланс_ - *${user.balance}*\n*Введіть суму яку Ви хочете перевести на баланс бота :*`, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: [[{text: '🔙 Назад', callback_data: `manage_bot_${BID}`}]]}})
        }
        state[chatId] = { awaitingSumToConvertBotBalance: true, BID: BID }
    }
    if (data.startsWith('changeNameBot_')) {
        const BID = data.split('changeNameBot_')[1]
        if (language === 'ru') {
            bot.editMessageText(`*Введите новое имя для бота :*`, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: [[{text: '🔙 Назад', callback_data: `manage_bot_${BID}`}]]}})
        } else if (language === 'ua') {
            bot.editMessageText(`*Введіть нове ім'я для бота :*`, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: [[{text: '🔙 Назад', callback_data: `manage_bot_${BID}`}]]}})
        }
        state[chatId] = { awaitingNewNameForBot: true, BID: BID }
    }
    if (data.startsWith('changeTokenBot_')) {
        const BID = data.split('changeTokenBot_')[1]
        if (language === 'ru') {
            bot.editMessageText(`*Введите новый токен для бота :*`, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: [[{text: '🔙 Назад', callback_data: `manage_bot_${BID}`}]]}})
        } else if (language === 'ua') {
            bot.editMessageText(`*Введіть новий токен для бота :*`, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: [[{text: '🔙 Назад', callback_data: `manage_bot_${BID}`}]]}})
        }
        state[chatId] = { awaitingNewTokenForBot: true, BID: BID }
    }
    if (data.startsWith('changeAdminIdBot_')) {
        const BID = data.split('changeAdminIdBot_')[1]
        if (language === 'ru') {
            bot.editMessageText(`*Введите айди нового админа для бота :*`, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: [[{text: '🔙 Назад', callback_data: `manage_bot_${BID}`}]]}})
        } else if (language === 'ua') {
            bot.editMessageText(`*Введіть айді нового адміна для бота :*`, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: [[{text: '🔙 Назад', callback_data: `manage_bot_${BID}`}]]}})
        }
        state[chatId] = { awaitingNewAdminIDForBot: true, BID: BID }
    }
        if (data === 'statusProject') {
        let message
        const language = await languageUser(chatId)
        const users = await db.collection('users').findOne({})
        const today = new Date();
        const formattedToday = today.toLocaleDateString('en-US', { timeZone: 'Europe/Kiev' });
        const newUsersToday = await db.collection('users').countDocuments({
            registrationDate: {
                $regex: `^${formattedToday}`
            }
        });
        if (language === 'ru') {
            message = '*🚀 Статистика проекта:*\n\n' +
                `🕜 Работаем : *${Math.floor((new Date() - new Date('2024-05-19')) / (1000 * 3600 * 24))} дней*\n
` +
                `👥 Всего пользователей: *${await db.collection('users').countDocuments()}*
` +
                `✈️ Новых за сегодня: *${newUsersToday}*
` +
                `
🤖 Ботов продано: *${await getTotalBuys()}*`
        } else if (language === 'ua') {
            message = '*🚀 Статистика проекту:*\n\n' +
                `🕜 Працюємо : *${Math.floor((new Date() - new Date('2024-05-19')) / (1000 * 3600 * 24))} днів*\n
` +
                `👥 Всього користувачів: *${await db.collection('users').countDocuments()}*
` +
                `✈️ Нових за сьогодні: *${newUsersToday}*
` +
                `
🤖 Ботiв продано: *${await getTotalBuys()}*`
        }
        bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown'
        })
    }
    if (data === 'clientChat') {
        const user = await db.collection('users').findOne({chatId: chatId})
        if (user.bots.length >= 1) {
            const chatMember = await bot.getChatMember(chatIdChannel, chatId);
            if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
                if (language === 'ru') {
                    bot.sendMessage(chatId, 'Вы уже являетесь участником закрытого чата клиентов.');
                } else if (language === 'ua') {
                    bot.sendMessage(chatId, 'Ви вже є учасником закритого чату клієнтів.');
                }
            } else {
                if (language === 'ru') {
                    const link = await bot.createChatInviteLink(chatIdChannel, {name: "Одноразовая ссылка", expire_date: Math.floor(Date.now() / 1000) + 86400, member_limit: 1});
                    bot.editMessageText('Нажмите на кнопку, чтобы перейти в закрытый чат клиентов.', {chat_id: chatId, message_id: messageId, reply_markup: {inline_keyboard: [[{text: 'Вступить в чат', url: link.invite_link}]]}});
                } else if (language === 'ua') {
                    const link = await bot.createChatInviteLink(chatIdChannel, {name: "Одноразове посилання", expire_date: Math.floor(Date.now() / 1000) + 86400, member_limit: 1});
                    bot.editMessageText('Натисніть на кнопку, щоб перейти у закритий чат клієнтів.', {chat_id: chatId, message_id: messageId, reply_markup: {inline_keyboard: [[{text: 'Вступити в чат', url: link.invite_link}]]}});
                }
            }
        } else {
            if (language === 'ru') {
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: '🚫 У Вас нету ботов.\nКупите бота и Вы получите доступ к закрытому чату.',
                    show_alert: true
                });
            } else if (language === 'ua') {
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: '🚫 У Вас немає ботів.\nПридбайте бота і Ви отримаете доступ до закритого чату.',
                    show_alert: true
                });
            }
        }
    }
    if (data === 'changeLanguage') {
        if (language === 'ru') {
            await db.collection('users').findOneAndUpdate(
                { chatId: chatId },
                { $set: { language: 'ua' } }
            );
            bot.sendMessage(chatId, '✅ Мова змінена.', {
                reply_markup: {
                    keyboard: [
                        ['🧑‍🏫 Замовити бот', '🔑 Адмін панель'],
                        ['👤 Мій профіль', '🦾 Партнери'],
                        ['🌋 Лавка ботів', '🗽 Інше']
                    ],
                    resize_keyboard: true
                }
            });
        } else if (language === 'ua') {
            await db.collection('users').findOneAndUpdate(
                { chatId: chatId },
                { $set: { language: 'ru' } }
            );
            bot.sendMessage(chatId, '✅ Язык изменён.', {
                reply_markup: {
                    keyboard: [
                        ['🧑‍🏫 Заказать бота', '🔑 Админ панель'],
                        ['👤 Мой профиль', '🦾 Партнёры'],
                        ['🌋 Лавка ботов', '🗽 Другое']
                    ],
                    resize_keyboard: true
                }
            });
        }
    }
    if (data === 'createTiketHelpManager') {
        let message
        let inlineKeyboard

        if (language === 'ru') {
            message = '❔ Опишите вашу проблему и в ближайшее время вам ответить менеджер для помощи :'
            inlineKeyboard = [[{text: '🔙 Отмена', callback_data: 'cancelCreateTiketHelpManager'}]]
        } else if (language === 'ua') {
            message = '❔ Опишіть вашу проблему, і найближчим часом вам відповісти менеджер для допомоги :'
            inlineKeyboard = [[{text: '🔙 Відміна', callback_data: 'cancelCreateTiketHelpManager'}]]
        }
        bot.sendMessage(chatId, message, {
            reply_markup: {
                inline_keyboard: inlineKeyboard
            }
        })
        state[chatId] = { awaitingTextForHelpTiket: true }
    }
    if (data === 'cancelCreateTiketHelpManager') {
        state[chatId].awaitingTextForHelpTiket = false
        let message
        if (language === 'ru') {
            message = 'Отменено.'
        } else if (language === 'ua') {
            message = 'Відмінено.'
        }
        bot.editMessageText(message, {chat_id: chatId, message_id: messageId})
    }
    if (data.startsWith('giveAnswer_')){
        const tiketId = data.split('giveAnswer_')[1]
        const tiketDB = await db.collection('tiketsHelp').findOne({tiketId: tiketId})
        if (tiketDB.statusTiket === false) {
            return
        }
        if (tiketDB.managerId !== null) {
            bot.sendMessage(chatId, '🚫 Этому пользователю уже отвечает другой менеджер.')
            return
        }
        await db.collection('tiketsHelp').findOneAndUpdate({tiketId: tiketId}, {$set: {managerId: chatId}})
        bot.sendMessage(chatId, 'Следующим сообщением напишите ответ пользователю : ')
        state[chatId] = { userIdHelp: tiketDB.userIdHelp, tiketId: tiketId, awaitingNewMessageForHelpFromManager: true}
    }
    if (data.startsWith('giveAnswerToUser_')) {
        const tiketId = data.split('_')[1]
        const tiketDB = await db.collection('tiketsHelp').findOne({tiketId: tiketId})
        if (tiketDB.statusTiket === false) {
            return
        }
        const userHelp = tiketDB.userIdHelp
        state[chatId] = {tiketId: tiketId, userIdHelp: userHelp, awaitingNewHelpMessageFromManager: true}
        bot.sendMessage(chatId, 'Следующим сообщением напишите ответ менеджеру : ')
    }
    if (data.startsWith('giveAnswerToMeneger_')) {
        const tiketId = data.split('_')[1]
        const tiketDB = await db.collection('tiketsHelp').findOne({tiketId: tiketId})
        if (tiketDB.statusTiket === false) {
            return
        }
        const managerId = tiketDB.managerId
        let message
        if (language === 'ru') {
            message = 'Следующим сообщением напишите ответ менеджеру : '
        } else if (language === 'ua') {
            message = 'Наступним повідомленням напишіть відповідь менеджеру :'
        }
        bot.sendMessage(chatId, message)
        state[chatId] = {tiketId: tiketId, managerId: managerId, awaitingNewHelpMessageFromUser: true}
        return
    }
    if (data.startsWith('closeTiketByUser_')) {
        const tiketId = data.split('_')[1]
        const tiketDB = await db.collection('tiketsHelp').findOne({tiketId: tiketId})
        if (tiketDB.statusTiket === false) {
            return
        }
        await db.collection('tiketsHelp').findOneAndUpdate({tiketId: tiketId}, {$set: {statusTiket: false}})
        const managerId = tiketDB.managerId
        let ManagerMessage = `*${tiketId} - Был закрыт пользывателям.*`
        let message
        if (language === 'ru') {
            message = `*${tiketId}* - Был закрыт.\n\n_Обращайтесь к нам если нужна будет помощь! Хорошего дня_`
        } else if (language === 'ua') {
            message = `*${tiketId}* - Був закритий.\n\n_Звертайтесь до нас, якщо потрібна буде допомога! Гарного дня_`
        }
        bot.sendMessage(managerId, ManagerMessage, {parse_mode: 'Markdown'})
        bot.editMessageText(message, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown'})
    }
    if (data.startsWith('closeTiketByManager_')) {
        const tiketId = data.split('_')[1]
        const tiketDB = await db.collection('tiketsHelp').findOne({tiketId: tiketId})
        if (tiketDB.statusTiket === false) {
            return
        }
        await db.collection('tiketsHelp').findOneAndUpdate({tiketId: tiketId}, {$set: {statusTiket: false}})
        const userHelp = tiketDB.userIdHelp
        let ManagerMessage = `*${tiketId} - Был закрыт вами.*`
        let message
        let language = await languageUser(userHelp)
        if (language === 'ru') {
            message = `*${tiketId}* - Был закрыт.\n\n_Обращайтесь к нам если нужна будет помощь! Хорошего дня_`
        } else if (language === 'ua') {
            message = `*${tiketId}* - Був закритий.\n\n_Звертайтесь до нас, якщо потрібна буде допомога! Гарного дня_`
        }
        bot.sendMessage(chatId, ManagerMessage, {parse_mode: 'Markdown'})
        bot.sendMessage(userHelp, message, {parse_mode: 'Markdown'})
    }
})
bot.on('message', async (msg) => {
    const chatId = msg.chat.id
    const text = msg.text
    const language = await languageUser(chatId)

    if (state[chatId]?.awaitingTTForReSellBot) {
        state[chatId].awaitingTTForReSellBot = false
        state[chatId].TT = text
        let message
        if (language === 'ru') {
            message = 'Введите ссылку на тестового бота для проверки :\n\n\n_Tестовый бот должен быть активен в течении 48 часов с момента подачи заявки_'
        } else if (language === "ua") {
            message = 'Введіть посилання на тестовий бот для перевірки :\n\n\n_Тестовий бот повинен бути активним протягом 48 годин з моменту подання заявки_'
        }
        bot.sendMessage(chatId, message, {parse_mode: 'Markdown'})
        state[chatId].awaitingTestLinkForReSellBot = true
        return
    }
    if (state[chatId]?.awaitingTestLinkForReSellBot) {
        state[chatId].awaitingTestLinkForReSellBot = false
        state[chatId].TestLink = text
        let message
        if (language === 'ru') {
            message = 'Введите способы связаться с вами :\n\n\n_Telegram: @user123, Discord: user123, Phone number: +380XXXXXXXXX_'
        } else if (language === "ua") {
            message = "Введіть способи зв'язатися з вами:\n\n\n_Telegram: @user123, Discord: user123, Phone number: +380XXXXXXXXX_"
        }
        bot.sendMessage(chatId, message, {parse_mode: 'Markdown'})
        state[chatId].awaitingWaysToContact = true
        return
    }
    if (state[chatId]?.awaitingWaysToContact) {
        state[chatId].awaitingWaysToContact = false
        const TechnikTask = state[chatId].TT
        const TestLink = state[chatId].TestLink
        const contacts = text
        let message
        if (language === "ru") {
            message = '*✅ Ваша заявка на продажу бота успешно отправлена на модерацию!*\n\n\n_В течении 5 робочих дней с вами свяжутся._'
        } else if (language === 'ua') {
            message = '*✅ Вашу заявку на продаж бота успішно відправлено на модерацію!*\n\n\n_Протягом 5 робочих днів з вами зв`яжуться._'
        }
        bot.sendMessage(chatId, message, {parse_mode: 'Markdown'})
        await sendTiketForReSellBot(TechnikTask, TestLink, contacts, chatId)
    }
    if (state[chatId]?.awaitingTextForHelpTiket) {
        state[chatId].awaitingTextForHelpTiket = false
        const textTiket = text
        const tiketId = await generateTiketIdOnly()
        const timeReg = new Date().toLocaleString('en-US', { timeZone: 'Europe/Kiev' })
        let message
        await db.collection('tiketsHelp').insertOne({
            statusTiket: true,
            userIdHelp: chatId,
            managerId: null,
            tiketId: tiketId,
            messages: [],
            regTimeTiket: timeReg,
        })
        await db.collection('tiketsHelp').findOneAndUpdate({tiketId: tiketId}, {$push: {messages: `Пользователь - ${textTiket}`}})
        if (language === 'ru') {
            message = `*✅ Ваш запрос успешно отправлен менеджерам.*

_Ваш Tiket ID_ - \`${tiketId}\`
_Время создания запроса_ - *${timeReg}*`
        } else if (language === 'ua') {
            message = `*✅ Ваш запит успішно надіслано менеджерам.*

_Ваш Tiket ID_ - \`${tiketId}\`
_Час створення запиту_ - *${timeReg}*`
        }

        bot.sendMessage(chatId, message, {parse_mode: 'Markdown'})

        await sendHelpTiket(chatId, textTiket, tiketId, timeReg)
    }
    if (state[chatId]?.awaitingNewMessageForHelpFromManager) {
        const userHelp = state[chatId].userIdHelp
        state[chatId].awaitingNewMessageForHelpFromManager = false
        const messageFromManager = text
        console.log(userHelp)
        const language = await languageUser(userHelp)
        const tiketId = state[chatId].tiketId
        await db.collection('tiketsHelp').findOneAndUpdate({tiketId: tiketId}, {$push: {messages: `Менеджер - ${messageFromManager}`}})
        bot.sendMessage(chatId, 'Сообщение отправлено. ', {
            reply_markup: {
                inline_keyboard: [
                    [{text: 'Написать еще сообщение', callback_data: `giveAnswerToUser_${tiketId}`}, {text: 'Закрыть переписку', callback_data: `closeTiketByManager_${tiketId}`}]
                ]
            }
        })
        let message
        let message2
        let inlineKeyboard
        if (language === 'ru') {
            message = `*Ответ от менеджера -*`
            message2 = `_Если вы хотите написать менеджеру - нажмите кнопку_ *"Ответить менеджеру"*`
            inlineKeyboard = [[{text: 'Ответить менеджеру', callback_data: `giveAnswerToMeneger_${tiketId}`}, {text: 'Закрыть переписку', callback_data: `closeTiketByUser_${tiketId}`}]]
        } else if (language === 'ua') {
            message = `*Відповідь від менеджера -*`
            message2 = `_Якщо ви хочете написати менеджеру - натисніть кнопку_ *"Відповісти менеджеру"*`
            inlineKeyboard = [[{text: 'Відповісти менеджеру', callback_data: `giveAnswerToMeneger_${tiketId}`}, {text: 'Закрити переписку', callback_data: `closeTiketByUser_${tiketId}`}]]
        }
        bot.sendMessage(userHelp, `${message} 

${messageFromManager}

${message2}`,  {reply_markup: {inline_keyboard: inlineKeyboard}, parse_mode: 'Markdown' })
    }
    if (state[chatId]?.awaitingAmountupToAccountBalance) {
        state[chatId].awaitingAmountupToAccountBalance = false
        const amount = parseFloat(text)
        let message
        if (language === "ru") {
            message = '🏦 Выберите способ пополнения :'
        } else if (language === "ua") {
            message = '🏦 Оберіть способ поповнення :'
        }
        bot.sendMessage(chatId, message, {reply_markup: {
            inline_keyboard: [
                [{text: 'Ukraine Banks', callback_data: 'byUkrBanks'}],
                [{text: 'USDT TRC-20', callback_data: 'byUsdtTrc20'}, {text: 'USDT ERC-20', callback_data: 'byUsdtErc20'}]
            ]
        }})
        state[chatId].amountUpToPay = amount
    }
    if (state[chatId]?.awaitingNewHelpMessageFromManager) {
        state[chatId].awaitingNewHelpMessageFromManager = false
        const messageFromManager = text
        const userHelp = state[chatId].userIdHelp
        const tiketId = state[chatId].tiketId
        await db.collection('tiketsHelp').findOneAndUpdate({tiketId: tiketId}, {$push: {messages: `Менеджер - ${messageFromManager}`}})
        const tiketDB = await db.collection('tiketsHelp').findOne({tiketId: tiketId})
        bot.sendMessage(chatId, 'Сообщение отправлено. ', {
            reply_markup: {
                inline_keyboard: [
                    [{text: 'Написать еще сообщение', callback_data: `giveAnswerToUser_${tiketId}`}, {text: 'Закрыть переписку', callback_data: `closeTiketByManager_${tiketId}`}]
                ]
            }
        })
        let message
        let message2
        let inlineKeyboard
        if (await languageUser(userHelp) === 'ru') {
            message = `*Ответ от менеджера -*`
            message2 = `_Если вы хотите написать менеджеру - нажмите кнопку_ *"Ответить менеджеру"*`
            inlineKeyboard = [[{text: 'Ответить менеджеру', callback_data: `giveAnswerToMeneger_${tiketId}`}, {text: 'Закрыть переписку', callback_data: `closeTiketByUser_${tiketId}`}]]
        } else if (await languageUser(userHelp) === 'ua') {
            message = `*Відповідь від менеджера -*`
            message2 = `_Якщо ви хочете написати менеджеру - натисніть кнопку_ *"Відповісти менеджеру"*`
            inlineKeyboard = [[{text: 'Відповісти менеджеру', callback_data: `giveAnswerToMeneger_${tiketId}`}, {text: 'Закрити переписку', callback_data: `closeTiketByUser_${tiketId}`}]]
        }
        bot.sendMessage(userHelp, `${message} 

${messageFromManager}

${message2}`,  {reply_markup: {inline_keyboard: inlineKeyboard}, parse_mode: 'Markdown' })
    }
    if (state[chatId]?.awaitingNewHelpMessageFromUser) {
        state[chatId].awaitingNewHelpMessageFromUser = false
        const messageFromUser = text
        const managerId = state[chatId].managerId
        const tiketId = state[chatId].tiketId
        await db.collection('tiketsHelp').findOneAndUpdate({tiketId: tiketId}, {$push: {messages: `Пользователь - ${messageFromUser}`}})
        const tiketDB = await db.collection('tiketsHelp').findOne({tiketId: tiketId})
        let message
        let inlineKeyboard
        if (await languageUser(chatId) === 'ru') {
            message = `*Ваше сообщение отправлено менеджеру.*`
            inlineKeyboard = [[{text: 'Написать менеджеру', callback_data: `giveAnswerToMeneger_${tiketId}`}, {text: 'Закрыть переписку', callback_data: `closeTiketByUser_${tiketId}`}]]
        } else if (await languageUser(chatId) === 'ua') {
            message = `*Ваше повідомленя відправлено менеджеру.*`
            inlineKeyboard = [[{text: 'Написати менеджеру', callback_data: `giveAnswerToMeneger_${tiketId}`}, {text: 'Закрити переписку', callback_data: `closeTiketByUser_${tiketId}`}]]
        }
        bot.sendMessage(chatId, `${message}`,  {reply_markup: {inline_keyboard: inlineKeyboard}, parse_mode: 'Markdown' })
        bot.sendMessage(managerId, `*Ответ от пользователя -*

${messageFromUser}

_Если вы хотите написать пользователю - нажмите кнопку_ *"Ответить пользователю"*`, {parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{text: 'Ответить пользователю', callback_data: `giveAnswerToUser_${tiketId}`}, {text: 'Закрыть переписку', callback_data: `closeTiketByManager_${tiketId}`}]
                ]
            }
        })
    }
    if (state[chatId]?.awaitingSumToConvertBotBalance) {
        const amount = parseFloat(text)
        const BID = state[chatId].BID
        let message
        delete state[chatId]
        if (!isNaN(amount)) {
            const user = await db.collection('users').findOne({chatId: chatId})
            if (user.balance < amount) {
                if (language === "ru") {
                    message = '*🚫 Недостаточно средств на вашем балансе*'
                } else if (language === 'ua') {
                    message = '*🚫 Недостатньо коштів на вашому балансі*'
                }
                bot.sendMessage(chatId, message, {parse_mode: 'Markdown🚫 Ви ввели не коректне число. Введіть правильне число'})
                return
            }
            await db.collection('users').findOneAndUpdate({chatId: chatId}, {
                $inc: {
                    balance: -amount
                }
            });
            await db.collection('botsUser').findOneAndUpdate({BID: BID}, {
                $inc: {
                    balanceBot: amount
                }
            });
            if (language === 'ru') {
                message = `*✅ Успешно! Счёт бота пополнен на ${amount}₴*`
            } else if (language === 'ua') {
                message = `*✅ Успішно! Рахунок бота поповнений на ${amount}₴*`
            }
            bot.sendMessage(chatId, message, {parse_mode: 'Markdown'})
        } else {
            if (language === 'ru') {
                message = '*🚫 Вы ввели не кореткное число. Введите коректно число*'
            } else if (language === 'ua') {
                message = '*🚫 Ви ввели не коректне число. Введіть правильне число*'
            }
            bot.sendMessage(chatId, message, {parse_mode: 'Markdown'})
        }
    }
    if (state[chatId]?.awaitingActivaatePromocode) {
        const promocodeName = text
        const promocodeInfo = await db.collection('promocodes').findOne({promocode: promocodeName})
        let message
        state[chatId].awaitingActivaatePromocode = false
        if (promocodeInfo) {
            if (!promocodeInfo.chatIdsUsed.includes(chatId)) {
                if (promocodeInfo.uses > promocodeInfo.chatIdsUsed.length) {
                    await db.collection('promocodes').findOneAndUpdate({promocode: promocodeName}, {$push: {chatIdsUsed: chatId}})
                    await db.collection('users').findOneAndUpdate({chatId: chatId}, {$inc: {balance: 200}})
                    if (language === "ru") {
                        message = '✅ Успешно! Вы активировали промокод. Проверьте свой баланс!'
                    } else if (language === "ua") {
                        message = '✅ Успішно! Ви активували промокод. Перевірте свій баланс!'
                    }
                } else {
                    if (language === 'ru') {
                        message = '🚫 Этот промокод уже израсходован'
                    } else if (language === 'ua') {
                        message = '🚫 Цей промокод вже витрачено'
                    }
                }
            } else {
                if (language === 'ru') {
                    message = '🚫 Вы уже использовали этот промокод.'
                } else if (language === 'ua') {
                    message = '🚫 Ви використовували цей промокод.'
                }
            }
        } else {
            if (language === 'ru') {
                message = '🚫 Вы ввели некорректный промокод. Попробуйте еще раз'
            } else if (language === 'ua') {
                message = '🚫 Ви ввели некоректний промокод. спробуйте ще раз'
            }
        }
        bot.sendMessage(chatId, `*${message}*`, {parse_mode: 'Markdown'})
    }
    if (state[chatId]?.awaitingNewNameForBot) {
        const newdata = text
        const BID = state[chatId].BID
        let message
        await db.collection('botsUser').findOneAndUpdate({BID: BID}, {
            $set: {
                botName: newdata
            }
        });
        if (language === 'ru') {
            message = `*✅ Успешно! Новое имя бота измено на ${newdata}*`
        } else if (language === 'ua') {
            message = `*✅ Успішно! Нове ім'я бота змінено на ${newdata}*`
        }
        bot.sendMessage(chatId, message, {parse_mode: 'Markdown'})
        delete state[chatId]
    }
    if (state[chatId]?.awaitingNewAdminIDForBot) {
        const newdata = parseFloat(text)
        const BID = state[chatId].BID
        let message
        await db.collection('botsUser').findOneAndUpdate({BID: BID}, {
            $set: {
                adminId: newdata
            }
        });
        if (language === 'ru') {
            message = `*✅ Успешно! Админ бота изменён на ${newdata} ID*`
        } else if (language === 'ua') {
            message = `*✅ Успішно! Адмін бота змінено на ${newdata} ID*`
        }
        bot.sendMessage(chatId, message, {parse_mode: 'Markdown'})
        delete state[chatId]
    }
    if (state[chatId]?.awaitingNewTokenForBot) {
        const newdata = text
        const BID = state[chatId].BID
        let message
        await db.collection('botsUser').findOneAndUpdate({BID: BID}, {
            $set: {
                token: newdata
            }
        });
        if (language === 'ru') {
            message = `*✅ Успешно! Новый токен бота измено на ${newdata}*`
        } else if (language === 'ua') {
            message = `*✅ Успішно! Новий токен бота змінено на ${newdata}*`
        }
        bot.sendMessage(chatId, message, {parse_mode: 'Markdown'})
        delete state[chatId]
    }
})
//////////////////////////////////////////////////////////////////////////////////////

                                    // Admin Panel
bot.onText(/\/admin/, (msg) => {
    const chatId = msg.chat.id
    console.log(adminChatId)
    if (adminChatId.includes(chatId.toString())) {
        sendAdminMenu(chatId)
    } else {
        return
    }
})
bot.onText(/Управление ботами/, (msg) => {
    const chatId = msg.chat.id
    if (adminChatId.includes(chatId.toString())) {
        bot.sendMessage(chatId, 'Выберите опцию :', {
            reply_markup: {
                keyboard: [
                    ['Добавить бота', 'Удалить бота'], ['Список ботов'], ['Назад']
                ],
                resize_keyboard: true
            }
        })
    } else {
        return
    }
});
bot.onText(/Назад/, (msg) => {
    const chatId = msg.chat.id
    if (adminChatId.includes(chatId.toString())) {
        sendAdminMenu(chatId)
    } else if (menegerChatId.includes(chatId.toString())) {
        sendMenegerMenu(chatId)
    }

})
bot.onText(/Добавить бота/, msg => {
    const chatId = msg.chat.id
    if (adminChatId.includes(chatId.toString())) {
        bot.sendMessage(chatId, 'Напишите новое названия для бота :', {
            reply_markup: {
                inline_keyboard: [
                    [{text: 'Отмена', callback_data: 'cancelAddNewBot'}]
                ]
            }
        })
        state[chatId] = { awaitingNewBotName: true }
    } else {
        return
    }
})
bot.onText(/Удалить бота/, async msg => {
    const chatId = msg.chat.id
    if (adminChatId.includes(chatId.toString())) {
        let inlineKeyboard = []
        const bots = await db.collection('bots').find({}).toArray();
        let row = [];
        for (let i = 0; i < bots.length; i += 1) {
            const bot = bots[i];
            row.push({
                text: bot.botName, // Название заказа для отображения на кнопке
                callback_data: `deleteBot_${bot._id}` // Callback данные, содержащие идентификатор заказа
            });
            if (row.length === 2) {
                inlineKeyboard.push(row);
                row = [];
            }
        }
        if (row.length > 0) {
            inlineKeyboard.push(row);
        }
        bot.sendMessage(chatId, 'Выберите бота, которого нужно удалить :\n( При нажатия на бота - он сразу удалится )', {reply_markup: {inline_keyboard: inlineKeyboard}})
    } else {
        return
    }
})
bot.onText(/Список ботов/, async msg => {
    const chatId = msg.chat.id
    if (adminChatId.includes(chatId.toString())) {
        const bots = await db.collection('bots').find({}).toArray();
        let row = [];
        let inlineKeyboard = []
        for (let i = 0; i < bots.length; i += 1) {
            const bot = bots[i];
            row.push({
                text: bot.botName, // Название заказа для отображения на кнопке
                callback_data: `infoAboutBot_${bot._id}` // Callback данные, содержащие идентификатор заказа
            });
            if (row.length === 2) {
                inlineKeyboard.push(row);
                row = [];
            }
        }
        if (row.length > 0) {
            inlineKeyboard.push(row);
        }
        bot.sendMessage(chatId, 'Выберите бота, информацию которого хотите посмотреть :', {reply_markup: {inline_keyboard: inlineKeyboard}})
    } else {
        return
    }
})
bot.onText(/Менеджеры/, (msg) => {
    const chatId = msg.chat.id
    if (adminChatId.includes(chatId.toString())) {
        bot.sendMessage(chatId, 'Выберите опцию :', {
            reply_markup: {
                keyboard: [
                    ['Добавить менеджера', 'Удалить менеджрера'], ['Список менеджеров'], ['Назад']
                ],
                resize_keyboard: true
            }
        })
    } else {
        return
    }
})
bot.onText(/Добавить менеджера/, msg => {
    const chatId = msg.chat.id
    if (adminChatId.includes(chatId.toString())) {
        bot.sendMessage(chatId, 'Напишите ID нового менеджера :', {
            reply_markup: {
                inline_keyboard: [
                    [{text: 'Отмена', callback_data: 'cancelAddNewManager'}]
                ]
            }
        })
        state[chatId] = { awaitingCreateNewManagerId: true }
    } else {
        return
    }
})
bot.onText(/Удалить менеджрера/, async msg => {
    const chatId = msg.chat.id
    if (adminChatId.includes(chatId.toString())) {
        let inlineKeyboard = []
        const botOptions = await db.collection('botOptions').findOne({});

        if (!botOptions || !botOptions.managers) {
            bot.sendMessage(chatId, 'Список менеджеров не найден.');
            return;
        }

        const managers = botOptions.managers;
        let row = [];
        for (let i = 0; i < managers.length; i += 1) {
            const manager = managers[i];
            row.push({
                text: manager, // Название заказа для отображения на кнопке
                callback_data: `deleteManager_${manager}` // Callback данные, содержащие идентификатор заказа
            });
            if (row.length === 2) {
                inlineKeyboard.push(row);
                row = [];
            }
        }
        if (row.length > 0) {
            inlineKeyboard.push(row);
        }
        bot.sendMessage(chatId, 'Выберите менеджера, которого нужно удалить :\n( При нажатии на менеджера - он сразу удалится )', {reply_markup: {inline_keyboard: inlineKeyboard}})
    } else {
        return
    }
});
bot.onText(/Список менеджеров/, async msg => {
    const chatId = msg.chat.id
    if (adminChatId.includes(chatId.toString())) {
        let inlineKeyboard = []
        const botOptions = await db.collection('botOptions').findOne({});

        if (!botOptions || !botOptions.managers) {
            bot.sendMessage(chatId, 'Список менеджеров не найден.');
            return;
        }

        const managers = botOptions.managers;
        let row = [];
        for (let i = 0; i < managers.length; i += 1) {
            const manager = managers[i];
            row.push({
                text: manager, // Название заказа для отображения на кнопке
                callback_data: `nothingToDo` // Callback данные, содержащие идентификатор заказа
            });
            if (row.length === 2) {
                inlineKeyboard.push(row);
                row = [];
            }
        }
        if (row.length > 0) {
            inlineKeyboard.push(row);
        }
        bot.sendMessage(chatId, 'Вот список менеджеров :', {reply_markup: {inline_keyboard: inlineKeyboard}})
    } else {
        return
    }
});
bot.on('message', async (msg) => {
    const chatId = msg.chat.id
    const text = msg.text

    const stateData = state[chatId];
    if (!stateData) {
        return;
    }
    if (stateData.awaitingNewBotName) {
        state[chatId] = {
            ...stateData,
            botName: text,
            awaitingNewBotName: false,
            awaitingDescriptionBot: true,
        };
        bot.sendMessage(chatId, 'Введите описание бота : ', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Отмена', callback_data: 'cancelAddNewBot' }]
                ]
            }
        });
        return;
    }
    if (state[chatId].awaitingCreateNewManagerId) {
        state[chatId].awaitingCreateNewManagerId = false
        const id = text
        await db.collection('botOptions').findOneAndUpdate({_id: new ObjectId('665d272a7611d73e2bec9bac')},{$push: {managers: id}})
        bot.sendMessage(chatId, `✅ Менеджер - ${id} успешно добавлен!`)
        await loadManagers()
        return
    }
    if (stateData.awaitingDescriptionBot) {
        state[chatId] = {
            ...stateData,
            description: text,
            awaitingDescriptionBot: false,
            awaitingUsernameTestBot: true,
        };
        bot.sendMessage(chatId, 'Введите username тестового бота "@testBot" : ', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Отмена', callback_data: 'cancelAddNewBot' }]
                ]
            }
        });
        return;
    }
    if (stateData.awaitingUsernameTestBot) {
        state[chatId] = {
            ...stateData,
            usernameTestBot: text,
            awaitingUsernameTestBot: false,
            awaitingPriceUAH: true,
        };
        bot.sendMessage(chatId, 'Введите цену за бота в UAH : ', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Отмена', callback_data: 'cancelAddNewBot' }]
                ]
            }
        });
        return;
    }
    if (stateData.awaitingPriceUAH) {
        state[chatId] = {
            ...stateData,
            priceUAH: parseFloat(text),
            awaitingPriceUAH: false,
            awaitingPriceUSD: true,
        };
        bot.sendMessage(chatId, 'Введите цену за бота в USD : ', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Отмена', callback_data: 'cancelAddNewBot' }]
                ]
            }
        });
        return;
    }
    if (stateData.awaitingPriceUSD) {
        const priceUSD = parseFloat(text);
        const { botName, description, usernameTestBot, priceUAH } = stateData;

        bot.sendMessage(chatId, 'Бот успешно добавлен в список для заказов!');
        await db.collection('bots').insertOne({
            botName,
            description,
            priceUAH,
            priceUSD,
            linkTestBot: usernameTestBot,
            buys: 0,
        });
        state[chatId] = {};
        console.log(`Новый бот доступен для продажи!`);
    }
    if (state[chatId]?.awaitingNewBotNameForBot) {
        state[chatId].awaitingNewBotNameForBot = false
        const id = state[chatId].id
        const botName = text
        await db.collection('bots').findOneAndUpdate({_id: new ObjectId(id)}, {$set: {botName: botName}})
        bot.sendMessage(chatId, `Имя бота успешно изменено на ${botName}`)
        return
    }
    if (state[chatId]?.awaitingNewDescriptionForBot) {
        state[chatId].awaitingNewDescriptionForBot = false
        const id = state[chatId].id
        const descrition = text
        await db.collection('bots').findOneAndUpdate({_id: new ObjectId(id)}, {$set: {description: descrition}})
        bot.sendMessage(chatId, `Описание бота успешно изменено на ${descrition}`)
        return
    }
    if (state[chatId]?.awaitingNewLinkForBot) {
        state[chatId].awaitingNewLinkForBot = false
        const id = state[chatId].id
        const linkTestBot = text
        await db.collection('bots').findOneAndUpdate({_id: new ObjectId(id)}, {$set: {linkTestBot: linkTestBot}})
        bot.sendMessage(chatId, `Cсылка на тестового бота успешно изменено на ${linkTestBot}`)
        return
    }
    if (state[chatId]?.awaitingNewPriceUAHForBot) {
        state[chatId].awaitingNewPriceUAHForBot = false
        const id = state[chatId].id
        const priceUAH = parseFloat(text)
        await db.collection('bots').findOneAndUpdate({_id: new ObjectId(id)}, {$set: {priceUAH: priceUAH}})
        bot.sendMessage(chatId, `Теперь введите цену в USD`)
        state[chatId].awaitingNewPriceUSDForBot = true
        return
    }
    if (state[chatId]?.awaitingNewPriceUSDForBot) {
        state[chatId].awaitingNewPriceUSDForBot = false
        const id = state[chatId].id
        const priceUSD = parseFloat(text)
        await db.collection('bots').findOneAndUpdate({_id: new ObjectId(id)}, {$set: {priceUSD: priceUSD}})
        bot.sendMessage(chatId, `Цена для бота успешно изменена`)
        return
    }
})
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const chatUn = callbackQuery.message.chat.username
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;

    if (data === 'cancelAddNewManager') {
        delete state[chatId]
        bot.sendMessage(chatId, 'Отменено.')
    }
    if (data.startsWith('deleteManager_')) {
        const managerId = data.split('deleteManager_')[1];
        await db.collection('botOptions').findOneAndUpdate(
            {},
            { $pull: { managers: managerId } }
        );
        bot.sendMessage(chatId, `Менеджер с ID ${managerId} удален.`);
    }
    if (data === 'cancelAddNewBot') {
        delete state[chatId]
        bot.sendMessage(chatId, 'Отменено.')
    }
    if (data.startsWith('deleteBot_')){
        const id = data.split('_')[1]
        const infoBot = await db.collection('bots').findOne({_id: new ObjectId(id)})
        await db.collection('bots').deleteOne({_id: new ObjectId(id)})
        bot.editMessageText( `Бот *${infoBot.botName}* - удалён`, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown'})
    }
    if (data.startsWith('deletePromocode_')){
        const id = data.split('_')[1]
        const infoPromocode = await db.collection('promocodes').findOne({_id: new ObjectId(id)})
        await db.collection('promocodes').deleteOne({_id: new ObjectId(id)})
        bot.editMessageText( `Промокод *${infoPromocode.promocode}* - удалён`, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown'})
    }
    if (data.startsWith('infoAboutBot_')){
        const id = data.split('_')[1]
        const infoBot = await db.collection('bots').findOne({_id: new ObjectId(id)})
        const inlineKeyboard = [[{text: 'Изменить название бота', callback_data: `changeNameAdminBot_${id}`}], [{text: 'Изменить цену бота', callback_data: `changePriceBot_${id}`}, {text: 'Изменить описание бота', callback_data: `changeDiscriptonBot_${id}`}], [{text: 'Изменить ссылку на тестового бота', callback_data: `changeLinkToTestBot_${id}`}]]
        bot.editMessageText( `_Информация о боте_ - *${infoBot.botName}*\n\n_Цена бота_ - *${infoBot.priceUAH} UAH* | *${infoBot.priceUSD} USD*\n\n_Описание бота_ - \n\n${infoBot.description}\n\n_Ссылка на тестового бота_ - *${infoBot.linkTestBot}*\n\n_Количество покупок бота_ - *${infoBot.buys}* `, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: inlineKeyboard}})
    }
    if (data.startsWith('changeLinkToTestBot_')) {
        const id = data.split('_')[1]
        bot.sendMessage(chatId, 'Отправьте новую ссылку на бота ( формат: @test_bot )')
        state[chatId] = { awaitingNewLinkForBot: true, id: id }
    }
    if (data.startsWith('changeDiscriptonBot_')) {
        const id = data.split('_')[1]
        bot.sendMessage(chatId, 'Отправьте новое описание для бота')
        state[chatId] = { awaitingNewDescriptionForBot: true, id: id }
    }
    if (data.startsWith('changePriceBot_')) {
        const id = data.split('_')[1]
        bot.sendMessage(chatId, 'Отправьте новую стоимость бота в UAH')
        state[chatId] = { awaitingNewPriceUAHForBot: true, id: id }
    }
    if (data.startsWith('changeNameAdminBot_')) {
        const id = data.split('_')[1]
        bot.sendMessage(chatId, 'Отправьте новое имя для бота')
        state[chatId] = { awaitingNewBotNameForBot: true, id: id }
    }
    if (data.startsWith('infoPromocode_')){
        const id = data.split('_')[1]
        const infoPromocode = await db.collection('promocodes').findOne({_id: new ObjectId(id)})
        bot.editMessageText( `_Информация о промокоде_ - *${infoPromocode.promocode}*\n\n_Количество использываний_ - *${infoPromocode.chatIdsUsed.length}/${infoPromocode.uses}*`, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: [[{text: 'Список людей кто использывал промокод', callback_data: `listOfPromocodeUsesChatId_${id}`}]]}})
    }
    if (data.startsWith('listOfPromocodeUsesChatId_')) {
        const id = data.split('_')[1];
        const infoPromocode = await db.collection('promocodes').findOne({ _id: new ObjectId(id) });
        const chatIdsUsed = infoPromocode.chatIdsUsed;
        let message = '';

        if (chatIdsUsed.length === 0) {
            message = 'Нет пользователей, которые ввели данный промокод';
        } else {
            for (let i = 0; i < chatIdsUsed.length; i += 1) {
                const userId = chatIdsUsed[i];
                message += i+1 + '. ' + userId + '\n';
            }
        }

        bot.editMessageText(message, { chat_id: chatId, message_id: messageId });
    }
})

//////////////////////////////////////////////////////////////////////////////////////
                                    //MANAGER MENU
bot.onText(/\/manager/, (msg) => {
    const chatId = msg.chat.id
    console.log(adminChatId)
    if (menegerChatId.includes(chatId).toString() || adminChatId.includes(chatId.toString())) {
        sendMenegerMenu(chatId)
    } else {
        return
    }
})
bot.onText(/Промокоды/, async (msg) => {
    const chatId = msg.chat.id
    if (menegerChatId.includes(chatId).toString() || adminChatId.includes(chatId.toString())) {
        bot.sendMessage(chatId, `Выберите что вы хотите сделать`, {
            reply_markup: {
                keyboard: [
                    ['Добавить промокод', 'Удалить промокод'], ['Список промокодов'], ['Назад']
                ],
                resize_keyboard: true
            }
        })
    }
})
bot.onText(/Добавить промокод/, async (msg) => {
    const chatId = msg.chat.id
    if (menegerChatId.includes(chatId).toString() || adminChatId.includes(chatId.toString())) {
        bot.sendMessage(chatId, `Введите название промокода или нажмите на "Слуйчайная генерация" : `, {
            reply_markup: {
                inline_keyboard: [
                    [{text: 'Случайная генерация', callback_data: 'randomGenerationCode'}]
                ]
            }
        })
        state[chatId] = { awaitingNewPromocodeName: true }
        return
    }
})
bot.onText(/Удалить промокод/, async (msg) => {
    const chatId = msg.chat.id
    if (menegerChatId.includes(chatId).toString() || adminChatId.includes(chatId.toString())) {
        let inlineKeyboard = []
        const promocodes = await db.collection('promocodes').find({}).toArray();
        let row = [];
        for (let i = 0; i < promocodes.length; i += 1) {
            const promocode = promocodes[i];
            row.push({
                text: `${promocode.promocode} | ${promocode.uses}`, // Название заказа для отображения на кнопке
                callback_data: `deletePromocode_${promocode._id}` // Callback данные, содержащие идентификатор заказа
            });
            if (row.length === 2) {
                inlineKeyboard.push(row);
                row = [];
            }
        }
        if (row.length > 0) {
            inlineKeyboard.push(row);
        }
        bot.sendMessage(chatId, 'Выберите промокод, который нужно удалить :\n( При нажатия на промокод - он сразу удалится )', {reply_markup: {inline_keyboard: inlineKeyboard}})
    }
})
bot.onText(/Список промокодов/, async (msg) => {
    const chatId = msg.chat.id
    if (menegerChatId.includes(chatId).toString() || adminChatId.includes(chatId.toString())) {
        let inlineKeyboard = []
        const promocodes = await db.collection('promocodes').find({}).toArray();
        let row = [];
        for (let i = 0; i < promocodes.length; i += 1) {
            const promocode = promocodes[i];
            row.push({
                text: `${promocode.promocode} | ${promocode.uses}`, // Название заказа для отображения на кнопке
                callback_data: `infoPromocode_${promocode._id}` // Callback данные, содержащие идентификатор заказа
            });
            if (row.length === 2) {
                inlineKeyboard.push(row);
                row = [];
            }
        }
        if (row.length > 0) {
            inlineKeyboard.push(row);
        }
        bot.sendMessage(chatId, 'Выберите промокод, информацию которого вы хотите посмотреть :', {reply_markup: {inline_keyboard: inlineKeyboard}})
    }
})

bot.onText(/Рассылка/, async (msg) => {
    const chatId = msg.chat.id
    if (menegerChatId.includes(chatId).toString() || adminChatId.includes(chatId.toString())) {
        bot.sendMessage(chatId, `Следующим сообщением, введите текст который увидят все пользыватели.`, {
            reply_markup: {
                inline_keyboard: [
                    [{text: 'Отмена', callback_data: 'cancelNewsletter'}]
                ],
            }
        })
        state[chatId] = { awaitingTextNewsletter: true }
    }
})

bot.on('message', async (msg) => {
    const chatId = msg.chat.id
    const chatUn = msg.chat.username
    const messageId = msg.chat.message_id
    const text = msg.text

    if (state[chatId]?.awaitingNewPromocodeName) {
        state[chatId].awaitingNewPromocodeName = false
        const promocodeName = text
        bot.sendMessage(chatId, 'Теперь напишите количество использываний промокода : ')
        state[chatId].awaitingAmountPromocode = true
        state[chatId].promocodeName = promocodeName
        return
    }
    if (state[chatId]?.awaitingTextNewsletter) {
        const TextNewsletter = text
        state[chatId].awaitingTextNewsletter = false
        const users = await db.collection('users').find({}).toArray()
        for (let i = 0; i < users.length; i += 1) {
            const user = users[i];
            bot.sendMessage(user.chatId, text)
        }
        bot.editMessageText('*✅ Успешно! Рассылка отправлена всем пользователям.*', {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown'})
    }
    if (state[chatId]?.awaitingAmountPromocode) {
        if (isNaN(text)) {
            bot.sendMessage(chatId, 'Введите коректное значение.')
            return
        }
        state[chatId].awaitingAmountPromocode = false
        const promocodeName = state[chatId].promocodeName
        await db.collection('promocodes').insertOne({
            promocode: promocodeName,
            uses: parseFloat(text),
            chatIdsUsed: []
        })
        bot.sendMessage(chatId, `Успешно! 

Ваш новый промокод - \`${promocodeName}\` успешно активирован.

Нажмите на него что бы скопировать.`, {parse_mode: 'Markdown'})
        delete state[chatId]
        if (adminChatId.includes(chatId)) {
            sendAdminMenu()
        } else if (menegerChatId.includes(chatId)) {
            sendMenegerMenu()
        }
    }
})
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const chatUn = callbackQuery.message.chat.username
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;

    if (data === 'randomGenerationCode') {
        state[chatId].awaitingNewPromocodeName = false
        const promocodeName = await generatePromocodeName()
        state[chatId].promocodeName = promocodeName
        bot.sendMessage(chatId, 'Теперь напишите количество использываний промокода : ')
        state[chatId].awaitingAmountPromocode = true
    }
//////////////////////////////////////////////////////////////////////////////////////
})
async function generatePromocodeName(){
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let promoCode = '';
    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        promoCode += chars[randomIndex];
    }
    return promoCode;
}
async function haveBots(chatId) {
    const user = await db.collection('users').findOne({chatId: chatId})
    if (user.bots.length >= 1) {
        return true
    } else {
        return false
    }
}
async function sendMenegerMenu(chatId) {
    bot.sendMessage(chatId, 'Менеджер меню :', {
        reply_markup: {
            keyboard: [
                ['Рассылка', 'Промокоды']
            ],
            resize_keyboard: true
        }
    })
}
async function sendAdminMenu(chatId) {
    bot.sendMessage(chatId, 'Админ меню :', {
        reply_markup: {
            keyboard: [
                ['Управление ботами'], ['Менеджеры', 'Промокоды']
            ],
            resize_keyboard: true
        }
    })
}
async function languageUser(chatId) {
    const user = await db.collection('users').findOne({chatId: chatId});
    if (user) {
        return user.language;
    } else {
        console.log(`Error - not a user or user not found. ChatId - ${chatId}`);
        return null; // Явно возвращаем null, если пользователь не найден
    }
}
async function isUser(chatId) {
    const user = db.collection('users').findOne({ chatId: chatId })
    if (user){
        return true
    } else {
        return false
    }
}
async function createNewUser(chatId, chatUn) {
    try {
        const userExists = await db.collection('users').findOne({ chatId: chatId });
        if (!userExists) {
            await db.collection('users').insertOne({
                chatId: chatId,
                username: chatUn,
                balance: 0,
                refBalance: 0,
                statusRefBalance: 0,
                language: 'ru',
                bots: [],
                usersInvited: [],
                registrationDate: new Date().toLocaleString('en-US', { timeZone: 'Europe/Kiev' }),
                notificationsEnabled: true,
            });
            console.log(`Пользователь ${chatId} добавлен в MongoDB.`);
        } else {
            console.log(`Пользователь ${chatId} уже существует в MongoDB.`);
        }
    } catch (error) {
        console.error("Ошибка при создании нового пользователя в MongoDB:", error);
    }
}
async function generateBotIdOnly(){
    let newBotId
    let BotIdExists = true
    while (BotIdExists) {
        const randomNumber = Math.floor(Math.random() * 9999) + 1;
        newBotId = `BID-${String(randomNumber).padStart(4, '0')}`;
        const payIdCount = await db.collection('botsUser').countDocuments({ BID: newBotId });
        if (payIdCount === 0) BotIdExists = false;
    }
    return newBotId
}
async function generateTiketIdOnly() {
    let newTiketId
    let TiketIdExists = true
    while (TiketIdExists) {
        const randomNumber = Math.floor(Math.random() * 9999) + 1;
        newTiketId = `Tiket-${String(randomNumber).padStart(4, '0')}`;
        const tiketIdCount = await db.collection('tiketsHelp').countDocuments({ tiketId: newTiketId });
        if (tiketIdCount === 0) TiketIdExists = false;
    }
    return newTiketId
}
async function getTotalBuys() {
    try {
        const botsCollection = db.collection('bots');

        const result = await botsCollection.aggregate([
            {
                $group: {
                    _id: null,
                    totalBuys: { $sum: "$buys" }
                }
            }
        ]).toArray();

        return result.length > 0 ? result[0].totalBuys : 0;
    } catch (error) {
        console.log(error)
    }
}
async function loadManagers() {
    try {
        const botOptions = await db.collection('botOptions').findOne({});
        if (botOptions && botOptions.managers) {
            const managers = botOptions.managers;
            console.log("Список chatId Менеджеров загружен: ", managers);
            return menegerChatId = managers;
        } else {
            console.error("Поле 'managers' не найдено в коллекции 'botOptions'");
            return [];
        }
    } catch (error) {
        console.error("Ошибка при загрузке списка менеджеров: ", error);
        return [];
    }
}

async function loadAdmins() {
    try {
        const botOptions = await db.collection('botOptions').findOne({});
        if (botOptions && botOptions.admins) {
            const admins = botOptions.admins;
            console.log("Список chatId Админов загружен: ", admins);
            return adminChatId = admins;
        } else {
            console.error("Поле 'admins' не найдено в коллекции 'botOptions'");
            return [];
        }
    } catch (error) {
        console.error("Ошибка при загрузке списка админов: ", error);
        return [];
    }
}

async function sendHelpTiket(userId, HelpMessage, tiketId, timeReg) {
    let message = `*🆘 Новый Help Tiket*
    
_User ID -_ ${userId}
_Tiket ID -_ *${tiketId}*
_Time Reg -_ *${timeReg}*
_Language User -_ *${await languageUser(userId)}* 
    
_Message Data -_ 
    
${HelpMessage}`;

    const botOptions = await db.collection('botOptions').findOne({});

    const admins = botOptions.admins; // admins уже массив
    for (let i = 0; i < admins.length; i += 1) {
        const adminId = admins[i];
        bot.sendMessage(adminId, message, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{text: `Ответить ${tiketId}`, callback_data: `giveAnswer_${tiketId}`}]
                ]
            }
        });
    }

    const managers = botOptions.managers; // managers уже массив
    for (let i = 0; i < managers.length; i += 1) {
        const managerId = managers[i];
        bot.sendMessage(managerId, message, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{text: `Ответить ${tiketId}`, callback_data: `giveAnswer_${tiketId}`}]
                ]
            }
        });
    }
}
async function addReferral(referrerId, newUserId, chatUn){
    try {
        const referrer = await db.collection('users').findOne({ chatId: parseFloat(referrerId) });
        if (!referrer) {
            console.log(`Реферер с chatId ${referrerId} не найден.`);
            return;
        }
        const newUserExists = await db.collection('users').findOne({ chatId: newUserId });
        if (parseFloat(referrerId) == newUserId) {
            console.log(`Попытка зарегестрироваться по своей реф ссылке - ${newUserId}`)
            return
        }
        if (!newUserExists) {
            await db.collection('users').insertOne({
                chatId: newUserId,
                username: chatUn,
                balance: 0,
                refBalance: 0,
                statusRefBalance: 0,
                language: 'ru',
                bots: [],
                usersInvited: [],
                registrationDate: new Date().toLocaleString('en-US', { timeZone: 'Europe/Kiev' }),
                notificationsEnabled: true,
            });
            await db.collection('users').updateOne({ chatId: parseFloat(referrerId) }, { $push: { usersInvited: newUserId } });
            const languageRef = await languageUser(parseFloat(referrerId))
            let messageRef
            if (languageRef === "ru") {
                messageRef = `На вашу ссылку зарегистрировался (${newUserId}). Спасибо за сотрудничество`
            } else if (languageRef === "ua") {
                messageRef = `На ваше посилання зареєструвався (${newUserId}). Дякую за співпрацю`
            }
            bot.sendMessage(parseFloat(referrerId), messageRef)
            console.log(`Новый партнер ${newUserId} успешно зарегистрирован.`);
        } else {
            console.log("Этот партнер уже зарегистрирован.");
        }
    } catch (error) {
        console.error("Ошибка при добавлении реферала в MongoDB:", error);
    }
}
async function sendTiketForReSellBot(TechnikTask, TestLink, contacts, chatId) {
    const botOptions = await db.collection('botOptions').findOne({});
    const admins = botOptions.admins; // admins уже массив
    let message = `🤖 Tiket Resell Bot\n\nТехническое задание :\n\n${TechnikTask}\n\nСсылка на тестового бота : ${TestLink}\n\nКонтакты :\n\n${contacts}\n\nChat ID: ${chatId}`
    for (let i = 0; i < admins.length; i += 1) {
        const adminId = admins[i];
        bot.sendMessage(adminId, message, {parse_mode: 'Markdown',});
    }
}
async function checkHostingDates() {
    try {
        const botsUserCollection = db.collection('botsUser');

        const hostingDate = new Date();
        const today = hostingDate.toLocaleDateString('en-GB', { timeZone: 'Europe/Kiev' });
        const bots = await botsUserCollection.find({}).toArray();
        hostingDate.setMonth(hostingDate.getMonth() + 1);
        const updatedHosting = hostingDate.toLocaleDateString('en-GB', { timeZone: 'Europe/Kiev' });
        for (let botU of bots) {
            if (botU.hosting === today) {
                if (botU.balanceBot >= 200) {
                    await db.collection('botsUser').findOneAndUpdate({_id: new ObjectId(botU._id)}, {$inc: {balanceBot: -200}})
                    await db.collection('botsUser').findOneAndUpdate({_id: new ObjectId(botU._id)}, {$set: {hosting: updatedHosting}})
                } else {
                    const userId = botU.buyerId
                    const language = await languageUser(userId)
                    let message

                    if (language === 'ru') {
                        message = '*❗️ Ваш хостинг закончился.* \n\nЧто бы обновить его пополните счет и напишите в "Помощь".\n\n_Ps: Вы можете пополнить баланс бота в админ панеле и хостинг будет автоматически оплачиваться_'
                    } else if (language === 'ua') {
                        message = '*❗️ Ваш хостинг закінчився.* \n\nЩоб оновити його, поповніть рахунок і напишіть у "Допомога".\n\n_Ps: Ви можете поповнити баланс бота в адмін панелі і хостинг буде автоматично оплачуватись_'
                    }
                    bot.sendMessage(userId, message, {parse_mode: 'Markdown'})
                    await sendNotificationAboutHostingUser(userId, botU.BID)
                }
            }
        }
    } catch (err) {
        console.error(err);
    }
}
async function sendNotificationAboutHostingUser(chatId, BID) {
    const botOptions = await db.collection('botOptions').findOne({});
    const managers = botOptions.managers; // managers уже массив

    let message =  `У пользователя - ${chatId} закончился хостинг на бота ${BID}. Отключите хостинг пока он не напишет в "Помощь"`

    for (let i = 0; i < managers.length; i += 1) {
        const managerId = managers[i];
        bot.sendMessage(managerId, message);
    }
}
cron.schedule('0 9 * * *', () => {
    checkHostingDates();
    console.log('Проверка дат хостинга выполнена');
});

bot.on('polling_error', console.log)
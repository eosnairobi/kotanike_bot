// Import these node modules
const TelegramBot = require('node-telegram-bot-api');
const config = require('config');
const request = require("request");
const fetch = require('node-fetch');

// Fetch wit.ai token from the config file
const NEW_ACCESS_TOKEN = config.get('witAiToken');

// Fetch the telegram token from the config file
const telegramToken = config.get('telegramToken');

// Set url to fetch from the now environment
const url = process.env.NOW_URL;

// Set up the webhook and the bot
const options = { webHook: { port: 443 } };
const bot = new TelegramBot(telegramToken, options);
bot.setWebHook(`${url}/bot${telegramToken}`);

// For any incoming message
bot.on('message', (msg) => {

    // For any incoming message, send it to the nlp
    handleMessage(msg);

});

// Message to send on start
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Hi and welcome to Kotani by @eosnairobi block producer candidate").then(() => bot.sendMessage(msg.chat.id, "Some of the questions you can ask are: \n - balance ha2tsmzqhege")).then(() => bot.sendMessage(msg.chat.id, "In case you get stuck, you can try /help to show you commands you can try"));
});

// Message to send on start
bot.onText(/\/help/, (msg) => {

    bot.sendMessage(msg.chat.id, "Some of the questions you can ask are: \n - balance ha2tsmzqhege");
        
})

// Checks account balance in the eos api
function checkAccountBalance(accountName, id) {
    var options = {
        method: "POST",
        url: "http://mainnet.eoscanada.com/v1/chain/get_account",
        body: {
            account_name: accountName
        },
        json: true

    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        let accountBalance = body.core_liquid_balance;
        console.log(body.core_liquid_balance);
        console.log(body);

        if (!error && response.statusCode == 200) {
            bot.sendMessage(id, `The account balance is ` + accountBalance);
        } else {
            bot.sendMessage(id, `The account name you entered is invalid or command entered is incorrect `)
            .then(() => bot.sendMessage(id, `Try: \n - balance accountname`));
        }

    });
}

// Get the context
function handleMessage(message_in) {
    let message = message_in.text;
    let id = message_in.chat.id;
    return queryWit(message).then(({ entities }) => {
        const intent = firstEntity(entities, 'intent');
        console.log(intent);

        if (!intent && message.text == !'/help' && message.text == !'/start') {
            bot.sendMessage(id, 'Sorry, try again');
            return;
        }

        switch (intent.value) {

            // if it is asking account balance
            case 'balance':
                // The last word in the sentence is the account name
                var sentence = message.split(" ");
                var accountName = sentence[sentence.length - 1];
                checkAccountBalance(accountName, id);

        }
    });

}

// Wit ai specific code
function firstEntity(entities, name) {
    return entities &&
        entities[name] &&
        Array.isArray(entities[name]) &&
        entities[name] &&
        entities[name][0];
}

// Wit ai specific code
function queryWit(text, n = 1) {
    return fetch(
        `https://api.wit.ai/message?v=20170307&n=${n}&q=${encodeURIComponent(text)}`,
        {
            headers: {
                Authorization: `Bearer ${NEW_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
        }
    ).then(res => res.json());
}


// Import these node modules
const TelegramBot = require('node-telegram-bot-api');
const config = require('config');
const request = require("request");
const fetch = require('node-fetch');
var _ = require("lodash");

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
    bot.sendMessage(msg.chat.id, "Hi and welcome to Kotani by @eosnairobi block producer candidate").then(() => bot.sendMessage(msg.chat.id, "Some of the questions you can ask are: \n - balance ha2tsmzqhege \n - eos price \n - get producer accountname")).then(() => bot.sendMessage(msg.chat.id, "In case you get stuck, you can try /help to show you commands you can try"));
});

// Message to send on start
bot.onText(/\/help/, (msg) => {

    bot.sendMessage(msg.chat.id, "Some of the questions you can ask are: \n - balance accountname \n - eos price \n - get producer accountname");

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
            bot.sendMessage(id, `The account name you entered is invalid or command entered is incorrect.`)
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

        if (!intent && message.text != '/help' && message.text != '/start') {
            bot.sendMessage(id, 'Hi, some of the questions you can ask are: \n - balance accountname \n - eos price \n - get producer accountname');
            return;
        }

        switch (intent.value) {

            // if it is asking account balance
            case 'balance':
                // The last word in the sentence is the account name
                var sentence = message.split(" ");
                var accountName = sentence[sentence.length - 1];
                checkAccountBalance(accountName, id);
                break;

            // if user is asking for the price of eos
            case 'price':
                getPrice(id);
                break;

            // if user is asking for information about a block producer candidate
            case 'producer':
                // The last word in the sentence is the producer name
                var sentence_one = message.split(" ");
                var producerName = sentence_one[sentence_one.length - 1];
                getProducerInfo(producerName, id);
                break;
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

// Gets prices from coinmarketcap
function getPrice(id) {

    request('https://api.coinmarketcap.com/v1/ticker/EOS/', function (error, response, body) {
        var data = JSON.parse(body);
        var price = data[0]["price_usd"];
        bot.sendMessage(id, '1 EOS token is equivalent to ' + price + ' US Dollars');
    });
}

// Checks account balance in the eos api
function getProducerInfo(accountName, id) {

    var options = {
        method: 'POST',
        url: 'http://mainnet.eoscanada.com/v1/chain/get_producers',
        body: { limit: '500', json: 'true' },
        json: true
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        var producers = body.rows;
        var producer_info = _.filter(producers, { owner: accountName });
        if (producer_info != '') {
            var producer_name = producer_info[0].owner;
            var url = producer_info[0].url;
            var rank = _.findIndex(producers, { owner: accountName }) + 1;
            var total_votes = producer_info[0].total_votes;
            var overal_total_votes = body.total_producer_vote_weight;
            var vote_percentage = (total_votes / overal_total_votes) * 100;

            bot.sendMessage(id, `About ` + producer_name + `\n\nUrl: `+ url + `\n\nRank: ` + rank + `\n\nTotal votes: `+ total_votes + `\n\nOveral number of votes: ` + overal_total_votes + `\n\nVote percentage: ` + vote_percentage);
        } else {
            bot.sendMessage(id, `The account name you entered is invalid or command entered is incorrect.`)
                .then(() => bot.sendMessage(id, `Try: \n - get producer accountname`));
        }
    });
}
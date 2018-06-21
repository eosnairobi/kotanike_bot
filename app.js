// Import these node modules
const TelegramBot = require('node-telegram-bot-api');
const config = require('config');
const request = require("request");

// Fetch the telegram token from the config file
const telegramToken = config.get('telegramToken');

const bot = new TelegramBot(telegramToken, { polling: true });


bot.on('message', (msg) => {
    
    if (msg.text.toString().toLowerCase().length == 12) {
    var accountName = msg.text.toString().toLowerCase();
    let account_balance = checkAccountName(accountName, msg);
   
    } 
        
});

function checkAccountName(accountName, msg) {
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
        bot.sendMessage(msg.chat.id, accountBalance);

    });
}


'use strict';

var Alexa = require('alexa-sdk');
var appId = 'amzn1.ask.skill.298e180a-4976-4a90-90d1-6081abaaf089';


exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = appId;
    alexa.dynamoDBTableName = 'favoritePersonUsers';
    alexa.registerHandlers(sessionHandlers);
    alexa.execute();
};

var globalFavorites = [
    ['me yay', 'none'],
    ['oh sorry, I\'m not playing favorites today', 'none'],
    ['Princess Leia', 'she is brave'],
    ['Harry Potter', 'he is clever'],
    ['Bugs Bunny', 'he is cool'],
    ['The Grinch', 'he is so crabby'],
    ['Santa Claus', 'he is Santa'],
    ['The Little Prince', ''],
    ['Mary Poppins', ''],
    ['Frosty The Snowman', 'he is never cold'],
    ['Woody', ''],
    ['Simba', ''],
    ['Dorothy', 'she is off to see the wizard'],
    ['Little Bo Peep', 'she is fond of sheep'],
    ['Willy wonka', 'he is a chocolate expert'],
    ['Superman', ''],
    ['Neo', 'he is the one']
];

var randomPick = function(favorites) {
    let i = Math.floor(favorites.length * Math.random() )
    return favorites[i]
};

var helpMessage = 'When you ask I\'ll tell you my favorite person of the day. For example you can say, Ask Favorite Person who is your favorite today. You can also suggest other people to be my favorite in the future. You can say, Tell Favorite Person to make Sarah your favorite because she is smart'; 

var sessionHandlers = {
    "Unhandled": function() {
      this.emit('GetFavoriteIntent');
    },
    'GetFavoriteIntent': function() {
        if(Object.keys(this.attributes).length === 0) {
            this.attributes['todaysFavorite'] = 'dummy';
            this.attributes['getFavoriteCount'] = 0;
            this.attributes['todaysDate'] = 0;
            this.emit(':tell', 'Welcome to Favorite Person.' + helpMessage);
        }
        else {
            this.emit('getFavoriteHandler');
        }
    },
    'AddFavoriteIntent': function() {
        this.emit('addFavoriteHandler');
    },
    'AddFavoriteAndNoteIntent': function() {
        this.emit('addFavoriteAndNoteHandler');
    },
    'getFavoriteHandler': function() {
        let fcount = this.attributes['getFavoriteCount'];
        this.attributes['getFavoriteCount'] += 1;

        let date = (new Date()).getDate();
        if (this.attributes['todaysDate'] == date) {
            this.emit(':tell', this.attributes['todaysFavorite']);
        }
        else {
            this.attributes['todaysDate'] = date;
            let pick;
            if (fcount == 0) {
                pick = globalFavorites[0];
            }
            else if ('userAddedFavorites' in this.attributes && fcount % 2 == 1) { 
                pick = randomPick(this.attributes['userAddedFavorites']);
            }
            else {
                pick = randomPick(globalFavorites);
            }
            let favorite = 'My favorite person today is ' + pick[0];

            if (pick[1] != 'empty') {
                favorite += ' because ' + pick[1];
            }
            this.attributes['todaysFavorite'] = favorite;
            this.emit(':tell', favorite);
        }
    },
    'addFavoriteHandler': function() {
        let fav = this.event.request.intent.slots.favname;
        if (fav && 'value' in fav) {
        
            if ( !('userAddedFavorites' in this.attributes) ) {
                this.attributes['userAddedFavorites'] = []
            }
            let value = fav['value'];
            this.attributes['userAddedFavorites'].push([value, 'empty']);
            let response = 'OK, I will think about making ' + value + ' my favorite';
            this.emit(':tell', response);
        }
        else {
            this.emit(':tell', 'Sorry, I didn\'t get that.');
        }
    },
    'addFavoriteAndNoteHandler': function() {
        let fav = this.event.request.intent.slots.favname;
        let note = this.event.request.intent.slots.favnote;
        if (fav && note && 'value' in fav && 'value' in note) {
            if ( !('userAddedFavorites' in this.attributes) ) {
                this.attributes['userAddedFavorites'] = []
            }
            let fvalue = fav['value'];
            let nvalue = note['value'];
            this.attributes['userAddedFavorites'].push([fvalue, nvalue]);
            let response = 'OK, I will think about making ' + fvalue + ' my favorite because ' + nvalue;
            this.emit(':tell', response);
        }
        else {
            this.emit(':tell', 'Sorry, I didn\'t get that.');
        }
    },
    "AMAZON.HelpIntent": function() {
        this.emit(':tell', helpMessage);
    }
};


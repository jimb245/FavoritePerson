'usestrict';

/*
Lambda function for Favorite Person, a kid's novelty Alexa
skill. The skill picks a favorite person of the day
randomly from a dynamic list. The list is initialized
with a few 'people', like Santa, and users can add 
new favorites.

The list contains names and optionally a 'reason' for
choosing that person as favorite. The reason has to fit the
sentence pattern:

my favorite today is <name> because <she|he> is <reason>

The list also includes a value for the <she|he> pronoun.

The list is limited to 20 entries. Entries can also be
deleted by name.

Uses DynamoDB for dynamic data. Uses a fork of the nodejs 
skills kit to provide access to DynamoDB's time to live 
feature. Dynamic data is deleted if there is no activity 
for a month.
*/

var Alexa = require('alexa-sdk');
var appId = 'amzn1.ask.skill.298e180a-4976-4a90-90d1-6081abaaf089';

var initFavorites = [
    ['me, <say-as interpret-as="interjection">yay,</say-as>', 'empty', 'empty'],
    ['sorry, I\'m not playing favorites today', 'empty', 'empty'],
    ['scrooge', 'he', 'mean but learns to be nice'],
    ['santa claus', 'he', 'Santa!'],
    ['snowman', 'he', 'never cold!'],
    ['rudolf', 'he', 'an important reindeer!']
    ['dorothy', 'she', 'off to see the wizard!'],
    ['little bopeep', 'she', 'kind to sheep!'],
    ['gretel', 'she', 'very clever!'],
    ['captain hook', 'he', 'a pirate!, <prosody rate="x-slow">arg</prosody>']
];

var welcomeMessage = '<break time="1s"/> You can ask my favorite person today. <break time="1s"/> You can also suggest someone to be my favorite in the future. <break time="1s"/> You can also ask me to forget someone. <break time="1s"/> Or you can ask for help. <break time="1s"/> What would you like to do?'; 

var helpMessage = 'When you ask I\'ll tell you my favorite person of the day. For example you can say, Who is your favorite person today. <break time="2s"/> You can also suggest other people to be my favorite in the future. For example you can say, Make Emily a favorite because she is smart. <break time="2s"/> You can also ask me to forget someone. You can say, Forget Emily. <break time="2s"/> What would you like to do?'; 

var limitCount = 20;

var limitMessage = 'Sorry, you already have twenty favorites. Any more would give me a headache. <break time="2s"/> You can ask me to forget some of them to make room for new ones. For example, you can say, Ask Favorite Person to forget Emily. <break time="2s"/> Here are all the favorites now,';

var errorMessage = 'Sorry, I didn\'t get that';

var TTL = 3600; // time to live delta in seconds
//var TTL = 3600*24*30; // time to live delta in seconds

var newTTL = function() {
    return Math.floor(Date.now()/1000) + TTL;
};

var randomPick = function(favorites) {
    var i = Math.floor(favorites.length * Math.random() );
    return favorites[i];
};

var addMessage = function(favorite) {
    if (favorite[1] != 'empty' && favorite[2] != 'empty') {
        return 'OK, I will think about making ' + favorite[0] + ' my favorite because ' + favorite[1] + ' is ' + favorite[2];
    }
    else {
        return 'OK, I will think about making ' + favorite[0] + ' my favorite';
    }
};

var existsMessage = function(name) {
    return 'Hmmm, I think ' + name + ' is already one of my favorites';
};

var removeSpaces = function(string) {
    return string.split(' ').join('');
};

var nameExists = function(name, favorites) {
    // Want the 'forget' intent to work for initial and
    // any added favorites so matching needs to be modulo
    // any name ambiguities.
    // name is from voice input to a First_Name slot and
    // probably rarely has spaces but some initial favorites
    // do contain spaces. So include matches to no-spaces
    // value or to initial substring. Also sometimes name
    // arrives capitalized so compare lowered values.
    var lowName = name.toLowerCase();
    var lowFav;
    for (var i = 0; i < favorites.length; i++) {
        lowFav = favorites[i][0].toLowerCase();
        if (lowName == lowFav || lowName == removeSpaces(lowFav)) {
            return i;
        }
    }
    for (i = 0; i < favorites.length; i++) {
        lowFav = favorites[i][0].toLowerCase();
        if (lowFav.startsWith(lowName)) {
            return i;
        }
    }
    return null;
};

var sessionHandlers = {
    'LaunchRequest': function() {
        this.emit('welcomeHandler');
    },
    'GetFavoriteIntent': function() {
        if(Object.keys(this.attributes).length === 0) {
            this.emit('welcomeHandler');
        }
        else {
            this.emit('getFavoriteHandler');
        }
    },
    'AddFavoriteIntent': function() {
        if(Object.keys(this.attributes).length === 0) {
            this.emit('welcomeHandler');
        }
        else {
            this.emit('addFavoriteHandler');
        }
    },
    'AddFavoriteBecauseIntent': function() {
        if(Object.keys(this.attributes).length === 0) {
            this.emit('welcomeHandler');
        }
        else {
            this.emit('addFavoriteBecauseHandler');
        }
    },
    'ForgetFavoriteIntent': function() {
        if(Object.keys(this.attributes).length === 0) {
            this.emit('welcomeHandler');
        }
        else {
            this.emit('forgetFavoriteHandler');
        }
    },
    'welcomeHandler': function() {
        if(Object.keys(this.attributes).length === 0) {
            this.attributes.todaysFavorite = 'dummy';
            this.attributes.getFavoriteCount = 0;
            this.attributes.todaysDate = 0;
            this.attributes.TTL = newTTL();
            this.attributes.favorites = initFavorites.slice();
        }
        this.emit(':ask', 'Welcome to Favorite Person.' + welcomeMessage, welcomeMessage);
    },
    'getFavoriteHandler': function() {
        this.attributes.TTL = newTTL();
        var fcount = this.attributes.getFavoriteCount;
        this.attributes.getFavoriteCount += 1;

        var date = (new Date()).getDate();
        /*
        if (this.attributes.todaysDate == date) {
            this.emit(':tell', this.attributes.todaysFavorite);
        }
        else {
        */
            if (this.attributes.favorites.length === 0) {
                var response = 'Uh oh, I don\'t have any favorites now. Maybe you should suggest some';
                this.emit(':tell', response);
            } 
            else {
                this.attributes.todaysDate = date;
                var pick;
                if (fcount === 0) {
                    pick = this.attributes.favorites[0];
                }
                else {
                    pick = randomPick(this.attributes.favorites);
                }
                var favorite = 'My favorite person today is ' + pick[0];

                if (pick[1] != 'empty') {
                    favorite += ', because ' + pick[1] + ' is ' + pick[2];
                }
                this.attributes.todaysFavorite = favorite;
                this.emit(':tell', favorite);
            }
        //}
    },
    'addFavoriteHandler': function() {
        this.attributes.TTL = newTTL();
        var favname = this.event.request.intent.slots.favname;
        if (favname && 'value' in favname) {
        
            var response;
            if (this.attributes.favorites.length >= limitCount) {
                response = limitMessage;
                // First two are not simple names, leaving them out of the
                // spoken list
                for (var i = 2; i < this.attributes.favorites.length; i++) {
                    response += this.attributes.favorites[i][0] + ', ';
                }
                this.emit(':tell', response);
            }
            else {
                var name = favname.value;
                if (nameExists(name, this.attributes.favorites) === null) {
                    this.attributes.favorites.push([name, 'empty', 'empty']);
                    response = addMessage([name, 'empty', 'empty']);
                    this.emit(':tell', response);
                }
                else {
                    response = existsMessage(name);
                    this.emit(':tell', response);
                }
            }
        }
        else {
            this.emit(':tell', errorMessage);
        }
    },
    'addFavoriteBecauseHandler': function() {
        this.attributes.TTL = newTTL();
        var favname = this.event.request.intent.slots.favname;
        var favnoun = this.event.request.intent.slots.favnoun;
        var favadj = this.event.request.intent.slots.favadj;
        if (favname && favnoun && favadj && 'value' in favname && 'value' in favnoun && 'value' in favadj) {
            var response;
            if (this.attributes.favorites.length >= limitCount) {
                response = limitMessage;
                for (var i = 0; i < this.attributes.favorites.length; i++) {
                    response += this.attributes.favorites[i][0] + ', ';
                }
                this.emit(':tell', response);
            }
            else {
                var name = favname.value;
                var noun = favnoun.value;
                var adjective = favadj.value;
                if (nameExists(name, this.attributes.favorites) === null) {
                    if (noun == 'he' || noun == 'she') {
                        this.attributes.favorites.push([name, noun, adjective]);
                        response = addMessage([name, noun, adjective]);
                        this.emit(':tell', response);
                    }
                    else {
                        response = errorMessage + '<break time="2s"/>If you are giving a reason for your suggestion try saying it as, because he is, or because she is, followed by the reason';
                        this.emit(':tell', response);
                    }
                }
                else {
                    response = existsMessage(name);
                    this.emit(':tell', response);
                }
            }
        }
        else {
            this.emit(':tell', errorMessage);
        }
    },
    'forgetFavoriteHandler': function() {
        this.attributes.TTL = newTTL();
        var favname = this.event.request.intent.slots.favname;
        if (favname && 'value' in favname) {
            var name = favname.value;
            var pos = nameExists(name, this.attributes.favorites);
            if (pos === null) {
                response = 'Hmm, I don\'t seem to remember anything about ' + name;
                this.emit(':tell', response);
            }
            else {
                response = 'OK, I will forget about ' + this.attributes.favorites[pos][0];
                this.attributes.favorites.splice(pos, 1);
                this.emit(':tell', response);
            }
        }
        else {
            this.emit(':tell', errorMessage);
        }
    },
    "AMAZON.HelpIntent": function() {
        this.attributes.TTL = newTTL();
        this.emit(':ask', helpMessage);
    },
    "AMAZON.StopIntent": function() {
        this.attributes.TTL = newTTL();
        this.emit(':tell', 'Goodbye');
    },
    "AMAZON.CancelIntent": function() {
        this.attributes.TTL = newTTL();
        this.emit(':tell', 'Goodbye');
    },
    'Unhandled': function() {
      this.attributes.TTL = newTTL();
      this.emit(':tell', errorMessage);
    }
};

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = appId;
    alexa.dynamoDBTableName = 'favoritePersonUsers';
    alexa.registerHandlers(sessionHandlers);
    alexa.execute();
};


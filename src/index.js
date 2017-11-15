'usestrict';

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
    ['me, <say-as interpret-as="interjection">yay,</say-as>', 'empty', 'empty'],
    ['sorry, I\'m not playing favorites today', 'empty', 'empty'],
    ['Princess Leia', 'she', 'brave'],
    ['Harry Potter', 'he', 'clever'],
    ['Bugs Bunny', 'he', 'cool'],
    ['The Grinch', 'he', 'crabby'],
    ['Santa Claus', 'he', 'Santa'],
    ['Mary Poppins', 'she', 'a magical nanny'],
    ['Frosty The Snowman', 'he', 'never cold'],
    ['Dorothy', 'she', 'off to see the wizard'],
    ['Little Bo Peep', 'she', 'kind to sheep'],
    ['Willy wonka', 'he', 'a chocolate expert'],
    ['Superman', 'he', 'strong'],
    ['Wonderwoman', 'she', 'an Amazon'],
    ['Neo', 'he', 'the one'],
    ['Kermit', 'he', 'cheerful'],
    ['Horton', 'he', 'a good listener'],
    ['Woody', 'he', 'a leader'],
    ['The Little Prince', 'he', 'from an asteroid'],
    ['Simba', 'he', 'a king'],
    ['Elsa', 'she', 'a good sister']
];

var helpMessage = 'When you ask I\'ll tell you my favorite person of the day. For example you can say, Ask favorite person today. You can also suggest other people to be my favorite in the future. For example you can say, Ask Favorite Person to make Emily your favorite because she is smart. You can also ask me to forget an earlier suggestion. You can say, Ask Favorite Person to forget Emily'; 

var limitCount = 20;

var limitMessage = 'Sorry, you already have suggested twenty favorites. Any more would give me a headache. You can delete some of your suggestions to make room for new ones. For example, you can say, Ask Favorite Person to forget Emily';

var errorMessage = 'Sorry, I didn\'t get that';

var randomPick = function(favorites) {
    var i = Math.floor(favorites.length * Math.random() );
    return favorites[i];
};

var isNewName = function(name, userFavorites) {
    for (var i in range(userFavorites.length)) {
        if (userFavorites[i][0] == name) {
            return false;
        }
    }
    return true;
};

var addMessage = function(favorite) {
    if (favorite[1] != 'empty' && favorite[2] != 'empty') {
        return 'OK, I will think about making ' + favorite[0] + ' my favorite because ' + favorite[1] + ' is ' + favorite[2];
    }
    else {
        return 'OK, I will think about making ' + favorite[0] + ' my favorite';
    }
};

var askedMessage = function(name) {
    return 'Hmmm, I guess you forgot you already asked me to make ' + name + ' my favorite';
};

var sessionHandlers = {
    'LaunchRequest': function() {
        if(Object.keys(this.attributes).length === 0) {
            this.emit('welcomeHandler');
        }
        else {
            this.emit('getFavoriteHandler');
        }
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
        this.attributes.todaysFavorite = 'dummy';
        this.attributes.getFavoriteCount = 0;
        this.attributes.todaysDate = 0;
        this.attributes.timeStamp = Date.now();
        this.emit(':tell', 'Welcome to Favorite Person.' + helpMessage);
    },
    'getFavoriteHandler': function() {
        var fcount = this.attributes.getFavoriteCount;
        this.attributes.getFavoriteCount += 1;

        var date = (new Date()).getDate();
        if (this.attributes.todaysDate == date) {
            this.emit(':tell', this.attributes.todaysFavorite);
        }
        else {
            this.attributes.todaysDate = date;
            this.attributes.timeStamp = Date.now();
            var pick;
            if (fcount === 0) {
                pick = globalFavorites[0];
            }
            else if (this.attributes.hasOwnProperty('userAddedFavorites') && this.attributes.userAddedFavorites.length > 0 && fcount % 2 == 1) { 
                pick = randomPick(this.attributes.userAddedFavorites);
            }
            else {
                pick = randomPick(globalFavorites);
            }
            var favorite = 'My favorite person today is ' + pick[0];

            if (pick[1] != 'empty') {
                favorite += ' because ' + pick[1] + ' is ' + pick[2];
            }
            this.attributes.todaysFavorite = favorite;
            this.emit(':tell', favorite);
        }
    },
    'addFavoriteHandler': function() {
        var favname = this.event.request.intent.slots.favname;
        if (favname && 'value' in favname) {
        
            if ( !( this.attributes.hasOwnProperty('userAddedFavorites') )) {
                this.attributes.userAddedFavorites = [];
            }
            if (this.attributes.userAddedFavorites.length == limitCount) {
                this.emit(':tell', limitMessage);
            }
            else {
                var name = favname.value;
                var response;
                if (isNewName(name, this.attributes.userAddedFavorites)) {
                    this.attributes.userAddedFavorites.push([name, 'empty', 'empty']);
                    response = addMessage([name, 'empty', 'empty']);
                    this.emit(':tell', response);
                }
                else {
                    response = askedMessage(name);
                    this.emit(':tell', response);
                }
            }
        }
        else {
            this.emit(':tell', errorMessage);
        }
    },
    'addFavoriteBecauseHandler': function() {
        var favname = this.event.request.intent.slots.favname;
        var favnoun = this.event.request.intent.slots.favnoun;
        var favadj = this.event.request.intent.slots.favadj;
        if (favname && favnoun && favadj && 'value' in favname && 'value' in favnoun && 'value' in favadj) {
            if ( !(this.attributes.hasOwnProperty('userAddedFavorites') )) {
                this.attributes.userAddedFavorites = [];
            }
            if (this.attributes.userAddedFavorites.length == limitCount) {
                this.emit(':tell', limitMessage);
            }
            else {
                var name = favname.value;
                var noun = favnoun.value;
                var adjective = favadj.value;
                var response;
                if (isNewName(name, this.attributes.userAddedFavorites)) {
                    this.attributes.userAddedFavorites.push([name, noun, adjective]);
                    response = addMessage([name, noun, adjective]);
                    this.emit(':tell', response);
                }
                else {
                    response = askedMessage(name);
                    this.emit(':tell', response);
                }
            }
        }
        else {
            this.emit(':tell', errorMessage);
        }
    },
    'forgetFavoriteHandler': function() {
        var favname = this.event.request.intent.slots.favname;
        if (favname && 'value' in favname) {
            var name = favname.value;
            if (isNewName(name, this.attributes.userAddedFavorites)) {
                response = 'Hmm, I don\'t seem to remember anything about ' + name;
                this.emit(':tell', response);
            }
            else {
                response = 'OK, I will forget about ' + name;
                this.emit(':tell', response);
            }
        }
        else {
            this.emit(':tell', errorMessage);
        }
    },
    "AMAZON.HelpIntent": function() {
        this.emit(':tell', helpMessage);
    },
    'Unhandled': function() {
      this.emit(':tell', errorMessage);
    }
};


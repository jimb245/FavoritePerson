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
    ['Mary Poppins', 'she', 'the best nanny'],
    ['Frosty The Snowman', 'he', 'never cold'],
    ['Dorothy', 'she', 'off to see the wizard'],
    ['Little Bo Peep', 'she', 'kind to sheep'],
    ['Willy wonka', 'he', 'a chocolate expert'],
    ['Superman', 'he', 'strong'],
    ['Neo', 'he', 'the one'],
    ['Kermit', 'he', 'cheerful'],
    ['Horton', 'he', 'a good listener'],
    ['Woody', 'empty', 'empty'],
    ['Simba', 'empty', 'empty'],
    ['The Little Prince', 'empty', 'empty'],
    ['Elsa', 'empty', 'empty']
];

var randomPick = function(favorites) {
    var i = Math.floor(favorites.length * Math.random() );
    return favorites[i];
};

var limitCount = 20;

var limitMessage = 'Sorry, you already have suggested twenty favorites. Any more would give me a headache. You can delete some of your suggestions to make room for new ones. For example, you can say, Ask Favorite Person to forget Emily';

var helpMessage = 'When you ask I\'ll tell you my favorite person of the day. For example you can say, Ask favorite person today. You can also suggest other people to be my favorite in the future. For example you can say, Ask Favorite Person to make Emily your favorite because she is smart. You can also ask me to forget a suggestion. You can say, Ask Favorite Person to forget Emily'; 

var errorMessage = 'Sorry, I didn\'t get that';

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
            if (this.attributes.userAddedFavorites.length > limitCount) {
                this.emit(':tell', limitMessage);
            }
            else {
                var name = favname.value;
                this.attributes.userAddedFavorites.push([name, 'empty', 'empty']);
                var response = 'OK, I will think about making ' + name + ' my favorite';
                this.emit(':tell', response);
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
            if (this.attributes.userAddedFavorites.length > limitCount) {
                this.emit(':tell', limitMessage);
            }
            else {
                var name = favname.value;
                var noun = favnoun.value;
                var adjective = favadj.value;
                this.attributes.userAddedFavorites.push([name, noun, adjective]);
                var response = 'OK, I will think about making ' + name + ' my favorite because ' + noun + ' is ' + adjective;
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


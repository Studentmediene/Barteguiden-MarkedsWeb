/*global require*/

var fs = require("fs");
var Q = require("q");
var request = require("request");
var mapper = require("object-mapper");
var jsdom = require("jsdom");
var serverSync = require("../server_sync");

var jquery = fs.readFileSync("../libs/jquery-1.7.min.js", "utf-8");


//var sourceFile = __dirname + "/../data/examples/uka.json";
var externalURL = "https://www.uka.no/program/?format=json";


getEventsFromExternalSource(function (data) {
    var externalEvents = JSON.parse(data);
    var events = parseEventsWithData(externalEvents);
    
    updateEventsWithPrices(events, function () {
        serverSync.sync(events, externalURL);
    });
});

function getEventsFromExternalSource (callback) {
//    fs.readFile(sourceFile, function(err, data) {
//        callback(data);
//    });
    request({
        method: "GET",
        uri: externalURL,
        encoding: "utf8"
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            callback(body);
        }
    });
}

function parseEventsWithData (eventsSource) {
    var outputEvents = [];
    for (var i = 0; i < eventsSource.length; i++) {
        var eventSource = eventsSource[i];
        var baseEvent = mapper.merge(eventSource, {
            externalURL: externalURL,
            isPublished: true
        }, mapping);
        
//        var data = mapper.getKeyValue(eventSource, "showings");
        
        outputEvents.push(baseEvent);
    }
    
    return outputEvents;
}

function updateEventsWithPrices (events, callback) {
    var promise_chain = Q.fcall(function(){});
    
    events.forEach(function (event) {
        var promise_link = function () {
            var deferred = Q.defer();
            
            console.log("Finding price for event: " + event.externalID);
            jsdom.env({
                url: event.eventURL,
                src: [jquery],
                done: function (err, window) {
                    event.price = findPrice(window.$);
                    console.log("Found price: " + event.price);
                    
                    deferred.resolve();
                }
            });
            
            return deferred.promise;
        };
        
        promise_chain = promise_chain.then(promise_link);
    });
    
    promise_chain.done(function () {
        callback();
    });
}

function findPrice($) {
    var prices = $("[data-price]").get().map(function (element) {
        return parseInt($(element).attr("data-price"), 10);
    });
    
    return Math.max(Math.max.apply(null, prices), 0);
}

var mapping = {
    "title": {
        key: "title",
        transform: trimString
    },
    "showings.0.date": { // TODO: There might exist more than one show
        key: "startAt",
        transform: function (value) {
            var currentTime = new Date();
            var timezoneOffset = currentTime.getTimezoneOffset();
            var date = new Date(Date.parse(value) + timezoneOffset * 60 * 1000);
            return date.toISOString();
        }
    },
    "showings.0.place": [
        {
            key: "placeName",
            transform: function (value) {
                return placeNameMapping[value];
            }
        },
        {
            key: "address",
            transform: function (value) {
                return addressMapping[value];
            }
        },
        {
            key: "latitude",
            transform: function (value) {
                return latitudeMapping[value];
            }
        },
        {
            key: "longitude",
            transform: function (value) {
                return longitudeMapping[value];
            }
        }
    ],
    "age_limit": {
        key: "ageLimit",
        transform: function (value) {
            var ageLimit = parseInt(value, 10);
            return (!isNaN(ageLimit)) ? ageLimit : 0;
        }
    },
    "event_type": {
        key: "categoryID",
        transform: function (value) {
            return categoryMapping[value];
        }
    },
    "text": {
        key: "descriptions",
        transform: addDescription("nb")
    },
    "showings.0.url": {
        key: "eventURL",
        transform: addUKAPrefix
    },
    "image": {
        key: "imageURL",
        transform: addUKAPrefix
    },
    "showings.0.id": {
        key: "externalID",
        transform: trimString
    },
};

var categoryMapping = {
    "Konsert": "MUSIC",
    "Fest og moro": "NIGHTLIFE",
    "Revy og teater": "PERFORMANCES"
};

var placeNameMapping = {
    "Storsalen": "Studentersamfundet",
    "Knaus": "Studentersamfundet",
    "Dødens dal": "Dødens dal"
};

var addressMapping = {
    "Storsalen": "Elgeseter gate 1",
    "Knaus": "Elgeseter gate 1",
    "Dødens dal": undefined
};

var latitudeMapping = {
    "Storsalen": 63.422634,
    "Knaus": 63.422634,
    "Dødens dal": 63.419322
};

var longitudeMapping = {
    "Storsalen": 10.394697,
    "Knaus": 10.394697,
    "Dødens dal": 10.406578
};

function addDescription (language) {
    return function (value, fromObject, toObject) {
        var output = mapper.getKeyValue(toObject, "descriptions") || [];
        if (value) {
            output.push({
                language: language,
                text: trimString(value)
            });
        }
        
        return output;
    };
}

function trimString (value) {
    return value.toString().trim();
}

function addUKAPrefix (value) {
    return "https://www.uka.no" + trimString(value);
}


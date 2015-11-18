var Event = require('../models/Event.js');
var Venue = require('../models/Venue.js');

exports.sync = function(events) {
    events.map(function(evt) {
        var eventquery = {
            'title': evt.title,
            'startAt': evt.startAt
        };

        Event.findOne(
            eventquery,
            function (err, doc) {
                if (!doc) {
                    Event.create(evt, function (err, doc) {
                            if (err) {
                                console.log("Something went wrong in creating new event");
                            }
                        }

                    );
                }

            }
        );
        var venuequery = {
            'name': evt.venue.name
        };
        var venue = {};
        venue.name = evt.venue.name;
        venue.address = evt.venue.address;
        venue.latitude = evt.venue.latitude;
        venue.longitude = evt.venue.longitude;
        Venue.findOneAndUpdate(
            venuequery,
            venue,
            {'upsert': true},
            function(err, doc) {
                if (err) {
                    console.log("Something went wrong in creating new event");
                }
            }
        );
    });
};

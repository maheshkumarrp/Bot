const RtmClient = require('@slack/client').RtmClient;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const token = process.env.SLACK_TOKEN || '';
const request = require('request-promise');

const rtm = new RtmClient(token, {
    logLevel: 'error',
    // logLevel: 'debug',    
    // Boolean indicating weather Slack should automatically reconnect after an error response
    autoReconnect: true,
    // Boolean indicating weather each message should be marked as read or not after it is processed
    autoMark: true,
});

let state = "DEFAULT";
const handlers = {};

handlers.DEFAULT = (message) => {
	rtm.sendMessage("Welcome to IDOL Answer Server! What's your question?", message.channel);
    state="ANSWER_SERVER";
};

handlers.ANSWER_SERVER = (message) => {		
	var options = {
		uri: 'http://localhost:12000/',
		qs: {
			Action: 'Ask',
			Text: message.text,
			MaxResults: "1",
			MinScore: "70",
			ResponseFormat: "JSON"
		},
		json: true // Automatically stringifies the body to JSON. A very important attribute.
	};
 
	request(options)
		.then(function (res) {
			var action_response = res.autnresponse.response.$;
			if(action_response === "SUCCESS" && typeof(res.autnresponse.responsedata.answers) !== 'undefined'){
				var system_name = res.autnresponse.responsedata.answers.answer["@system_name"];
				rtm.sendMessage(res.autnresponse.responsedata.answers.answer.text.$+"\n(Response from "+system_name+")", message.channel);
			}else if (action_response === "SUCCESS" && typeof(res.autnresponse.responsedata.answers) === 'undefined'){
				rtm.sendMessage("Sorry, I am unable to find an anwer", message.channel);    
			}
		})
		.catch(function (err) {
			console.log("Error for the question '"+message.text+"' is "+err);
		});
    state="ANSWER_SERVER";
};

const router = (message) => {
	/*
    if (message.channel === "G4R5GF4RM" || message.user === "U4RK49U4Q") {
        return;
    } else if (message.channel === "D4XCK5D97") {
        handlers[state](message);
    }*/
	handlers[state](message);
}
// Listens to all 'message' events from the team
rtm.on(RTM_EVENTS.MESSAGE, (message) => {
    router(message);
});

rtm.start();
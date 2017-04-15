/* Hi everyone :) this is a hello world app for a slackbot */
const RtmClient = require('@slack/client').RtmClient;
const MemoryDataStore = require('@slack/client').MemoryDataStore;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const token = process.env.SLACK_TOKEN || '';

const rtm = new RtmClient(token, {
    logLevel: 'error',
    // logLevel: 'debug',
    // Initialise a data store for our client, this will load additional helper functions for the storing and retrieval of data
    dataStore: new MemoryDataStore(),
    // Boolean indicating weather Slack should automatically reconnect after an error response
    autoReconnect: true,
    // Boolean indicating weather each message should be marked as read or not after it is processed
    autoMark: true,
});

let state = "DEFAULT";
let name = "";
let address = "";
let phone = "";
let title = "";
const handlers = {};

handlers.DEFAULT = (message) => {
    rtm.sendMessage("Welcome! What's your name?", message.channel);
    state="GET_NAME";
};

handlers.GET_NAME = (message) => {
    name = message.text;
    rtm.sendMessage("OK, what's your address?", message.channel);
    state="GET_ADDRESS";
};

handlers.GET_ADDRESS = (message) => {
    address = message.text;
    rtm.sendMessage("What's your phone number?", message.channel);
    state="GET_PHONE";
};

handlers.GET_PHONE = (message) => {
    phone = message.text;
    rtm.sendMessage("What's your job title?", message.channel);
    state="TITLE";
};

handlers.TITLE = (message) => {
    title = message.text
    rtm.sendMessage("Is the following correct:", message.channel);
    rtm.sendMessage(name, message.channel);
    rtm.sendMessage(address, message.channel);
    rtm.sendMessage(phone, message.channel);
    rtm.sendMessage(title, message.channel);
    state="DONE";
};

handlers.DONE = (message) => {
    if (message.text === "yes") {
        rtm.sendMessage("Great! All done!", message.channel);
        state="DEFAULT";
    } else {
        rtm.sendMessage("OK, let's try this again.", message.channel);
        rtm.sendMessage("What's your name?", message.channel);
        name = address = phone = title = "";

        state="GET_NAME";
    }
}

const router = (message) => {
    if (message.channel === "G4R5GF4RM" || message.user === "U4RK49U4Q") {
        return;
    } else if (message.channel === "D4XCK5D97") {
        handlers[state](message);
    }
}
// Listens to all 'message' events from the team
rtm.on(RTM_EVENTS.MESSAGE, (message) => {
    router(message);
});

rtm.start();
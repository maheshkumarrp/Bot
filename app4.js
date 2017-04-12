/* Hi everyone :) this is a hello world app for a slackbot */
const RtmClient = require('@slack/client').RtmClient;
const MemoryDataStore = require('@slack/client').MemoryDataStore;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const {Wit, log} = require('node-wit');

const witToken = process.env.WIT_TOKEN || '';
const wit = new Wit({accessToken: witToken});
const token = process.env.SLACK_TOKEN || '';

const rtm = new RtmClient(token, {
  logLevel: 'error',
  // logLevel: 'debug',
  // Initialise a data store for our client, this will load additional helper functions for the storing and retrieval of data
  dataStore: new MemoryDataStore(),
  // Boolean indicating whether Slack should automatically reconnect after an error response
  autoReconnect: true,
  // Boolean indicating whether each message should be marked as read or not after it is processed
  autoMark: true,
});

let state = "DEFAULT";
const handlers = {};

let userInfo = {};
let reservation = {};
handlers.DEFAULT = (message) => {
  state = "GET_NAME";
  rtm.sendMessage("Hi there! What's your name?", message.channel);
}

handlers.GET_NAME = (message) => {
  userInfo.name = message.text;
  state = "GET_ADDRESS";
  rtm.sendMessage("Which city are you in?", message.channel);
}

handlers.GET_ADDRESS = (message) => {
  userInfo.city = message.text;
  state = "GET_PHONE";
  rtm.sendMessage("Can I get your phone number?", message.channel);
}

handlers.GET_PHONE = (message) => {
  userInfo.phone = message.text;
  state = "GET_TITLE";
  rtm.sendMessage(`And what do you do in ${userInfo.city}?`, message.channel);
}

handlers.GET_TITLE = (message) => {
  userInfo.jobTitle = message.text;
  state = "CONFIRM";
  rtm.sendMessage("Is this ok?", message.channel);
  rtm.sendMessage(`Name: ${userInfo.name}`, message.channel);
  rtm.sendMessage(`City: ${userInfo.city}`, message.channel);
  rtm.sendMessage(`Phone: ${userInfo.phone}`, message.channel);
  rtm.sendMessage(`Job: ${userInfo.jobTitle}`, message.channel);
}

handlers.CONFIRM = (message) => {
  if(message.text.toLowerCase() === "no"){
    rtm.sendMessage("*plays sad trombone*", message.channel);
    rtm.sendMessage("Let's start over!", message.channel);
    rtm.sendMessage("What's your name again?", message.channel);
    state = "GET_NAME";
  }  else if (message.text.toLowerCase() === "yes") {
    rtm.sendMessage(`Happy to meet you ${userInfo.name}!`, message.channel);
    state = "DEFAULT";
  } else {
    rtm.sendMessage("Sorry I didn't understand, can you please answer with Yes or No?", message.channel);
  }
}

handlers.EMPTY = (message) => {}

handlers.CONFIRM_RESERVATION = (message) => {
  rtm.sendMessage(`I found a booking in ${reservation.location} for ${reservation.duration}, it is free on ${reservation.date} at a price of ${reservation.price}, Book it?`, message.channel);
  state = "EMPTY";
  reservation = {};
}

const updateState = (reservation, message) => {
  if (!reservation.location) {
    return rtm.sendMessage("Where would you like to go?", message.channel);
  }
  if (!reservation.duration) {
    return rtm.sendMessage("How long will you be staying?", message.channel);
  }
  if (!reservation.date){
    return rtm.sendMessage("When will you be going?", message.channel);
  }
  if (!reservation.price) {
    return rtm.sendMessage("How much would you like to pay?", message.channel);
  }
  return "CONFIRM_RESERVATION";
}

const router = (message) => {
  //if (message.channel === "G4R5GF4RM") return;

  //if (message.channel === "D4TKU6U2C") {
    wit.message(message.text, {})
      .then((data) => {
        let values = data.entities;
        console.log(values);
        if (values.location) { reservation.location = values.location[0].value };
        if (values.duration) {reservation.duration = values.duration[0].value + ' ' + values.duration[0].unit};
        if (values.datetime) {reservation.date = values.datetime[0].value};
        if (values.price) {reservation.price = values.price[0].value};
        state = updateState(reservation, message);
        console.log("State: ", state);
        handlers[state](message);
      })
      .catch(console.error);
//  }
}
// Listens to all `message` events from the team
rtm.on(RTM_EVENTS.MESSAGE, (message) => {
    router(message);
});

rtm.start();


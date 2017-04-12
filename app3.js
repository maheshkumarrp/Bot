const {Wit, log} = require('node-wit');
const witToken = process.env.WIT_TOKEN || '';
const wit = new Wit({accessToken: witToken});

wit.message('I would like to book a room for two in reykjavik for two weeks starting June 8', {})
  .then((data) => {
    console.log("Wit API response received: " + JSON.stringify(data));
  })
  .catch(console.error);
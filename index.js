#!/usr/bin/env node

// TODO:
// Longer Google oauth
// Fix writing file
// move google setup into configure action

const program = require('commander');
const { prompt } = require('inquirer');
const storage = require('node-persist');
const moment = require('moment');
const colors = require ('colors');
const fetch = require('node-fetch');
const { CronJob } = require('cron');
const {google} = require('googleapis');
const readline = require('readline'); // TODO: replace this with prompt
const fs = require('fs');

const TOKEN_PATH = 'credentials.json';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];


const DEFAULT_STATUS = {
  "status_text": "Teaching machines",
  "status_emoji": ":ml-sprocket:"
};

const getEvent = (start, end) => {
  return {
    'summary': 'Code Cave',
    'description': 'Entering a code cave. Please interrupt only if there is an emergency.',
    'start': {
      'dateTime': moment(start).format(),
      'timeZone': moment.tz.guess()
    },
    'end': {
      'dateTime': moment(end).format(),
      'timeZone': moment.tz.guess()
    }
  };
};

const getCaveStatus = (endTime) => {
  return {
    "status_text": `In code cave. Will emerge at ${endTime}`,
    "status_emoji": ":code-cave:"
  };
}

if (process.argv.length < 3) {
  program.help();
}

program
  .version('0.0.1')
  .description('Code Cave');

program
  .command('config')
  .description('One time config of the app')
  .action(async () => {
    prompt([{
      type: 'input',
      name: 'slackToken',
      message: 'Enter your slack token:',
      validate: (input) => {
        if (input.length <= 0) {
          return "This doesn't look like a slack token 😬. \nGet one and try again https://api.slack.com/custom-integrations/legacy-tokens"
        }
        return true;
      }
    }]).then(async answers => {
      await storage.init();
      await storage.setItem('slackToken', answers.slackToken);
      console.log('Done'.green);
    });
  });


program
  .command('enter')
  .alias('e')
  .description('Enter the code cave (start session)')
  .action(async () => {
    await storage.init();
    const session = await storage.getItem('session');

    if (typeof session !== 'undefined') {
      console.log(`You are already in the cave! Your session started ${moment(session.start).fromNow().green}.`);
      return;
    }

    prompt([{
      type : 'input',
      name : 'durationMins',
      message : 'When would you like to emerge? (duration in minutes)',
      validate: (input) => {
        const duration = parseInt(input);
        if (typeof duration !== "number" || duration <= 0) {
          return `Could not parse duration: ${input}. Please try again. (Example: 30)`
        }
        return true;
      },
      default: 30
    }]).then(async answers => {
      const durationMins = parseInt(answers.durationMins);
      const start = moment().valueOf();
      const end = moment().add(durationMins, 'minutes').valueOf();

      await storage.init();

      const token = await storage.getItem('slackToken');

      fetch(`https://slack.com/api/users.profile.set?token=${token}&profile=${JSON.stringify(getCaveStatus(moment(end).format('h:mm a')))}`, {
        method: "POST"
      });

      fetch(`https://slack.com/api/dnd.setSnooze?token=${token}&num_minutes=${durationMins}`, {
        method: "POST"
      });

      try {
        const content = fs.readFileSync('client_secret.json');
        authorize(JSON.parse(content), createEvent(start, end));
      } catch (err) {
        return console.log('Error loading client secret file:', err);
      }

      const job = new CronJob(moment(end).toDate(), function() {
          emerge();
        }, function () {

          console.log("Welcome back!")
          /* This function is executed when the job stops */
        },
        true,
        moment.tz.guess()
      );

      console.log("Setting session...".yellow);

      await storage.setItem('session', {
        start: start,
        durationMins: durationMins,
        end: end
      });

      console.log(`Entering the cave. You shall emerge at ${moment(end).format('h:mm a').green}`);
      console.log("(this process will self-terminate when you emerge)".grey);
    });
  });

program
  .command('status')
  .description('Get your current status')
  .action(async () => {
    await storage.init();
    const session = await storage.getItem('session');

    if (typeof session === 'undefined') {
      console.log("You don't have an active session. Start one with \`codecave enter\`")
      return;
    }

    console.log("Your session started", moment(session.start).fromNow().green);
    console.log("And will end", moment().to(session.end).yellow);
  });

program
  .command('emerge')
  .alias('exit')
  .description('Emerge from the cave (end the session)')
  .action(async () => {
    emerge();
  });

const emerge = async () => {
  console.log("Emerging from the cave...".yellow);

  await storage.init();
  const session = await storage.getItem('session');

  if (typeof session === 'undefined') {
    console.log("You don't have an active session. Start one with \`codecave enter\`")
    return;
  }

  if(moment().isBefore(session.end)) {
    console.log(`You are emerging ${moment().to(session.end, true).red} early.`)
  }

  const token = await storage.getItem('slackToken');

  fetch(`https://slack.com/api/users.profile.set?token=${token}&profile=${JSON.stringify(DEFAULT_STATUS)}`, {
    method: "POST"
  });

  fetch(`https://slack.com/api/dnd.endSnooze?token=${token}`, {
    method: "POST"
  });

  storage.removeItem('session');
};

program.parse(process.argv);


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 * @return {function} if error in reading credentials.json asks for a new one.
 */
 function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  let token = {};
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  try {
    token = fs.readFileSync(TOKEN_PATH);
  } catch (err) {
    return getAccessToken(oAuth2Client, callback);
  }
  oAuth2Client.setCredentials(JSON.parse(token));
  callback(oAuth2Client);
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
 function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return callback(err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      try {
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        // console.log('Token stored to', TOKEN_PATH);
      } catch (err) {
        console.error(err);
      }
      callback(oAuth2Client);
    });
  });
}

function createEvent(start, end) {
  return (auth) => {
    const calendar = google.calendar({version: 'v3', auth});

    calendar.events.insert({
      auth: auth,
      calendarId: 'primary',
      resource: getEvent(start, end),
    }, function(err, event) {
      if (err) {
        console.log('There was an error contacting the Calendar service: ' + err);
        return;
      }
    });
  };
}

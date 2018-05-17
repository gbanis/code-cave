#!/usr/bin/env node

// TODO:
// Longer Google oauth
// Fix writing file
// move google setup into configure action

const program = require('commander');
const { prompt } = require('inquirer');
const moment = require('moment');
const colors = require ('colors');
const { CronJob } = require('cron');
const cache = require('persistent-cache');

const { authorize, createEvent } = require('./apis/googleCalendar.js');
const { setCaveStatus, setDefaultStatus, setDnd, endDnd } = require('./apis/slack.js');

const db = cache();

if (process.argv.length < 3) {
  program.help();
}

program
  .version('0.0.1')
  .description('Code Cave');

program
  .command('config')
  .description('One time config of the app')
  .action(() => {
    prompt([{
      type: 'input',
      name: 'slackToken',
      message: 'Enter your slack token:',
      validate: (input) => {
        if (input.length <= 0 && typeof db.getSync('slackToken') === 'undefined') {
          return "This doesn't look like a slack token 😬. \nGet one and try again: https://api.slack.com/custom-integrations/legacy-tokens"
        }
        return true;
      }
    }, {
      type: 'input',
      name: 'googleClientSecret',
      message: 'Enter Google client secret:',
      validate: (input) => {
        if (input.length <= 0 && typeof db.getSync('googleClientSecret') === 'undefined') {
          return "This doesn't look like a Google client secret 😬. \nGet one and try again: https://console.developers.google.com/apis/credentials"
        }
        return true;
      }
    }]).then(answers => {
      if (answers.slackToken.length == 0 ) {
        console.log('Not updating slack token'.yellow);
      } else {
        db.putSync('slackToken', answers.slackToken);
        console.log('Updated slack token'.green);
      }

      if (answers.googleClientSecret.length == 0 ) {
        console.log('Not updating Google client secret'.yellow);
      } else {
        db.putSync('googleClientSecret', answers.googleClientSecret);
        console.log('Updated Google client secret'.green);
      }
    });
  });


program
  .command('enter')
  .alias('e')
  .description('Enter the code cave (start session)')
  .action(() => {
    const session = db.getSync('session');

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
      default: 60
    }]).then(answers => {
      const durationMins = parseInt(answers.durationMins);
      const start = moment().valueOf();
      const end = moment().add(durationMins, 'minutes').valueOf();
      const token = db.getSync('slackToken')

      setCaveStatus(token, moment(end).format('h:mm a'));
      setDnd(token, durationMins);

      try {
        authorize(createEvent(start, end));
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

      db.putSync('session', {
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
  .action(() => {
    const session = db.getSync('session');

    if (typeof session === 'undefined') {
      console.warn("You don't have an active session. Start one with \`codecave enter\`")
      return;
    }

    console.log("Your session started", moment(session.start).fromNow().green);
    console.log("And will end", moment().to(session.end).yellow);
  });

program
  .command('emerge')
  .alias('exit')
  .description('Emerge from the cave (end the session)')
  .action(() => {
    emerge();
  });

const emerge = () => {
  console.log("Emerging from the cave...".yellow);

  const session = db.getSync('session');

  if (typeof session === 'undefined') {
    console.log("You don't have an active session. Start one with \`codecave enter\`")
    return;
  }

  if(moment().isBefore(session.end)) {
    console.log(`You are emerging ${moment().to(session.end, true).red} early.`)
  }

  const token = db.getSync('slackToken');

  setDefaultStatus(token);
  endDnd(token);

  db.deleteSync('session');
};

program.parse(process.argv);


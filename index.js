#!/usr/bin/env node

const program = require('commander');
const { prompt } = require('inquirer');
const moment = require('moment');
const colors = require ('colors');
const { startCron, stopCron } = require('./utils/cron.js');
const cache = require('persistent-cache');
const exec = require('child_process').exec;

const { authorize, createEvent, getAccessToken } = require('./apis/googleCalendar.js');
const { setStatus, setDnd, endDnd } = require('./apis/slack.js');
const { closeJasper, openYouTubeMusic } = require ('./apis/applescript.js');
const doNotDisturb = require('@sindresorhus/do-not-disturb');

const db = cache();

if (process.argv.length < 3) {
  program.help();
}

program
  .version('0.0.1')
  .description('Code Cave');

program
  .command('enter [durationMins] [statusMsgArr...]')
  .description('Enter the cave (start session)')
  .action((durationMins, statusMsgArr) => {
    const session = db.getSync('session');

    if (typeof session !== 'undefined') {
      console.log(`You are already in the cave! Your session started ${moment(session.start).fromNow().green}.`);
      return;
    }

    if (typeof durationMins === 'undefined') {
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
      }]).then(answers => {
        enter(answers.durationMins, statusMsgArr);
      });
    } else {
      enter(durationMins, statusMsgArr);
    }
  });

program
  .command('defaults')
  .description('Set up default messages')
  .action(() => {
    prompt([{
      type: 'input',
      name: 'defaultStatus',
      message: 'Enter default status:'
    }, {
      type: 'input',
      name: 'defaultEmoji',
      message: 'Enter default emoji (including colons):'
    }]).then(answers => {
      db.putSync('defaultStatus', answers.defaultStatus);
      db.putSync('defaultEmoji', answers.defaultEmoji);
    });
  });

program
  .command('config')
  .description('One time config of the app')
  .action(() => {
    prompt([{
      type: 'input',
      name: 'slackToken',
      message: 'Enter your slack token (https://api.slack.com/custom-integrations/legacy-tokens):\n'
    }, {
      type: 'input',
      name: 'googleClientSecret',
      message: 'Enter Google client secret JSON (https://console.developers.google.com/apis/credentials):\n'
    }]).then(answers => {
      if (answers.slackToken.length === 0 ) {
        console.log('Not updating slack token'.yellow);
      } else {
        db.putSync('slackToken', answers.slackToken);
        console.log('Updated slack token'.green);
      }

      if (answers.googleClientSecret.length === 0 ) {
        console.log('Not updating Google client secret'.yellow);
      } else {
        db.putSync('googleClientSecret', answers.googleClientSecret);
        console.log('Updated Google client secret'.green);
        getAccessToken();
      }
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
  .alias('end')
  .description('Emerge from the cave (end the session)')
  .action(() => {
    emerge();
  });


const enter = (durationMinsStr, statusArr) => {
  const durationMins = parseInt(durationMinsStr);

  const start = moment().valueOf();
  const end = moment().add(durationMins, 'minutes').valueOf();
  const token = db.getSync('slackToken');
  const status = getStatusOrDefault(end, statusArr)
  
  setStatus(token, status);
  setDnd(token, durationMins);
  authorize(createEvent(start, end, status.status_text));
  doNotDisturb.enable();
  // closeJasper();
  // openYouTubeMusic();

  startCron(end, emerge);

  db.putSync('session', {
    start: start,
    durationMins: durationMins,
    end: end
  });

  console.log(`Entering the cave. You shall emerge at ${moment(end).format('h:mm a').green}`);
  console.log("(this process will self-terminate when you emerge)".grey);
};

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

  setStatus(token, getEmergedStatus());
  endDnd(token);
  doNotDisturb.disable();

  db.deleteSync('session');

  exec("exit"); // to close terminal
};

const getEmergedStatus = () => {
  const status = db.getSync('defaultStatus');
  const emoji = db.getSync('defaultEmoji');
  return {
    "status_text": status,
    "status_emoji": emoji
  };
};

const getStatusOrDefault = (endTime, statusArr) => {
  if (statusArr instanceof Array && statusArr.length > 2) {
    return {
      "status_text": `${statusArr.slice(1).join(' ')} (till ${moment(endTime).format('h:mm a')})`,
      "status_emoji": statusArr[0]
    };
  } else if (statusArr instanceof Array && statusArr.length === 2) {
    return {
      "status_text": `${statusArr[1]} (till ${moment(endTime).format('h:mm a')})`,
      "status_emoji": statusArr[0]
    };
  } else if (statusArr instanceof Array && statusArr.length === 1) {
    return {
      "status_text": `${statusArr[0]} (till ${moment(endTime).format('h:mm a')})`,
      "status_emoji": ''
    };
  } else {
    return {
      "status_text": `In code cave (back at ${moment(endTime).format('h:mm a')})`,
      "status_emoji": ":code-cave:"
    };
  } 
};

program.parse(process.argv);


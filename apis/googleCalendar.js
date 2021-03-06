const { google } = require('googleapis');
const moment = require('moment');
const cache = require('persistent-cache');
const { prompt } = require('inquirer');

const readline = require('readline'); // TODO: replace this with prompt

const db = cache();

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const authorize = (callback) => {
  const credentials = db.getSync('googleClientSecret');

  if (typeof credentials === 'undefined') {
    throw 'Google creds not configured. Please run \`codecave config\` to set that up.'
  }

  const {client_secret, client_id, redirect_uris} = JSON.parse(credentials).installed;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const token = db.getSync('googleToken');

  if (typeof token === 'undefined') {
    throw 'Token is not configured; you need to oauth. Please run \`codecave config\` to set that up.'
  }

  oAuth2Client.setCredentials(token);
  callback(oAuth2Client);
};

const createEvent = (start, end, statusMsg) => {
  return (auth) => {
    const calendar = google.calendar({version: 'v3', auth});

    calendar.events.insert({
      auth: auth,
      calendarId: 'primary',
      resource: buildEvent(start, end, statusMsg),
    }, function(err, event) {
      if (err) {
        console.log('There was an error contacting the Calendar service: ' + err);
        return;
      }
    });
  };
};

const getAccessToken = () => {
  const credentials = db.getSync('googleClientSecret');
  const {client_secret, client_id, redirect_uris} = JSON.parse(credentials).installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authUrl);

  prompt([{
    type : 'input',
    name : 'code',
    message : 'Enter the code from that page here:',
    validate: (input) => {
      if (input.length === 0) {
        return 'Invalid token';
      }
      return true;
    }
  }]).then(answers => {
    oAuth2Client.getToken(answers.code, (err, token) => {
      console.log(token);
      db.putSync('googleToken', token);
    });
  });
};

const buildEvent = (start, end, statusMsg) => {
  return {
    'summary': statusMsg,
    'description': '',
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

module.exports = {
  authorize,
  createEvent,
  getAccessToken
};

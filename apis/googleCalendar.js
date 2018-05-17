const {google} = require('googleapis');
const readline = require('readline'); // TODO: replace this with prompt
const fs = require('fs');

const TOKEN_PATH = '/Users/gbanis/dev/personal/code-cave/credentials.json';
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const authorize = (credentials, callback) => {
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
};

const createEvent = (start, end) => {
  return (auth) => {
    const calendar = google.calendar({version: 'v3', auth});

    calendar.events.insert({
      auth: auth,
      calendarId: 'primary',
      resource: buildEvent(start, end),
    }, function(err, event) {
      if (err) {
        console.log('There was an error contacting the Calendar service: ' + err);
        return;
      }
    });
  };
};

const getAccessToken = (oAuth2Client, callback) => {
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
};

const buildEvent = (start, end) => {
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

module.exports = {
  authorize,
  createEvent
};

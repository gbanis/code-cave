const fetch = require('node-fetch');
const cache = require('persistent-cache');

const db = cache();

const getDefaultStatus = () => {
  return {
    "status_text": db.getSync('defaultStatus'),
    "status_emoji": db.getSync('defaultEmoji')
  };
};

const getCaveStatus = (endTime) => {
  return {
    "status_text": `In code cave. I'll be back at ${endTime}`,
    "status_emoji": ":code-cave:"
  };
};

const setCaveStatus = (token, endTime) => {
  fetch(`https://slack.com/api/users.profile.set?token=${token}&profile=${JSON.stringify(getCaveStatus(endTime))}`, {
    method: "POST"
  });
};

const setDefaultStatus = (token) => {
  fetch(`https://slack.com/api/users.profile.set?token=${token}&profile=${JSON.stringify(getDefaultStatus())}`, {
    method: "POST"
  });
};

const setDnd = (token, durationMins) => {
  fetch(`https://slack.com/api/dnd.setSnooze?token=${token}&num_minutes=${durationMins}`, {
    method: "POST"
  });
};

const endDnd = (token) => {
  fetch(`https://slack.com/api/dnd.endSnooze?token=${token}`, {
    method: "POST"
  });
};

module.exports = {
  setCaveStatus,
  setDefaultStatus,
  setDnd,
  endDnd
};

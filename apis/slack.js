const fetch = require('node-fetch');
const cache = require('persistent-cache');

const db = cache();

const getDefaultStatus = () => {
  const status = db.getSync('defaultStatus');
  const emoji = db.getSync('defaultEmoji');
  return {
    "status_text": status,
    "status_emoji": emoji
  };
};

const getCaveStatus = (endTime) => {
  return {
    "status_text": `In code cave. Be back at ${endTime}`,
    "status_emoji": ":code-cave:"
  };
};

const setCaveStatus = (token, endTime) => {
  return fetch(`https://slack.com/api/users.profile.set?token=${token}&profile=${JSON.stringify(getCaveStatus(endTime))}`, {
    method: "POST"
  });
};

const setDefaultStatus = (token) => {
  return fetch(`https://slack.com/api/users.profile.set?token=${token}&profile=${JSON.stringify(getDefaultStatus())}`, {
    method: "POST"
  });
};

const setDnd = (token, durationMins) => {
  return fetch(`https://slack.com/api/dnd.setSnooze?token=${token}&num_minutes=${durationMins}`, {
    method: "POST"
  });
};

const endDnd = (token) => {
  return fetch(`https://slack.com/api/dnd.endSnooze?token=${token}`, {
    method: "POST"
  });
};

module.exports = {
  setCaveStatus,
  setDefaultStatus,
  setDnd,
  endDnd
};

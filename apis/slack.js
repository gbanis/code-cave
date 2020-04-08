const fetch = require('node-fetch');

const setStatus = (token, status) => {
  return fetch(`https://slack.com/api/users.profile.set?token=${token}&profile=${JSON.stringify(status)}`, {
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
  setStatus,
  setDnd,
  endDnd
};

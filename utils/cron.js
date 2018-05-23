const { CronJob } = require('cron');
const moment = require('moment');

let job;

const startCron = (endTs, callback) => {
  job = new CronJob(
    moment(endTs).toDate(),
    callback,
    function () {
      console.log("Welcome back!")
    },
    false,
    moment.tz.guess()
  );

  job.start();
};

const stopCron = () => {
  job.stop();
}

module.exports = {
  startCron, stopCron
};

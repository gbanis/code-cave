var osascript = require('node-osascript');

const openSlack = () => {
  osascript.execute(`tell application "Slack" to activate`);
};

const closeSlack = () => {
  osascript.execute(`tell application "Slack"
      quit
    end tell`);
};

const openJasper = () => {
  osascript.execute(`tell application "Jasper" to activate`);
};

const closeJasper = () => {
  osascript.execute(`tell application "Jasper"
      quit
    end tell`);
};

module.exports = {
  openSlack,
  closeSlack,
  openJasper,
  closeJasper
};

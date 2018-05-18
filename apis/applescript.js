var osascript = require('node-osascript');

// https://gist.github.com/Zettt/fd9979100d4603e548d6
const APPLESCRIPT_COMMAND = `try
  tell application "System Events"
    option key down
    delay 0.1
    tell application process "SystemUIServer"
      tell (every menu bar whose title of menu bar item 1 contains "Notification")
        click (1st menu bar item whose title contains "Notification")
      end tell
    end tell
    option key up
  end tell
on error errMsg
  tell application "System Events"
    option key up
  end tell
  error errMsg
end try`;

const toggleDnd = () => {
  osascript.execute(APPLESCRIPT_COMMAND, function(err, result, raw){
    if (err) {
      console.log("Could not toggle your Mac's DND".red);
      console.log("You my need to grant your terminal Accessibility permissions from System Preferences -> Security & Privacy -> Accessibility.".red)
    } else {
      console.log("Toggled Mac OSX DND ✅");
    }
  });
};

module.exports = {
  toggleDnd
};

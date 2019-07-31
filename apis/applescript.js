var osascript = require('node-osascript');

const openSlack = () => {
  // osascript.execute(`tell application "Slack" to activate`);
  const closeSlack = () => {
    osascript.execute(`tell application "Slack"
        set miniaturized of window 1 to false
      end tell`);
  };
};

const closeSlack = () => {
  osascript.execute(`tell application "Slack"
      set miniaturized of window 1 to true
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

const toggleDnd = () => {
  osascript.execute(`tell application "System Events"
    tell application process "SystemUIServer"
      try
        if exists menu bar item "Notification Center, Do Not Disturb enabled" of menu bar 1 of application process "SystemUIServer" of application "System Events" then
          (* It is disabled *)
          key down option
          click menu bar item "Notification Center, Do Not Disturb enabled" of menu bar 1
          key up option
        else
          (* It is enabled *)
          key down option
          click menu bar item "Notification Center" of menu bar 1
          key up option
        end if
      on error
        key up option
      end try
    end tell
  end tell`);
};

const reloadGooglePlayMusicChrome = () => {
  osascript.execute(`tell application "Google Chrome"
    activate
    set theUrl to "https://music.youtube.com"

    if (count every window) = 0 then
      make new window
    end if

    set found to false
    set theTabIndex to -1
    repeat with theWindow in every window
      set theTabIndex to 0
      repeat with theTab in every tab of theWindow
        set theTabIndex to theTabIndex + 1
        if (theTab's URL contains theUrl) then
          set found to true
          exit
        end if
      end repeat

      if found then
        exit repeat
      end if
    end repeat

    if found then
      set theWindow's active tab index to theTabIndex
      set index of theWindow to 1
    else
      tell window 1 to make new tab with properties {URL:theUrl}
    end if
  end tell`);
};

module.exports = {
  openSlack,
  closeSlack,
  openJasper,
  closeJasper,
  reloadGooglePlayMusicChrome,
  toggleDnd
};

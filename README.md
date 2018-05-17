![code-cave](https://git.hubteam.com/storage/user/519/files/11fd42ba-5965-11e8-807d-28f08b974210)

### How it works

Pick how long you want to be in "code cave" mode and it:
- sets you as dnd for that duration
- sets your slack status to code cave mode
- creates an event and blocks your calendar
- resets everything when the time elapses and you "emerge" from the cave
- makes you a better programmer (j/k only using rxjava makes you a better programmer)

![codecave](https://git.hubteam.com/storage/user/519/files/c3c1e3cc-58ff-11e8-9567-6be9acdc91a8)

### Setup

Install the latest node version. I used `$ nvm install v9.3.0`.

Run yarn `$ yarn`.

Set up your default status: `$ codecave defaults`

Set up your slack and google cal creds: `$ codecave config`

You are probably good to go.

### Usage

`codecave enter` - enter the cave, after N minutes you will exit automagically

`codecave emerge` - exit the cave and come back to this dull and boring world

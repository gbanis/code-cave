![11fd42ba-5965-11e8-807d-28f08b974210](https://user-images.githubusercontent.com/7933929/40399654-9136e6e8-5e0c-11e8-9909-1eb6ae758814.png)

### How it works

Pick how long you want to be in "code cave" mode and it:
- sets you as dnd for that duration
- sets your slack status to code cave mode
- creates an event and blocks your calendar
- toggles your mac's dnd for all notifications
- resets everything when the time elapses and you "emerge" from the cave
- makes you a better programmer (j/k only using rxjava makes you a better programmer)

![c3c1e3cc-58ff-11e8-9567-6be9acdc91a8](https://user-images.githubusercontent.com/7933929/40399660-a296fd4c-5e0c-11e8-8ccd-0e8c556bc25e.gif)

### Setup

- Install the latest node version. I used `$ nvm install v9.3.0`
- Run yarn `$ yarn install`
- Symlink this package `$ yarn link` (from within the `code-cave` directory)
- Set up your default status: `$ codecave defaults`
- Set up your slack and google cal creds: `$ codecave config`

You are probably good to go!

### Usage

`codecave enter` - enter the cave, after N minutes you will exit automagically

`codecave emerge` - exit the cave and come back to this dull and boring world

### Warning

This is a super alpha version. It is very likely not going to work for you. Proceed with caution.

If you have questions ping me @gbanis on slack. I'll get back to you when I emerge from the cave. 😄


### Changelog

#### v1.1

Added mac dnd toggle.

![d22f1934-5a2b-11e8-8dc8-20859aaa23db](https://user-images.githubusercontent.com/7933929/40399667-aff901d8-5e0c-11e8-87f8-01966a66361a.gif)

#### v1.0

Basic functionality. Set slack status, slack dnd, create google cal.

![c3c1e3cc-58ff-11e8-9567-6be9acdc91a8](https://user-images.githubusercontent.com/7933929/40399660-a296fd4c-5e0c-11e8-8ccd-0e8c556bc25e.gif)

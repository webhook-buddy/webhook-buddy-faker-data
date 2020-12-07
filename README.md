# Webhook Buddy Faker Data

Used to replace real email addresses in Sendgrid and Mailgun's webhooks with fake ones so that the database can be shared publicly without exposing email addresses.

## Setup
`npm install`

## Run
`npm start`

## Debugging in VS Code

Borrowed from: https://github.com/microsoft/vscode-recipes/tree/master/nodemon

_Note: Debugging works best after installing and running a long running task, such as **Express** web server. VS Code automatically re-attaches to a newly spanned Node process whenever files change, but because this default console app immediately ends its process, VS Code doesn't have enough time to re-attach reliably._

* Terminal:
  * `npm run debug`
* VS Code:
  * Go to the Debug view and select `Node: Nodemon` configuration
  * Start the debugger with <kbd>F5</kbd>
  * VS Code should list all of the running node processes. Select `nodemon --exec babel-node --inspect src/index.js` 
![image](https://user-images.githubusercontent.com/504505/77853652-0c17a580-719a-11ea-88f1-4fc02ddd568c.png)
  * Set a breakpoint and it should now be hit


# O2O Survey demo
### Get Started
npm install

npm run dev

Webpack entry file is /public/javascripts/index.js.

### Firebase Functions
Firebase functions are required to work with Twitter API because Twitter API required Back End environment.

Visit https://firebase.google.com/docs/functions/.

## Duplicating into new project
If new project requires twitter login, please create new twitter app and new firebase project, and change the configuration settings for twitter and firebase.

Change Twitter config in /functions/index.js.

Change Firebase project name in .firebaseserc.



If login is not required, simply remove the login pages and modal, then disable the event listeners for login/register buttons in events() function in /public/javascripts/index.js, and pass in `true` for the `autoRegister` param in initUser(). You can also remove the modal and regForm.css.
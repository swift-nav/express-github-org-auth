# express-github-org-auth

Super-simple module that attaches itself to an Express or Connect application, requiring that all connections to the server after that point have been authenticated via GitHub. You must pass a "GitHub" organization name as a parameter, thus sandboxing your application to users within that organization.

## Install
`npm install express-github-org-auth --save`

## Example
```javascript
  var app = express();
  var host = process.env['HOSTPORT'] || 'localhost:1234';

  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(require('cookie-session')({ keys: ['keyboard-kitty'] }));
  app.use(require('body-parser').urlencoded());

  // Authenticate all the things
  require('express-github-org-auth')(host, 'swift-nav', app);

  // All access after this point is authenticated via GitHub
  app.use(express.static('./static'));
```

## Copyright
Copyright (C) 2015 Swift Navigation Inc.

Contact: Joshua Gross <josh@swift-nav.com>

License: MIT

# express-github-org-auth

Super-simple module that attaches itself to an Express or Connect application, requiring that all connections to the server after that point have been authenticated via GitHub. You must pass a "GitHub" organization name as a parameter, thus sandboxing your application to users within that organization.

## Install
`npm install express-github-org-auth --save`

### Github auth tokens
You must have a Github application for the application you're authenticating.
Get your `Client ID` and `Client Secret` and make them available for the app
via the environment:

```
export GITHUB_CLIENT_ID=xyzxyzxyzxyzxyzxyzxy
export GITHUB_CLIENT_SECRET=xyzxyzxyzxyzxyzxyzxyxyzxyzxyzxyzxyzxyzxy
```

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

## Caveats
Authentication tokens are stored in-memory, which makes this module only suitable
for small applications running single processes. If you need to use this module in
larger production environments, consider replacing the in-memory cache with a
memcached layer or something similar.

## Copyright
Copyright (C) 2015 Swift Navigation Inc.

Contact: Joshua Gross <josh@swift-nav.com>

License: MIT

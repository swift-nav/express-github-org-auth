/**
 * Copyright (C) 2015 Swift Navigation Inc.
 * Contact: Joshua Gross <josh@swift-nav.com>
 * License: MIT
 *
 * This source is subject to the license found in the file 'LICENSE' which must
 * be distributed together with this source. All other rights reserved.
 *
 * THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND,
 * EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A PARTICULAR PURPOSE.
 */
/*eslint-env node*/

var passport = require('passport');
var GitHubStrategy = require('passport-github').Strategy;

// This is used to store user session data in-memory on the server. Causes all sessions to expire every time
//  the server is restarted - which is fine since we're using oauth which should be seamless.
var lazyUserDict = {};

/**
 * @param host should be of the format: 'localhost:8000' (protocol not currently configurable, defaults to http)
 * @param requiredOrg the name of some GitHub organization that the user must be a member of
 * @param app an Express/Connect app
 */
function installAuth (host, requiredOrg, app) {
  // Passport session setup.
  //   To support persistent login sessions, Passport needs to be able to
  //   serialize users into and deserialize users out of the session.  Typically,
  //   this will be as simple as storing the user ID when serializing, and finding
  //   the user by ID when deserializing.  However, since this example does not
  //   have a database of user records, the complete GitHub profile is serialized
  //   and deserialized.
  passport.serializeUser(function(user, done) {
    lazyUserDict[user.username] = user;
    return done(null, user.username);
  });

  passport.deserializeUser(function(obj, done) {
    if (!lazyUserDict[obj]) {
      return done(null, {});
    }
    return done(null, lazyUserDict[obj]);
  });

  // Use the GitHubStrategy within Passport.
  //   Strategies in Passport require a `verify` function, which accept
  //   credentials (in this case, an accessToken, refreshToken, and GitHub
  //   profile), and invoke a callback with a user object.
  var strategyConfig = {
    clientID: process.env["GITHUB_CLIENT_ID"],
    clientSecret: process.env["GITHUB_CLIENT_SECRET"],
    callbackURL: "http://" + host + "/auth/github/callback",
    scope: ["read:org", "read:user"]
  };
  passport.use(new GitHubStrategy(strategyConfig, function(accessToken, refreshToken, profile, done) {
    // Get user's orgs list, ensure desired organization is in there.
    var https = require('https');

    var rawResponse = '';
    return https.get({
      hostname: "api.github.com",
      port: 443,
      path: "/user/orgs",
      headers: {
        "User-Agent": "joshuagross",
        "Authorization": "token " + accessToken
      }
    }, function (res) {
      res.on('data', function(d) {
        rawResponse += d.toString();
      });
      res.on('end', function () {
        var response = JSON.parse(rawResponse);
        var requiredOrgFound = false;
        response.map(function (org) {
          requiredOrgFound = requiredOrgFound || org['login'] === requiredOrg;
        });
        if (!requiredOrgFound) {
          return done(new Error('you must be a member of ' + requiredOrg));
        }
        return done(null, profile);
      })
    });
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // GET /auth/github
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  The first step in GitHub authentication will involve redirecting
  //   the user to github.com.  After authorization, GitHub will redirect the user
  //   back to this application at /auth/github/callback
  app.get('/auth/github',
    passport.authenticate('github'),
    function() {
      // The request will be redirected to GitHub for authentication, so this
      // function will not be called.
    });

  // GET /auth/github/callback
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function function will be called,
  //   which, in this example, will redirect the user to the home page.
  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    function(req, res) {
      return res.redirect('/');
    });

  app.get('/logout', function(req, res){
    req.logout();
    return res.redirect('/');
  });

  // Simple route middleware to ensure user is authenticated.
  //   Use this route middleware on any resource that needs to be protected.  If
  //   the request is authenticated (typically via a persistent login session),
  //   the request will proceed.  Otherwise, the user will be redirected to the
  //   login page.
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.redirect('/auth/github');
  }
  app.use(ensureAuthenticated);
}

module.exports = installAuth;

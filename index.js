const express = require("express");
const app = express();
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const simpleOauthModule = require("simple-oauth2");
require("dotenv").config();
/* HTTPS SERVER
var privateKey  = fs.readFileSync('/path/to/franciskim.co.key', 'utf8');
var certificate = fs.readFileSync('/path/to/franciskim.co.crt', 'utf8');
var credentials = { key: privateKey, cert: certificate };

// START --== Your App Code ==--
app.get('/', function(req, res, next) {
    res.json({
        app: 'Foobar App'
    });
});
// END --== Your App Code ==--

var httpsServer = https.createServer(credentials, app);
httpsServer.listen(1337);
HTTPS SERVER */

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});
app.get("/login", function(req, res) {
  res.sendFile(__dirname + "/login.html");
});

app.listen(3000, () => console.log("App open on port 3000"));
app.use(express.static(path.join(__dirname, "/public")));
//ADAM'S OAUTH2 STUFF, DO NOT TOUCH!
const oauth2 = simpleOauthModule.create({
  client: {
    id: process.env.ID,
    secret: process.env.SECRET
  },
  auth: {
    tokenHost: "https://github.com",
    tokenPath: "/login/oauth/access_token",
    authorizePath: "/login/oauth/authorize"
  }
});

const authorizationUri = oauth2.authorizationCode.authorizeURL({
  redirect_uri: "http://localhost:3000/callback",
  scope: "notifications",
  state: "3(#0/!~"
});

// Initial page redirecting to Github
app.get("/auth", (req, res) => {
  console.log(authorizationUri);
  res.redirect(authorizationUri);
});

// Callback service parsing the authorization token and asking for the access token
app.get("/callback", (req, res) => {
  const code = req.query.code;
  const options = {
    code
  };

  oauth2.authorizationCode.getToken(options, (error, result) => {
    if (error) {
      console.error("Access Token Error", error.message);
      return res.json("Authentication failed");
    }

    console.log("The resulting token: ", result);
    const token = oauth2.accessToken.create(result);

    return res.status(200).json(token);
  });
});

app.get("/success", (req, res) => {
  res.send("");
});

//Generate event code.
function genEventCode() {
  return (
    "CD_" +
    Math.random()
      .toString(36)
      .substr(2, 4) +
    "-" +
    Math.random()
      .toString(36)
      .substr(3, 4)
  );
}

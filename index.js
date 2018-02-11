const express = require("express");
const app = express();
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const simpleOauthModule = require("simple-oauth2");
var request = require("request");
var session = require("express-session");
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
app.use(
  session({
    secret: process.env.SESSIONSECRET,
    resave: true,
    saveUninitialized: true
  })
);
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
  scope: "read:user",
  state: process.env.STATESTRING
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
    console.log(result);

    //console.log("The resulting token: ", result);
    console.log(result["access_token"]);
    var RequestString = "https://api.github.com/user"; // + result["access_token"];
    console.log(RequestString);
    var options = {
      url: RequestString,
      headers: {
        "User-Agent": "CoderDojoToledoAttendance",
        Authorization: "token " + result["access_token"]
      }
    };
    request.get(options, function(error, response) {
      if (error) throw error;

      var Parsed = JSON.parse(response.body);
      var ParsedID = Parsed["id"];
      console.log(Parsed["id"]);

      if (ParsedID == "29166546") {
        console.log("GOTCHU FAM, TIME TO AUTH");
        req.session.GithubID = ParsedID;
        req.session.Authorized = true;
        return res.redirect("../authTest");
      } else {
        return res.redirect("../login");
      }
    });
    const token = oauth2.accessToken.create(result);
    // return res.status(200).json(token);
  });
});

app.get("/success", (req, res) => {
  res.send("");
});
app.get("/authTest", auth, (req, res) => {
  res.send("U in boy");
});
app.get("/AdminDashboard", auth, (req, res) => {
  console.log(req.session.Authorized);
  res.sendFile(__dirname + "/Admin-dashboard/analytics.html");
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

function auth(req, res, next) {
  console.log(req.session.Authorized);
  if (req.session && req.session.Authorized == true) {
    console.log("Authorized:" + req.session.GithubID);
    return next();
  } else {
    return res.sendStatus(401);
  }
}

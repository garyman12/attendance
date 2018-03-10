require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const simpleOauthModule = require("simple-oauth2");
var request = require("request");
var session = require("express-session");
const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  "coderdojo",
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: "localhost",
    dialect: "mysql",

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);
//Creating sequelize database tables

var attendance = sequelize.define("attendance", {
  person_id: {
    type: Sequelize.STRING(32),
    allowNull: true
  },
  dojo_id: {
    type: Sequelize.STRING(32),
    allowNull: true
  },
  date: {
    type: Sequelize.DATEONLY,
    allowNull: true
  }
});
var dojo_person_xref = sequelize.define("dojo_person_xref", {
  dojo_id: {
    type: Sequelize.STRING(16),
    allowNull: true
  },
  person_id: {
    type: Sequelize.STRING(16),
    allowNull: true
  },
  is_primary: {
    type: Sequelize.CHAR(1),
    allowNull: true
  }
});
var dojo = sequelize.define("dojo", {
  name: {
    type: Sequelize.STRING(32),
    allowNull: true
  },
  street_address: {
    type: Sequelize.STRING(32),
    allowNull: true
  },
  city: {
    type: Sequelize.STRING(32),
    allowNull: true
  },
  state: {
    type: Sequelize.CHAR(2),
    allowNull: true
  },
  zip: {
    type: Sequelize.CHAR(5),
    allowNull: true
  }
});
var guardian_xref = sequelize.define("guardian_xref", {
  person1: {
    type: Sequelize.STRING(16),
    allowNull: true
  },
  person2: {
    type: Sequelize.STRING(16),
    allowNull: true
  },
  relationship_id: {
    type: Sequelize.STRING(16),
    allowNull: true
  }
});
var person = sequelize.define("person", {
  fullname: {
    type: Sequelize.STRING(32),
    allowNull: true,
    defaultValue: ""
  },
  role: {
    type: Sequelize.STRING(32),
    allowNull: true
  },
  email: {
    type: Sequelize.STRING(32),
    allowNull: true
  },
  slack_id: {
    type: Sequelize.STRING(32),
    allowNull: false,
    defaultValue: ""
  },
  github_id: {
    type: Sequelize.STRING(32),
    allowNull: true
  }
});
var relationship = sequelize.define("relationship", {
  description: {
    type: Sequelize.STRING(64),
    allowNull: true
  }
});
// Sync sequel Tables
sequelize
  .sync()
  .then(function() {
    console.log("Synced");
  })
  .catch(function(err) {
    console.log(err, "Something went wack");
  });

// Adding Sequel Database

sequelize
  .authenticate()
  .then(() => {})
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });

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

app.listen(3000, () => console.log("App open on port 3000"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(
  session({
    secret: process.env.SESSIONSECRET,
    resave: true,
    saveUninitialized: true
  })
);
// Serving Files to user through server

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/public/index.html");
});
app.get("/login", function(req, res) {
  res.sendFile(__dirname + "/public/login.html");
});
app.get("/signup", function(req, res) {
  res.sendFile(__dirname + "/public/makeuser.html");
});

// Form Input

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function(req, res) {
  console.log(JSON.stringify(req.body, null, 2));
});

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
      /*THE AUTH PLAN: BY ADAM
STEP 1: GET THE USERID OF THE GITHUB ACCOUNT USING THE OAUTH TOKEN
STEP 2: COMPARE THE USERID TOKEN TO A MYSQL LIST OF TOKEN
  IF THE TOKEN EXISTS, LOGIN, IF NOT, MAKE AN ACCOUNT
STEP 3: SETUP RESTRICTIONS
STEP 4: DONE */
      if (ParsedID == "29166546") {
        console.log("GOTCHU FAM, TIME TO AUTH YOU IN YO");
        req.session.GithubID = ParsedID;
        req.session.Authorized = true;
        return res.redirect("../success");
      } else {
        return res.redirect("../login");
      }
    });
    const token = oauth2.accessToken.create(result);
    // return res.status(200).json(token);
  });
});

app.get("/success", (req, res) => {
  setTimeout(function() {
    res.redirect("../AdminDashboard");
  }, 1500);
});
app.get("/authTest", auth, (req, res) => {
  res.send("U in boy");
});
app.get("/AdminDashboard", auth, (req, res) => {
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
    return res.redirect("../login");
  }
}

//SQL COMMANDS: WILL MOVE TO A DIFFERENT FILE LATER
function startSequlizeConnection() {
  sequelize
    .authenticate()
    .then(() => {
      console.log("Sequlize Connection Established (YAY!)");
    })
    .catch(err => {
      console.error(
        "Unable to connect to the Database, server threw Error: " + err
      );
    });
}

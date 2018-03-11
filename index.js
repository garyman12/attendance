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
    type: Sequelize.STRING,
    allowNull: true
  },
  dojo_id: {
    type: Sequelize.STRING,
    allowNull: true
  },
  date: {
    type: Sequelize.DATEONLY,
    allowNull: true
  }
});
var dojo_person_xref = sequelize.define("dojo_person_xref", {
  dojo_id: {
    type: Sequelize.STRING,
    allowNull: true
  },
  person_id: {
    type: Sequelize.STRING,
    allowNull: true
  },
  is_primary: {
    type: Sequelize.CHAR,
    allowNull: true
  }
});
var dojo = sequelize.define("dojo", {
  name: {
    type: Sequelize.STRING,
    allowNull: true
  },
  street_address: {
    type: Sequelize.STRING,
    allowNull: true
  },
  city: {
    type: Sequelize.STRING,
    allowNull: true
  },
  state: {
    type: Sequelize.CHAR,
    allowNull: true
  },
  zip: {
    type: Sequelize.CHAR,
    allowNull: true
  }
});
var guardian_xref = sequelize.define("guardian_xref", {
  person1: {
    type: Sequelize.STRING,
    allowNull: true
  },
  person2: {
    type: Sequelize.STRING,
    allowNull: true
  },
  relationship_id: {
    type: Sequelize.STRING,
    allowNull: true
  }
});
var person = sequelize.define("person", {
  fullname: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: ""
  },
  role: {
    type: Sequelize.STRING,
    allowNull: true
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true
  },
  slack_id: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: ""
  },
  github_id: {
    type: Sequelize.STRING,
    allowNull: true
  },
  access: {
    type: Sequelize.CHAR,
    allowNull: false,
    defaultValue: "1"
  },
});
var relationship = sequelize.define("relationship", {
  description: {
    type: Sequelize.STRING,
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
  person
    .findOrCreate({
      where: {
        fullname: "Adam Kuhn",
        role: "programmer",
        email: "Adamku19@mybedford.us",
        slack_id: "NA",
        github_id: "16625600"
      }
    })
    .spread((user, created) => {
      console.log(
        user.get({
          plain: true
        })
      );
      console.log(created);
    });
});

function sequelizeTestVerify(ID) {
  var allowed = [];
  return new Promise(function(fulfill, reject) {
    console.log(ID);
    var parsed;
    person
      .findAll({
        where: { github_id: ID },
        attributes: [["role", "UserRank"]]
      })
      .spread(user => {
        if (user === undefined) {
          console.log("User Not Found in Database, Destroying Session");
          allowed.push(false);
          fulfill(allowed);
        } else {
          parsed = user.get({
            plain: true
          });
          console.log(parsed);
          console.log(Number(parsed["UserRank"]));
          if (Number(parsed["UserRank"] > 0)) {
            console.log("Yeet");
            allowed.push(true);
            allowed.push(Number(parsed["UserRank"]))
            fulfill(allowed);
          } else {
            console.log("Nop");
            allowed.push(false);
            fulfill(allowed);
          }
        }
      });
  });
}
app.get("/signup", function(req, res) {
  res.sendFile(__dirname + "/public/makeuser.html");
  sequelizeTestVerify("16625600");
});


// Form Input

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function(req, res) {
  var info = JSON.parse(JSON.stringify(req.body, null, 2));
  if(info.fullname != ""){
    createPerson(info);
  }
   });
   
  person.destroy({ where: { fullname: "" } });

// Creating user data and pushing to database
function createPerson(info) {
  person
    .findOrCreate({
      where: { github_id: info.github_id },
      defaults: {
        fullname: info.fullname,
        role: info.role,
        email: info.email,
        slack_id: info.slack_id,
        github_id: info.github_id
      }
    })
    .spread((user, created) => {
      console.log(
        "Found/Created person with full name: " +
          info.fullname +
          ", role: " +
          info.role +
          ", email: " +
          info.email +
          ", Slack ID: " +
          info.slack_id +
          ", and Github Id: " +
          info.github_id
      );
    });
}

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
  function SQLVerify(ID) {
    return new Promise(function(fulfill, reject) {
      var sql = "SELECT Name FROM mentorsdb WHERE GithubID='" + ID + "'";
      console.log(sql);

      connection.query(sql, function(err, result) {
        if (err) throw err;
        console.log(result.length);
        console.log(result[0].Name);
        fulfill(result);
      });
    });
  }
  function ActualSQLVerify(ID) {
    var allowed = false;

    return new Promise(function(fulfill, reject) {
      var sql =
        "SELECT COUNT(*) AS verify FROM mentorsdb WHERE GithubID='" + ID + "'";
      console.log(sql);

      connection.query(sql, function(err, result) {
        if (err) throw err;
        console.log(result[0].verify);
        if (result[0].verify == 1) {
          console.log("Yeet");
          allowed = true;
          fulfill(allowed);
        } else if (result[0].verify == 0) {
          console.log("Nop");
          allowed = false;
          fulfill(allowed);
        } else {
          console / log("INVALID NUMBER PASSED, DO NOTHING DARN HECKER");
          allowed = false;
          fulfill(allowed);
        }
      });
    });
  }

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

      sequelizeTestVerify(ParsedID).then(function(result) {
        if (result[0] == true) {
          console.log("Valid ID Passed!");
          req.session.GithubID = ParsedID;
          req.session.Authorized = true;
          req.session.Rank = result[1];
          //   req.session.name = SQLVerify(ParsedID)
          return res.redirect("../success");
        } else if (result[0] == false) {
          console.log("Not Authorized Login Attempt");
          return res.redirect("/login");
        }
      });
      /*THE AUTH PLAN: BY ADAM
STEP 1: GET THE USERID OF THE GITHUB ACCOUNT USING THE OAUTH TOKEN
STEP 2: COMPARE THE USERID TOKEN TO A MYSQL LIST OF TOKEN
  IF THE TOKEN EXISTS, LOGIN, IF NOT, MAKE AN ACCOUNT
STEP 3: SETUP RESTRICTIONS
STEP 4: DONE */
      /*  if (ParsedID == "29166546") {
        console.log("Valid ID Passed!");
        req.session.GithubID = ParsedID;
        req.session.Authorized = true;
        return res.redirect("../success");
      } else {
        return res.redirect("../login");
      } */
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
app.get("/AdminDashboard", auth,(req, res) => {
  console.log(req.session.Rank);
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


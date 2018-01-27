const express = require("express");
const app = express();
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
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
  res.sendFile(__dirname + "/attendance.html");
});
app.get("/login", function(req, res) {
  res.sendFile(__dirname + "/login.html");
});

app.listen(3000, () => console.log("Example app listening on port 3000!"));
app.use(express.static(path.join(__dirname, "/public")));
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

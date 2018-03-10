var guardians = 2;
var submitTemplateThree =
  "<p>Guardian 3's Name:</p><input type=\"text\" name=\"guardian_3\"><p>Description of Relationship:</p><input type=\"text\" name=\"guardian_3_desc\">";

function addAnother() {
  guardians++;
  var extraguardians = guardians + 1;
  if (guardians == 3) {
    document.getElementById("guardian3").innerHTML = submitTemplateThree;
    var buttonTemplate =
      "<div class=\"col-sm-3\" id=\"guardian" +
      extraguardians +
      "\"><button onclick=\"addAnother()\" style=\"margin-left: 5%;\">Add Another</button></div>";
    document.getElementById("row2").innerHTML =
      document.getElementById("row2").innerHTML + buttonTemplate;
  }

  if (guardians > 3 && guardians < 6) {
    var whichguardian = "guardian" + guardians;
    var submitTemplateMore =
      "<p>Guardian " +
      guardians +
      "'s Name:</p><input type=\"text\" name=\"guardian_" +
      guardians +
      "\"><p>Description of Relationship:</p><input type=\"text\" name=\"guardian_+" +
      guardians +
      "_desc\">";
    var elementname = "guardian" + guardians;
    document.getElementById(elementname).innerHTML = submitTemplateMore;
    buttonTemplate =
      "<div class=\"col-sm-3\" id=\"guardian" +
      extraguardians +
      "\"><button onclick=\"addAnother()\" style=\"margin-left: 5%;\">Add Another</button></div>";
    document.getElementById("row2").innerHTML =
      document.getElementById("row2").innerHTML + buttonTemplate;
  }
  if (guardians == 6) {
    var whichguardian = "guardian" + guardians;
    var submitTemplateMore =
      "<p>Guardian " +
      guardians +
      "'s Name:</p><input type=\"text\" name=\"guardian_" +
      guardians +
      "\"><p>Description of Relationship:</p><input type=\"text\" name=\"guardian_+" +
      guardians +
      "_desc\">";
    var elementname = "guardian" + guardians;
    document.getElementById(elementname).innerHTML = submitTemplateMore;
  }
}

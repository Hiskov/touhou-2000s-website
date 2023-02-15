"use strict";

var express = require("express");

var router = require("./router.js");

var app = express();
var port = 3000;
app.use(express["static"](__dirname + '/public'));
app.use("/", router);
app.listen(port, function () {
  console.log("Example app listening on port ".concat(port));
});
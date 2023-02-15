const express = require("express");
const router = require("./router.js");
const app = express()
const port = 3000

app.use(express.static(__dirname + '/public'));
app.use("/", router);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
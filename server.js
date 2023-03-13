const express = require("express");
const router = require("./router.js");
const app = express()
const port = 80
const path = require('path');

app.use(express.static(__dirname + '/public'));
app.use("/", router);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

app.get('*', function(req, res){
  res.sendFile(path.join(__dirname, 'public/404.html'));
});
const express = require("express");
const app = express();
app.use(express.json());
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");
const { open } = sqlite;
const path = require("path");
const dbpath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");
let dbObject = null;

const initilizeDBandserver = async () => {
  try {
    dbObject = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });

    app.listen(3000, function () {
      console.log("server running at local host 3000");
    });
  } catch (error) {
    console.log("db error:${error.message}");
    process.exit(1);
  }
};
initilizeDBandserver();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  let passwordLength = request.body.password.length; //get password
  const hashedpassword = await bcrypt.hash(request.body.password, 10);

  const usernameselectquery = `SELECT * FROM user WHERE username ='${username}'`;

  const dbuser = await dbObject.get(usernameselectquery);

  if (dbuser === undefined && passwordLength > 5) {
    const postuserdataquery = `INSERT INTO user (username,name,password,gender,location)
  VALUES('${username}',
  '${name}',
  '${hashedpassword}','${gender}',
  '${location}');`;
    await dbObject.run(postuserdataquery);
    response.status(200);
    response.send("User created successfully");
  } else if (passwordLength < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const usernamequery = `SELECT * FROM user WHERE username ='${username}'`;
  const dbuser = await dbObject.get(usernamequery);
  if (dbuser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const ispasswordMatched = await bcrypt.compare(password, dbuser.password);
    if (ispasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldpassword, newpassword } = request.body;
  let newpasswordLength = request.body.newpassword.length;

  const usernamequery = `SELECT * FROM user WHERE username ='${username}'`;
  const dbuser = await dbObject.get(usernamequery);

  if (dbuser === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const isvalidpassword = await bcrypt.compare(oldpassword, dbuser.password);
    if (isvalidpassword === true) {
      if (newpasswordLength < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const ensctpedpassword = await bcrypt.hash(newpassword, 10);
        const updatequery = `UPDATE user SET password='${ensctpedpassword}' WHERE username ='${username}'`;
        await dbObject.run(updatequery);

        response.send("Password updated");
      }
    } else {
      response.send(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;

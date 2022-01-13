const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const sqlite = require("sqlite3");
const sequelize = require("./database");
const Auth = require("./AuthUser");
const User = require("./User");
const RefreshTokens = require("./RefreshTokens");
const cors = require('cors');
sequelize
  .sync({ force: true })
  .then(() => console.log("database is ready"))
  .catch((err) => {
    console.log("eror occupied");
  });
app.use(express.json());
app.use(cors({origin:"*"}))
//---------verify function----------
const verify = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, "mysecretkey", (err, user) => {
      if (err) {
        return res.status(403).json("Token is not valid");
      }
      console.log("verified", user);
      req.user = user;
      next();
    });
  } else {
    res.status(401).json("You are not authenticated");
  }
};
//----------------------------------/
//----download file-------//
app.get("/api/download", (req, res) => {
  res.download("./Document.pdf");
});
//------------------------/
//token generater functions
const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, "mysecretkey", {
    expiresIn: "20s",
  });
};
const generateRefreshToken = (user) => {
  return jwt.sign({ email: user.email }, "myrefreshkey");
};
// const generateID = (user) => {
//   return jwt.sign({
//     sub: "110ZH9U",
//     fullName: "TOĞRUL TALIBZADƏ",
//     authorities: [
//       {
//         authority: "ROLE_A"
//       }
//     ],
//     status: "ACTIVE"
//   }, "userid",{expiresIn: "3m"});
// };
//----------------------------/
//--------sign up-------------/

app.post("/api/signup", async (req, res) => {
  const user = {
    name: req.body.name,
    surname: req.body.surname,
    email: req.body.email,
    password: req.body.password,
  };
  const response = await Auth.create({
    name: user.name,
    surname: user.surname,
    email: user.email,
    password: user.password,
  });

  res.status(200).json(response);
});

//--------------------
//refresh token
app.post("/api/refresh", async (req, res) => {
  const refreshToken = req.body.token;

  if (!refreshToken) {
    return res.status(401).json("You are not authenticated");
  }
  const a = await RefreshTokens.findOne({
    where: { refreshToken: refreshToken },
  });
  if (!a) {
    return res.status(403).json({
      message: "Refresh token is not valid",
      token: req.body.token,
      checker: a,
    });
  }
  jwt.verify(refreshToken, "myrefreshkey", async (err, user) => {
    err && console.log(err);
    console.log("reffdsfdsf", user);
    const b=await Auth.findOne({where:{email:user.email}})
    console.log('qqqqqqqq',b)
    const newAccessToken = generateAccessToken(b);
    const newRefreshToken = generateRefreshToken(b);
    a.refreshToken = newRefreshToken;

    a.save();
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });
  //if everything is ok,create new access token ,refresh and send to user
});
//------------------------------------------------/

//---------login---------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await Auth.findOne({
    where: { email: email, password: password },
  });
  console.log(user);
  if (user) {
    //generate access token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const a = await RefreshTokens.findOne({ where: { email: email } });

    if (a) {
      a.refreshToken = refreshToken;
      a.save();
    } else {
      await RefreshTokens.create({ email: email, refreshToken: refreshToken });
    }

    res.json({
      name: user.name,
      surname: user.surname,
      isAdmin: user.isadmin,

      accessToken,
      refreshToken,
    });
  } else {
    res.status(403).json("username or password incorrect");
  }

  // res.json(user);
});
//-----------------------------

//---------change password------
app.put("/api/profile/reset/", verify, async (req, res) => {
  const response = await Auth.findOne({ where: { email: req.user.email } });
  if (!response) {
    res.status(500).json("account not found");
  }
  response.password = req.body.password;
  await response.save();
  res.json(response);
});

//--------------------------
app.get("/api", (req, res) => {
  res.json(req.body);
});

//-----------------------------/

//------------logout-----------/

app.post("/api/logout", verify, (req, res) => {
  refreshToken = req.body.token;
  refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
  res.status(200).json("you logged out succesfully");
});

//---------------------------------//
app.delete("/api/users/:userName", verify, (req, res) => {
  console.log(req.user);
  if (req.user.username === req.params.userName) {
    res.status(200).json("User has been deleted");
  } else {
    res.status(403).json("You are not allowed to delete this user !");
  }
});
app.post("/api/sqlite", (res, req) => {
  console.log(req.req.body);
  User.create(req.req.body).then(() => {
    res.res.status(200).json("success");
  });
});
app.get("/api/users", async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

app.get("/api/users/:userId", async (req, res) => {
  const id = req.params.userId;
  const user = await User.findOne({ where: { id: id } });
  res.json(user);
});

app.put("/api/users/:userId", async (req, res) => {
  const id = req.params.userId;
  const user = await User.findOne({ where: { id: id } });
  user.username = "amilomucos";
  await user.save();
  res.json(user);
});
app.delete("/api/users/", async (req, res) => {
  const id = req.body.id;
  await User.destroy({ where: { id: id } });
  res.send(`${id} removed`);
});
app.listen(8000, () => {
  console.log("backend server started");
});

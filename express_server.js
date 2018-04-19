
let express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "JamTime" : {
    id: "JamTime",
    email: "Jamit@gmail.com",
    password: "purple-monkey-dinosaur"
  },
  "HackerAttacker" : {
    id: "HackerAttacker",
    email: "TicTacHackAttack@example.com",
    password: "YouWillNeverKnow"
  }
}




app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// app.get("/hello", (req, res) => {
//   res.end("<html><body>Hello <b>World</b></body></html>\n");
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase,
                       user: users[req.cookies['user_id']] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies['user_id']] }
  res.render("urls_new", templateVars);
});


app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
                       longURL: urlDatabase[req.params.id],
                       user: users[req.cookies['user_id']] }
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
})

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  let randomURL = generateRandomString();
  urlDatabase[randomURL] = req.body.longURL;
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
res.render("urls_registration")
})

app.post("/register", (req, res) => {
let randomID = generateRandomString();
for (let userKey in users) {
if (req.body.email === '' || req.body.password === '') {
  res.status(400).send("Uh Oh, looks like something went wrong!")
} else if (req.body.email === users[userKey].email) {
  res.status(400).send("Sorry this email is already registered.")
}
};
let user = {id : randomID,
            email : req.body.email,
            password : req.body.password}
users[randomID] = user;
res.cookie('user_id', user.id);
res.redirect("/urls")
});

app.get("/login", (req, res) => {
  res.render("urls_login");
})

app.post("/login", (req, res) => {
  var userKey = '';
  for (var key in users) {
    if (users[key].email === req.body.email) {
        userKey = users[key];
    }
  }
    if ( userKey === '') {
        res.status(403).send("Sorry that email doesn't exist. Lets get you signed up!");
        res.redirect('/register');
    } else if (req.body.password !== userKey.password) {
        res.status(403).send("Sorry, passwords don't match.")
    } else {
        res.cookie('user_id', userKey.id);
        res.redirect('/');
    }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls')
});




function generateRandomString() {
let shortURL = Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
return shortURL;
}








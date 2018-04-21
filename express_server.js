
const bcrypt = require('bcrypt');
let express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require("cookie-session");
app.use(cookieSession({
  name: 'session',
  keys: ['anxious_secret'],
  max: 24 * 60 * 60 * 1000
}));

app.set("view engine", "ejs");


const urlDatabase = {
          "b2xVn2": {
            url : "http://www.lighthouselabs.ca",
            userID : "JamTime"
          },
          "9sm5xK": {
            url : "http://www.google.com",
            userID : "HackerAttacker"
          }
  };

// do i remove these? string passwords securly last comment
const users = {
  "JamTime" : {
    id: "JamTime",
    email: "Jamit@gmail.com",
    password: "purple"
  },
  "HackerAttacker" : {
    id: "HackerAttacker",
    email: "TicTacHackAttack@example.com",
    password: "YouWillNeverKnow"
  }
};

function cookieExist(cookie) {
  if (req.session.user_id) {
    true;
  } else {
    false;
  }
};


function filterURL(userID) {
  const urlObt = {};
  for (const shortURL in urlDatabase) {
    if (userID === urlDatabase[shortURL].userID) {
      urlObt[shortURL] = urlDatabase[shortURL];
    }
  }
  return urlObt;
}


function addLongUrl(longURL, userID) {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
          shortURL: shortURL,
          url: longURL,
          userID: userID
  }
};



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
  if (!users[req.session.user_id]){
    res.redirect('/login');
  }
  const urlsUser = filterURL(req.session.user_id);
  let templateVars = { urls: urlsUser,
                       user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.session.user_id] }
  if (!req.session['user_id']) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});


app.get("/urls/:id", (req, res) => {
  if (!users[req.session.user_id]){
    res.redirect('/login')
  }
  let templateVars = { shortURL: req.params.id,
                       longURL: urlDatabase[req.params.id],
                       user: users[req.session.user_id] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].url = req.body.longURL;
  res.redirect('/urls');
})

app.post('/urls/:id/delete', (req, res) => {
  if(req.session.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.post("/urls", (req, res) => {
  addLongUrl(req.body.longURL, req.session.user_id);
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  }
  res.render("urls_registration", templateVars )
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
var hashedPassword = bcrypt.hashSync(req.body.password, 10);
let user = {id : randomID,
            email : req.body.email,
            password : hashedPassword}
users[randomID] = user;
req.session.user_id = user.id;
res.redirect("/urls")
});

app.get("/login", (req, res) => {
    let templateVars = {
    user: users[req.session.user_id]
  }
  res.render("urls_login", templateVars);
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
    } else if (!bcrypt.compareSync(req.body.password, userKey.password)) {
        res.status(403).send("Sorry, passwords don't match.")
    } else {
        req.session.user_id = userKey.id;
        res.redirect('/urls');
    }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login')
});




function generateRandomString() {
let shortURL = Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
return shortURL;
}








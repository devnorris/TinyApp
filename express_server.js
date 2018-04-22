
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

// updated URL database
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

//helper function that may help later in project
function cookieExist(cookie) {
  if (req.session.user_id) {
    true;
  } else {
    false;
  }
};


// helper function to store matching users with their websites
function filterURL(userID) {
  const urlObt = {};
  for (const shortURL in urlDatabase) {
    if (userID === urlDatabase[shortURL].userID) {
      urlObt[shortURL] = urlDatabase[shortURL];
    }
  }
  return urlObt;
};


// helper function to add longURL to users list
function addLongUrl(longURL, userID) {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
          shortURL: shortURL,
          url: longURL,
          userID: userID
  }
};


// Changed this to redirect to login, just in case.
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// No need for this page anymore
// app.get("/hello", (req, res) => {
//   res.end("<html><body>Hello <b>World</b></body></html>\n");
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


app.get('/urls', (req, res) => {
  if (!users[req.session.user_id]){   // check if user is logged in
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
  if (!users[req.session.user_id]){ // check if user is logged in
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
});


// Deletes URL if it belongs to current user and returns back to urls index
app.post('/urls/:id/delete', (req, res) => {
  if(req.session.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    res.redirect('/login'); // if not current user, redirects to login page
  }
});


// Passes the function to add url to user ids list
app.post("/urls", (req, res) => {
  addLongUrl(req.body.longURL, req.session.user_id);
  res.redirect('/urls');
});


// Takes you to the long urls website associated with the short URL made
// Also redirect to login if user doesnt match short URL
app.get("/u/:shortURL", (req, res) => {
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.status(400).send('Sorry, you dont have access to this shortened URL.');
  }
  let longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(longURL);
});


// Register page
app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  }
  res.render("urls_registration", templateVars )
});


// Signs new users up and errors on existing users or empty input
app.post("/register", (req, res) => {
let randomID = generateRandomString();
for (let userKey in users) {
if (req.body.email === '' || req.body.password === '') {
  res.status(400).send("<html><body><p>Uh Oh! Looks like something went wrong. Lets try that again.</p><li><button type=submit value=Register><a href='/register'>Register</a></button></li></body></html>")
} else if (req.body.email === users[userKey].email) {
  res.status(400).send("<html><body><p>Looks like you are already Registered!</p><li><button type=submit value=Login><a href='/login'>Login</a></button></li></body></html>")
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


// login page
app.get("/login", (req, res) => {
    let templateVars = {
    user: users[req.session.user_id]
  }
  res.render("urls_login", templateVars);
});


// Logs new users in or error on in proper input or unregistered users
// Also encrypts password and user id(assigning  this to an encrypted cookie)
app.post("/login", (req, res) => {
  var userKey = '';
  for (var key in users) {
    if (users[key].email === req.body.email) {
        userKey = users[key];
    }
  };
    if ( userKey === '') {
        res.status(403).send("<html><body><p>Sorry that email doesn't exist. Lets get you signed up!</p><li><button type=submit value=Register><a href='/register'>Register</a></button></li></body></html>");
    } else if (!bcrypt.compareSync(req.body.password, userKey.password)) {
        res.status(403).send("<html><body><p>Oops, wrong password!</p><li><button type=submit value=Login><a href='/login'>Login</a></button></li></body></html>")
    } else {
        req.session.user_id = userKey.id;
        res.redirect('/urls');
    }
});


// Post logout
app.post("/logout", (req, res) => {
  req.session = null; //clearing all cookies when logging out
  res.redirect('/login')
});



// Generates a random string that will be used for users id and shortened URLs
function generateRandomString() {
let shortURL = Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
return shortURL;
}








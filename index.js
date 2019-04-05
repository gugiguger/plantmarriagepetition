const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const hb = require("express-handlebars");
const db = require("./db");
const cookieSession = require("cookie-session");
// const csurf = require("csurf");

// handlebars
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

// serving static file
app.use(express.static("public"));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// saving signature in the cookies
app.use(
    cookieSession({
        maxAge: 1000 * 60 * 60 * 24 * 14,
        secret: "well doneee"
    })
);

// Security Matter
// app.use(csurf());
// app.use(function(req, res, next) {
//     res.setHeader("x-frame-options", "DENY");
//     res.locals.csrfToken = req.csrfToken();
//     next();
// });

///////////////////////////////////////////////////////////////////
/////////////////////// REDIRECT PAGE TO HOME ////////////////////////////
///////////////////////////////////////////////////////////////////

app.get("/", (req, res) => res.redirect("/register"));

///////////////////////////////////////////////////////////////////
/////////////////////// REGISTER PAGE ////////////////////////////
///////////////////////////////////////////////////////////////////

app.get("/register", (req, res) => {
    res.render("register", {
        layout: "main"
    });
});

app.post("/register", (req, res) => {
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let signature = req.body.signature;
    db.insertNewUser(firstname, lastname, signature)
        .then(results => {
            req.session.user_id = results.rows[0].id;
            req.session.firstname = results.rows[0].firstname;
            req.session.lastname = results.rows[0].lastname;

            res.redirect("/thankyou");
        })
        .catch(err => {
            console.log("err in insertNewUser", err);
        });
});

///////////////////////////////////////////////////////////////////
/////////////////////// THANK YOU PAGE ////////////////////////////
///////////////////////////////////////////////////////////////////

app.get("/thankyou", (req, res) => {
    let signImg = "";
    console.log(req.session.user_id);
    db.getSignatureImg(req.session.user_id).then(results => {
        signImg = results.rows[0].signature_url;
        console.log(signImg);
        res.render("thankyou", {
            layout: "main",
            message: "Thank you for signing my petition!",
            signed: signImg
        });
    });
});

///////////////////////////////////////////////////////////////////
/////////////////////// LISTEN TO LOCAL HOST 8080 /////////////////
///////////////////////////////////////////////////////////////////

app.listen(8080, () => console.log("listening"));

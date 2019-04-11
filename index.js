const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const hb = require("express-handlebars");
const db = require("./db");
const cookieSession = require("cookie-session");
// const csurf = require("csurf");

const {
    checkForRegisteredUsers,
    checkIfRegistered,
    registeredProfile
} = require("./middleware");

// handlebars
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

// static file
app.use(express.static("public"));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// saving signature in the cookies
app.use(
    cookieSession({
        maxAge: 1000 * 60 * 60 * 24 * 14,
        secret: "I am always Hungary."
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
/////////////////////// REDIRECT PAGE TO REGISTRATION ////////////////////////////
///////////////////////////////////////////////////////////////////

app.get("/", (req, res) => res.redirect("/register"));

///////////////////////////////////////////////////////////////////
/////////////////////// REGISTER PAGE ////////////////////////////
///////////////////////////////////////////////////////////////////

app.get("/register", checkIfRegistered, (req, res) => {
    res.render("register", {
        layout: "main"
    });
});

app.post("/register", (req, res) => {
    db.hashPassword(req.body.password).then(hash => {
        console.log(req.body.email);
        db.insertNewUser(
            req.body.firstname,
            req.body.lastname,
            req.body.email,
            hash
        )
            .then(results => {
                // req.session = {};
                // req.session.user = {};
                req.session.user_id = results.rows[0].id;
                // req.session.firstname = req.body.firstname;
                // req.session.lastname = req.body.lastname;
                // req.session.user.email = req.body.email;

                res.redirect("/profile");
            })
            .catch(err => console.log(err));
    });
});

///////////////////////////////////////////////////////////////////
/////////////////////// LOGIN PAGE ////////////////////////////
///////////////////////////////////////////////////////////////////

app.get("/login", checkIfRegistered, (req, res) => {
    res.render("login", {
        layout: "main",
        email: "e-mail address"
    });
});

app.post("/login", (req, res) => {
    db.getDatabasePw(req.body.email)
        .then(result => {
            return db.checkPassword(req.body.password, result.rows[0].password);
        })
        .then(doesMatch => {
            if (doesMatch) {
                return db.checkForUserInfos(req.body.email);
            } else {
                res.render("login", {
                    layout: "main",
                    error: "error"
                });
                return;
            }
        })
        .then(result => {
            req.session.firstname = result.rows[0].firstname;
            req.session.lastname = result.rows[0].lastname;
            req.session.user_id = result.rows[0].user_id;
            req.session.signaturesId = result.rows[0].signatures_id;
            res.redirect("/thankyou");
        })
        .catch(err => {
            console.log(err);
        });
});

///////////////////////////////////////////////////////////////////
/////////////////////// PROFILE PAGE ////////////////////////////
///////////////////////////////////////////////////////////////////

app.get("/profile", registeredProfile, (req, res) => {
    res.render("profile", {
        layout: "main",
        age: "age",
        city: "city",
        url: "url"
    });
}),
app.post("/profile", (req, res) => {
    db.getProfileInfos(
        req.session.user_id,
        req.body.age,
        req.body.city,
        req.body.url
    )
        .then(() => {
            res.redirect("/petition");
        })
        .catch(err => {
            console.log("Err in db.getProfileInfos function: ", err);
        });
});

///////////////////////////////////////////////////////////////////
/////////////////////// PETITION PAGE ////////////////////////////
///////////////////////////////////////////////////////////////////

app.get("/petition", checkIfRegistered, (req, res) => {
    res.render("petition", {
        layout: "main"
    });
});

app.post("/petition", (req, res) => {
    let signature_url = req.body.signature;
    let user_id = req.session.user_id;
    db.submitSign(signature_url, user_id)
        .then(result => {
            console.log(result);
            req.session.sigId = result.rows[0].id;
            res.redirect("/thankyou");
        })
        .catch(err => {
            console.log("err in submitSign", err);
        });
});

///////////////////////////////////////////////////////////////////
/////////////////////// SIGNERS PAGE ////////////////////////////
///////////////////////////////////////////////////////////////////

app.get("/signers", checkForRegisteredUsers, (req, res) => {
    if (!req.session.user_id) {
        console.log(req.session.user_Id);
        res.redirect("/petition");
    } else {
        db.getSignersInfos()
            .then(result => {
                console.log(result.rows);

                res.render("signers", {
                    layout: "main",
                    firstname: "First Name",
                    lastname: "Last Name",
                    signatureImg: `${req.session.petition}`,
                    signer: "",
                    signaturelist: result.rows
                });
            })
            .catch(err => {
                console.log("ERROR in the getSignersInfos: ", err);
            });
    }
});

app.get("/signers/:city", checkForRegisteredUsers, (req, res) => {
    db.getSignersInfosFromCity(req.params.city)
        .then(users => {
            res.render("signers", {
                layout: "main",
                message: `These are the people from ${
                    users.rows[0].city
                } who have signed the petition!`,
                signaturelist: users.rows
            });
        })
        .catch(err => {
            console.log(err);
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
        console.log(results);
        res.render("thankyou", {
            layout: "main",
            message: "Thank you for signing my petition!",
            signed: signImg
        });
    });
});

///////////////////////////////////////////////////////////////////
/////////////////////// UPDATE PROFILE PAGE ////////////////////////////
///////////////////////////////////////////////////////////////////

app.get("/updateProfiles", checkForRegisteredUsers, (req, res) => {
    db.mergingTables(req.session.user_id)
        .then(update => {
            res.render("updateProfiles", {
                layout: "main",
                update: update[0]
            });
        })
        .catch(err => {
            console.log(err);
        });
});

app.post("/updateProfiles", (req, res) => {
    if (req.body.password) {
        db.hashPassword(req.body.password)
            .then(hash => {
                Promise.all([
                    db.getPasswordUpdate(
                        req.session.user_id,
                        req.body.firstname,
                        req.body.lastname,
                        req.body.email,
                        hash
                    ),
                    db.getUpdatedProfile(
                        req.session.user_id,
                        req.body.age,
                        req.body.city,
                        req.body.url
                    )
                ])
                    .then(() => {
                        res.redirect("thankyou");
                    })
                    .catch(err => {
                        console.log(err);
                    });
            })
            .catch(err => {
                console.log(err);
            });
    } else {
        Promise.all([
            db.getEditedProfile(
                req.session.user_id,
                req.body.firstname,
                req.body.lastname,
                req.body.email
            ),
            db
                .getUpdatedProfile(
                    req.session.user_id,
                    req.body.age,
                    req.body.city,
                    req.body.url
                )
                .catch(err => {
                    console.log(err, 1);
                })
        ])
            .then(() => {
                res.redirect("/thankyou");
            })
            .catch(err => {
                console.log(err, 2);
            });
    }
});

///////////////////////////////////////////////////////////////////
/////////////////////// LOG OUT ///////////////////////////////////
///////////////////////////////////////////////////////////////////

app.get("/logout", (req, res) => {
    req.session.destroy;
    req.session = null;
    res.redirect("/register");
});

///////////////////////////////////////////////////////////////////
/////////////////////// LOG OUT ///////////////////////////////////
///////////////////////////////////////////////////////////////////

app.get("/deleteSignature", checkForRegisteredUsers, (req, res) => {
    db.deleteSignature(req.session.user_id)
        .then(() => {
            delete req.session.sigId;
            delete req.body.signature;
            res.redirect("/petition");
        })
        .catch(err => {
            console.log(err);
        });
});

app.get("/deleteProfile", checkForRegisteredUsers, (req, res) => {
    db.deleteProfile(req.session.user_id)
        .then(() => {
            delete req.session.sigId;
            delete req.body.signature;
            delete req.session.user_id;
            res.redirect("/register");
        })
        .catch(err => {
            console.log(err);
        });
});
///////////////////////////////////////////////////////////////////
/////////////////////// LISTEN TO LOCAL HOST 8080 /////////////////
///////////////////////////////////////////////////////////////////

app.listen(8080, () => console.log("listening"));

module.exports = {
    requireLoggedInUser,
    requireLoggedOutUser,
    requireSignature,
    requireNoSignature
};

function requireLoggedInUser(req, res, next) {
    if (!req.session.user_id && req.url != "/register" && req.url != "/login") {
        return res.redirect("/register");
    }
    next();
}

function requireLoggedOutUser(req, res, next) {
    if (req.session.user_id) {
        return res.redirect("/petition");
    }
    next();
}

function requireSignature(req, res, next) {
    if (!req.session.sigId) {
        return res.redirect("/petition");
    }
    next();
}

function requireNoSignature(req, res, next) {
    if (req.session.sigId) {
        return res.redirect("/thankyou");
    }
    next();
}

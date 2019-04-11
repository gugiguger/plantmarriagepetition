module.exports = {
    checkForRegisteredUsers,
    registeredProfile,
    checkIfRegistered
};

function checkForRegisteredUsers(req, res, next) {
    if (!req.session.user_id) {
        res.redirect("/register");
    } else {
        next();
    }
}

function registeredProfile(req, res, next) {
    if (req.session.age || req.session.city || req.session.homepage) {
        res.redirect("/thankyou");
    } else {
        next();
    }
}

function checkIfRegistered(req, res, next) {
    console.log("made it here");
    console.log(req.session.sigId);
    if (req.session.sigId) {
        res.redirect("/thankyou");
    } else {
        next();
    }
}

var spicedPg = require("spiced-pg");

var db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

const bcrypt = require("bcryptjs");

exports.getSignatureImg = function(user_id) {
    let q = `
        SELECT * FROM signatures WHERE user_id = $1
    `;
    let params = [user_id];

    return db.query(q, params);
};

exports.insertNewUser = function(first, last, email, hashedPw) {
    let q = `
        INSERT INTO users
        (firstname, lastname, email, password)
        VALUES
        ($1, $2, $3, $4)
        RETURNING id
    `;
    let params = [first || null, last || null, email || null, hashedPw || null];

    return db.query(q, params);
};

exports.hashPassword = function(plainTextPassword) {
    return new Promise(function(resolve, reject) {
        bcrypt.genSalt(function(err, salt) {
            if (err) {
                return reject(err);
            }
            bcrypt.hash(plainTextPassword, salt, function(err, hash) {
                if (err) {
                    return reject(err);
                }
                resolve(hash);
            });
        });
    });
};

exports.getDatabasePw = function(email) {
    let q = `SELECT password FROM users WHERE email = $1`;
    let params = [email || null];
    return db.query(q, params);
};

exports.checkPassword = function checkPassword(
    textEnteredInLoginForm,
    hashedPasswordFromDatabase
) {
    return new Promise(function(resolve, reject) {
        bcrypt.compare(
            textEnteredInLoginForm,
            hashedPasswordFromDatabase,
            function(err, doesMatch) {
                if (err) {
                    reject(err);
                } else {
                    resolve(doesMatch);
                }
            }
        );
    });
};

exports.checkForUserInfos = function(email) {
    let q = `
    SELECT firstname, lastname, users.id as user_id, signatures.id as signatures_id
    FROM users
    FULL OUTER JOIN signatures
    ON signatures.user_id = users.id
    WHERE email = $1
    `;
    let params = [email || null];
    return db.query(q, params);
};

exports.getProfileInfos = function(user_id, age, city, url) {
    let q = `INSERT INTO user_profiles
    (user_id, age, city, url)
    VALUES($1,$2,$3,$4)`;
    let params = [user_id, age, city, url];
    return db.query(q, params);
};

exports.getSignersInfos = function() {
    let q = `
    SELECT users.id AS user_id, firstname, lastname, age, city, url
    FROM users
    JOIN signatures
    ON signatures.user_id = users.id
    FULL OUTER JOIN user_profiles
    ON user_profiles.user_id = users.id;
    `;
    return db.query(q);
};

exports.getSignersInfosFromCity = function(city) {
    const q = `
    SELECT users.id AS user_id, firstname, lastname, age, city, url
    FROM users
    JOIN signatures
    ON signatures.user_id = users.id
    FULL OUTER JOIN user_profiles
    ON user_profiles.user_id = users.id
    WHERE LOWER(city) = LOWER($1);
    `;
    let params = [city];
    return db.query(q, params);
};

exports.submitSign = function(signature_url, user_id) {
    let q = `INSERT INTO signatures
    (signature_url, user_id)
    VALUES($1, $2)
    RETURNING id`;

    let params = [signature_url, user_id];

    return db.query(q, params);
};

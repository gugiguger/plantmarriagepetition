var spicedPg = require("spiced-pg");

var db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
);

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

exports.mergingTables = function(id) {
    let q = `SELECT users.firstname, users.lastname, users.email, user_profiles.age, user_profiles.city,user_profiles.url
    FROM users
    FULL OUTER JOIN user_profiles
    ON users.id = user_profiles.user_id WHERE users.id = $1;`;
    let params = [id];
    return db
        .query(q, params)
        .then(result => {
            return result.rows;
        })
        .catch(function(err) {
            console.log(err);
        });
};

exports.updateWithNewPassword = function(
    id,
    firstname,
    lastname,
    email,
    hashedPw
) {
    let q = `UPDATE users SET firstname = $1, lastname = $2, email = $3, password = $4 WHERE id = $5`;
    let params = [firstname, lastname, email, hashedPw, id];
    return db.query(q, params);
};

exports.updateWithNewProfile = function(id, age, city, url) {
    let q = `INSERT INTO user_profiles (user_id, age, city, url) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET age = $1, city =$2, url = $3`;
    let params = [id || null, age || null, city || null, url || null];
    return db.query(q, params);
};

exports.updateAccountInformation = function(id, firstname, lastname, email) {
    let q = `UPDATE users SET firstname = $1, lastname = $2, email = $3 WHERE id = $4`;
    let params = [firstname, lastname, email, id];
    return db.query(q, params);
};

exports.deleteSignature = function(id) {
    let q = `DELETE FROM signatures WHERE user_id = $1`;
    let params = [id || null];
    return db.query(q, params);
};

exports.deleteProfile = function(id) {
    const q1 = `DELETE FROM signatures WHERE user_id = $1`;
    const q2 = `DELETE FROM user_profiles WHERE id = $1`;
    const q3 = `DELETE FROM users WHERE id = $1`;
    const params = [id || null];

    return Promise.all([
        db.query(q1, params),
        db.query(q2, params),
        db.query(q3, params)
    ]);
};

exports.getUsersNumbers = function() {
    let q = `SELECT COUNT(*) FROM signatures`;
    let params = [];
    return db.query(q, params);
};

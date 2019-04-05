var spicedPg = require("spiced-pg");

var db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

// #############################################################################
// #############################################################################
// #############################################################################

exports.insertNewUser = function(first_name, last_name, signature_url) {
    let q = `
        INSERT INTO signatures
        (first_name, last_name, signature_url)
        VALUES
        ($1, $2, $3)
        RETURNING id
    `;
    let params = [first_name || null, last_name || null, signature_url || null];

    return db.query(q, params);
};

// #############################################################################
// ############################ Select Signature Id/ Image #####################
// #############################################################################

exports.getSignatureImg = function(id) {
    let q = `
        SELECT * FROM signatures WHERE id = $1
    `;
    let params = [id];

    return db.query(q, params);
};

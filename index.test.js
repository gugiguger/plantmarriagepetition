const {app} = require('./index.js')
const supertest = require('supertest')
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const db = require('./db');
// const {checkIfNotSignedIn, checkIfNotSigned, checkIfAlreadySigned, checkIfAlreadySignedIn} = require('./middleware')



jest.mock('./db')

test('Users who are logged out are redirected to the registration page when they attempt to go to the petition page', () => {
    return supertest(app).get('/list').then(res => {
        expect(res.headers.location).toBe('/')
    })
})

test('Users who are logged out are redirected to the registration page when they attempt to go to the sign page', () => {
    return supertest(app).get('/sign').then(res => {
        expect(res.headers.location).toBe('/')
    })
})

test('Users who are logged out are redirected to the registration page when they attempt to go to the list/berlin page', () => {
    return supertest(app).get('/list/berlin').then(res => {
        expect(res.headers.location).toBe('/')
    })
})

test('Users who are logged out are redirected to the registration page when they attempt to go to the profile page', () => {
    return supertest(app).get('/profile').then(res => {
        expect(res.headers.location).toBe('/')
    })
})

test('Users who are logged in are redirected to the petition page when they attempt to go to either the registration page', () => {
    cookieSession.mockSessionOnce({signatureUserid: 666})
    return supertest(app).get('/').then(res => {
        expect(res.headers.location).toBe('/sign')
    })
})

test('Users who are logged in and have signed the petition are redirected to the thank you page when they attempt to go to the petition page or submit a signature', () => {
    cookieSession.mockSessionOnce({signatureId: 666, signatureUserid: 777})
    return supertest(app).get('/sign').then(res => {
        expect(res.headers.location).toBe('/list')
    })
})

test('Users who are logged in and have not signed the petition are redirected to the petition page when they attempt to go to either the thank you page or the signers page', () => {
    cookieSession.mockSessionOnce({signatureUserid: 666})
    return supertest(app).get('/list').then(res => {
        expect(res.headers.location).toBe('/sign')
    })
})

test('When the input is good, the user is redirected to the thank you page', () => {
    db.sign.mockResolvedValue({rows: [{id: 66}]})
    cookieSession.mockSessionOnce({signatureUserid: 666})
    return supertest(app).post('/sign')
    .send({petition: 'xxx', first:'sss', last:'ss', signature:'longstringgggggggggggg', note:'none'})
    .set('Accept', 'application/json')
    .then(res => {
        expect(res.headers.location).toBe('/list')
    })
})

test('When the input is bad, the response body contains an error message', () => {
    db.sign.mockResolvedValue({rows: []})
    cookieSession.mockSessionOnce({signatureUserid: 666})
    return supertest(app).post('/sign')
    .send({petition: 'xxx', first:'sss', last:'ss', signature:'longstringgggggggggggg', note:'none'})
    .set('Accept', 'application/json')
    .then(res => {
        expect(res.text).toContain('<h1>ERROR</h1>')
    })

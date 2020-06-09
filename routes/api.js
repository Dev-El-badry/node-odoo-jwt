const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const odoo_xmlrpc = require("odoo-xmlrpc");

//secret key
const secret_key = 'blackbelts';

router.get('/', (req, res)=> {
    res.send({
        message: 'well done'
        
    });
});

router.post('/login', (req, res) => {
   
    //MOCK user
    const auth = {
        url: 'http://207.154.195.214',
        port: req.body.port,
        db: req.body.db,
        username: req.body.username,
        password: req.body.password
    };

    const odoo = new odoo_xmlrpc(auth);
    odoo.connect((err, result) => {
        if(err) {
            res.sendStatus(403);
        }

        auth.id = result;

        jwt.sign({auth}, secret_key, {expiresIn: '2 Days'}, (err, token) => {
            res.json({
                token,
                auth
            });
        });

    });

  

});

router.post('/call_method/:modelname/:method', verifyToken, (req, res)=> {

    const modelname = req.params.modelname;
    const method = req.params.method;
    const list = JSON.parse(req.body.paramList);
    const resultList = Object.values(list.paramlist);
    
    jwt.verify(req.token, secret_key, (err, authData) => {
        
        if(err) {
            res.sendStatus(403);
        } else {

            const odoo = new odoo_xmlrpc(authData);

            odoo.connect((err, response) => {
                if(err) return console.log('error', err);
            });

            odoo.execute_kw(modelname, method, [resultList], function (err, value) {
                if (err) { return res.send(err); }
                res.json({
                    authData,
                    value: value
                });
            
            });
        }
    });
});





//FORMAT OF TOKEN
//Authrization: Bearer <access_token>

//Verify Token
function verifyToken(req, res, next) {
    //Get auth header
    const bearerHeader = req.headers['authorization'];

    //Check if bearerToken is undefined
    if(typeof bearerHeader !== 'undefined') {
        //split the space
        const bearer = bearerHeader.split(' ');

        //Get Token From Array
        const bearerToken = bearer[1];
       
        //Set The Token
        req.token = bearerToken;

        //Next Middleware
        next();
    } else {
        res.sendStatus(403);
    }
}

module.exports = router;
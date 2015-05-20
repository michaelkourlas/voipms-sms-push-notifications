var express = require("express");

var app = express();

var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'database',
    password : 'database',
    database : 'voipmssms'
});
connection.connect();
connection.query("CREATE TABLE main (RegistrationId varchar(255), Did varchar(255));", function(err) {

});

app.get(/\/(register|push)/, function(req, res, next) {
    if (!("did" in req.query)) {
        res.json({
            status: "no_did"
        });
    }
    else if (req.query["did"] === "") {
        res.json({
            status: "did_empty"
        });
    }
    else if (isNaN(req.query["did"])) {
        res.json({
            status: "did_nan"
        });
    }
    else {
        next();
    }
});

app.get("/register", function(req, res, next) {
    if (!("reg_id" in req.query)) {
        res.json({
            status: "no_reg_id"
        });
    }
    else if (req.query["reg_id"] === "") {
        res.json({
            status: "reg_id_empty"
        });
    }
    else {
        next();
    }
});

app.get("/register", function(req, res, next) {
    connection.query('INSERT INTO main (RegistrationId, Did) VALUES (' + connection.escape(req.query["reg_id"]) + ',' + connection.escape(req.query["did"]) + ');', function(err) {
        if (!err)
            res.json({
                status: "success"
            });
        else
            res.json({
                status: "database_error"
            });

        next();
    });
});

app.get("/push", function(req, res, next) {
    next();
});

module.exports = app;


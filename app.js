var express = require('express'),
    app = express(),
    server = require('http').createServer(app);

server.listen(3000);


app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});

app.get('/other', function(req, res) {
    res.sendfile(__dirname + '/other.html');
});

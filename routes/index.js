var express = require('express');
var router = express.Router();

var markdown = require('markdown').markdown;
var fs = require('fs');
var path = require('path');

var terms = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'views', 'docs', 'terms.json'), 'utf8'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'FoldIt FIGURE - Starships' });
});

router.get('/doc/terms', function(req, res, next) {
    res.send(terms);
});

router.get('/doc/:docKey', function(req, res, next) {
    fs.readFile(path.join(req.app.rootFolder, 'views', 'docs', req.params.docKey + '.md'), 'utf8', function(err, md) {
        if (err) {
            res.send('<div class="error">Error: ' + err + '</div>');
            return;
        }
        res.send(markdown.toHTML(md));
    });
});

module.exports = router;

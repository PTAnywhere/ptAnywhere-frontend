// npm install
// webdriver-manager update
// webdriver-manager start // in one tab
//    ( node_modules/webdriver-manager/bin/webdriver-manager update )
// jasmine-node widget-spec.js // in another
//    ( node_modules/jasmine-node/bin/jasmine-node widget-spec.js )

var webdriver = require('selenium-webdriver');

function newDriver() {
    return new webdriver.Builder().
                   usingServer('http://localhost:4444/wd/hub').
                   withCapabilities(webdriver.Capabilities.chrome()).
                   build();
}

var by = webdriver.By;
var until = webdriver.until;


describe('reservation landing page', function () {

    var browser;

    beforeEach(function(done) {
        browser = newDriver();
        browser.get('http://forge.kmi.open.ac.uk/test/').then(done);
    });

    afterEach(function(done) {
        browser.quit().then(done);
    });

	it('should be on correct page', function (done) {
		browser.getTitle().then(function(title) {
			expect(title).toBe('Reserve instance');
			done();
		});
	});

    it('button click redirects to session', function (done) {
        browser.findElement(by.id("btnReserve")).click();
        browser.wait(until.titleContains('Widget'), 2000);
        browser.getTitle().then(function(title) {
            expect(title).toMatch('Widget');
        });
        done();
    });
});

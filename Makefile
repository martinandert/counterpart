BIN = ./node_modules/.bin
PATH := $(BIN):$(PATH)

test: lint
	@mocha -t 5000 -b -R spec spec.js

lint:
	@jshint index.js strftime.js locales/

install link:
	@npm $@

release-patch: test
	@$(call release,patch)

release-minor: test
	@$(call release,minor)

release-major: test
	@$(call release,major)

publish:
	git push --tags origin HEAD:master
	npm publish

define release
	npm version $(1) -m 'release %s'
endef

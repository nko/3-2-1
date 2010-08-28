all:

vendor:
	rm -rf vendor
	mkdir vendor
	npm bundle vendor

.PHONY: all vendor

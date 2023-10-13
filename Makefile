extension.zip: $(shell find -name *.js -or -name *.json -or -name *.html -or -name *.css -or -name *.png)
	zip $@ $^

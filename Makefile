PORT ?= 8000

.PHONY: serve help

help:
	@echo "make serve [PORT=8000]  static server, open http://localhost:$(PORT)/proposals/"

serve:
	@echo "Gallery: http://localhost:$(PORT)/proposals/"
	python3 -m http.server $(PORT) --bind 127.0.0.1

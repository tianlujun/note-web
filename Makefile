.PHONY: build deploy restart health

NERD_HOST := root@172.245.147.11
NERD_PATH := /opt/note-web

build:
	cd $(NERD_PATH)/frontend && npm run build

deploy: build
	ssh $(NERD_HOST) 'systemctl restart note-web'

restart:
	ssh $(NERD_HOST) 'systemctl restart note-web'

health:
	@curl -sI https://notes.cinnabar.ink/ | head -1
	@curl -s https://notes.cinnabar.ink/api/files -H 'Authorization: Bearer notes123' | python3 -c 'import json,sys; d=json.load(sys.stdin); print("tree entries:", len(d["tree"]))'

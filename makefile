run-todos-example:
	./node_modules/.bin/mojo build ./examples/todos/app/index.js --output=./examples/todos/app/index.bundle.js --debug --serve=./examples/todos --port=8085

run-chatroom-example:
	./node_modules/.bin/mojo build ./examples/chatroom/index.js --output=./examples/chatroom/index.bundle.js --debug --serve=./examples/chatroom --port=8085
include Makefile.val

build-backend: 
	$(DOCKER_BIN) build -f build/Dockerfile -t true-fit-api .

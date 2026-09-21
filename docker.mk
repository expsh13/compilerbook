IMAGE := compilerbook
PLATFORM := linux/amd64
PROJECT_DIR := /Users/hatasatoki/Develops/compilerbook

.PHONY: image shell run

image:
	docker build --platform $(PLATFORM) -t $(IMAGE) .

shell:
	docker run --rm -it --platform $(PLATFORM) \
		-v $(PROJECT_DIR):/workspace \
		-w /workspace \
		$(IMAGE) bash

run:
	docker run --rm --platform $(PLATFORM) \
		-v $(PROJECT_DIR):/workspace \
		-w /workspace \
		$(IMAGE) $(CMD)

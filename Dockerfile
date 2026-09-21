FROM --platform=linux/amd64 ubuntu:latest

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       gcc \
       make \
       git \
       binutils \
       libc6-dev \
       gdb \
       sudo \
       adduser \
    && rm -rf /var/lib/apt/lists/*

RUN adduser --disabled-password --gecos '' user \
    && echo 'user ALL=(root) NOPASSWD:ALL' > /etc/sudoers.d/user

USER user
WORKDIR /workspace

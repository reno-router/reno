#!/usr/bin/env sh

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
$NVM_DIR/nvm-exec use
npm i
npm test

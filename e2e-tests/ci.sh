#!/usr/bin/env sh

# TODO: find a better approach and remove duped .deno-version!
curl -fsSL https://deno.land/x/install/install.sh | sh -s $(cat .deno-version)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
nvm i
npm i
npm test

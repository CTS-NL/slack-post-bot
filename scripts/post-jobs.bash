#!/usr/bin/env bash
cd "$(dirname "${BASH_SOURCE[0]}")" && source "./common.bash"

load-environment-file .env
load-environment-file .env.dist

process-run "node" "cts-slack-post-jobs" "$PWD" "src/post-jobs.js"

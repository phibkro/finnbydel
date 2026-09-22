set shell := ["bash", "-euo", "pipefail", "-c"]

check:
    bun run check

conventions-check:
    "${HOMELAB_ROOT:-../../homelab}/foundry/bin/conventions-check" .

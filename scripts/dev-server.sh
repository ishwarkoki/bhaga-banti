#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

required_vars=(
  "PORT"
  "NODE_ENV"
  "DATABASE_URL"
  "BETTER_AUTH_SECRET"
  "BETTER_AUTH_URL"
)

optional_vars=(
  "FRONTEND_URL"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "EMAIL_HOST"
  "EMAIL_PORT"
  "EMAIL_USER"
  "EMAIL_PASS"
  "LOG_LEVEL"
)

trim_quotes() {
  local value="$1"
  value="${value%$'\r'}"

  if [[ "$value" == \"*\" && "$value" == *\" ]]; then
    value="${value:1:${#value}-2}"
  elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
    value="${value:1:${#value}-2}"
  fi

  printf '%s' "$value"
}

load_var_from_env_file() {
  local key="$1"

  [[ -f "$ENV_FILE" ]] || return 1

  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 || true)"
  [[ -n "$line" ]] || return 1

  trim_quotes "${line#*=}"
}

hydrate_var() {
  local key="$1"

  if [[ -n "${!key:-}" ]]; then
    return 0
  fi

  local value
  if value="$(load_var_from_env_file "$key")"; then
    export "$key=$value"
  fi
}

for key in "${required_vars[@]}" "${optional_vars[@]}"; do
  hydrate_var "$key"
done

missing_vars=()
for key in "${required_vars[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    missing_vars+=("$key")
  fi
done

if (( ${#missing_vars[@]} > 0 )); then
  printf 'Missing required environment variables:\n' >&2
  for key in "${missing_vars[@]}"; do
    printf '  - %s\n' "$key" >&2
  done

  if [[ -f "$ENV_FILE" ]]; then
    printf '\nChecked %s for fallback values.\n' "$ENV_FILE" >&2
  else
    printf '\nNo %s file found.\n' "$ENV_FILE" >&2
  fi

  exit 1
fi

if [[ -n "${GOOGLE_CLIENT_ID:-}" && -z "${GOOGLE_CLIENT_SECRET:-}" ]] || [[ -z "${GOOGLE_CLIENT_ID:-}" && -n "${GOOGLE_CLIENT_SECRET:-}" ]]; then
  printf 'Google OAuth is partially configured. Set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET or leave both unset.\n' >&2
  exit 1
fi

BASE_URL="${BETTER_AUTH_URL%/}"

printf 'Bhaga-Banti backend starting...\n'
printf 'Base URL:   %s\n' "$BASE_URL"
printf 'Health:     %s/health\n' "$BASE_URL"
printf 'Docs:       %s/api-docs\n' "$BASE_URL"
printf 'Auth:       %s/api/auth\n' "$BASE_URL"
printf '\n'

cd "$PROJECT_ROOT"
exec node --import tsx src/app.ts

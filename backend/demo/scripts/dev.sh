#!/bin/sh
set -eu
# Remove stale bytecode, including classes whose source files were deleted.
compile() { mvn -B -ntp -Dmaven.repo.local=/cache/maven -DskipTests clean compile; }
fingerprint() { find src pom.xml -type f -exec sha256sum {} \; | sort | sha256sum; }
compile
previous=$(fingerprint)
mvn -B -ntp -Dmaven.repo.local=/cache/maven spring-boot:run &
app_pid=$!
trap 'kill "$app_pid" 2>/dev/null || true' EXIT
trap 'exit 0' INT TERM
while kill -0 "$app_pid" 2>/dev/null; do
    sleep 2
    current=$(fingerprint)
    if [ "$current" != "$previous" ]; then
        # Retry failed builds without marking the sources as successfully compiled.
        if compile; then previous=$current; fi
    fi
done
wait "$app_pid"

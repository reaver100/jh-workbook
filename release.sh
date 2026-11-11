#!/bin/bash
# 문제집 새 버전 올리기: 캐시 번호 · 에셋 버전 · 앱 버전 · 빌드 시각
set -e
cd "$(dirname "$0")"
cur=$(sed -n "s/.*wb-v\([0-9]\{1,\}\).*/\1/p" sw.js | head -1)
next=$((cur+1))
built=$(TZ=Asia/Seoul date '+%Y-%m-%d %H:%M')
sed -i "s/wb-v$cur/wb-v$next/" sw.js
sed -i "s/?v=$cur/?v=$next/g" index.html sw.js
sed -i "s/var APPV = \"[^\"]*\"/var APPV = \"$next\"/" app.js
sed -i "s/BUILT = \"[^\"]*\"/BUILT = \"$built\"/" app.js
echo "버전 $cur → $next ($built)"

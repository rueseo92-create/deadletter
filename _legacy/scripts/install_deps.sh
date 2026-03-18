#!/bin/bash
# deadletter — 의존성 설치

set -e

echo "Python 의존성 설치 중..."
pip3 install -r requirements.txt

echo ""
echo "설치 완료!"

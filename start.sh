#!/bin/bash
echo "============================================"
echo "  AA Translator 시작 중..."
echo "============================================"
echo ""

# pnpm 설치 확인
if ! command -v pnpm &> /dev/null; then
    echo "[오류] pnpm이 설치되어 있지 않습니다."
    echo ""
    exit 1
fi

# 처음 실행 시 자동으로 pnpm install
if [ ! -d "node_modules" ]; then
    echo "[설치] 처음 실행이므로 필요한 파일을 설치합니다..."
    echo "잠시만 기다려주세요..."
    echo ""
    pnpm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "[오류] 설치에 실패했습니다. 인터넷 연결을 확인해주세요."
        exit 1
    fi
    echo ""
    echo "[완료] 설치가 완료되었습니다!"
    echo ""
fi

echo "[시작] 브라우저에서 http://localhost:3000 을 열어주세요."
echo "       (자동으로 열리지 않으면 위 주소를 직접 입력하세요)"
echo ""
echo "       종료하려면 Ctrl+C를 누르세요."
echo "============================================"
echo ""

# macOS에서는 자동으로 브라우저 열기
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3000 &
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:3000 2>/dev/null &
fi

pnpm dev

#!/bin/bash
# deadletter — 전체 서비스 시작/중지
# Usage: bash scripts/run_all.sh [start|stop|status]

PIDFILE="/tmp/deadletter.pid"
LOGFILE="logs/deadletter.log"

start() {
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
        echo "deadletter가 이미 실행 중입니다 (PID: $(cat "$PIDFILE"))"
        exit 1
    fi

    echo "deadletter 서비스 시작..."
    mkdir -p logs

    nohup python3 main.py >> "$LOGFILE" 2>&1 &
    echo $! > "$PIDFILE"

    echo "서비스 시작 완료 (PID: $(cat "$PIDFILE"))"
    echo "로그: tail -f $LOGFILE"
}

stop() {
    if [ ! -f "$PIDFILE" ]; then
        echo "deadletter가 실행 중이 아닙니다."
        exit 1
    fi

    PID=$(cat "$PIDFILE")
    echo "deadletter 서비스 중지 (PID: $PID)..."
    kill "$PID" 2>/dev/null
    rm -f "$PIDFILE"
    echo "서비스 중지 완료"
}

status() {
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
        echo "deadletter 실행 중 (PID: $(cat "$PIDFILE"))"
    else
        echo "deadletter 중지 상태"
        rm -f "$PIDFILE"
    fi
}

case "${1:-start}" in
    start)  start ;;
    stop)   stop ;;
    status) status ;;
    restart) stop; sleep 1; start ;;
    *)
        echo "Usage: $0 {start|stop|status|restart}"
        exit 1
        ;;
esac

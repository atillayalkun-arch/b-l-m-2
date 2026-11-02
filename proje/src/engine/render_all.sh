#!/bin/bash
# Kaldığı yerden devam eden parça parça render: bash engine/render_all.sh s01
set -e
ID=${1:-s01}; SEG=500; cd "$(dirname "$0")/.."
N=$(node -e "import('./out/bundle.js').catch(()=>{});" 2>/dev/null; python3 -c "print(int(__import__('math').ceil(125.0*30)))")
[ -n "$2" ] && N=$2
run() { f=$1; o=out/${ID}_seg_$(printf %05d $f).mp4; [ -s "$o.ok" ] || { node engine/render.mjs $ID --range $f,$((f+SEG)) >/dev/null && echo 1 > "$o.ok"; echo "seg $f ok"; }; }
for ((f=0; f<N; f+=SEG*2)); do run $f & run $((f+SEG)) & wait; done
ls out/${ID}_seg_*.mp4 | sort | sed "s|^out/|file '|;s|$|'|" > out/${ID}_list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i out/${ID}_list.txt -c copy out/${ID}_video.mp4
node engine/render.mjs $ID --audio-only
echo "ALL DONE"

#!/bin/zsh
# Fabrique une copie allégée de la v2 pour la lecture sur téléphone et le partage en ligne.
# La v2 n'est pas modifiée. Résultat dans ../v2-partage (à relancer après chaque ajout de médias).
# Limites de la publication : 15 Mo par fichier.
set -eu
V2=${0:A:h:h}
OUT=${V2:h}/v2-partage
X=(-c:v libx264 -pix_fmt yuv420p -profile:v high -movflags +faststart -preset slow)

rm -rf $OUT && mkdir -p $OUT
cp $V2/*.html $OUT/
cp -R $V2/assets $OUT/assets
mkdir -p $OUT/media
cp -R $V2/media/brand $OUT/media/brand

# vidéos : boucles muettes allégées, films complets en 720p avec le son
for f in $V2/media/*/*.mp4(N); do
  rel=${f#$V2/}; dir=$OUT/${rel:h}; mkdir -p $dir; name=${f:t:r}
  [[ $rel == media/brand/* ]] && continue
  w=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 $f | head -1)
  h=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 $f | head -1)
  if (( w >= h )); then scale="scale=1280:-2"; else scale="scale=720:-2"; fi
  has_audio=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 $f | head -1)
  if [[ -n $has_audio ]]; then
    ffmpeg -v error -y -i $f -vf $scale $X -crf 26 -maxrate 2.2M -bufsize 4.4M -c:a aac -b:a 96k $dir/$name.mp4
  else
    ffmpeg -v error -y -i $f -vf $scale -an $X -crf 27 -maxrate 1.8M -bufsize 3.6M $dir/$name.mp4
  fi
  echo "vidéo  $rel  $(du -h $dir/$name.mp4 | cut -f1)"
done
for f in $V2/media/*/*.jpg(N); do rel=${f#$V2/}; mkdir -p $OUT/${rel:h}; cp $f $OUT/$rel; done

# photos : 1600 px
for f in $V2/media/photos/*/*.jpg(N); do
  rel=${f#$V2/}; mkdir -p $OUT/${rel:h}
  sips -Z 1600 -s format jpeg -s formatOptions 72 $f --out $OUT/$rel >/dev/null
done

# la page d'accueil est publiée sans son enveloppe <html><head><body> (ajoutée par l'hébergement)
python3 - $OUT/index.html <<'PY'
import re, sys
p = sys.argv[1]; s = open(p).read()
s = re.sub(r'<!doctype html>\s*<html[^>]*>\s*<head>\s*', '', s, count=1, flags=re.I)
s = s.replace('</head>\n<body>\n', '', 1).replace('</body>\n</html>\n', '', 1)
s = s.replace('<meta charset="utf-8">\n', '', 1).replace('<meta name="viewport" content="width=device-width, initial-scale=1">\n', '', 1)
open(p, 'w').write(s)
PY

echo "taille totale : $(du -sh $OUT | cut -f1)"
find $OUT -type f -size +15M -print | sed 's/^/TROP LOURD : /'

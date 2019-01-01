#!/usr/bin/env bash
# pdf-montage.sh
#
# Take a PDF and create a PNG with a montage of thumbnails of each page.
#
# Example PDF:
# https://academic.oup.com/bioinformatics/article-pdf/30/17/2496/17148439/btu326.pdf
#
# Example montage:
# https://i.imgur.com/nGn989z.png

set -x

# The full path to the PDF file.
pdf="$1"

if [[ ! -f "$pdf"  || "$pdf" != *.pdf ]]
then
  echo "Usage: ./pdf-montage.sh file.pdf"
  exit 1
fi

# Create temporary PNG files in a temporary directory.
wd=$(mktemp -d)

# Convert each page of the PDF to a PNG image.
convert -alpha off -density 300 "$pdf" -resize 25% "${wd}/%04d.png"

# Add a drop shadow to each PNG image.
for f in "$wd"/????.png
do
  convert "$f" \
    \( +clone  -background black -shadow 80x5+0+3 \) +swap \
    -background none -layers merge +repage \
    "${f%.png}-shadow.png"
done

# Count the number of pages.
pages=$(ls -1 "$wd"/????-shadow.png | wc -l)
rows=$(awk "BEGIN { x = sprintf(\"%.0f\", $pages / 5 + 0.5); print x }")

# Create a montage of the pages next to each other.
montage="${pdf%.pdf}-montage.png"
# montage "$wd"/????-shadow.png -tile ${pages}x1 -geometry 500x+1+1 "$montage"
montage "$wd"/????-shadow.png -tile 5x${rows} -geometry 500x+1+1 "$montage"

# Optimize the PNG file size.
pngquant --force --output "$montage" -- "$montage"

# Delete the temporary directory.
rm -rf "$wd"

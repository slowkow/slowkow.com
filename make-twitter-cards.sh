#!/usr/bin/env bash

f=static/images/partners-disk-usage.png

convert $f -bordercolor White -border 40x40 ${f%.png}-card.png

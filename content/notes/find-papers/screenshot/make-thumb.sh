#!/usr/bin/env bash
mkdir -p thumb
mogrify -format jpg -path thumb -thumbnail x400 *.jpg *.png

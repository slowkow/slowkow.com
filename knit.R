#!/usr/bin/env Rscript --vanilla

'knit.R - knit the .Rmd files in content/notes/*.Rmd

Usage:
  knit.R knit [<file>...]
  knit.R list
  naval_fate.R (-h | --help)
  naval_fate.R --version

Options:
  -h --help     Show this screen.
  --version     Show version.

' -> doc

library(docopt)
arguments <- docopt(doc, version = 'Naval Fate 2.0')
# print(arguments)

library(knitr)

# render_jekyll(highlight = "pygments")
opts_knit$set(out.format = 'markdown') 
# opts_knit$set(base.url = '{{ .Site.baseurl }}/')
opts_chunk$set(fig.path = 'static/notes/')

knitr::opts_knit$set(
  base.dir = normalizePath("static/", mustWork = TRUE),
  base.url = "/"
)

# knitr::opts_chunk$set(
#   cache.path = normalizePath("cache/", mustWork = TRUE),
#   collapse = TRUE,
#   comment  = "#>"
# )

drop_extension <- function(fname) sub('^(.+)\\..*', '\\1', fname)

input_files <- Sys.glob('content/notes/*.R*')
if (length(arguments[["<file>"]])) {
  input_files <- arguments[["<file>"]]
}

for (iname in input_files) {
  if (!file.exists(iname)) {
    message(iname, " not found")
    next
  }
	oname <- file.path(
		'content/notes', paste(sep = '', basename(drop_extension(iname)), '.md')
	)
  if (!file.exists(oname) || file_test("-nt", iname, oname)) {
    if (arguments$list) {
      message(iname, " -> ", oname)
    } else {
      message("Running ", iname, " -> ", oname)
      #if (grepl("\\.R$", iname)) {
      #    message('Spinning and knitting ', iname)
      #    spin(hair = iname, knit = FALSE, format = "Rmd")
      #    rmd_file <- sprintf("%smd", iname)
      #    knit(input = rmd_file, output = oname, quiet = TRUE)
      #    #unlink(rmd_file)
      #} else {
      #    message('Knitting ', iname)
      #    knit(input = iname, output = oname, quiet = TRUE)
      #}
    }
  } else {
    message(oname, " is newer than ", iname)
  }
}

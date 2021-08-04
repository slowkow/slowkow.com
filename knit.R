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
library(glue)

# render_jekyll(highlight = "pygments")
opts_knit$set(out.format = 'markdown') 
# opts_knit$set(base.url = '{{ .Site.baseurl }}/')
# opts_chunk$set(fig.path = 'static/notes/')

knitr::opts_knit$set(
  base.dir = normalizePath("static/", mustWork = TRUE),
  base.url = "/"
)

# knitr::opts_chunk$set(
#   cache.path = normalizePath("cache/", mustWork = TRUE),
#   collapse = TRUE,
#   comment  = "#>"
# )

# This works, but it is intended for knitting HTML, not Markdown.
e <- new.env({
  library(knitr)
  knitr::opts_chunk$set(
    class.output  = "bg-success",
    class.message = "bg-info text-info",
    class.warning = "bg-warning text-warning",
    class.error   = "bg-danger text-danger"
  )
})

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
  slug <- basename(drop_extension(iname))
	out_md <- glue('{dirname(iname)}/{slug}.md')
# opts_chunk$set(fig.path = 'static/notes/')
  opts_chunk$set(
    fig.path = glue('notes/{slug}_files/figure-html/')
  )
  if (!file.exists(out_md) || file_test("-nt", iname, out_md)) {
    if (arguments$list) {
      message(iname, " -> ", out_md)
    } else {
      if (grepl("\\.R$", iname)) {
          message('Spinning and knitting ', iname)
          spin(hair = iname, knit = FALSE, format = "Rmd")
          rmd_file <- sprintf("%smd", iname)
          knit(input = rmd_file, output = out_md, quiet = TRUE, envir = e)
          #unlink(rmd_file)
      } else if (grepl("\\.Rmd$", iname)) {
          # Make Markdown from the R Markdown
          message('Knitting ', iname, ' to ', out_md)
          knit(input = iname, output = out_md, quiet = TRUE, envir = e)
          # Make an R script from the R Markdown
          # https://bookdown.org/yihui/rmarkdown-cookbook/purl.html
          out_r <- glue('{dirname(iname)}/{slug}.R')
          message('Knitting ', iname, ' to ', out_r)
          purl(input = iname, output = out_r, quiet = TRUE, envir = e, documentation = 2)
      }
    }
  } else {
    message(out_md, " is newer than ", iname)
  }
}

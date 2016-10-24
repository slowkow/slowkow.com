#!/usr/bin/env Rscript --vanilla

library(knitr)

render_jekyll(highlight = "pygments")
opts_knit$set(out.format = 'markdown') 
opts_knit$set(base.url = '{{ site.baseurl }}/')
opts_chunk$set(fig.path = 'public/figures/')

drop_extension <- function(fname) sub('^(.+)\\..*', '\\1', fname)

for (fname in Sys.glob('_rmd/*.Rmd')) {
	oname <- file.path(
		'_posts', paste(sep = '', basename(drop_extension(fname)), '.md')
	)
	knit(input = fname, output = oname, quiet = TRUE)
}

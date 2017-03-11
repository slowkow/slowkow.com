---
layout: post
title: Create a quantile-quantile plot with ggplot2
tags: R
categories: notes
---

After performing many tests for statistical significance, the next step is to
check if any results are more significant than we would expect by random
chance. One way to do this is by comparing the distribution of p-values from
our tests to the uniform distribution with a quantile-quantile (QQ) plot.
Here's a function to create such a plot with [ggplot2].

[ggplot2]: http://docs.ggplot2.org/

<!-- more -->

# Example

![Quantile-quantile plot with ggplot2]({{ site.url }}/public/images/ggplot2-qqplot.png)

# Source code

{% gist 9041570 gg_qqplot.R %}

# Lambda

In genome-wide association studies, we often see a lambda statistic \\(
\lambda \\) reported with the QQ plot. In general, the lambda statistic should
be close to 1 if the points fall within the expected range, or greater than
one if the observed p-values are more significant than expected.

Here's how you can compute it:

```r
set.seed(1234)
pvalue <- runif(1000, min=0, max=1)
chisq <- qchisq(1 - pvalue, 1)
lambda <- median(chisq) / qchisq(0.5, 1)
lambda 
```

```
[1] 0.9532617
```

You can find more details here:

- [stats.stackexchange][1]

- [Population stratification][2]

[1]: https://stats.stackexchange.com/questions/110755/how-calculate-inflation-observed-and-expected-p-values-from-uniform-distribution 
[2]: https://en.wikipedia.org/wiki/Population_stratification

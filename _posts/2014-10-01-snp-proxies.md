---
layout: post
title: SNP Proxies
tags: [Javascript, Data]
categories: notes
---

I made a simple web service to list proxies for SNPs in the [1000 Genomes
Project][tgp]. Check out an example of the [JSON output][example]. I used it
to make an [application][app] powered by [Highcharts] for viewing the
r<sup>2</sup> [linkage disequilibrium] plot of any SNP in any population.

[tgp]: http://www.1000genomes.org
[example]: http://broadinstitute.org/~slowikow/snp_proxies.php?q=rs42&pop=ASN&r2=0.8&dp=0
[Highcharts]: http://www.highcharts.com
[linkage disequilibrium]: https://en.wikipedia.org/wiki/Linkage_disequilibrium

# Application

<a href="{{ site.url }}/public/images/snp_proxies_rs42.png">
<img src="{{ site.url }}/public/images/snp_proxies_rs42-thumb.png" alt="SNP proxies for rs42 in EUR" />
</a>

[View SNPs in linkage disequilibrium (LD) with any given SNP, calculated using
individuals from a specific population.][app]

[app]: https://www.broadinstitute.org/~slowikow/snp_proxies

# Details

For each SNP, I precomputed the r<sup>2</sup> and D' values for all
neighboring SNPs within a 1 Mb window. I did this for each population (AFR,
AMR, ASN, EUR). Next, I wrote a PHP script to retrieve those precomputed
values from my files.

You can download the data files here:

<http://broadinstitute.org/~slowikow/tgp/pairwise_ld/>

Contact me if you'd like the code for computing these values.

# Example

<http://www.broadinstitute.org/~slowikow/snp_proxies.php?q=rs42&r2=0.95&pop=ASN>

# Parameters

    Name    Example     Description
    categories: notes
----    -------     -----------
    q       q=rs42      rs identifier of a SNP.
    pop     pop=EUR     1000 Genomes population used to compute r2 and D'.
    r2      r2=0.5      Pearson correlation coefficient.
    dp      dp=0.5      D' value.

# Output

```json
{
    "status": "found proxies",
    "snp": {
        "name": "rs42",
        "chrom": "chr7",
        "pos": 11586351
    },
    "r2": 0.95,
    "dp": 0,
    "pop": "ASN",
    "proxies": [
        {
            "name": "rs55",
            "chrom": "chr7",
            "pos": 11585628,
            "r2": 1,
            "dp": 1
        },
        {
            "name": "rs54",
            "chrom": "chr7",
            "pos": 11586050,
            "r2": 0.991171,
            "dp": 1
        },
        {
            "name": "rs44",
            "chrom": "chr7",
            "pos": 11586190,
            "r2": 0.991171,
            "dp": 1
        },
        {
            "name": "rs43",
            "chrom": "chr7",
            "pos": 11586267,
            "r2": 0.991171,
            "dp": 1
        }
    ]
}
```


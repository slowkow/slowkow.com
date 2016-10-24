---
layout: post
title: Run Picard tools and collate multiple metrics files
tags: [Bash, Projects]
categories: notes
---

[Picard] is a set of Java command line tools for manipulating high-throughput
sequencing ([HTS]) data files such as [BAM] and [VCF]. I needed to check the
quality of thousands of BAM files, so I created a Bash script called
[picardmetrics]. It runs 10 of the Picard tools on a BAM file and easily
collates all of the generated metrics files into a single table. I also
include utility scripts for generating the reference files required for
Picard.

[Picard]: http://broadinstitute.github.io/picard/
[HTS]: https://github.com/samtools/hts-specs
[BAM]: http://samtools.github.io/hts-specs/SAMv1.pdf
[VCF]: http://samtools.github.io/hts-specs/VCFv4.2.pdf
[picardmetrics]: https://github.com/slowkow/picardmetrics


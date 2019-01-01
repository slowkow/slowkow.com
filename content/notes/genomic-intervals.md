---
date: 2013-08-07
layout: post
title: 0-based and 1-based genomic intervals, overlap, and distance
tags:
  - Python
categories: notes
thumb: "/images/noun_length_470641_000000.svg"
twitter:
  card: "summary"
---

Here, I describe two kinds of genomic intervals and include source code for
testing overlap and calculating distance between intervals.

<!--more-->

You will find files specifying genomic coordinates in two formats:

    0-based : 0 1 2 3 4   (UCSC, BED, bedGraph, narrowPeak)
    1-based :  1 2 3 4    (NCBI, Ensembl, GFF, GTF, VCF, SAM, BAM, wiggle)
    sequence:  A T G C

0-based starts with 0 and numbers the *spaces* in between nucleotides.

1-based starts with 1 and numbers the *nucleotides*.

The subsequence `TG` of the full string `ATGC` is:

    0-based : [1, 3)
    1-based : [2, 3]

The 0-based style does not include the last position: `)`

The 1-based style includes the last position: `]`

This results in different length calculations for subsequence `TG`:

    0-based : 3 - 1     = 2
    1-based : 3 - 2 + 1 = 2

Read further here: <https://genome.ucsc.edu/FAQ/FAQformat.html>


# Example

```python
>>> a, b = (1, 3), (3, 7)

>>> print_intervals0(a, b)
01234567890
 ==
   ====

>>> print_intervals1(a, b)
1234567890
===
  =====

>>> overlap0(a, b)
False

>>> overlap1(a, b)
True

>>> distance0(a, b)
0

>>> distance1(a, b)
-1
```

```python
# 0-based intervals

def overlap0(a, b):
    """Check if two 0-based intervals overlap."""
    # a.start < b.end and a.end > b.start
    return a[0] < b[1] and a[1] > b[0]


def distance0(a, b):
    """Get the number of bases between two 1-based intervals, 0 if the
    intervals are book-ended against each other, or, if negative, the number
    of bases in the overlap.
    """
    return max(a[0] - b[1], b[0] - a[1])


def print_intervals0(*intervals):
    start  = min([i[0] for i in intervals])
    stop   = max([i[1] for i in intervals])
    length = stop - start
    print '0' + '1234567890' * ((length + 10) / 10)
    for i in intervals:
        spaces = ' ' * i[0]
        marks  = '=' * (i[1] - i[0])
        print spaces + marks


# 1-based intervals

def overlap1(a, b):
    """Check if two 1-based intervals overlap."""
    # a.start <= b.end and a.end >= b.start
    return a[0] <= b[1] and a[1] >= b[0]


def distance1(a, b):
    """Get the number of bases between two 1-based intervals, 0 if the
    intervals are book-ended against each other, or, if negative, the number
    of bases in the overlap.
    """
    return max(a[0] - b[1], b[0] - a[1]) - 1


def print_intervals1(*intervals):
    start  = min([i[0] for i in intervals])
    stop   = max([i[1] for i in intervals])
    length = stop - start + 1
    print '1234567890' * ((length + 10) / 10)
    for i in intervals:
        spaces = ' ' * (i[0] - 1)
        marks  = '=' * (i[1] - i[0] + 1)
        print spaces + marks
```

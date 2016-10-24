---
layout: post
title: Benchmark the binomial probability mass function in Python
tags: Python
categories: notes
---

It turns out that [sympy] and [scipy] have the slowest implementations of the
binomial mass function. A pure Python version is just 30 times slower than
C in my benchmark. Feel free to copy the code from [the IPython notebook][1]
and test it for yourself.

[sympy]: http://www.sympy.org/
[scipy]: http://www.scipy.org/
[1]: https://gist.github.com/slowkow/11504548

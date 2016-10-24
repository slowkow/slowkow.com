---
layout: post
title: Install MISO and all of its dependencies
tags: [Python, Tutorials]
categories: notes
---

[MISO][1] is a Python package for splicing analysis of RNA-seq data.
Unfortunately, installation is difficult, so I've documented my steps below.

<!-- more -->

Install Python
==============================================================================

To make Python version management and package management easier, I highly
recommend that you use [conda].

Here are the steps:

1. Install Miniconda.
2. Use `conda` to create a new Python 2 environment and install some of the
   MISO dependencies.
3. Install the remaining dependencies with `pip` inside the new environment.


Install Berkeley DB
==============================================================================

We have to install two components:

1. Berkeley DB
2. A Python package called `bsddb3` that uses Berkeley DB.

Download Berkeley DB:

```bash
wget http://download.oracle.com/berkeley-db/db-6.2.23.tar.gz
tar xf db-6.2.23.tar.gz
cd db-6.2.23/build_unix
../dist/configure --prefix=/PHShome/ks38/.local --enable-compat185 --enable-dbm --enable-cxx
make -j4
make install
```

```bash
wget https://pypi.python.org/packages/73/73/58954679be79a1c6031a421c81f3c8e283cd700455ad3af1de7da8fabd67/bsddb3-6.2.1.tar.gz#md5=16c7eca6b0494de063dc86fa3cf5ecbf
tar xf bsddb3-6.2.1.tar.gz
cd bsddb3-6.2.1/
python setup.py install --berkeley-db-lib=$HOME/.local
```


Fix dbhash
==============================================================================

Try executing this line:

```bash
python -c 'import dbhash'
```

If your setup is like mine, then you'll see this error:

```
Traceback (most recent call last):
  File "<string>", line 1, in <module>
  File "/data/srlab/slowikow/src/miniconda2/envs/misoenv/lib/python2.7/dbhash.py", line 7, in <module>
    import bsddb
  File "/data/srlab/slowikow/src/miniconda2/envs/misoenv/lib/python2.7/bsddb/__init__.py", line 67, in <module>
    import _bsddb
ImportError: No module named _bsddb
```

The solution is to edit the mentioned file:

```bash
vim /data/srlab/slowikow/src/miniconda2/envs/misoenv/lib/python2.7/dbhash.py
```

And replace:

```python
import bsddb
```

with:

```python
import bsddb3 as bsddb
```

Now when you run this command again, you should see no output:

```bash
python -c 'import dbhash'
```

Install bedtools-2.23.0
==============================================================================

MISO will not work with any newer version of `bedtools`, because the output
format changed after this version. MISO doesn't know how to read the new
output.


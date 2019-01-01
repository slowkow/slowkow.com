---
title: "How to ssh to a remote server without typing your password"
layout: post
date: 2014-02-04
categories: notes
tags:
  - Tutorials
thumb: "/images/noun_Key_180437_000000.svg"
twitter:
  card: "summary"
---

Here are a few tips to use `ssh` more effectively. Login to your server using
public key encryption instead of typing a password. Use the `~/.ssh/config`
file to create short and memorable aliases for your servers. Also, use aliases
to connect through a login server into a work server.

<!--more-->

# 1. Generate and install a key pair

On your laptop, generate a new key pair:

```bash
#!/usr/bin/env bash

# Create this folder if it does not exist, and set the correct permissions.
mkdir -p ~/.ssh && chmod 700 ~/.ssh

# Generate an RSA key pair for identification with the remote server.
# You may accept all the default settings by pressing Enter.
ssh-keygen -t rsa
```

By default, `ssh-keygen` will create two files:

- `~/.ssh/id_rsa` is the private key. Never share this with anyone.
- `~/.ssh/id_rsa.pub` is the public key. This can be shared with everyone.

Now we can install the **public key** on the remote server:

```bash
# Your remote username, an @ sign, and the hostname of your remote server.
host='username@myserver.com'

# Set correct permissions on the remote server, or else ssh will not work.
ssh $host 'chmod g-w,o-w ~; mkdir -p ~/.ssh; chmod 700 ~/.ssh'

# Copy your public key to the remote server
cat ~/.ssh/id_rsa.pub | ssh $host 'cat >> ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys'
```

At this point, you should be able to connect to your server without typing
a password: 

```bash
ssh username@myserver.com
```

# 2. Use an alias for your server's address

You might prefer to type something memorable like `jupiter` (7 characters)
rather than `username@myserver.com` (21 characters). To create an alias for
your server, make a config file `~/.ssh/config` on your laptop as shown below.

You'll be able to use the `jupiter` alias with `rsync`, `scp`, and `ssh`.

```
# ~/.ssh/config

Host jupiter
   User carl
   HostName myserver.com
```

At this point, you should be able to connect to your server like this: 

```bash
ssh jupiter
```

# 3. Automatically connect to a work server through a login server

If you want a single command to do two steps:

1. Connect to a login server `jupiter`.
2. Once connected to `jupiter`, connect to a work server `saturn`.

Then configure your `~/.ssh/config` file as follows:

```
# ~/.ssh/config

Host jupiter
   User carl
   Hostname myserver.com

Host saturn
   User carl
   ProxyCommand ssh -qX jupiter nc %h %p
```

At this point, you should be able to connect to `saturn` via `jupiter` like
this:

```bash
ssh saturn
```

# Further reading

How to write your own config file:

<http://www.cyberciti.biz/faq/create-ssh-config-file-on-linux-unix/>

All available configuration options:

<http://linux.die.net/man/5/ssh_config>

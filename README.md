## log-scanner
My attempt at providing a simple API for viewing files from /var/log in reverse order.  This project doesn't
do anything other than provide REST access to the specified files.  Each file is handled in a separate worker
process, and the contents of the file are read into memory (lazily) so that they can be served more quickly
on subsequent requests.  The worker does a rudimentary check to see if the file has been modified since the
last time it was loaded.  The REST API is provided by the Express framework.

# Credits
I found a nice idea for an Express-based load balancer by [@braktim99] 
(https://www.geeksforgeeks.org/how-to-create-load-balancing-servers-using-node-js/)
I modified this idea to `fork()` each worker rather than running each worker in the same node process

# Configure
As this project is a bit of proof-of-concept, it doesn't support any command line or configuration file.
As such, you need to modify the available log files within the main load balancer script (lb.js).  Add as 
many workers as you like by specifying the file path (key), the HTTP port the worker will use, and the encoding
of the log file.

# Usage
npm install
npm run serve

# Accessing API
You could use either Postman or cURL to access the API.
The URI of the log file is the same as the file path.  For example, if a worker was configured to access
/var/log/syslog, and the load balancer was configured to use port 8080, then to access the log file using
cURL you could do the following:
```
curl "http://IP_ADDRESS:PORT/var/log/syslog"
```

# Limiting the Number of Lines returned
To limit the output of the request, add the query string parameter `limit` and set provide an integer
value.  For example, to return the last 10 lines of /var/log/syslog file:
```
curl "http://IP_ADDRESS:PORT/var/log/syslog?limit=10"
```

# Basic Keyword Search
To do a basic keyword search, add the query string parameter `keyword` and provide the search keyword.  For
example, to return the last 5 lines of /var/log/syslog file containing the word foo:
```
curl "http://IP_ADDRESS:PORT/var/log/syslog?limit=5&keyword=foo"
```
Multiple keywords are supported.  For example, the following request will search for any lines containing foo
or bar in the log file:
```
curl "http://IP_ADDRESS:PORT/var/log/syslog?keyword=foo&keyword=bar"
```

# Issues
This project admittedly does not do a great deal of error checking or validating.  It could use some
command line parsing or read environment or configuration files.  It could take as input a directory, scan the
directory for files, and automatically configure workers and the corresponding routes in the load balancer / worker
framework.  As it stands, each file requires a separate worker; in reality, one worker could handle multiple files,
thereby reducing the number of child processes that the load balancer forks.

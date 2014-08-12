```
___  ___             __   __                 _____     _               
|  \/  |             \ \ / /                |_   _|   | |              
| .  . | __ _ _ __    \ V /___  _   _ _ __    | |_   _| |__   ___  ___ 
| |\/| |/ _` | '_ \    \ // _ \| | | | '__|   | | | | | '_ \ / _ \/ __|
| |  | | (_| | |_) |   | | (_) | |_| | |      | | |_| | |_) |  __/\__ \
\_|  |_/\__,_| .__/    \_/\___/ \__,_|_|      \_/\__,_|_.__/ \___||___/
             | |                                                       
             |_|                                                       
```

This is a simple command-line tool to make it easy for a small
group of people to collaboratively build a map of the internet.

To use it, you'll first need to set up [map-your-tubes-server][].

Then invent an alphanumeric username for yourself, like `bob`.

Assuming your server is at http://example.com/, run:

```
npm install -g map-your-tubes
map-your-tubes http://example.com/user/bob
```

Currently, the CLI essentially just connects to the server through
a WebSocket and proxies `traceroute` for it (`tracert` on Windows). It
automatically attempts to reconnect to the server when the connection
goes down.

  [map-your-tubes-server]: https://github.com/toolness/map-your-tubes-server

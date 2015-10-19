(function() {
  var HashRouter = {
    routes: [],
    route: function(pattern, callback) {
      var pattern = pattern.split("/");
      var routeObj = {};
      routeObj.route = pattern;
      if (callback) {
        routeObj.callback = callback; 
      }
      this.routes.push(routeObj);
    },
    last: {},
    current: {},
    view: function(location) {
      if ( location && location != "" ) {
        window.location.hash = "/" + location;
      }
      var path = this.getPath();
      var query = this.getParams();
      var route = this.findRoute(path);
      var rewrite = [];
      if (route) {
        for(i=0; i<path.length; ++i) {
          rewrite[i] = path[i];
        }
        var keyval = route.route.map(function(key, index) {
          var obj = {};
          if (key.indexOf(":") > -1) { 
            key = key.substr(1);
            obj[key] = rewrite[index];
            return obj;
          } else {
            return key;
          }
        });
        this.current = { route: rewrite, keyval: keyval, query: query, callback: route.callback };
        if ( JSON.stringify(this.last) != JSON.stringify(this.current) ) {
          this.last = this.current;
          // Find the variable args in the route and pass to the callback.
          if (this.current.callback) {
            var args = [];
            for (i=0; i<route.route.length; ++i) {
              if (route.route[i].indexOf(":") > -1) {
                args.push(this.current.route[i]); 
              }
            }
            args.push(this.current.query);
            this.current.callback.apply(this, args);
          }
          var viewUpdate = new CustomEvent("hashrouter:update", {detail: this.current});
          window.dispatchEvent(viewUpdate);
        } else {
          var viewUpdate = new CustomEvent("hashrouter:update", {detail: this.current});
          window.dispatchEvent(viewUpdate);
        }
      }
    },
    findRoute: function(incoming) {
      // Identify relevant routes based on array length
      var count = incoming.length;
      var format = [];
      var possibles = [];
      var i, n;
      for (i=0; i<this.routes.length; ++i) {
        if (this.routes[i].route.length == count) {
          format.push(this.routes[i].route);
          possibles.push(this.routes[i]);
        }
      }
      // Identify fixed values
      var fixeds = [];
      for (i=0; i<format.length; ++i) {
        var route = format[i];
        fixeds[i] = [];
        for (n=0; n<route.length; ++n) {
          if (route[n].indexOf(":") == -1) {
            fixeds[i][n] = route[n];
          }
        }
      }
      // Boil down to fixed value positions
      var possible = [];
      for (i=0; i<fixeds.length; ++i) {
        possible[i] = [];
        for(n=0; n<fixeds[i].length; ++n) {
          var value = fixeds[i][n];
          if (value) {
            possible[i][n] = incoming[n];
          }
        }
      }
      // Crush arrays into strings and compare
      var pos, comp = "";
      var correct;
      for (i=0; i<possible.length; ++i) {
        pos = possible[i].join();
        comp = fixeds[i].join();
        if (pos == comp) {
          correct = possibles[i];
        }
      }
      // Response to URL change
      if (correct) {
        return correct;
      } else {
        console.log("No route found for " + incoming.join("/"));
      }
    },
    getParams: function() {
      if (window.location.hash && window.location.hash.indexOf("?") > -1) {
        var piece = window.location.hash.split("?");
        var querystring = piece[1];
        var pairs = querystring.split("&");
        var params = {};
        for (i=0; i<pairs.length; ++i) {
          var keyval = pairs[i].split("=");
          params[keyval[0]] = keyval[1];
        }
        return params;
      } else {
        return {};
      }
    },
    getPath: function() {
      var full = window.location.hash;
      var piece = full.split("?");
      var path = piece[0].substr(2).split("/");
      for (i=0; i<path.length; ++i) {
        if (!path[i] || path[i] == "") {
          path.splice(i, 1);
        }
      }
      return path;
    }
  };
  window.HashRouter = window.HashRouter || HashRouter;
})();

// Registering to listen on events:
window.addEventListener("load", function() {
  HashRouter.view();
});
window.addEventListener("hashchange", function() {
  HashRouter.view();
});

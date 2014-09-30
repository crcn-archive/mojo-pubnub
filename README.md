**This plugin is still very experimental.**

This plugin will automatically discover relationships between your model layer, and synchronize changes across different platforms via pubnub. No need to change your application structure - just add a few lines of code!


```javascript
var Application = require("mojo-application"),
models          = require("mojo-models");

var MyApplication = Application.extend({
  config: {
    pubnub: {
      key: "ABC-DEF-GHI"
    }
  },
  plugins: [  
    models,                    // model layer we're gonna make realtime
    require("mojo-event-bus"), // required for hooking mojo models with pubnub
    require("mojo-pubnub"),    // takes event bus changes, and publishes them to pubnub
    require("./models")
  ]
});


var app = new MyApplication();
app.initialize();
```

./models/index.js:

```javascript
module.exports = function (app) {
  app.models.register({
    todo: require("./todo"),
    todos: require("./todos")
  });
}
```

./models/todo.js:

```javascript
var models = require("models");
module.exports = models.Base.extend({
});
```

./models/todos.js:

```javascript
var models = require("models");
module.exports = models.Collection.extend({
  createModel: function (properties) {
    return this.application.models.create(properties);
  }
});
```

That's all there is to it! 

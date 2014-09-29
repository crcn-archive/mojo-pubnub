var Application = require("mojo-application");

window.$ = require("jquery");


var TodosApplication = Application.extend({
  config: {
    pubnub: {
      subscribe_key: "sub-c-9535ac96-4823-11e4-aaa5-02ee2ddab7fe",
      publish_key: "pub-c-55ed0f2b-6b2e-455a-977e-9530bb287d2f"
    }
  },
  plugins: [
    require("mojo-views"),
    require("mojo-paperclip"),
    require("mojo-models"),
    require("mojo-event-bus"),
    require("../../../lib"),
    require("./models"),
    require("./views")
  ]
});

var app = new TodosApplication();

$(document).ready(function () {

  console.log("PUB");
  app.eventBus.publish("/channel", "todos");

  document.body.appendChild(app.views.create("main", {
    todos: app.models.create("todos")
  }).render());
});
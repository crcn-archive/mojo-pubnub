var Application = require("mojo-application");

window.$ = require("jquery");


var TodosApplication = Application.extend({
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
  document.body.appendChild(app.views.create("main", {
    todos: app.models.create("todos")
  }).render());
});
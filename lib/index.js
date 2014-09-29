require("pubnub");
var uuid = require("uuid");

module.exports = function (app) {
  app.use(pubnub);
  app.use(modelDecor);
  app.use(collectionDecor);
}

function pubnub (app) {

  var pubnub = PUBNUB.init(app.get("config.pubnub")),
    channels   = [],
    appId      = uuid.v4();

  app.eventBus.subscribe({

    // model change
    "/(.*)/change": {
      execute: function (payload, context) {
        publish("changeModel", {
          _cid: payload.key === "_cid" ? payload.oldValue : context.get("_cid"),
          key: payload.key,
          newValue: payload.newValue,
          oldValue: payload.oldValue
        });
      }
    },

    // model dispose
    "/(.*)/dispose": {
      execute: function (payload, context) {
        publish("disposeModel", {
          _cid: context.get("_cid")
        });
      }
    },

    // collections
    "/(.*)/willUpdate": {
      execute: function (payload, context) {

        publish("updateCollection", {
          _cid: context.get("owner._id"),
          insert: (payload.insert || []).map(function (model) {
            return model.toJSON();
          }),
          remove: (payload.remove || []).map(function (model) {
            return model.toJSON()
          }),
          collectionName: context.__name
        });
      }
    },

    "/channel": {
      execute: function (channel) {

        channels.push(channel);

        pubnub.subscribe({
          channel: channel,
          message: onMessage
        });
      }
    }

  }).addContext(app);


  function onMessage (message) {
    if (message.clientId === appId) return;


    message.batch.forEach(function (data) {
      app.eventBus.publish("/remote/" + data.route, data.payload);
    });
  }

  var batch = [];


  var updating;

  function publish (route, payload) {
    if (app._ignorePubSub) return;

    batch.push({
      clientId: appId,
      route: route,
      payload: payload
    });

    if (updating) return;
    updating = true;
    timeout = setTimeout(publishLater, 100);

  }

  function publishLater () {
    updating = false;
    channels.forEach(function (channel) { 
      pubnub.publish({
        channel: channel,
        message: {
          clientId: appId,
          batch: batch
        }
      })
    });
    batch = [];
  }
}



function modelDecor (app) {

  var modelListeners = app.eventBus.subscribe({
    "/remote/changeModel": {
      test: { "payload._cid": "_cid" },
      execute: function (payload) {

        // dirty
        this._ignorePubSub = true;
        this.set(payload.key, payload.newValue);
        this._ignorePubSub = false;
      }
    },
    "/remote/disposeModel": {
      test: { "payload._cid": "_cid" },
      execute: function () {

        // dirty
        this._ignorePubSub = true;
        this.dispose();
        this._ignorePubSub = false;
      }
    }
  });

  app.models.decorator({
    inherit: true,
    getOptions: function (model) {
      if (model.__isBindableCollection) return void 0;
      return true;
    },
    decorate: function (model) {

      modelListeners.addContext(model);

      // _cid might be changed to the _id of the model
      model.bind("_cid", function (v, nv, ov) {
        allModels[ov] = void 0;
        allModels[nv] = model;
      });
    }
  });
}


function collectionDecor (app) {
  var collectionListeners = app.eventBus.subscribe({
    "/remote/updateCollection": {
      test: { "payload._cid": "owner._cid", "payload.collectionName": "__name" },
      execute: function (payload) {

        // dirty
        app._ignorePubSub = true;

        if (payload.insert) {
          for (var i = 0, n = payload.insert.length; i < n; i++) {
            this.create(payload.insert[i]);
          }
        }

        if (payload.remove) {
          for (var i = 0, n = payload.remove.length; i < n; i++) {
            var oldItem = payload.remove[i];
            for (var j = this.length; j--;) {
              var currentItem = this.at(j);
              if (currentItem._cid == oldItem._cid) {
                this.splice(j, 1);
                break;
              }
            }
          }
        }

        app._ignorePubSub = false;
      }
    }
  });

  app.models.decorator({
    inherit: true,
    getOptions: function (model) {
      return model.__isBindableCollection;
    },
    decorate: function (model) {
      collectionListeners.addContext(model);
    }
  });
}
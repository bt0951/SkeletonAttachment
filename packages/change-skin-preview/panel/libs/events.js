// "use strict";
// var Events = new Vue()
// module.exports = Events

// const DEBUG = !1;
const Events = require("events");
module.exports = new Events.EventEmitter;
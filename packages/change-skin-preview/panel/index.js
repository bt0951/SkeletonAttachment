"use strict"

const _name = "change-skin-preview"
const home = Editor.require(`packages://${_name}/panel/component/home`)
const events = require("./libs/events")

const components = {
  "skin-list": Editor.require(`packages://${_name}/panel/component/skin-list`),
  "part-list": Editor.require(`packages://${_name}/panel/component/part-list`),
  "tab-list": Editor.require(`packages://${_name}/panel/component/tab-list`),
  "animation-list": Editor.require(`packages://${_name}/panel/component/animation-list`),
  "debug": Editor.require(`packages://${_name}/panel/component/debug`),
}

var createVue = function (e, t) {
  return new Vue({
    el: e,
    watch: home.watch,
    data: home.data(),
    methods: home.methods,
    created: home.created,
    compiled: home.compiled,
    components
  })
}

Editor.Panel.extend({
  template: home.template,
  messages: {
    'selection:selected'(e, type, t) {
      if ("node" === type) {
        events.emit("change-node", { id: t[0] })
      }
    },
    'scene:ready'(e) {
      Editor.Scene.callSceneScript("change-skin-preview", "select-skeleton", null, () => { })
    },
  },
  ready() {
    this.vm = createVue(this.shadowRoot)
  },
  close(e) {
    const nodeId = Editor.Selection.curSelection('node')[0]
    Editor.Scene.callSceneScript("change-skin-preview", "reset-skin", { nodeId }, () => { })
    this.vm.save(e)
  }
});
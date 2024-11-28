"use strcit"

const fs = require("fire-fs")
const path = require("path")
const events = require("../libs/events")

const TabList = {
    换装: 0,
    动作: 1,
    调试: 2
}

module.exports = {

    name: "home",
    template: fs.readFileSync(path.join(__dirname, "../template/home.html"), "utf-8"),
    props: ["partList"],
    watch: {},
    ready() { },
    created() {
        events.on("change-node", e => {
            Vue.set(this, "node", e.id)
        })
        events.on("onSelectTab", index => {
            Vue.set(this, "tabIndex", index)
        })
    },
    compiled() {
        Editor.Scene.callSceneScript("change-skin-preview", "opeScene", null, () => { })
        Vue.set(this, "node", this.getSelectedNode())
    },
    data() {
        return {
            node: null,
            tabIndex: 0
        }
    },
    methods: {
        T: Editor.T,
        getSelectedNode() {
            return this.node || Editor.Selection.curSelection("node")[0]
        },
        getTabList() {
            return Object.keys(TabList)
        },
        onClickReset() {
            events.emit("reset")
            Editor.Scene.callSceneScript("change-skin-preview", "reset-skin", { nodeId: this.node }, () => { })
        }
    }

}
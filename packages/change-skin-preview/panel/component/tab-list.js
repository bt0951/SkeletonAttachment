"use strcit"

const fs = require("fs")
const path = require("path")
const events = require("../libs/events")

module.exports = {

    name: "tab-list",
    template: fs.readFileSync(path.join(__dirname, "../template/tab-list.html"), "utf-8"),
    props: ["list"],
    ready() { },
    created() { },
    compiled() { },
    data() {
        return {
            index: 0
        }
    },
    methods: {
        T: Editor.T,
        isSelected(index) {
            return this.index == index
        },
        onSelectTab(index) {
            Vue.set(this, "index", index)
            events.emit("onSelectTab", this.index, this.list[this.index])
        },
    }

}
"use strcit"

const fs = require("fs")
const path = require("path")

module.exports = {

    name: "debug",
    template: fs.readFileSync(path.join(__dirname, "../template/debug.html"), "utf-8"),
    props: ["list"],
    ready() { },
    created() { },
    compiled() {
        this.updateSlots()
    },
    data() {
        return {
            loading: true,
            slots: []
        }
    },
    methods: {
        T: Editor.T,
        updateSlots() {
            Editor.Scene.callSceneScript("change-skin-preview", "update-slots", null, (event, slots) => {
                this.loading = false
                if (slots) {
                    let list = []
                    for (const [slot, attachments] of slots) {
                        list.push({ slot, attachments })
                    }
                    // Object.keys(slots)
                    //     .forEach(key => {
                    //         const v = slots[key]
                    //         list.push({ key, v })
                    //     })
                    // let list = Object.keys(slots)
                    Vue.set(this, "slots", list)
                }
            })
        },
        getAttachments(slot) {
            return this.slots[slot]
        },
        activeSlot(slot, active) {
            Editor.Scene.callSceneScript("change-skin-preview", "active-slot", { slot, active }, (event, slots) => {

            })
        },
        convertColor(color) {
            const { r, g, b, a } = color
            return `rgba(${r * 255},${g * 255},${b * 255},${a})`
        },
        onSlotColorChange(slot, _color) {
            const [r, g, b, _a] = _color
            const color = { r, g, b, a: _a * 255 }
            Editor.Scene.callSceneScript("change-skin-preview", "change-slot-color", { slot, color }, (event, slots) => {

            })
        }
    }

}
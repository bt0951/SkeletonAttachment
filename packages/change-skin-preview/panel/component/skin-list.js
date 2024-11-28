"use strcit"

const fs = require("fs")
const path = require("path")
const events = require("../libs/events")
const utils = require("../libs/utils")

const loadPath = "db://assets/resources/spine/skin"
const skinMap = new Map()

async function loadSkins(part) {
    let results = await utils.promisify(Editor.assetdb.queryAssets)(`${loadPath}/${part}/*.png`, ["texture"])
    return results
}

module.exports = {

    name: "skin-list",
    template: fs.readFileSync(path.join(__dirname, "../template/skin-list.html"), "utf-8"),
    props: [],
    ready() { },
    created() {
        events.on("onSelectPart", part => {
            this.part = part
            this.onSelectPart(part)
        })
        events.on("reset", () => {
            Vue.set(this, "selectedSkin", null)
        })
    },
    compiled() { },
    data() {
        return {
            loading: true,
            skins: [],
            slots: [],
            part: null,
            selectedSkin: null
        }
    },
    methods: {
        T: Editor.T,
        getImgSrc(url) {
            return Editor.url(url)
        },
        updateSlots() {
            if (!this.slots.length) {
                Editor.Scene.callSceneScript("change-skin-preview", "update-slots", null, (event, slots) => {
                    this.loading = false
                    if (slots) {
                        let list = [{ name: "" }]
                        for (const [slot, attachments] of slots) {
                            list.push(slot)
                        }
                        Vue.set(this, "slots", list)
                    }
                })
            }
        },
        activeSlot(item, slot) {
            if (!!slot) {
                Vue.set(item, "slot", this.slots[Number(slot)].name)
            }
            else {
                Vue.set(item, "slot", undefined)
            }
        },
        async initSkins(part) {
            let list = skinMap.get(part)
            if (!list) {
                try {
                    let _skins = await loadSkins(this.part)
                    skinMap.set(part, _skins)
                    Vue.set(this, "skins", _skins)
                }
                catch (e) {
                    Vue.set(this, "skins", [])
                    console.error(e)
                }
                finally {
                    this.loading = false
                }
            }
            else {
                Vue.set(this, "skins", list)
                this.loading = false
            }
        },
        getSkins(part) {
            return skinMap.get(part) ?? []
        },
        getRes(url, slot) {
            const split = url.split("db://assets/resources/spine/skin/")
            const png = split[split.length - 1]
            const name = png.split(".")[0]
            return name + (slot ? `@${slot}` : "")
        },
        getResUrl(url) {
            const split = url.split(`${loadPath}/`)
            const res = split[1].split(".png")
            return res[0]
        },
        async onSelectPart(part) {
            this.part = part
            this.loading = true
            this.initSkins(this.part)
            this.updateSlots()
        },
        isSelected(item) {
            if (!item || !this.selectedSkin) {
                return false
            }
            const path = this.getRes(item.url, item.slot)
            const [part, res] = path.split("/")
            return this.selectedSkin[part] == res
        },
        onClickSkin(item) {
            const path = this.getRes(item.url, item.slot)
            const [part, res] = path.split("/")
            if (!this.selectedSkin) {
                Vue.set(this, "selectedSkin", { [part]: res })
            }
            else {
                Vue.set(this.selectedSkin, part, res)
            }
            const nodeId = this.$parent.getSelectedNode()
            Editor.Scene.callSceneScript("change-skin-preview", "change-skin", { res: path, part, nodeId }, () => { })
        }
    }

}
"use strcit"

const fs = require("fs")
const path = require("path")

let animsEnum = null

module.exports = {

    name: "animation-list",
    template: fs.readFileSync(path.join(__dirname, "../template/animation-list.html"), "utf-8"),
    props: [],
    ready() { },
    created() { },
    compiled() {
        this.updateAnimationList()
    },
    data() {
        return {
            loading: true,
            index: 0,
            animation: null,
            animations: [],
            timeScale: 1
        }
    },
    methods: {
        T: Editor.T,
        isSelected(index) {
            return this.index == index
        },
        updateAnimationList() {
            if (!animsEnum) {
                const nodeId = this.$parent.getSelectedNode()
                Editor.Scene.callSceneScript("change-skin-preview", "animation-list", { nodeId }, (event, anims) => {
                    this.loading = false
                    animsEnum = anims
                    Vue.set(this, "animations", Object.keys(anims))
                })
            }
            else {
                Vue.set(this, "animations", Object.keys(animsEnum))
                this.loading = false
            }
        },
        onSelectAnimation(index) {
            Vue.set(this, "index", index)
            const nodeId = this.$parent.getSelectedNode()
            let animationName = this.animations[this.index]
            if (!this.index) {
                animationName = null
            }
            Editor.Scene.callSceneScript("change-skin-preview", "play-animation", { nodeId, animationName, timeScale: this.timeScale }, (event, anims) => { })
        },
        onTimeScaleChange(value) {
            this.timeScale = value
            Editor.Scene.callSceneScript("change-skin-preview", "change-timescale", this.timeScale, (event) => { })
        }
    }

}
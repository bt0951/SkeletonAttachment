"use strcit"

const fs = require("fs")
const path = require("path")
const events = require("../libs/events")

const Part = {
    WEAPON: 0,//武器
    HAT: 1,//头部
    CLOTHES: 2,//身体
    HAND: 3,//手部
    SHOES: 4,//鞋
    ACCESSORY: 5,//饰品
    WAISTBAND: 6,//腰带
    CLOAK: 7,//披风
}

let parts = []

function getFoldersInDir(path) {
    const items = fs.readdirSync(path);
    const result = [];
    items.forEach(item => {
        const itemPath = `${path}/${item}`;
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
            result.push(item);
        }
    });
    return result;
}

module.exports = {

    name: "part-list",
    template: fs.readFileSync(path.join(__dirname, "../template/part-list.html"), "utf-8"),
    props: [],
    ready() { },
    created() { },
    compiled() {
        const dir = path.join(
            __dirname,
            `../../../../assets/resources/spine/skin`,
        )
        this.parts = parts = getFoldersInDir(dir)
        setTimeout(() => {
            this.onSelectPart(this.parts[0])
        }, 100);
    },
    data() {
        return {
            selected: null,
            parts
        }
    },
    methods: {
        T: Editor.T,
        isSelected(item) {
            return this.selected == item
        },
        onSelectPart(item) {
            Vue.set(this, "selected", item)
            events.emit("onSelectPart", this.selected)
        },
    }

}
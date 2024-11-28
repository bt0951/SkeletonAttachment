"use strict"

let skeletonCompont
let skeleton
let SpineSkin
let attachmentMap = new Map()

function updateSkeletonCompont(nodeId) {
    if (!skeletonCompont) {
        let node = cc.engine.getInstanceById(nodeId)
        skeletonCompont = node?.getComponent("sp.Skeleton")
        skeletonUpdate()

        const skeletonData = skeletonCompont.skeletonData.getRuntimeData()
        skeleton = new sp.spine.Skeleton(skeletonData)

        const comp = cc.require("SpineSkin")
        SpineSkin = new comp.SpineSkin(skeletonCompont)
    }
    if (skeletonCompont) {
        updateAttachments()
    }
}

function skeletonUpdate() {
    if (!skeletonCompont) {
        return
    }

    skeletonCompont.__proto__.update = function (dt) {
        if (CC_EDITOR) {
            cc.engine._animatingInEditMode = 1
            cc.engine.animatingInEditMode = 1
        }
        if (this.paused) {
            return
        }
        dt *= this.timeScale * sp.timeScale
        if (this.isAnimationCached()) {
            if (this._isAniComplete) {
                if (this._animationQueue.length === 0 && !this._headAniInfo) {
                    let frameCache = this._frameCache
                    if (frameCache && frameCache.isInvalid()) {
                        frameCache.updateToFrame();
                        let frames = frameCache.frames
                        this._curFrame = frames[frames.length - 1]
                    }
                    return
                }
                if (!this._headAniInfo) {
                    this._headAniInfo = this._animationQueue.shift()
                }
                this._accTime += dt
                if (this._accTime > this._headAniInfo.delay) {
                    let aniInfo = this._headAniInfo;
                    this._headAniInfo = null
                    this.setAnimation(0, aniInfo.animationName, aniInfo.loop)
                }
                return;
            }

            this._updateCache(dt)
        }
        else {
            this._updateRealtime(dt)
        }
    }
}

function updateAttachments() {
    attachmentMap?.clear()
    if (skeletonCompont) {
        skeleton.slots.forEach((slot, i) => {
            var attachments = []
            skeleton.data.skins.forEach(skin => {
                attachmentMap.set(slot, attachments)
                skin.getAttachmentsForSlot(i, attachments)
            })
        })
    }
}

function getAttachmentTable() {
    const attachmentTable = new Map()
    for (const [key, value] of attachmentMap) {
        attachmentTable.set(key.data, JSON.parse(stringify(value)))
    }
    return attachmentTable
}

function clear() {
    skeletonCompont = null
    skeleton = null
    SpineSkin = null
    attachmentMap?.clear()
}

function stringify(o) {
    var cache = []
    var str = JSON.stringify(o, function (key, value) {
        if (typeof value === "object" && value !== null) {
            if (cache.indexOf(value) !== -1) {
                return
            }
            cache.push(value)
        }
        return value
    });
    cache = null
    return str
}

let resList = {}

module.exports = {
    "change-skin"(event, data) {
        updateSkeletonCompont(data.nodeId)
        resList[data.part] = data.res
        let list = []
        for (const key in resList) {
            if (Object.hasOwnProperty.call(resList, key)) {
                const element = resList[key]
                list.push(element)
            }
        }
        if (skeletonCompont) {
            SpineSkin.changeSkins(list)
        }
        if (event.reply) {
            event.reply()
        }
        Editor.log("change-skin", JSON.stringify(data))
    },
    "reset-skin"(event, data) {
        resList = {}
        updateSkeletonCompont(data.nodeId)
        if (skeletonCompont) {
            skeletonCompont.setSkin(skeletonCompont.defaultSkin)
            skeletonCompont.setSlotsToSetupPose()
            skeletonCompont.animation = null
            skeletonCompont.timeScale = 1

            clear()
        }
        if (event.reply) {
            event.reply()
        }
    },
    "select-skeleton"(event) {
        Editor.Ipc.sendToPanel("scene", "scene:query-nodes-by-comp-name", "sp.Skeleton", (error, nodes) => {
            if (error) {
                Editor.error(error)
            }
            else if (nodes) {
                const node = nodes[0]
                if (node) {
                    Editor.Selection.select("node", node)
                    updateSkeletonCompont(node)
                }
            }
        })
    },
    opeScene(event) {
        const scene = cc.director?.getScene()?.name
        if (scene != "change-skin-preview") {
            Editor.assetdb.queryUuidByUrl("db://assets/scenes/change-skin-preview.fire", (error, uuid) => {
                if (uuid) {
                    Editor.Ipc.sendToAll("scene:open-by-uuid", uuid)
                }
            })
        }
        else {
            this["select-skeleton"]()
        }
    },
    "animation-list"(event, data) {
        updateSkeletonCompont(data.nodeId)
        if (skeletonCompont) {
            const animsEnum = skeletonCompont.skeletonData.getAnimsEnum();
            // const animations = skeletonCompont.skeletonData._skeletonJson.animations
            event?.reply?.(null, animsEnum)
        }
    },
    "play-animation"(event, data) {
        if (skeletonCompont) {
            if (data.animationName) {
                skeletonCompont.setAnimation(0, data.animationName, skeletonCompont.loop)
                skeletonCompont.animation = data.animationName
                SpineSkin?.setAnimation(data.animationName, data.timeScale || 1, skeletonCompont.loop)
            }
            else {
                skeletonCompont.animation = null
            }
            skeletonCompont.timeScale = data.timeScale || 1
            Editor.Utils.refreshSelectedInspector("node", skeletonCompont.node.uuid);
        }
    },
    "change-timescale"(event, timeScale) {
        if (timeScale != null) {
            if (skeletonCompont) {
                skeletonCompont.timeScale = timeScale
            }
        }
    },
    "update-slots"(event) {
        if (skeletonCompont) {
            const table = getAttachmentTable()
            event?.reply?.(null, table)
        }
    },
    "active-slot"(event, data) {
        if (skeletonCompont) {
            const slot = skeletonCompont.findSlot(data.slot.name)
            if (slot) {
                if (!data.active) {
                    slot.setAttachment(null)
                }
                else {
                    skeleton.slots.forEach((s, i) => {
                        var name_1 = s.data.attachmentName;
                        if (name_1 == data.slot.name) {
                            skeleton.data.skins.forEach(skin => {
                                var attachment = skin.getAttachment(i, name_1);
                                if (attachment != null) {
                                    slot.setAttachment(attachment);

                                }
                            })
                        }
                    })
                }
            }
            event?.reply?.()
        }
    },
    "change-slot-color"(event, data) {
        if (skeletonCompont) {
            const { r, g, b, a } = data.color
            const color = cc.color(r / 255, g / 255, b / 255, a / 255)
            // SpineSkin.changeColor(skeletonCompont, data.slot.name, color)
            event?.reply?.()
        }
    }

}
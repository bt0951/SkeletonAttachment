
function loadSkeletonData(_path: string, slotName: string) {
    const path = `spine/skin/${_path}`;
    return new Promise<{ data: sp.SkeletonData, slotName: string; }>((resolve, reject) => {
        cc.resources.load(path, sp.SkeletonData, (error, skeletonData) => {
            resolve({ data: skeletonData, slotName });
            if (error) {
                console.warn(error);
            }
        });
    });
}

function decRef(asset: cc.Asset) {
    asset?.decRef();
}

function addRef(asset: cc.Asset) {
    asset?.addRef();
}

export class SpineSkin {

    constructor(private skeleton: sp.Skeleton) { }

    private lastSkinHash: string = "";
    private skinCache = new Map<string, sp.spine.Skin>();
    private slotCache = new Map<string, { slot: sp.spine.Slot, skeletonAttachment: sp.spine.SkeletonAttachment }>();
    private mixTimeCache = new Map<string, number>();

    /**
     * 更改角色的皮肤。
     * 这个方法异步加载角色的皮肤资源，并在加载完成后应用新的皮肤。
     * 如果资源已经被缓存，它将从缓存中获取数据，避免重复加载。
     *
     * @param res - 一个字符串数组，每个字符串代表一个皮肤资源的路径和插槽名称，格式为："路径@插槽名称"
     * @example ["clothes/clothes1@equip_ribbon_3", "weapon/weapon_102310_female@d_weapon_dan"]
     */
    public async changeSkins(res: string[]) {
        const skeleton = this.skeleton;
        if (!skeleton || !res || !res.length) {
            return;
        }
        // res = [...res, "weapon/weapon_102310_female@d_weapon_dan"]
        const resList = res.map(e => {
            const [path, slotName] = e.split("@");
            return [path, slotName];
        });

        const hash = res.join("|");
        if (this.lastSkinHash == hash) {
            return;
        }

        this.lastSkinHash = hash;

        if (this.checkCache(hash)) {
            return;
        }

        //@ts-ignore
        const _skeleton = skeleton._skeleton as sp.spine.Skeleton;

        return Promise
            .all(resList.map(e => loadSkeletonData(e[0], e[1])))
            .then(list => {

                if (!this.setSkinFromCache(hash)) {
                    const skeletonData = skeleton.skeletonData.getRuntimeData() as sp.spine.SkeletonData;
                    const newSkin = new sp.spine.Skin(hash);
                    // newSkin.addSkin(skeletonData.findSkin("all"));

                    for (let index = 0; index < list.length; index++) {
                        const element = list[index];
                        if (!element) {
                            continue;
                        }
                        if (!element.slotName) {
                            const data = element.data.getRuntimeData() as sp.spine.SkeletonData;
                            newSkin.addSkin(data.skins[0]);
                        }
                    }

                    this.setSkin(newSkin);
                    this.skinCache.set(hash, newSkin);
                }

                if (sp.spine.SkeletonAttachment) {
                    for (let index = 0; index < list.length; index++) {
                        const element = list[index];
                        if (!element) {
                            continue;
                        }
                        if (element.slotName) {
                            const data = element.data.getRuntimeData() as sp.spine.SkeletonData;
                            const _res = hash.split("|")[index];
                            if (this.setAttachmentFromCache(_res)) {
                                continue;
                            }
                            if (!this.setSkeletonAttachment(_res, _skeleton, data, element.slotName)) {
                                continue;
                            }
                        }
                    }

                    if (skeleton.animation) {
                        this.setAnimation(skeleton.animation, skeleton.timeScale, skeleton.loop);
                    }

                    this._setMix();

                    this.updateSkeletonScale();
                }

            });
    }

    private setSkeletonAttachment(res: string, skeleton: sp.spine.Skeleton, skeletonData: sp.spine.SkeletonData, slotName: string) {
        let slot = skeleton.findSlot(slotName);
        if (!slot) {
            return false;
        }

        slot.setSkeletonAttachment(skeletonData);
        const skeletonAttachment = slot.getSkeletonAttachment();
        this.slotCache.set(res, { slot, skeletonAttachment });

        return true;
    }

    private setAttachmentFromCache(hash: string) {
        const cache = this.slotCache.get(hash);
        if (cache) {
            cache.slot.setAttachment(cache.skeletonAttachment);
            return true;
        }
    }

    private setSkinFromCache(hash: string) {
        const cache = this.skinCache.get(hash);
        if (cache) {
            this.setSkin(cache);
            return true;
        }
    }

    private checkCache(hash: string) {
        let cache = false;
        if (this.setSkinFromCache(hash)) {
            const split = hash.split("|");
            if (this._checkCache(split)) {
                cache = true;
            }
        }
        return cache;
    }

    private _checkCache(res: string[]) {
        return !res.some(e => {
            if (e.includes("@")) {
                return !this.setAttachmentFromCache(e);
            }
            else {
                return !this.setSkinFromCache(e);
            }
        });
    }

    private setSkin(skin: sp.spine.Skin) {
        const skeleton = this.skeleton;
        //@ts-ignore
        const _skeleton = skeleton._skeleton as sp.spine.Skeleton;
        _skeleton.setSkin(skin);
        _skeleton.setToSetupPose();
    }

    public setAnimation(anim: string, timeScale: number = 1, loop = false) {
        let tracks: sp.spine.TrackEntry[] = [];
        this.slotCache
            .forEach((v, k) => {
                if (v.skeletonAttachment.getSkeleton().data.findAnimation(anim)) {
                    const state = v.slot.getState();
                    const track = state.setAnimation(0, anim, loop);
                    if (track) {
                        const _track = this.skeleton.getCurrent(0);
                        if (_track) {
                            track.trackTime = _track.trackTime;
                        }
                        track.timeScale = timeScale;
                        tracks.push(track);
                    }
                }
                else {
                    if (CC_EDITOR) {
                        cc.warn(`${k}找不到动画：${anim}`)
                    }
                }
            });
        return tracks;
    }

    public playAnim(anim: string, time: number) {
        this.slotCache
            .forEach(v => {
                const state = v.slot.getState();
                const track = state.setAnimation(0, anim, false);
                if (track) {
                    const scale = track.animation.duration / time;
                    track.timeScale = scale;
                }
            });
    }

    public setAnimNormalizedTime(time: number) {
        this.slotCache.forEach((v, k) => {
            const track = v.slot.getState().getCurrent(0);
            if (track) {
                track.trackTime = time * track.animation.duration;
            }
            if (CC_EDITOR) {
                //@ts-ignore
                v.skeleton._updateRealtime(0);
            }
        });
    }

    public setMix(fromAnimation: string, toAnimation: string, duration: number) {
        this.mixTimeCache.set(`${fromAnimation}-${toAnimation}`, duration)
        this._setMix();
    }

    private _setMix() {
        this.slotCache
            .forEach(v => {
                this.mixTimeCache.forEach((e, k) => {
                    const [fromAnimation, toAnimation] = k.split("-");
                    v.slot.getState().data.setMix(fromAnimation, toAnimation, e);
                })
            });
    }

    public updateSkeletonScale() {
        const rootBone = this.skeleton.findBone("root") as sp.spine.Bone;
        if (!rootBone) {
            return;
        }
        this.slotCache
            .forEach(v => {
                const skeleton = v.skeletonAttachment.getSkeleton();
                if (skeleton) {
                    const _rootBone = skeleton.findBone("root");
                    if (_rootBone) {
                        _rootBone.scaleX = rootBone.scaleX;
                        _rootBone.scaleY = rootBone.scaleY;
                    }
                }
            });
    }

    public weaponGlow(color: cc.Color) {
        if (!this.skeleton?.isValid) {
            return;
        }
        //@ts-ignore
        const _skeleton = this.skeleton._skeleton as sp.spine.Skeleton;

        const updateColor = (attachment: sp.spine.Attachment, toColor: { r: number, g: number, b: number, a: number; }) => {
            if (!attachment) {
                return;
            }
            let _color: sp.spine.Color;
            if (sp.spine.SkeletonAttachment && attachment instanceof sp.spine.SkeletonAttachment) {
                const skeleton = attachment.getSkeleton();
                const slots = skeleton.slots;
                for (let i = 0; i < slots.length; i++) {
                    if (!slots[i].data?.attachmentName?.includes("weapon")) {
                        continue;
                    }
                    const attachment = slots[i].getAttachment();
                    if (!attachment) {
                        continue;
                    }
                    changeBlendMode(slots[i], 1);
                    updateColor(attachment, color.clone());
                    this.skeleton.scheduleOnce(() => {
                        changeBlendMode(slots[i], 0);
                        updateColor(attachment, { r: 255, g: 255, b: 255, a: 255 });
                    }, 1);
                }
                return
            }
            else {
                //@ts-ignore
                _color = attachment?.color as sp.spine.Color;
                _color.r = toColor.r / 255;
                _color.g = toColor.g / 255;
                _color.b = toColor.b / 255;
                _color.a = toColor.a / 255;
            }
        };
        const changeBlendMode = (slot: sp.spine.Slot, mode: sp.spine.BlendMode) => {
            if (slot?.data) {
                slot.data.blendMode = mode;
            }
        };
        const slots = _skeleton.slots;
        for (let i = 0; i < slots.length; i++) {
            if (!slots[i].data?.attachmentName?.includes("weapon")) {
                continue;
            }
            const attachment = slots[i].getAttachment();
            if (!attachment) {
                continue;
            }
            changeBlendMode(slots[i], 1);
            updateColor(attachment, color.clone());
            this.skeleton.scheduleOnce(() => {
                changeBlendMode(slots[i], 0);
                updateColor(attachment, { r: 255, g: 255, b: 255, a: 255 });
            }, 1);
        }
    }

    public static reset(skeleton: sp.Skeleton) {
        skeleton.setSkin(skeleton.defaultSkin);
        skeleton.setToSetupPose();
    }

}
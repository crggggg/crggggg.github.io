(function (global) {
    const KEYCODES = {
        a: 65,
        d: 68,
        e: 69,
        r: 82,
        s: 83,
        w: 87,
        x: 88,
        z: 90,
        arrowLeft: 37,
        arrowUp: 38,
        arrowRight: 39,
        arrowDown: 40,
        equal: 187,
    };

    function normalizeTargetPath(targetPath) {
        if (!targetPath || typeof targetPath !== 'string') return '';
        const withoutHash = targetPath.split('#')[0];
        const withoutQuery = withoutHash.split('?')[0];
        return withoutQuery.split('/').pop().toLowerCase();
    }

    function makeKey(key, keyCode) {
        return { key, keyCode };
    }

    function makeDpad(id, title, position, size, directions) {
        return {
            type: 'dpad',
            id,
            title,
            position,
            size,
            directions,
        };
    }

    function makeButton(id, title, position, size, keys) {
        return {
            type: 'button',
            id,
            title,
            label: title,
            position,
            size,
            keys,
        };
    }

    function makeWasdDpad(id, title, position, size) {
        return makeDpad(id, title, position, size, {
            up: [makeKey('w', KEYCODES.w)],
            down: [makeKey('s', KEYCODES.s)],
            left: [makeKey('a', KEYCODES.a)],
            right: [makeKey('d', KEYCODES.d)],
        });
    }

    function makeArrowDpad(id, title, position, size) {
        return makeDpad(id, title, position, size, {
            up: [makeKey('ArrowUp', KEYCODES.arrowUp)],
            down: [makeKey('ArrowDown', KEYCODES.arrowDown)],
            left: [makeKey('ArrowLeft', KEYCODES.arrowLeft)],
            right: [makeKey('ArrowRight', KEYCODES.arrowRight)],
        });
    }

    function makeHorizontalArrowDpad(id, title, position, size) {
        return makeDpad(id, title, position, size, {
            left: [makeKey('ArrowLeft', KEYCODES.arrowLeft)],
            right: [makeKey('ArrowRight', KEYCODES.arrowRight)],
        });
    }

    const PRESETS = {
        weatherDuckRpgChapterWasd: {
            targetMatch: (file) => file === 'weather-duck-rpg.html' || file.startsWith('rpg-1-'),
            controls: [
                makeWasdDpad('dpad-move', 'Move', { bottom: 8, left: 6 }, 18),
            ],
        },
        weatherDuckRpgChapterArrows: {
            targetMatch: (file) => file.startsWith('rpg-2-') || file.startsWith('rpg-3-'),
            controls: [
                makeArrowDpad('dpad-move', 'Move', { bottom: 8, left: 6 }, 18),
            ],
        },
        weatherDuckRoguelike: {
            targetMatch: (file) => file === 'weather-duck-roguelike.html',
            controls: [
                makeWasdDpad('dpad-left', 'Move (WASD)', { bottom: 8, left: 6 }, 18),
                makeArrowDpad('dpad-right', 'Move (Arrows)', { bottom: 8, right: 6 }, 18),
            ],
        },
        weatherDuckPlatformer: {
            targetMatch: (file) => file === 'weather-duck-platformer.html',
            controls: [
                makeHorizontalArrowDpad('dpad-move', 'Move', { bottom: 8, right: 6 }, 18),
                makeButton('btn-jump', '↑', { bottom: 8, left: 6 }, 12, [makeKey('ArrowUp', KEYCODES.arrowUp)]),
                makeButton('btn-r', 'r', { top: 6, left: 6 }, 10, [makeKey('r', KEYCODES.r)]),
                makeButton('btn-equals', '=', { top: 6, right: 6 }, 10, [makeKey('=', KEYCODES.equal)]),
            ],
        },
        waterrune: {
            targetMatch: (file) => file === 'waterrune.html',
            controls: [
                makeArrowDpad('dpad-move', 'Move', { bottom: 8, right: 6 }, 18),
                makeButton('btn-z', 'Z', { bottom: 8, left: 6 }, 12, [makeKey('z', KEYCODES.z), makeKey('e', KEYCODES.e)]),
                makeButton('btn-x', 'X', { top: 45, left: 6 }, 12, [makeKey('x', KEYCODES.x)]),
            ],
        },
    };

    function getMobileControlsForTarget(targetPath) {
        const file = normalizeTargetPath(targetPath);
        const presets = Object.values(PRESETS);

        for (const preset of presets) {
            if (preset.targetMatch(file)) {
                return {
                    targetPath,
                    controls: preset.controls,
                };
            }
        }

        if (file.includes('weather-duck') || file.startsWith('rpg-')) {
            const isArrowChapter = file.startsWith('rpg-2-') || file.startsWith('rpg-3-');
            return {
                targetPath,
                controls: [
                    (isArrowChapter
                        ? makeArrowDpad('dpad-move', 'Move', { bottom: 8, left: 6 }, 18)
                        : makeWasdDpad('dpad-move', 'Move', { bottom: 8, left: 6 }, 18)),
                ],
            };
        }

        return {
            targetPath,
            controls: [],
        };
    }

    global.MOBILE_CONTROLS_PRESETS = PRESETS;
    global.getMobileControlsForTarget = getMobileControlsForTarget;
})(typeof window !== 'undefined' ? window : globalThis);

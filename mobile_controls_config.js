(function (global) {
    // Map standard chars to legacy keyCodes AND modern codes 
    // This helps compatibility with both old and new game engines
    const KEY_MAP = {
        'w': { code: 'KeyW', keyCode: 87 },
        'a': { code: 'KeyA', keyCode: 65 },
        's': { code: 'KeyS', keyCode: 83 },
        'd': { code: 'KeyD', keyCode: 68 },
        'z': { code: 'KeyZ', keyCode: 90 },
        'x': { code: 'KeyX', keyCode: 88 },
        'e': { code: 'KeyE', keyCode: 69 },
        'r': { code: 'KeyR', keyCode: 82 },
        '=': { code: 'Equal', keyCode: 187 },
        'ArrowUp': { code: 'ArrowUp', keyCode: 38 },
        'ArrowDown': { code: 'ArrowDown', keyCode: 40 },
        'ArrowLeft': { code: 'ArrowLeft', keyCode: 37 },
        'ArrowRight': { code: 'ArrowRight', keyCode: 39 },
    };

    function normalizeTargetPath(targetPath) {
        if (!targetPath || typeof targetPath !== 'string') return '';
        const withoutHash = targetPath.split('#')[0];
        const withoutQuery = withoutHash.split('?')[0];
        return withoutQuery.split('/').pop().toLowerCase();
    }

    function makeKey(keyName, manualKeyCode) {
        // Try to find full config in KEY_MAP, fallback to manual inputs
        const mapData = KEY_MAP[keyName] || {};
        return { 
            key: keyName, 
            code: mapData.code || '', 
            keyCode: manualKeyCode || mapData.keyCode || 0 
        };
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

    // --- Specific D-pad Factories ---

    function makeWasdDpad(id, title, position, size) {
        return makeDpad(id, title, position, size, {
            up: [makeKey('w')],
            down: [makeKey('s')],
            left: [makeKey('a')],
            right: [makeKey('d')],
        });
    }

    function makeArrowDpad(id, title, position, size) {
        return makeDpad(id, title, position, size, {
            up: [makeKey('ArrowUp')],
            down: [makeKey('ArrowDown')],
            left: [makeKey('ArrowLeft')],
            right: [makeKey('ArrowRight')],
        });
    }

    function makeHorizontalArrowDpad(id, title, position, size) {
        return makeDpad(id, title, position, size, {
            left: [makeKey('ArrowLeft')],
            right: [makeKey('ArrowRight')],
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
                makeButton('btn-jump', '↑', { bottom: 8, left: 6 }, 12, [makeKey('ArrowUp')]),
                makeButton('btn-r', 'r', { top: 6, left: 6 }, 10, [makeKey('r')]),
                makeButton('btn-equals', '=', { top: 6, right: 6 }, 10, [makeKey('=')]),
            ],
        },
        waterrune: {
            targetMatch: (file) => file === 'waterrune.html',
            controls: [
                makeArrowDpad('dpad-move', 'Move', { bottom: 8, right: 6 }, 18),
                makeButton('btn-z', 'Z', { bottom: 8, left: 6 }, 12, [makeKey('z'), makeKey('e')]),
                makeButton('btn-x', 'X', { top: 45, left: 6 }, 12, [makeKey('x')]),
            ],
        },
    };

    function getMobileControlsForTarget(targetPath) {
        const file = normalizeTargetPath(targetPath);
        const presets = Object.values(PRESETS);

        for (const preset of presets) {
            if (preset.targetMatch(file)) {
                return { targetPath, controls: preset.controls };
            }
        }

        // Fallback Logic
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

        return { targetPath, controls: [] };
    }

    global.MOBILE_CONTROLS_PRESETS = PRESETS;
    global.getMobileControlsForTarget = getMobileControlsForTarget;
})(typeof window !== 'undefined' ? window : globalThis);

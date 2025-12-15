// game_config.js

const GAME_LAUNCH_CONFIG = {
    // 1. Target Game Path
    targetGamePath: './your_existing_game.html', 

    // 2. Button and D-Pad Configurations
    // NOTE: All positions are percentages (0-100) from the screen edge.
    controls: [
        // --- D-Pad 1 (Left Side) ---
        {
            type: 'dpad',
            id: 'dpad-move',
            // Position: bottom: 20% from bottom, left: 10% from left
            position: { bottom: 20, left: 10 },
            size: 15, // D-Pad size as a percentage of the smaller screen dimension (vmin)
            buttons: [
                // Up: Simulates 'W' key
                { direction: 'up', key: 'w', keyCode: 87 },
                // Down: Simulates 'S' key
                { direction: 'down', key: 's', keyCode: 83 },
                // Left: Simulates 'A' key
                { direction: 'left', key: 'a', keyCode: 65 },
                // Right: Simulates 'D' key
                { direction: 'right', key: 'd', keyCode: 68 },
            ]
        },
        
        // --- Action Button 1 (Right Side) ---
        {
            type: 'button',
            id: 'action-jump',
            label: 'J', // Optional label 'J' for Jump
            // Position: bottom: 20% from bottom, right: 10% from right
            position: { bottom: 20, right: 10 },
            size: 10, // Button size as a percentage of vmin
            key: 'Space', // Simulates 'Spacebar'
            keyCode: 32 
        },

        // --- Action Button 2 (Top Right) ---
        {
            type: 'button',
            id: 'action-punch',
            label: 'A', // Optional label 'A' for Attack
            // Position: bottom: 35% from bottom, right: 25% from right
            position: { bottom: 35, right: 25 }, 
            size: 8,
            key: 'k', // Simulates 'K' key
            keyCode: 75
        }
    ]
};

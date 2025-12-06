
import { Room, EntityType, WeaponType, RoomBlueprint } from './types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const TILE_SIZE = 40;

export interface WeaponStats {
  name: string;
  damage: number;
  cooldown: number; // Frames
  range: number;
  speed?: number; // Optional
  color: string;
  type: 'MELEE' | 'RANGED';
}

export const WEAPONS: { [key in WeaponType]: WeaponStats } = {
  [WeaponType.PITCHFORK]: {
    name: 'Pitchfork',
    damage: 15,
    cooldown: 20, // Frames
    range: 60,
    color: '#a3a3a3',
    type: 'MELEE'
  },
  [WeaponType.CROSSBOW]: {
    name: 'Crossbow',
    damage: 10,
    cooldown: 30,
    range: 400,
    speed: 10,
    color: '#8b4513',
    type: 'RANGED'
  },
  [WeaponType.WARHAMMER]: {
    name: 'Warhammer',
    damage: 40,
    cooldown: 60,
    range: 80,
    color: '#4a4a4a',
    type: 'MELEE'
  },
  [WeaponType.VOID_SCEPTER]: {
    name: 'Void Scepter',
    damage: 5, // Low damage but insane fire rate
    cooldown: 5,
    range: 500,
    speed: 15,
    color: '#4b0082',
    type: 'RANGED'
  }
};

// Map Layout: 17 Rooms
// We will use a coordinate system for ID "x,y"
// Start at 0,0
// Layout covers a rough area to fit 17 rooms
export const INITIAL_MAP_LAYOUT: { [key: string]: RoomBlueprint } = {
  "0,0": { description: "The Beginning. Tutorial signs on the floor.", enemies: [], items: [] },
  
  // Path to Boss 1 (Gatekeeper) - Left/Up
  "-1,0": { enemies: [{ type: EntityType.ENEMY_CHASER, count: 2 }] },
  "-2,0": { enemies: [{ type: EntityType.ENEMY_SHOOTER, count: 2 }] },
  "-2,1": { enemies: [{ type: EntityType.ENEMY_TANK, count: 1 }, { type: EntityType.ENEMY_CHASER, count: 2 }] },
  "-3,1": { isBossRoom: true, description: "Gatekeeper's Sanctum", enemies: [{ type: EntityType.BOSS_GATEKEEPER, count: 1 }] },

  // Path to Boss 2 (Construct) - Right/Up
  "1,0": { enemies: [{ type: EntityType.ENEMY_CHASER, count: 3 }] },
  "2,0": { enemies: [{ type: EntityType.ENEMY_SHOOTER, count: 3 }] },
  "2,1": { items: [{ type: EntityType.WEAPON_PICKUP, weaponType: WeaponType.CROSSBOW }] }, // Weapon 1
  "2,2": { enemies: [{ type: EntityType.ENEMY_TANK, count: 2 }] },
  "1,2": { isBossRoom: true, description: "Construct's Factory", enemies: [{ type: EntityType.BOSS_CONSTRUCT, count: 1 }] },

  // Middle Exploration
  "0,1": { enemies: [{ type: EntityType.ENEMY_CHASER, count: 4 }] },
  "0,2": { items: [{ type: EntityType.ITEM_HEALTH }] },
  
  // Path to Secret Boss - Down/Right hidden
  "1,-1": { enemies: [{ type: EntityType.ENEMY_SHOOTER, count: 2 }, { type: EntityType.ENEMY_CHASER, count: 2 }] },
  "1,-2": { items: [{ type: EntityType.WEAPON_PICKUP, weaponType: WeaponType.WARHAMMER }] }, // Weapon 2
  "2,-2": { isSecret: true, description: "The Void", enemies: [{ type: EntityType.BOSS_SECRET, count: 1 }] },

  // Path to Final Boss - Up from center (requires keys conceptually, code will check flags)
  "0,3": { enemies: [{ type: EntityType.ENEMY_TANK, count: 1 }, { type: EntityType.ENEMY_SHOOTER, count: 3 }] },
  "0,4": { isFinal: true, description: "Heaven's Door", enemies: [{ type: EntityType.BOSS_ANGEL, count: 1 }] },

  // Extra room to make 17
  "-1,-1": { items: [{ type: EntityType.ITEM_SPEED }] }
};

// Helper to expand the shorthand above into full Room objects
export const generateMap = (): { [key: string]: Room } => {
  const rooms: { [key: string]: Room } = {};
  
  Object.entries(INITIAL_MAP_LAYOUT).forEach(([id, data]) => {
    const [x, y] = id.split(',').map(Number);
    
    // Separate blueprint specific arrays that don't match Room interface
    const { enemies, items, ...roomProps } = data;

    rooms[id] = {
      id,
      x,
      y,
      visited: id === "0,0",
      cleared: false,
      doors: {},
      enemies: [],
      items: [],
      isBossRoom: false,
      isSecret: false,
      isFinal: false,
      description: "A dark, cold room.",
      ...roomProps,
      // Expand enemy shorthand to actual entities later in initialization
    } as Room;
  });

  // Link doors
  Object.values(rooms).forEach(room => {
    const directions = [
      { dir: 'top', dx: 0, dy: 1 },
      { dir: 'bottom', dx: 0, dy: -1 },
      { dir: 'left', dx: -1, dy: 0 },
      { dir: 'right', dx: 1, dy: 0 },
    ] as const;

    directions.forEach(({ dir, dx, dy }) => {
      const neighborId = `${room.x + dx},${room.y + dy}`;
      if (rooms[neighborId]) {
        room.doors[dir] = neighborId;
      }
    });
  });

  return rooms;
};

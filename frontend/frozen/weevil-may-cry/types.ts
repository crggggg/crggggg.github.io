
export type Vector2 = { x: number; y: number };

export enum EntityType {
  PLAYER,
  ENEMY_CHASER,
  ENEMY_SHOOTER,
  ENEMY_TANK,
  BOSS_GATEKEEPER,
  BOSS_CONSTRUCT,
  BOSS_SECRET,
  BOSS_ANGEL,
  PROJECTILE,
  ITEM_HEALTH,
  ITEM_SPEED,
  ITEM_SHIELD,
  WEAPON_PICKUP
}

export enum WeaponType {
  PITCHFORK = 'PITCHFORK',
  CROSSBOW = 'CROSSBOW',
  WARHAMMER = 'WARHAMMER',
  VOID_SCEPTER = 'VOID_SCEPTER'
}

export interface Entity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  damage: number;
  color: string;
  dead: boolean;
  // Specific properties
  attackCooldown?: number;
  projectileSpeed?: number;
  projectileDuration?: number;
  itemType?: string; // For pickups
  weaponType?: WeaponType; // For weapon pickups
  emoji?: string;
  facing?: number; // radians
}

export interface Room {
  id: string; // "x,y"
  x: number;
  y: number;
  visited: boolean;
  cleared: boolean;
  enemies: Entity[];
  items: Entity[];
  doors: { [key in 'top' | 'bottom' | 'left' | 'right']?: string }; // connects to Room ID
  isBossRoom?: boolean;
  isSecret?: boolean;
  isFinal?: boolean;
  description?: string;
}

// Config Types for Map Generation
export interface EnemyConfig {
  type: EntityType;
  count: number;
}

export interface ItemConfig {
  type: EntityType;
  weaponType?: WeaponType;
}

export interface RoomBlueprint {
  description?: string;
  enemies?: EnemyConfig[];
  items?: ItemConfig[];
  isBossRoom?: boolean;
  isSecret?: boolean;
  isFinal?: boolean;
}

export interface GameState {
  currentRoomId: string;
  rooms: { [key: string]: Room };
  player: Entity & {
    inventory: WeaponType[];
    currentWeapon: WeaponType;
    shieldActive: boolean;
    speedBoostActive: boolean;
    dashes: number;
  };
  projectiles: Entity[];
  particles: Particle[];
  status: 'START' | 'PLAYING' | 'GAME_OVER' | 'VICTORY';
  timeElapsed: number;
  bossesDefeated: string[];
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

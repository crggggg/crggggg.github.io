import { Entity, EntityType, GameState, Particle, Room, Vector2, WeaponType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, WEAPONS } from '../constants';

export const createEntity = (type: EntityType, x: number, y: number, subtype?: any): Entity => {
  const base: Entity = {
    id: Math.random().toString(36).substr(2, 9),
    type,
    x,
    y,
    radius: 15,
    vx: 0,
    vy: 0,
    hp: 10,
    maxHp: 10,
    damage: 1,
    color: '#fff',
    dead: false,
    facing: 0
  };

  switch (type) {
    case EntityType.PLAYER:
      return { ...base, hp: 100, maxHp: 100, radius: 16, color: '#9333ea', emoji: '😈' }; // Purple Devil
    case EntityType.ENEMY_CHASER:
      return { ...base, hp: 30, damage: 10, radius: 14, color: '#ef4444', emoji: '👹' }; // Red Oni
    case EntityType.ENEMY_SHOOTER:
      return { ...base, hp: 20, damage: 15, radius: 14, color: '#22c55e', attackCooldown: 100, emoji: '🐍' }; // Green Snake
    case EntityType.ENEMY_TANK:
      return { ...base, hp: 80, damage: 20, radius: 20, color: '#3b82f6', emoji: '🐗' }; // Blue Boar
    case EntityType.BOSS_GATEKEEPER:
      return { ...base, hp: 300, damage: 25, radius: 30, color: '#dc2626', emoji: '👺' }; // Tengu
    case EntityType.BOSS_CONSTRUCT:
      return { ...base, hp: 400, damage: 20, radius: 35, color: '#475569', attackCooldown: 60, emoji: '🤖' }; // Robot
    case EntityType.BOSS_SECRET:
      return { ...base, hp: 666, damage: 40, radius: 25, color: '#000000', attackCooldown: 30, emoji: '👽' }; // Alien
    case EntityType.BOSS_ANGEL:
      return { ...base, hp: 1000, damage: 30, radius: 30, color: '#fbbf24', attackCooldown: 40, emoji: '👼' }; // Angel
    case EntityType.ITEM_HEALTH:
      return { ...base, radius: 10, color: '#fca5a5', itemType: 'HEALTH', emoji: '❤️' };
    case EntityType.ITEM_SPEED:
      return { ...base, radius: 10, color: '#fde047', itemType: 'SPEED', emoji: '⚡' };
    case EntityType.ITEM_SHIELD:
      return { ...base, radius: 10, color: '#93c5fd', itemType: 'SHIELD', emoji: '🛡️' };
    case EntityType.WEAPON_PICKUP:
      return { ...base, radius: 12, color: '#fff', weaponType: subtype, emoji: '⚔️' };
    default:
      return base;
  }
};

export const checkCollision = (a: Entity, b: Entity): boolean => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < a.radius + b.radius;
};

export const spawnParticles = (x: number, y: number, color: string, count: number, particles: Particle[]) => {
  for (let i = 0; i < count; i++) {
    particles.push({
      id: Math.random().toString(),
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 20 + Math.random() * 20,
      color,
      size: 2 + Math.random() * 3
    });
  }
};

export const updateEntities = (
  room: Room, 
  player: GameState['player'], 
  projectiles: Entity[], 
  particles: Particle[],
  bossesDefeated: string[]
) => {
  // Move Player
  player.x += player.vx;
  player.y += player.vy;

  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;
  const doorZone = 50; // Distance from center where a door is accessible

  // Wall collisions for player
  // Only clamp if there is NO door in that direction OR the player is not aligned with the door
  
  // Left Wall
  if (player.x < player.radius) {
    const canExit = room.doors.left && Math.abs(player.y - cy) < doorZone;
    if (!canExit) player.x = player.radius;
  }
  // Right Wall
  if (player.x > CANVAS_WIDTH - player.radius) {
    const canExit = room.doors.right && Math.abs(player.y - cy) < doorZone;
    if (!canExit) player.x = CANVAS_WIDTH - player.radius;
  }
  // Top Wall
  if (player.y < player.radius) {
    const canExit = room.doors.top && Math.abs(player.x - cx) < doorZone;
    if (!canExit) player.y = player.radius;
  }
  // Bottom Wall
  if (player.y > CANVAS_HEIGHT - player.radius) {
    const canExit = room.doors.bottom && Math.abs(player.x - cx) < doorZone;
    if (!canExit) player.y = CANVAS_HEIGHT - player.radius;
  }

  // Update Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Enemy Logic
  room.enemies.forEach(enemy => {
    if (enemy.dead) return;

    // Movement
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    enemy.facing = Math.atan2(dy, dx);

    let speed = 2;
    if (enemy.type === EntityType.ENEMY_TANK) speed = 1;
    if (enemy.type === EntityType.BOSS_GATEKEEPER) speed = 1.5;
    if (enemy.type === EntityType.BOSS_CONSTRUCT) speed = 0.5;

    // Simple chase AI
    if (dist > enemy.radius + player.radius) {
      if (enemy.type !== EntityType.ENEMY_SHOOTER || dist > 200) {
        enemy.x += (dx / dist) * speed;
        enemy.y += (dy / dist) * speed;
      }
    }

    // Boss/Shooter Attack
    if (enemy.attackCooldown && enemy.attackCooldown > 0) {
      enemy.attackCooldown--;
    } else if (enemy.attackCooldown !== undefined) {
      // Fire
      if (enemy.type === EntityType.ENEMY_SHOOTER || enemy.type === EntityType.BOSS_CONSTRUCT || enemy.type === EntityType.BOSS_SECRET) {
        projectiles.push({
           id: Math.random().toString(),
           type: EntityType.PROJECTILE,
           x: enemy.x,
           y: enemy.y,
           vx: (dx / dist) * 5,
           vy: (dy / dist) * 5,
           radius: 6,
           hp: 1, maxHp: 1, damage: enemy.damage, color: enemy.color, dead: false
        });
        enemy.attackCooldown = (enemy.type === EntityType.BOSS_SECRET) ? 20 : 100;
      }
      
      // Angel Spread Shot
      if (enemy.type === EntityType.BOSS_ANGEL) {
        for(let i = -1; i <= 1; i++) {
           const angle = Math.atan2(dy, dx) + i * 0.3;
           projectiles.push({
             id: Math.random().toString(),
             type: EntityType.PROJECTILE,
             x: enemy.x,
             y: enemy.y,
             vx: Math.cos(angle) * 6,
             vy: Math.sin(angle) * 6,
             radius: 8,
             hp: 1, maxHp: 1, damage: enemy.damage, color: 'gold', dead: false
          });
        }
        enemy.attackCooldown = 50;
      }
    }

    // Collision Player vs Enemy
    if (checkCollision(player, enemy)) {
      if (!player.shieldActive) {
        player.hp -= 0.5; // Contact damage
      }
    }
  });

  // Projectile Logic
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx;
    p.y += p.vy;

    // Out of bounds
    if (p.x < 0 || p.x > CANVAS_WIDTH || p.y < 0 || p.y > CANVAS_HEIGHT) {
      p.dead = true;
    }

    // Player Projectile hitting Enemies
    if (p.color === 'player_proj' || p.type === EntityType.PROJECTILE && p.color !== player.color) { // Simplify: Friendly fire check based on origin logic needing enhancement, but for now assuming projectiles have owners implicitly by color/context
      // Actually let's just check overlap
    }
  }
};
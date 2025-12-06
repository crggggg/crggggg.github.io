import React, { useEffect, useRef, useState } from 'react';
import { GameState, EntityType, WeaponType, Entity, Room } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, WEAPONS, generateMap, INITIAL_MAP_LAYOUT } from '../constants';
import { createEntity, updateEntities, checkCollision, spawnParticles } from '../utils/gameLogic';

const INITIAL_PLAYER_STATS = {
  inventory: [WeaponType.PITCHFORK],
  currentWeapon: WeaponType.PITCHFORK,
  shieldActive: false,
  speedBoostActive: false,
  dashes: 3
};

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uiState, setUiState] = useState<Partial<GameState>>({ status: 'START', timeElapsed: 0, player: undefined });
  
  // Game State Ref (Mutable for performance)
  const gameState = useRef<GameState>({
    currentRoomId: "0,0",
    rooms: generateMap(),
    player: createEntity(EntityType.PLAYER, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2) as any,
    projectiles: [],
    particles: [],
    status: 'START',
    timeElapsed: 0,
    bossesDefeated: []
  });

  // Initialize Map Content
  useEffect(() => {
    const state = gameState.current;
    state.player = { ...state.player, ...INITIAL_PLAYER_STATS };
    
    // Populate rooms with actual entities
    Object.values(state.rooms).forEach(room => {
      const initData = INITIAL_MAP_LAYOUT[room.id];
      if (initData?.enemies) {
        initData.enemies.forEach((e: any) => {
          for (let i = 0; i < e.count; i++) {
             room.enemies.push(createEntity(e.type, 100 + Math.random() * (CANVAS_WIDTH - 200), 100 + Math.random() * (CANVAS_HEIGHT - 200)));
          }
        });
      }
      if (initData?.items) {
        initData.items.forEach((i: any) => {
          room.items.push(createEntity(i.type, 100 + Math.random() * (CANVAS_WIDTH - 200), 100 + Math.random() * (CANVAS_HEIGHT - 200), i.weaponType));
        });
      }
    });
  }, []);

  // Input Handling
  useEffect(() => {
    const keys = new Set<string>();
    const handleKeyDown = (e: KeyboardEvent) => keys.add(e.code);
    const handleKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
    
    // Mouse for aiming/shooting
    const mouse = { x: 0, y: 0, down: false };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }
    };
    const handleMouseDown = () => mouse.down = true;
    const handleMouseUp = () => mouse.down = false;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    let animationFrameId: number;
    let lastTime = 0;
    
    const gameLoop = (timestamp: number) => {
      const dt = timestamp - lastTime;
      lastTime = timestamp;
      
      const state = gameState.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (!canvas || !ctx) return;

      if (state.status === 'PLAYING') {
        state.timeElapsed += dt;

        // --- UPDATE ---
        const speed = state.player.speedBoostActive ? 6 : 4;
        state.player.vx = 0;
        state.player.vy = 0;
        
        if (keys.has('KeyW') || keys.has('ArrowUp')) state.player.vy = -speed;
        if (keys.has('KeyS') || keys.has('ArrowDown')) state.player.vy = speed;
        if (keys.has('KeyA') || keys.has('ArrowLeft')) state.player.vx = -speed;
        if (keys.has('KeyD') || keys.has('ArrowRight')) state.player.vx = speed;

        // Weapon Switching
        if (keys.has('Digit1') && state.player.inventory.includes(WeaponType.PITCHFORK)) state.player.currentWeapon = WeaponType.PITCHFORK;
        if (keys.has('Digit2') && state.player.inventory.includes(WeaponType.CROSSBOW)) state.player.currentWeapon = WeaponType.CROSSBOW;
        if (keys.has('Digit3') && state.player.inventory.includes(WeaponType.WARHAMMER)) state.player.currentWeapon = WeaponType.WARHAMMER;
        if (keys.has('Digit4') && state.player.inventory.includes(WeaponType.VOID_SCEPTER)) state.player.currentWeapon = WeaponType.VOID_SCEPTER;

        // Room Transition logic
        const currentRoom = state.rooms[state.currentRoomId];
        let changedRoom = false;

        // Door checks
        if (state.player.y < 10 && currentRoom.doors.top) { state.currentRoomId = currentRoom.doors.top!; state.player.y = CANVAS_HEIGHT - 40; changedRoom = true; }
        else if (state.player.y > CANVAS_HEIGHT - 10 && currentRoom.doors.bottom) { state.currentRoomId = currentRoom.doors.bottom!; state.player.y = 40; changedRoom = true; }
        else if (state.player.x < 10 && currentRoom.doors.left) { state.currentRoomId = currentRoom.doors.left!; state.player.x = CANVAS_WIDTH - 40; changedRoom = true; }
        else if (state.player.x > CANVAS_WIDTH - 10 && currentRoom.doors.right) { state.currentRoomId = currentRoom.doors.right!; state.player.x = 40; changedRoom = true; }

        if (changedRoom) {
            // Check Lock conditions
            const newRoom = state.rooms[state.currentRoomId];
            newRoom.visited = true;
            state.projectiles = []; // Clear projectiles on room change
            
            if (newRoom.isFinal && state.bossesDefeated.length < 2) {
                // Bounce back if locked
                alert("The Angel's door is sealed. Defeat the Gatekeeper and the Construct first.");
                // Revert
                if (state.player.y === 40) state.player.y = CANVAS_HEIGHT - 50; 
                // ... simplistic revert for now, better to block movement
            }
        }

        // Aiming
        const aimDx = mouse.x - state.player.x;
        const aimDy = mouse.y - state.player.y;
        state.player.facing = Math.atan2(aimDy, aimDx);

        // Attacking
        if (state.player.attackCooldown && state.player.attackCooldown > 0) state.player.attackCooldown--;
        if (mouse.down && (!state.player.attackCooldown || state.player.attackCooldown <= 0)) {
            const weapon = WEAPONS[state.player.currentWeapon];
            state.player.attackCooldown = weapon.cooldown;
            
            if (weapon.type === 'RANGED') {
                state.projectiles.push({
                    id: Math.random().toString(),
                    type: EntityType.PROJECTILE,
                    x: state.player.x,
                    y: state.player.y,
                    vx: Math.cos(state.player.facing) * (weapon.speed || 10),
                    vy: Math.sin(state.player.facing) * (weapon.speed || 10),
                    radius: 5,
                    hp: 1, maxHp: 1, damage: weapon.damage, color: 'player_proj', dead: false
                });
            } else {
                // Melee Arc
                // Ideally create a temporary hitbox, for simplicity we check distance in cone
                 currentRoom.enemies.forEach(e => {
                    const dist = Math.sqrt(Math.pow(e.x - state.player.x, 2) + Math.pow(e.y - state.player.y, 2));
                    if (dist < weapon.range) {
                        // Check angle
                        const angleToEnemy = Math.atan2(e.y - state.player.y, e.x - state.player.x);
                        let angleDiff = angleToEnemy - state.player.facing!;
                        // Normalize
                        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

                        if (Math.abs(angleDiff) < 1.0) { // 60 degree cone roughly
                             e.hp -= weapon.damage;
                             spawnParticles(e.x, e.y, '#fff', 5, state.particles);
                             if (e.hp <= 0) {
                                 e.dead = true;
                                 spawnParticles(e.x, e.y, e.color, 15, state.particles);
                                 if (e.type === EntityType.BOSS_GATEKEEPER || e.type === EntityType.BOSS_CONSTRUCT) state.bossesDefeated.push(e.type.toString());
                                 if (e.type === EntityType.BOSS_SECRET) state.player.inventory.push(WeaponType.VOID_SCEPTER);
                                 if (e.type === EntityType.BOSS_ANGEL) state.status = 'VICTORY';
                             }
                        }
                    }
                 });
            }
        }

        // Logic Updates
        updateEntities(currentRoom, state.player, state.projectiles, state.particles, state.bossesDefeated);
        
        // Items Collision
        currentRoom.items.forEach(item => {
            if (!item.dead && checkCollision(state.player, item)) {
                item.dead = true;
                if (item.type === EntityType.ITEM_HEALTH) state.player.hp = Math.min(state.player.hp + 30, state.player.maxHp);
                if (item.type === EntityType.ITEM_SPEED) state.player.speedBoostActive = true;
                if (item.type === EntityType.ITEM_SHIELD) state.player.shieldActive = true;
                if (item.type === EntityType.WEAPON_PICKUP && item.weaponType) {
                    if (!state.player.inventory.includes(item.weaponType)) {
                        state.player.inventory.push(item.weaponType);
                        alert(`Picked up ${WEAPONS[item.weaponType].name}!`);
                    }
                }
            }
        });

        // Player vs Projectiles
        for (let i = state.projectiles.length - 1; i >= 0; i--) {
            const p = state.projectiles[i];
            if (p.dead) continue;
            
            // Enemy hitting player
            if (p.color !== 'player_proj') {
                if (checkCollision(state.player, p)) {
                    if (!state.player.shieldActive) {
                        state.player.hp -= p.damage;
                        spawnParticles(state.player.x, state.player.y, '#9333ea', 5, state.particles);
                        if (state.player.hp <= 0) state.status = 'GAME_OVER';
                    }
                    p.dead = true;
                }
            } else {
                // Player hitting enemy
                currentRoom.enemies.forEach(e => {
                    if (!e.dead && checkCollision(p, e)) {
                         e.hp -= p.damage;
                         p.dead = true;
                         spawnParticles(e.x, e.y, '#fff', 3, state.particles);
                         if (e.hp <= 0) {
                             e.dead = true;
                             spawnParticles(e.x, e.y, e.color, 15, state.particles);
                             if (e.type === EntityType.BOSS_GATEKEEPER || e.type === EntityType.BOSS_CONSTRUCT) state.bossesDefeated.push(e.type.toString());
                             if (e.type === EntityType.BOSS_SECRET) state.player.inventory.push(WeaponType.VOID_SCEPTER);
                             if (e.type === EntityType.BOSS_ANGEL) state.status = 'VICTORY';
                         }
                    }
                });
            }
            if (p.dead) state.projectiles.splice(i, 1);
        }

        // Cleanup dead
        currentRoom.enemies = currentRoom.enemies.filter(e => !e.dead);
        currentRoom.items = currentRoom.items.filter(i => !i.dead);
        if (currentRoom.enemies.length === 0) currentRoom.cleared = true;

      } // End Playing Check

      // --- RENDER ---
      // Clear
      ctx.fillStyle = '#171717'; // Neutral dark gray/black
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (state.status === 'START') {
         ctx.fillStyle = '#fff';
         ctx.font = '30px Courier New';
         ctx.textAlign = 'center';
         ctx.fillText("WEEVIL MAY CRY", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
         ctx.font = '20px Courier New';
         ctx.fillText("Click to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
         ctx.fillText("WASD to Move | Mouse to Aim/Attack", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
         
         if (mouse.down) state.status = 'PLAYING';
      } else if (state.status === 'GAME_OVER') {
         ctx.fillStyle = '#ef4444';
         ctx.font = '40px Courier New';
         ctx.textAlign = 'center';
         ctx.fillText("YOU DIED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
         ctx.fillStyle = '#fff';
         ctx.font = '20px Courier New';
         ctx.fillText("Refresh to try again", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
      } else if (state.status === 'VICTORY') {
         ctx.fillStyle = '#fbbf24';
         ctx.font = '40px Courier New';
         ctx.textAlign = 'center';
         ctx.fillText("VICTORY", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
         ctx.fillText(`Time: ${(state.timeElapsed / 1000).toFixed(1)}s`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
      } else {
        // Draw Doors
        const room = state.rooms[state.currentRoomId];
        ctx.fillStyle = '#333';
        if (room.doors.top) ctx.fillRect(CANVAS_WIDTH/2 - 40, 0, 80, 20);
        if (room.doors.bottom) ctx.fillRect(CANVAS_WIDTH/2 - 40, CANVAS_HEIGHT - 20, 80, 20);
        if (room.doors.left) ctx.fillRect(0, CANVAS_HEIGHT/2 - 40, 20, 80);
        if (room.doors.right) ctx.fillRect(CANVAS_WIDTH - 20, CANVAS_HEIGHT/2 - 40, 20, 80);

        // Draw Items
        room.items.forEach(item => {
            ctx.font = '24px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.emoji || '?', item.x, item.y);
        });

        // Draw Enemies
        room.enemies.forEach(enemy => {
            ctx.font = `${enemy.radius * 2}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(enemy.emoji || '💀', enemy.x, enemy.y);
            
            // HP Bar for bosses
            if (enemy.maxHp > 50) {
                ctx.fillStyle = 'red';
                ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 10, 40 * (enemy.hp / enemy.maxHp), 5);
            }
        });

        // Draw Player
        ctx.save();
        ctx.translate(state.player.x, state.player.y);
        // Draw Weapon
        const weapon = WEAPONS[state.player.currentWeapon];
        ctx.rotate(state.player.facing!);
        ctx.fillStyle = weapon.color;
        if (weapon.type === 'MELEE') {
             // Simple visual for melee held
             ctx.fillRect(10, -2, 20, 4);
        } else {
             ctx.fillRect(10, -2, 15, 4);
        }
        ctx.restore();

        // Player Body
        ctx.font = '32px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.player.emoji || 'P', state.player.x, state.player.y);

        // Draw Projectiles
        state.projectiles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color === 'player_proj' ? weapon.color : p.color;
            ctx.fill();
        });

        // Draw Particles
        state.particles.forEach(p => {
            ctx.globalAlpha = p.life / 20;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            ctx.globalAlpha = 1.0;
        });

        // UI Updates (throttled slightly by React renders, but good enough)
        if (Math.random() < 0.1) {
            setUiState({
                status: state.status,
                timeElapsed: state.timeElapsed,
                player: { ...state.player }
            });
        }
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center h-screen w-screen bg-stone-900">
      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        className="border-4 border-stone-600 bg-stone-800 shadow-2xl cursor-crosshair"
      />
      
      {uiState.status === 'PLAYING' && uiState.player && (
        <div className="absolute top-4 left-4 p-4 bg-stone-950/80 text-stone-200 border border-stone-600 rounded w-64 pointer-events-none">
           <div className="mb-2">
             <span className="font-bold">HP: </span>
             <span className={`${uiState.player.hp < 30 ? 'text-red-500' : 'text-green-500'}`}>
                {Math.floor(uiState.player.hp)} / {uiState.player.maxHp}
             </span>
             <div className="w-full bg-stone-700 h-2 mt-1">
                <div 
                  className="bg-purple-600 h-full transition-all" 
                  style={{ width: `${(uiState.player.hp / uiState.player.maxHp) * 100}%` }}
                ></div>
             </div>
           </div>
           
           <div className="mb-2">
              <div className="font-bold mb-1">Weapon:</div>
              <div className="text-sm text-yellow-500">{WEAPONS[uiState.player.currentWeapon].name}</div>
           </div>

           <div className="text-xs text-stone-400 mt-4">
              <p>Inventory:</p>
              {uiState.player.inventory.map((w, i) => (
                  <span key={w} className={`mr-2 ${w === uiState.player.currentWeapon ? 'text-white font-bold' : ''}`}>
                    [{i+1}] {WEAPONS[w].name}
                  </span>
              ))}
           </div>
           
           <div className="absolute top-0 right-0 p-2 text-xs text-stone-500">
             {(uiState.timeElapsed! / 1000).toFixed(0)}s
           </div>
        </div>
      )}

      {/* Mini Map or Boss Tracker */}
      {uiState.status === 'PLAYING' && (
         <div className="absolute bottom-4 right-4 p-2 bg-stone-950/80 text-stone-400 border border-stone-700 rounded text-xs">
            <p>Bosses Defeated: {gameState.current.bossesDefeated.length} / 2</p>
            <p className="mt-1">{gameState.current.rooms[gameState.current.currentRoomId].description || "Unknown Room"}</p>
            <p className="mt-1 text-[10px] uppercase tracking-widest">{gameState.current.currentRoomId}</p>
         </div>
      )}
    </div>
  );
};

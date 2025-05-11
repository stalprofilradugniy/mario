// Game Constants
const GAME_WIDTH = 256; // NES resolution
const GAME_HEIGHT = 240;
const TILE_SIZE = 16;
const GRAVITY = 0.5;
const JUMP_FORCE = -10; // Negative as y-axis increases downwards
const PLAYER_SPEED = 2;

// Game State (simple example)
let score = 0;
let lives = 3;
let player;
let enemies = [];
let blocks = [];
let currentLevel;

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// UI Elements
const scoreDisplay = document.getElementById('ui-score');
const livesDisplay = document.getElementById('ui-lives');
const touchControls = document.getElementById('touch-controls');

// --- Game Objects (Place in separate files: player.js, enemy.js, block.js, etc.) ---
// Example Player Class (placeholder)
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE * 2; // Mario is 2 tiles tall
        this.vx = 0; // velocity x
        this.vy = 0; // velocity y
        this.isJumping = false;
        this.isMovingLeft = false;
        this.isMovingRight = false;
        // Add sprite/animation state later
    }

    update() {
        // Apply gravity
        this.vy += GRAVITY;

        // Apply horizontal movement
        this.vx = 0;
        if (this.isMovingLeft) {
            this.vx = -PLAYER_SPEED;
        } else if (this.isMovingRight) {
            this.vx = PLAYER_SPEED;
        }

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Basic boundary check (prevent falling off bottom)
        if (this.y > GAME_HEIGHT - this.height) {
             this.y = GAME_HEIGHT - this.height;
             this.vy = 0;
             this.isJumping = false; // Can jump again if on ground
             // Handle player death later
        }

        // --- Collision detection would go here ---
        // Check collisions with blocks, enemies, etc.
        // Example: Check collision with ground blocks
        // This requires iterating through blocks and checking for overlaps,
        // then adjusting player position and velocity based on the collision side.
        // This is complex and omitted for this basic structure.
    }

    draw(ctx) {
        // Simple rectangle for now
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Draw white rectangle for cap
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x, this.y, this.width, this.height / 4);
    }

    jump() {
        if (!this.isJumping) {
            this.vy = JUMP_FORCE;
            this.isJumping = true;
            // Add jump sound later
        }
    }
}

// Example Enemy Class (placeholder)
class Goomba {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.vx = -1; // move left
        // Add state (alive/squashed), sprite later
    }

    update() {
         // Apply gravity (if needed, Goombas usually just walk on ground)
         // this.vy += GRAVITY;
         this.x += this.vx;

         // Basic wall collision (turn around)
         if (this.x < 0 || this.x > GAME_WIDTH - this.width) {
             this.vx *= -1;
         }

        // --- Collision with player would go here ---
        // If player hits from top, squish goomba
        // If player hits from side, player takes damage/loses life
    }

    draw(ctx) {
        // Simple rectangle for now
        ctx.fillStyle = 'brown';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Draw eyes? :)
    }
}

// Example Block Class (placeholder)
class Block {
    constructor(x, y, type = 'brick') { // type could be 'coin', 'powerup', 'empty'
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.type = type;
        this.hits = 0; // How many times it's been hit
        // Add sprite state later
    }

    draw(ctx) {
        // Simple rectangle for now
        ctx.fillStyle = this.type === 'brick' ? 'sienna' : (this.type === 'coin' ? 'yellow' : 'gray');
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Maybe add a question mark for some block types
    }

    // Handle being hit from below
    hit(player) {
        if (this.type === 'coin') {
            // Spawn a coin animation, add to score, change block state
            score += 200;
            this.type = 'empty'; // Or just remove the block
            this.draw(ctx); // Redraw immediately
        } else if (this.type === 'powerup') {
             // Spawn a powerup, change block state
             this.type = 'empty';
             this.draw(ctx);
        } else if (this.type === 'brick') {
             // Break block? Depends on player state.
             // For now, just do nothing
        }
        this.hits++; // Track hits
    }
}


// --- Level Data (Place in scripts/level.js) ---
// This would be a 2D array or similar structure representing the level layout
// Example:
/*
const level1_1_data = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    // ... many rows ...
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Ground
];
function loadLevel(levelData) {
    blocks = [];
    enemies = [];
    // Iterate through levelData and create Block/Enemy objects
    // Position player
}
*/
// Placeholder level data and loading
const level1_1_data = [
    // Basic ground and a few objects
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] // Ground
];

function loadLevel(levelData) {
    blocks = [];
    enemies = []; // Clear old enemies
    // This is a simplified load - a real game would parse the levelData
    // and create objects at specific positions based on the data.
    // For this example, we just create a player and one goomba
    player = new Player(50, GAME_HEIGHT - TILE_SIZE * 3); // Start above ground
    enemies.push(new Goomba(GAME_WIDTH - 50, GAME_HEIGHT - TILE_SIZE * 2)); // Goomba on ground
    // Add some ground blocks for the Goomba to walk on if needed
}


// --- Input Handling (Place in scripts/input.js) ---
// This would handle event listeners for keyboard and touch

function setupInput() {
    // Keyboard Input (for desktop testing)
    document.addEventListener('keydown', (e) => {
        if (!player) return; // Don't handle if player doesn't exist
        if (e.key === 'ArrowLeft') player.isMovingLeft = true;
        if (e.key === 'ArrowRight') player.isMovingRight = true;
        if (e.key === ' ' || e.key === 'ArrowUp') player.jump();
    });

    document.addEventListener('keyup', (e) => {
         if (!player) return;
         if (e.key === 'ArrowLeft') player.isMovingLeft = false;
         if (e.key === 'ArrowRight') player.isMovingRight = false;
    });

    // Touch Input
    const touchLeft = document.getElementById('touch-left');
    const touchRight = document.getElementById('touch-right');
    const touchJump = document.getElementById('touch-jump');

    if ('ontouchstart' in window) { // Check if touch is supported
         touchControls.style.display = 'flex'; // Show controls
         // Handle touch events
         touchLeft.addEventListener('touchstart', (e) => { e.preventDefault(); if (player) player.isMovingLeft = true; });
         touchLeft.addEventListener('touchend', (e) => { e.preventDefault(); if (player) player.isMovingLeft = false; });

         touchRight.addEventListener('touchstart', (e) => { e.preventDefault(); if (player) player.isMovingRight = true; });
         touchRight.addEventListener('touchend', (e) => { e.preventDefault(); if (player) player.isMovingRight = false; });

         touchJump.addEventListener('touchstart', (e) => { e.preventDefault(); if (player) player.jump(); });
         // Jump often doesn't need a touchend unless it's a hold-to-jump mechanic
         // touchJump.addEventListener('touchend', (e) => { e.preventDefault(); });

    } else {
        touchControls.style.display = 'none'; // Hide controls on non-touch devices
    }

}


// --- Game Loop ---
let lastTime = 0;
function gameLoop(timestamp) {
    // Calculate delta time (useful for frame-rate independent physics)
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Update game state
    update(deltaTime);

    // Draw everything
    draw();

    // Request the next frame
    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    // Update player
    if (player) {
        player.update(deltaTime);
        // Simple camera follow (pan the world instead of moving the player)
        // This is complex to implement fully (scrolling background, keeping UI fixed)
        // For this basic example, we just update the player.
    }

    // Update enemies
    enemies.forEach(enemy => enemy.update(deltaTime));

    // --- Collision detection and response goes here ---
    // Check player vs enemies, player vs blocks, enemies vs blocks, etc.
    // Based on collision results, update game state (e.g., remove enemy, change player state)

    // Update UI
    scoreDisplay.textContent = `Score: ${score}`;
    livesDisplay.textContent = `Lives: ${lives}`;

    // Check win/lose conditions (omitted for this basic example)
}

function draw() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background (sky is handled by CSS body background)
    // Draw tiles/blocks
    blocks.forEach(block => block.draw(ctx));

    // Draw enemies
    enemies.forEach(enemy => enemy.draw(ctx));

    // Draw player (draw player last so they are on top)
    if (player) {
        player.draw(ctx);
    }

    // UI is drawn by the browser as HTML elements, not on the canvas
}


// --- Initialization ---
function init() {
    setupInput(); // Start listening for input
    loadLevel(level1_1_data); // Load the initial level
    gameLoop(0); // Start the game loop
}

// Start the game when the window loads
window.onload = init;

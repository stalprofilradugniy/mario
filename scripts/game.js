// scripts/game.js

// Импортируем все необходимые модули
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from './constants.js';
import { setupInput, getInputState } from './input.js';
import { loadLevel, level1_1_data } from './level.js'; // Импортируем данные уровня и загрузчик
import { Player } from './player.js';
// Импортируем классы врагов и блоков, даже если level.js их создает,
// так как они нужны для проверок коллизий в этом файле
import { Goomba } from './enemy.js';
import { Block } from './block.js';
// import { Mushroom } from './items.js'; // Если есть предметы


// --- Игровое Состояние ---
let score = 0; // Текущий счет игрока
let lives = 3; // Оставшиеся жизни игрока
let player = null; // Объект игрока
let enemies = []; // Массив активных врагов
let blocks = []; // Массив активных блоков
// let items = []; // Массив предметов (грибы, цветы и т.д.)

let gameRunning = true; // Флаг, показывающий, запущена ли игра

// --- Настройка Canvas ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Устанавливаем размеры canvas в соответствии с константами игры
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Получаем элементы UI
const scoreDisplay = document.getElementById('ui-score');
const livesDisplay = document.getElementById('ui-lives');

// --- Игровой Цикл ---
let lastTime = 0; // Время предыдущего кадра для расчета deltaTime

/**
 * Главная функция игрового цикла. Вызывается браузером с оптимальной частотой.
 * @param {number} timestamp - Время текущего кадра в миллисекундах.
 */
function gameLoop(timestamp) {
    // Если игра не запущена, останавливаем цикл
    if (!gameRunning) {
        // Логика паузы, меню конца игры и т.д.
        return;
    }

    // Рассчитываем время, прошедшее с предыдущего кадра
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Обновляем состояние игры
    update(deltaTime);

    // Отрисовываем все игровые объекты
    draw();

    // Запрашиваем следующий кадр игрового цикла
    requestAnimationFrame(gameLoop);
}

/**
 * Обновляет состояние всех игровых объектов и обрабатывает взаимодействия.
 * @param {number} deltaTime - Время, прошедшее с предыдущего кадра.
 */
function update(deltaTime) {
    // Получаем текущее состояние ввода
    const inputState = getInputState();

    // --- Обновление объектов ---
    // Обновляем игрока, передавая ему состояние ввода и списки объектов для коллизий
    if (player) {
        player.update(deltaTime, inputState, blocks, enemies);
    }

    // Обновляем врагов
    // Сначала фильтруем неживых врагов, чтобы они не обновлялись и не рисовались
    enemies = enemies.filter(enemy => enemy.isAlive);
    enemies.forEach(enemy => enemy.update(deltaTime, blocks)); // Врагам нужны блоки для коллизий (например, чтобы не падать)

    // Обновляем предметы (если есть)
    // items.forEach(item => item.update(deltaTime, blocks, player));
    // items = items.filter(item => !item.isCollected); // Удаляем собранные предметы

    // --- Обработка Коллизий Между Объектами ---
    // Это место для более сложной логики взаимодействия между различными типами объектов.
    // Простые коллизии (игрок-блок, враг-блок) частично обработаны в update соответствующих классов.
    // Здесь обрабатывается, например:
    // - Игрок наступает на врага
    // - Игрок касается врага сбоку
    // - Fireball попадает во врага или блок
    // - Игрок собирает предмет

     if (player && player.isAlive) {
         // Проверка коллизий игрока с врагами
         enemies.forEach((enemy, index) => {
             // Проверка наложения игрока и врага (AABB)
             if (player.x < enemy.x + enemy.width &&
                 player.x + player.width > enemy.x &&
                 player.y < enemy.y + enemy.height &&
                 player.y + player.height > enemy.y) {

                 // Есть коллизия! Определяем тип взаимодействия.
                 const playerBottom = player.y + player.height;
                 const enemyTop = enemy.y;

                 // Проверка, наступил ли игрок на врага
                 // Условие: игрок падал (vy > 0) и нижняя часть игрока находится или находилась чуть выше верхней части врага
                 // (Добавим небольшую дельту для надежности)
                 const overlapY = (player.y + player.height) - enemy.y;
                 const overlapX = (player.x + player.width) - enemy.x;

                 if (player.vy > 0 && // Игрок падает
                     playerBottom < enemyTop + Math.abs(player.vy) * 2 && // Нижняя часть игрока близко к верхней части врага
                     overlapY > overlapX * 0.5 // Вертикальное наложение больше горизонтального (примерно)
                    ) // Это очень упрощенное условие приземления сверху
                 {
                     // Игрок наступил на врага (раздавил его)
                     enemy.squash(); // Вызываем метод раздавливания у врага
                     player.vy = JUMP_FORCE / 2; // Игрок отскакивает от врага
                     addScore(100); // Добавляем очки
                     // Можно добавить короткую анимацию/звук
                 } else {
                     // Игрок столкнулся с врагом сбоку или снизу - игрок получает урон
                     // В SMB игрок становится маленьким или теряет жизнь
                     console.log("Player took damage!"); // Логируем урон
                     // player.takeDamage(); // Вызываем метод обработки урона у игрока
                     // Для простоты, пока просто уменьшаем жизни в игре
                     loseLife(); // Вызываем функцию потери жизни
                 }
             }
         });

         // Проверка коллизий игрока с предметами (если есть items)
         // items.forEach((item, index) => {
         //      if (player.x < item.x + item.width &&
         //          player.x + player.width > item.x &&
         //          player.y < item.y + item.height &&
         //          player.y + player.height > item.y) {
         //          // Игрок подобрал предмет
         //          item.collect(player); // Вызываем метод сбора у предмета
         //          // items.splice(index, 1); // Удаляем предмет из массива
         //          addScore(item.scoreValue); // Добавляем очки за предмет
         //      }
         // });
     }

    // --- Обновление UI ---
    scoreDisplay.textContent = `Score: ${score}`; // Обновляем текст счета
    livesDisplay.textContent = `Lives: ${lives}`; // Обновляем текст жизней

    // --- Проверки Игрового Состояния (Победа/Поражение) ---
    if (lives <= 0) {
        gameOver(); // Вызываем функцию конца игры, если жизни закончились
    }
    // Добавьте условие победы (например, достижение конца уровня/флагштока)
}

/**
 * Отрисовывает все игровые объекты на canvas.
 */
function draw() {
    // Очищаем весь canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем фон (небо уже задано через CSS background-color body)
    // Если нужен более сложный фон, рисовать здесь.

    // Рисуем блоки
    blocks.forEach(block => block.draw(ctx));

    // Рисуем врагов
    enemies.forEach(enemy => enemy.draw(ctx));

    // Рисуем предметы (если есть)
    // items.forEach(item => item.draw(ctx));

    // Рисуем игрока (рисуем последним, чтобы он был поверх всего)
    if (player) {
        player.draw(ctx);
    }

    // UI (счет, жизни, touch-кнопки) рисуются как обычные HTML элементы, они не рисуются на canvas.
}

// --- Функции управления игровым состоянием ---

/**
 * Добавляет очки к текущему счету.
 * @param {number} amount - Количество добавляемых очков.
 */
function addScore(amount) {
    score += amount;
    // Обновление scoreDisplay произойдет в следующем кадре в функции update
}

/**
 * Уменьшает количество жизней игрока.
 */
function loseLife() {
    lives--;
    // Обновление livesDisplay произойдет в следующем кадре в функции update
    // Если жизни <= 0, game over будет вызван в update
    if (lives > 0) {
         // Логика возрождения игрока
         console.log("Player lost a life. Remaining lives: " + lives);
         resetPlayerPosition(); // Пример: вернуть игрока на старт уровня или контрольную точку
    }
}

/**
 * Сбрасывает позицию игрока (например, после потери жизни).
 * (Требует доступа к начальной позиции уровня)
 */
function resetPlayerPosition() {
     // Это очень простая заглушка. В реальной игре нужно сохранять и загружать
     // позицию из данных уровня или последней контрольной точки.
     player.x = TILE_SIZE * 2;
     player.y = GAME_HEIGHT - TILE_SIZE * 3;
     player.vx = 0;
     player.vy = 0;
     player.isJumping = false;
     player.isGrounded = true; // Предполагаем, что возрождаемся на твердой земле
     // Вернуть игрока в маленькое состояние, если он был большим
     // player.isBigMario = false;
     // player.height = TILE_SIZE;
     // Добавить временную неуязвимость после возрождения
}


/**
 * Обрабатывает конец игры.
 */
function gameOver() {
    console.log("Game Over!");
    gameRunning = false; // Останавливаем игровой цикл
    // Здесь должна быть логика отображения экрана "Game Over",
    // возможность начать сначала и т.д.
    // Например: displayGameOverScreen();
}


// --- Инициализация Игры ---

/**
 * Инициализирует все компоненты игры и запускает игровой цикл.
 */
function init() {
    console.log("Initializing game...");

    // 1. Загружаем данные уровня и создаем объекты
    const levelObjects = loadLevel(level1_1_data);
    blocks = levelObjects.blocks; // Получаем массив блоков
    enemies = levelObjects.enemies; // Получаем массив врагов
    // items = levelObjects.items; // Получаем массив предметов (если они загружаются)

    // 2. Создаем объект игрока, используя начальную позицию из уровня
    if (levelObjects.playerStart) {
        player = new Player(levelObjects.playerStart.x, levelObjects.playerStart.y);
    } else {
        // Если в данных уровня нет начальной позиции, используем позицию по умолчанию
        player = new Player(TILE_SIZE * 2, GAME_HEIGHT - TILE_SIZE * 3);
    }


    // 3. Настраиваем обработку ввода, передавая объект игрока
    setupInput(player);

    // 4. Убеждаемся, что UI отображает начальные значения
    scoreDisplay.textContent = `Score: ${score}`;
    livesDisplay.textContent = `Lives: ${lives}`;

    console.log("Game initialized. Starting game loop.");

    // 5. Запускаем главный игровой цикл
    lastTime = performance.now(); // Получаем точное время для первого кадра
    requestAnimationFrame(gameLoop);
}

// Запускаем функцию инициализации, когда вся страница и все скрипты загружены
window.onload = init;

// Дополнительные функции, если нужны (например, для переключения уровней)
// function goToNextLevel(nextLevelData) { ... }

// scripts/game.js

// Импортируем все необходимые модули и константы
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, START_LIVES, START_SCORE, DEFAULT_PLAYER_START_X, DEFAULT_PLAYER_START_Y, SCORE_GOOMBA } from './constants.js';
import { setupInput, getInputState } from './input.js'; // Функции для работы с вводом
import { loadLevel, level1_1_data } from './level.js'; // Функция загрузки уровня и данные первого уровня
import { Player } from './player.js'; // Класс игрока
import { Block } from './block.js'; // Класс блока (нужен для проверок типов)
import { Goomba } from './enemy.js'; // Класс врага (нужен для проверок типов и вызова squash)
// import { Item } from './items.js'; // Класс предмета (если есть)


// --- Глобальное Игровое Состояние ---
// Эти переменные содержат всю информацию о текущем состоянии игры
let score = START_SCORE; // Текущий счет игрока, начинаем с константы
let lives = START_LIVES; // Оставшиеся жизни игрока, начинаем с константы

// Ссылки на основные игровые объекты
let player = null;        // Объект игрока (экземпляр класса Player)
let enemies = [];         // Массив активных врагов (экземпляры классов Goomba, Koopa Troopa и т.д.)
let blocks = [];          // Массив активных блоков (экземпляры класса Block)
// let items = [];         // Массив активных предметов (экземпляры классов Mushroom, Fireball и т.д.)

let gameRunning = true;   // Флаг, указывающий, активен ли игровой процесс (не пауза, не Game Over)

// Ссылка на контекст рисования Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Получаем ссылки на элементы UI из HTML
const scoreDisplay = document.getElementById('ui-score');
const livesDisplay = document.getElementById('ui-lives');
const touchControls = document.getElementById('touch-controls'); // Также получаем контейнер touch-кнопок

// --- Переменные для игрового цикла и времени ---
let lastTime = 0; // Время предыдущего кадра (для расчета deltaTime)
// let cameraX = 0; // Позиция камеры по X (для прокрутки мира) - не реализовано в этом базовом примере


// --- Основные функции игры ---

/**
 * Главная функция игрового цикла. Вызывается браузером через requestAnimationFrame.
 * В этой функции происходит обновление состояния игры и отрисовка следующего кадра.
 * @param {number} timestamp - Высокоточное время (в миллисекундах) с момента загрузки страницы.
 */
function gameLoop(timestamp) {
    // Если игра не должна обновляться/рисоваться (например, пауза, Game Over), просто выходим
    if (!gameRunning) {
        // Можно запросить следующий кадр только при определенных условиях (например, для анимации меню)
        // или полностью остановить цикл. В этом примере цикл просто продолжает работать, но update() и draw() неактивны.
        requestAnimationFrame(gameLoop); // Продолжаем запрашивать кадры, чтобы можно было "разбудить" игру
        return;
    }

    // Рассчитываем время, прошедшее с предыдущего кадра
    // deltaTime полезно для создания физики и анимации, независимых от частоты кадров.
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Обновляем состояние всех игровых объектов и обрабатываем взаимодействия
    update(deltaTime);

    // Отрисовываем текущее состояние игрового мира
    draw();

    // Запрашиваем у браузера отрисовку следующего кадра
    requestAnimationFrame(gameLoop);
}

/**
 * Обновляет логику всех игровых объектов и обрабатывает их взаимодействие.
 * Эта функция вызывается в каждом кадре игрового цикла.
 * @param {number} deltaTime - Время, прошедшее с предыдущего кадра.
 */
function update(deltaTime) {
    // Получаем текущее состояние ввода (нажаты ли кнопки/клавиши)
    const inputState = getInputState();

    // --- Обновление объектов ---
    // Обновляем игрока
    // Передаем player.update() состояние ввода, массивы блоков и врагов, а также ссылку на объект game
    // для обработки событий вроде потери жизни или сбора предметов.
    if (player) {
        player.update(deltaTime, inputState, blocks, enemies, game);
    }

    // Обновляем врагов
    // Сначала фильтруем массив enemies, чтобы удалить врагов, помеченных как !isAlive (например, раздавленных)
    enemies = enemies.filter(enemy => enemy.isAlive);
    // Обновляем каждого оставшегося живого врага
    enemies.forEach(enemy => enemy.update(deltaTime, blocks)); // Передаем врагам блоки для коллизий

    // Обновляем предметы (если есть)
    // Сначала фильтруем массив items, чтобы удалить собранные предметы
    // items = items.filter(item => !item.isCollected);
    // Обновляем каждый оставшийся предмет
    // items.forEach(item => item.update(deltaTime, blocks, player)); // Предметы могут взаимодействовать с игроком и блоками

    // --- Обработка Коллизий Между Разными Типами Объектов ---
    // Коллизии между объектами одного типа (например, игрок-блок) могут обрабатываться
    // внутри метода update() самого объекта, но коллизии между разными типами (игрок-враг)
    // лучше обрабатывать здесь, в общем цикле update.

     // Проверка коллизий игрока с врагами
     if (player && player.isAlive) {
         // Перебираем всех живых врагов
         enemies.forEach((enemy) => {
             // Проверка наложения между прямоугольниками игрока и врага (AABB - Axis-Aligned Bounding Box)
             if (player.x < enemy.x + enemy.width &&
                 player.x + player.width > enemy.x &&
                 player.y < enemy.y + enemy.height &&
                 player.y + player.height > enemy.y) {

                 // !!! Коллизия обнаружена !!!
                 // Теперь определяем, как именно игрок столкнулся с врагом.
                 // Самый простой способ - проверить, падал ли игрок и находится ли его нижняя грань
                 // достаточно близко к верхней грани врага.

                 const playerBottom = player.y + player.height;
                 const enemyTop = enemy.y;
                 // Дельта, чтобы учесть движение за кадр
                 const playerPrevBottom = player.y - player.vy + player.height;

                 // Упрощенное условие для "раздавливания" врага:
                 // Игрок падает (скорость по Y положительная)
                 // И нижняя часть игрока (в текущем или предыдущем кадре) была над или ровно на верхней части врага
                 // Это очень приблизительная проверка, требует доработки для точности
                 if (player.vy > 0 && playerPrevBottom <= enemyTop && playerBottom > enemyTop) {
                     // Игрок наступил на врага!
                     enemy.squash(); // Вызываем метод раздавливания у врага
                     player.vy = JUMP_FORCE / 2; // Игрок отскакивает вверх
                     addScore(SCORE_GOOMBA); // Добавляем очки за раздавленного врага
                     console.log("Игрок раздавил врага!");
                 } else {
                     // Игрок столкнулся с врагом сбоку или снизу - игрок получает урон
                     // Проверяем, что игрок не неуязвим
                     // if (!player.isInvincible) {
                          // player.takeDamage(game); // Вызываем метод получения урона у игрока
                          loseLife(); // Для простоты в этом базовом примере - сразу теряем жизнь
                          console.log("Игрок получил урон!");
                     // }
                 }
             }
         });

         // Проверка коллизий игрока с предметами (если есть items)
         // items.forEach((item, index) => {
         //      // Проверка наложения
         //      if (player.x < item.x + item.width &&
         //          player.x + player.width > item.x &&
         //          player.y < item.y + item.height &&
         //          player.y + player.height > item.y) {
         //          // Игрок подобрал предмет
         //          player.collectItem(item, game); // Вызываем метод сбора предмета у игрока
         //          // Предмет будет удален из массива items при следующей фильтрации
         //      }
         // });

     }

    // --- Обновление UI ---
    scoreDisplay.textContent = `Score: ${score}`; // Обновляем отображение счета
    livesDisplay.textContent = `Lives: ${lives}`; // Обновляем отображение жизней

    // --- Проверки Игрового Состояния (Победа/Поражение) ---
    if (lives <= 0) {
        gameOver(); // Если жизни закончились, вызываем функцию конца игры
    }
    // Добавьте условие победы (например, если игрок достиг конца уровня)
    // if (player && player.x >= END_OF_LEVEL_X) {
    //      levelComplete(); // Вызвать функцию завершения уровня
    // }
}

/**
 * Отрисовывает все игровые объекты и фон на canvas.
 * Эта функция вызывается в каждом кадре игрового цикла после update().
 */
function draw() {
    // Очищаем всю область canvas перед отрисовкой нового кадра
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- Отрисовка игрового мира ---
    // Порядок отрисовки важен: сначала фон, затем объекты на заднем плане,
    // затем объекты на переднем плане, и в конце игрок.

    // Фон (небо) уже задан через CSS background-color для body.
    // Если нужен более сложный фон (горы, облака на разных слоях),
    // их нужно рисовать здесь.

    // Рисуем блоки
    blocks.forEach(block => block.draw(ctx));

    // Рисуем врагов
    enemies.forEach(enemy => enemy.draw(ctx));

    // Рисуем предметы (если есть)
    // items.forEach(item => item.draw(ctx));

    // Рисуем игрока
    // Рисуем игрока последним, чтобы он всегда был поверх всех других объектов
    if (player) {
        player.draw(ctx);
    }

    // UI элементы (счет, жизни, touch-кнопки) являются обычными HTML элементами
    // и автоматически отображаются браузером поверх canvas согласно CSS стилям.
    // Их не нужно рисовать в этой функции draw().

    // Отладка: можно рисовать хитбоксы объектов
    // blocks.forEach(block => { ctx.strokeStyle = 'blue'; ctx.strokeRect(block.x, block.y, block.width, block.height); });
    // enemies.forEach(enemy => { ctx.strokeStyle = 'red'; ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height); });
    // if (player) { ctx.strokeStyle = 'green'; ctx.strokeRect(player.x, player.y, player.width, player.height); }
}


// --- Функции управления игровым состоянием (жизни, очки, сброс) ---

/**
 * Добавляет указанное количество очков к текущему счету игрока.
 * @param {number} amount - Количество добавляемых очков.
 */
function addScore(amount) {
    score += amount;
    // UI будет обновлен в следующем кадре в функции update()
}

/**
 * Уменьшает количество жизней игрока. Если жизни заканчиваются, вызывает game over.
 */
function loseLife() {
    lives--;
    // UI будет обновлен в следующем кадре в функции update()

    if (lives <= 0) {
        gameOver(); // Если жизни <= 0, игра окончена
    } else {
        console.log(`Игрок потерял жизнь. Осталось: ${lives}`);
        // Логика, выполняющаяся после потери жизни, но до Game Over:
        // - Перезагрузка уровня или сброс игрока на контрольную точку
        resetPlayerPosition(); // Сбрасываем позицию игрока
        // - Временная неуязвимость игрока
        // player.isInvincible = true; // Нужно реализовать в классе Player
        // player.invincibilityTimer = 2000; // На 2 секунды (пример)
        // - Звук потери жизни
    }
}

/**
 * Сбрасывает позицию игрока в начальную точку уровня (или последнюю контрольную точку).
 * Вызывается после потери жизни (если жизни > 0).
 */
function resetPlayerPosition() {
     // В этом базовом примере просто сбрасываем игрока на позицию по умолчанию
     // В реальной игре нужно иметь возможность получить начальную позицию текущего уровня
     // или позицию последней посещенной контрольной точки.
     if (player) {
        player.x = DEFAULT_PLAYER_START_X;
        player.y = DEFAULT_PLAYER_START_Y;
        player.vx = 0;
        player.vy = 0;
        player.isJumping = false;
        player.isGrounded = true; // Предполагаем, что возрождаемся на твердой земле

        // Сбрасываем состояние Марио, если он был большим или огненным (как в оригинале)
        // player.isBigMario = false;
        // player.height = TILE_SIZE;
        // player.hasFireFlower = false;

        // Устанавливаем временную неуязвимость после возрождения
        // player.isInvincible = true;
        // player.invincibilityTimer = 2000; // 2 секунды неуязвимости
     }
     console.log("Позиция игрока сброшена.");
}


/**
 * Обрабатывает событие окончания игры (когда у игрока не осталось жизней).
 */
function gameOver() {
    console.log("GAME OVER!");
    gameRunning = false; // Останавливаем игровой цикл (фактически, update и draw перестанут выполняться)

    // Здесь должна быть логика отображения финального экрана "GAME OVER":
    // - Показать сообщение "GAME OVER"
    // - Возможно, отобразить итоговый счет
    // - Предложить начать новую игру
    // - Остановить фоновую музыку
}

// --- Вспомогательные функции для управления объектами ---

/**
 * Добавляет новый игровой объект (например, Fireball, Mushroom) в соответствующие массивы игры.
 * Это полезно, когда блоки или игрок создают новые объекты во время игры.
 * @param {object} obj - Игровой объект для добавления (экземпляр Block, Enemy, Item и т.д.).
 */
// function addGameObject(obj) {
//      if (obj instanceof Enemy) {
//          enemies.push(obj);
//      } else if (obj instanceof Item) {
//          items.push(obj);
//      }
//      // Добавьте другие типы объектов
// }

// --- Инициализация Игры ---

/**
 * Инициализирует все компоненты игры при загрузке страницы и запускает игровой цикл.
 */
function init() {
    console.log("Инициализация игры...");

    // 1. Настраиваем размеры canvas, если они не заданы в HTML/CSS или требуют масштабирования
    // canvas.width = GAME_WIDTH;
    // canvas.height = GAME_HEIGHT;
    // Если нужно масштабирование на весь экран мобильного:
    // function resizeCanvas() {
    //      canvas.width = window.innerWidth;
    //      canvas.height = window.innerHeight;
    //      // Нужно будет пересчитывать scale для отрисовки игрового мира на новом размере canvas
    //      // Это значительно усложняет отрисовку и коллизии
    // }
    // window.addEventListener('resize', resizeCanvas);
    // resizeCanvas(); // Вызываем один раз при старте

    // Более простой подход для мобильных: задать canvas фиксированный размер и масштабировать его через CSS.
    // Но тогда UI элементы #ui-score, #ui-lives, #touch-controls должны быть
    // либо вне #game-container, либо #game-container тоже должен масштабироваться,
    // и их позиционирование relative/absolute должно работать с этим масштабом.
    // Текущий CSS и JS используют фиксированные размеры canvas и positioning внутри контейнера,
    // полагаясь на мета-тег viewport для масштабирования всего содержимого страницы.

    // 2. Загружаем данные уровня и создаем начальные игровые объекты
    const levelObjects = loadLevel(level1_1_data); // Используем данные уровня из level.js
    blocks = levelObjects.blocks; // Получаем массив блоков из загрузчика уровня
    enemies = levelObjects.enemies; // Получаем массив врагов
    // items = levelObjects.items; // Получаем массив предметов (если они загружаются)

    // 3. Создаем объект игрока, используя начальную позицию из уровня (или по умолчанию)
    if (levelObjects.playerStart) {
        player = new Player(levelObjects.playerStart.x, levelObjects.playerStart.y);
    } else {
        // Если начальная позиция игрока не была указана в данных уровня
        player = new Player(DEFAULT_PLAYER_START_X, DEFAULT_PLAYER_START_Y); // Используем константы по умолчанию
    }
     // Убедимся, что начальное состояние игрока корректно (например, isGrounded=true если он на земле)
     player.isGrounded = true; // Предполагаем, что стартует на земле в начале уровня


    // 4. Настраиваем обработку ввода
    // Передаем объект игрока, чтобы input.js мог вызывать его методы (jump, fire)
    setupInput(player);

    // 5. Убеждаемся, что UI отображает начальные значения
    scoreDisplay.textContent = `Score: ${score}`;
    livesDisplay.textContent = `Lives: ${lives}`;

    console.log("Игра инициализирована. Запуск игрового цикла.");

    // 6. Запускаем главный игровой цикл
    lastTime = performance.now(); // Получаем текущее время для корректного расчета deltaTime первого кадра
    requestAnimationFrame(gameLoop);
}

// Запускаем функцию инициализации, когда вся страница и все скрипты полностью загружены
window.onload = init;

// Также можно предоставить некоторые функции глобально, если другие скрипты должны их вызывать
// Например, для добавления очков из класса Block, если не передается ссылка на game
// window.addScore = addScore; // Пример: делаем addScore доступной глобально

// Чтобы иметь возможность вызывать loseLife из Player, если player.takeDamage не реализован
// или для падения в яму, можно сделать функции управления состоянием доступными извне
const game = {
    addScore: addScore,
    loseLife: loseLife,
    resetPlayerPosition: resetPlayerPosition,
    gameOver: gameOver,
    // addGameObject: addGameObject // Если нужна функция добавления объектов
    // Добавьте ссылки на массивы объектов, если они нужны другим классам
    // enemies: enemies, // !!! Осторожно, передача массивов по ссылке может привести к сложным зависимостям !!!
    // blocks: blocks
};
// Теперь в Player и Block можно использовать game.addScore() или game.loseLife()
// (Убедитесь, что вы передаете game в их методы update/hit)

// scripts/player.js

// Импортируем необходимые константы
import { TILE_SIZE, GRAVITY, JUMP_FORCE, PLAYER_SPEED, GAME_WIDTH, GAME_HEIGHT, MAX_FALL_SPEED } from './constants.js';
// Импортируем классы других объектов для проверки коллизий
import { Block } from './block.js';
import { Goomba } from './enemy.js';
// import { Mushroom } from './items.js'; // Если есть предметы

/**
 * Класс, представляющий игрового персонажа (Марио).
 */
export class Player {
    /**
     * @param {number} x - Начальная X-координата игрока.
     * @param {number} y - Начальная Y-координата игрока.
     */
    constructor(x, y) {
        this.x = x; // Позиция X
        this.y = y; // Позиция Y
        this.width = TILE_SIZE; // Ширина игрока
        this.height = TILE_SIZE * 2; // Высота игрока (изначально "Большой Марио" для упрощения коллизий с Goomba)
                                      // В реальной игре начальная высота = TILE_SIZE, и она увеличивается
                                      // при подборе гриба.

        this.vx = 0; // Горизонтальная скорость
        this.vy = 0; // Вертикальная скорость

        this.isJumping = false; // Находится ли игрок в прыжке
        this.isGrounded = false; // Находится ли игрок на твердой поверхности

        // Состояния, получаемые из input.js
        this.isMovingLeft = false;
        this.isMovingRight = false;
        // this.isFiring = false; // Для огненного шара

        // Игровые состояния Марио
        this.isBigMario = true; // Начнем сразу с "Большого Марио" для демонстрации
                               // В реальной игре: false по умолчанию
        // this.hasFireFlower = false; // Есть ли огненный цветок
        // this.isInvincible = false; // Временная неуязвимость после урона
        // this.invincibilityTimer = 0; // Таймер неуязвимости
        // this.fireTimer = 0; // Таймер между выстрелами огненными шарами

        this.isAlive = true; // Жив ли игрок
    }

    /**
     * Обновляет состояние игрока (позиция, скорость, коллизии).
     * @param {number} deltaTime - Время, прошедшее с предыдущего кадра (в миллисекундах).
     * @param {object} inputState - Текущее состояние ввода (получено из input.js).
     * @param {Block[]} blocks - Массив всех блоков на уровне.
     * @param {Enemy[]} enemies - Массив всех врагов на уровне.
     * @param {Game} game - Ссылка на объект игры для взаимодействия (например, получение урона, создание предметов).
     */
    update(deltaTime, inputState, blocks, enemies, game) {
        // Если игрок не жив, не обновляем его логику
        if (!this.isAlive) {
             // Логика смерти игрока (анимация, таймер перед Game Over/возрождением)
             // this.deathAnimationTimer -= deltaTime;
             // if (this.deathAnimationTimer <= 0) {
             //      game.handlePlayerDeathComplete(); // Уведомить игру о завершении анимации смерти
             // }
             return; // Прекращаем обновление, если игрок мертв
        }

        // --- Обновление состояния на основе ввода ---
        this.isMovingLeft = inputState.left;
        this.isMovingRight = inputState.right;
        // inputState.jump и inputState.action обрабатываются в input.js и вызывают jump()/fire() при первом нажатии

        // --- Применение физики ---
        // Применяем гравитацию к вертикальной скорости
        // (В реальной физике: this.vy += GRAVITY * (deltaTime / 1000);)
        this.vy += GRAVITY;
        // Ограничиваем максимальную скорость падения
        if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;

        // Вычисляем горизонтальную скорость на основе движения
        this.vx = 0;
        if (this.isMovingLeft) {
            this.vx = -PLAYER_SPEED;
        } else if (this.isMovingRight) {
            this.vx = PLAYER_SPEED;
        }

        // --- Обработка Коллизий ---
        // Проверка и разрешение коллизий - это ключевая и самая сложная часть платформера.
        // Здесь мы будем проверять коллизии с блоками и врагами.

        // Сбрасываем флаг isGrounded перед проверкой коллизий
        this.isGrounded = false;
        let hitCeiling = false; // Флаг удара головой

        // --- Коллизии с блоками ---
        // Сначала обновляем X, проверяем коллизии по X, затем обновляем Y, проверяем коллизии по Y.
        // Это помогает правильно обрабатывать коллизии с углами.

        // Проверяем коллизии по горизонтали
        const nextX = this.x + this.vx;
        blocks.forEach(block => {
            if (!block.isSolid) return; // Проверяем коллизию только с твердыми блоками

             // Проверка наложения между *предстоящей* позицией игрока по X и текущей позицией блока
             // и текущей позицией игрока по Y и текущей позицией блока
             if (nextX < block.x + block.width &&
                 nextX + this.width > block.x &&
                 this.y < block.y + block.height && // Проверка по текущему Y игрока
                 this.y + this.height > block.y) {

                 // Есть горизонтальная коллизия!
                 if (this.vx > 0) { // Игрок движется вправо
                     this.x = block.x - this.width; // Ставим игрока рядом с блоком слева от него
                 } else if (this.vx < 0) { // Игрок движется влево
                     this.x = block.x + block.width; // Ставим игрока рядом с блоком справа от него
                 }
                 this.vx = 0; // Останавливаем горизонтальное движение при столкновении
                 collidedHorizontally = true; // Флаг горизонтальной коллизии (можно использовать позже)
            }
        });

        // Обновляем X позицию (она уже скорректирована, если была коллизия)
        this.x += this.vx;


        // Проверяем коллизии по вертикали (после обновления X)
        const nextY = this.y + this.vy;
         blocks.forEach(block => {
            if (!block.isSolid) return; // Проверяем коллизию только с твердыми блоками

            // Проверка наложения между текущей позицией игрока по X
            // и *предстоящей* позицией игрока по Y и текущей позицией блока
             if (this.x < block.x + block.width && // Проверка по текущему X игрока
                 this.x + this.width > block.x &&
                 nextY < block.y + block.height &&
                 nextY + this.height > block.y) {

                 // Есть вертикальная коллизия!
                 if (this.vy > 0) { // Игрок падает вниз (приземляется на блок)
                     this.y = block.y - this.height; // Ставим игрока ровно на верхнюю грань блока
                     this.vy = 0; // Останавливаем вертикальное движение
                     this.isJumping = false; // Игрок больше не в прыжке
                     this.isGrounded = true; // Игрок теперь на земле
                 } else if (this.vy < 0) { // Игрок движется вверх (ударяется головой об блок)
                     this.y = block.y + block.height; // Ставим игрока ровно под нижнюю грань блока
                     this.vy = 0; // Останавливаем вертикальное движение (отскакиваем вниз)
                     hitCeiling = true; // Устанавливаем флаг удара головой

                     // Если блок может быть ударен (например, блок вопроса или кирпич)
                     block.hit(this, game); // Вызываем метод hit() блока
                 }
            }
        });

        // Обновляем Y позицию (она уже скорректирована, если была коллизия)
        this.y += this.vy;


        // --- Коллизии с врагами ---
        // Коллизия игрока с врагами обычно обрабатывается после обновления позиций
        // всех объектов в функции update() game.js, так как это взаимодействие
        // между разными классами объектов.

        // --- Проверки границ мира ---
        // Не даем игроку уйти за левый край экрана
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        }

        // Не даем игроку уйти за правый край экрана (при отсутствии прокрутки камеры)
        // В реальной игре с прокруткой мира, эта граница будет сдвигаться.
        if (this.x + this.width > GAME_WIDTH) {
            this.x = GAME_WIDTH - this.width;
            this.vx = 0;
        }

        // Не даем игроку уйти за верхний край экрана
        if (this.y < 0) {
            this.y = 0;
            this.vy = 0;
        }

        // Обработка падения в пропасть (нижняя граница экрана)
        if (this.y + this.height > GAME_HEIGHT) {
             // Игрок упал ниже нижней границы игрового мира
             // Это считается падением в пропасть и потерей жизни
             // game.loseLife(); // Вызываем функцию потери жизни у объекта Game
             console.log("Игрок упал в пропасть!"); // Логируем событие
             // Для этого базового примера просто возвращаем игрока в начальную позицию
             game.resetPlayerPosition(); // Вызываем метод сброса позиции у объекта Game
        }

        // --- Обновление состояний, зависящих от времени (неуязвимость, таймеры Fireball) ---
        // if (this.isInvincible) {
        //     this.invincibilityTimer -= deltaTime;
        //     if (this.invincibilityTimer <= 0) {
        //         this.isInvincible = false;
        //     }
        // }
        // if (this.fireTimer > 0) {
        //      this.fireTimer -= deltaTime;
        // }
    }

    /**
     * Рисует игрока на canvas.
     * @param {CanvasRenderingContext2D} ctx - Контекст отрисовки canvas.
     */
    draw(ctx) {
        // Если игрок временно неуязвим, можно сделать его мигающим (не реализовано)
        // if (this.isInvincible && Math.floor(this.invincibilityTimer / 100) % 2 === 0) {
        //      return; // Не рисуем в этом кадре для эффекта мигания
        // }

        // Выбираем цвет в зависимости от состояния Марио (маленький/большой/огненный)
        // const bodyColor = this.hasFireFlower ? 'orange' : (this.isBigMario ? 'red' : 'red'); // Маленький и Большой - красный
        const bodyColor = 'red'; // Всегда красный в этом базовом примере

        // Рисуем основную часть тела игрока как прямоугольник
        ctx.fillStyle = bodyColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Рисуем "колпак" (примитивная визуализация)
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x, this.y, this.width, this.height / 4); // Белый прямоугольник сверху

        // Если Марио "Большой", можно добавить "рубашку" или другие детали
        // if (this.isBigMario) {
        //     ctx.fillStyle = 'blue'; // Цвет комбинезона
        //     ctx.fillRect(this.x, this.y + this.height / 4, this.width, this.height / 4); // Пример "рубашки"
        // }

        // Добавьте отрисовку спрайтов и анимации здесь!
        // Это просто заглушки.
    }

    /**
     * Выполняет действие прыжка для игрока.
     * Может быть вызван из input.js при нажатии кнопки прыжка.
     */
    jump() {
        // Игрок может прыгнуть только если он находится на земле
        if (this.isGrounded) {
            this.vy = JUMP_FORCE; // Задаем начальную вертикальную скорость прыжка
            this.isJumping = true; // Устанавливаем флаг, что игрок в прыжке
            this.isGrounded = false; // Игрок больше не на земле
            // Добавьте логику воспроизведения звука прыжка
             console.log("Прыжок!");
        }
    }

    /**
     * Выполняет действие "огонь" (например, бросок Fireball).
     * Может быть вызван из input.js при нажатии кнопки действия.
     */
    // fire() {
    //     // Игрок может "стрелять", только если у него есть Fire Flower и прошел кулдаун
    //     if (this.hasFireFlower /* && this.fireTimer <= 0 */) {
    //         console.log("Огонь!");
    //         // Создать новый объект Fireball
    //         // const fireball = new Fireball(this.x + this.width, this.y + this.height / 2, this.isMovingRight); // Создать Fireball
    //         // game.addGameObject(fireball); // Добавить Fireball в список активных объектов игры
    //         // this.fireTimer = 500; // Установить кулдаун (например, 500 мс)
    //     }
    // }

    /**
     * Игрок получает урон (столкновение с врагом сбоку, падение в яму и т.д.).
     * @param {Game} game - Ссылка на объект игры для управления жизнями.
     */
    takeDamage(game) {
        // if (this.isInvincible) return; // Игнорируем урон, если игрок неуязвим

        // if (this.isBigMario) {
        //     // Если Марио был большой, он становится маленьким
        //     this.isBigMario = false;
        //     this.height = TILE_SIZE; // Уменьшаем высоту (нужна логика коллизий для новой высоты)
        //     this.hasFireFlower = false; // Теряет огненный цветок, если был
        //     this.isInvincible = true; // Становится временно неуязвимым
        //     this.invincibilityTimer = 2000; // Неуязвимость на 2 секунды (пример)
        //     // Добавьте звук уменьшения и анимацию мигания
        //      console.log("Марио стал маленьким!");
        // } else {
            // Если Марио был маленький, он теряет жизнь
            game.loseLife(); // Вызываем функцию потери жизни в game.js
             console.log("Марио потерял жизнь!");
        // }
    }

    /**
     * Игрок собирает предмет (например, гриб или цветок).
     * @param {Item} item - Объект собранного предмета.
     * @param {Game} game - Ссылка на объект игры.
     */
    // collectItem(item, game) {
    //     console.log(`Игрок подобрал предмет: ${item.type}`);
    //     switch (item.type) {
    //         case 'mushroom':
    //             if (!this.isBigMario) {
    //                 this.growUp(); // Становимся большим
    //             }
    //             game.addScore(item.scoreValue);
    //             break;
    //         case 'flower':
    //             this.growUp(); // Становимся большим (если был маленьким)
    //             this.hasFireFlower = true; // Получаем Fire Flower
    //             game.addScore(item.scoreValue);
    //             break;
    //         case 'star':
    //              this.isInvincible = true; // Становимся неуязвимым
    //              this.invincibilityTimer = 10000; // Долгая неуязвимость (пример)
    //              // Добавьте эффект музыки и анимации
    //              game.addScore(item.scoreValue);
    //              break;
    //         case 'coin': // Монеты тоже могут быть предметами
    //             game.addScore(item.scoreValue);
    //             // Добавьте звук монеты
    //             break;
    //     }
    //     item.isCollected = true; // Помечаем предмет как собранный для удаления
    // }

    /**
     * Метод для увеличения Марио (после подбора гриба или цветка).
     */
    // growUp() {
    //     if (!this.isBigMario) {
    //          this.isBigMario = true;
    //          this.height = TILE_SIZE * 2; // Увеличиваем высоту
    //          this.y -= TILE_SIZE; // Сдвигаем вверх, чтобы нижняя часть осталась на месте
    //          // Добавьте анимацию увеличения
    //          console.log("Марио вырос!");
    //     }
    // }
}

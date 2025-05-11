// scripts/player.js

// Импортируем необходимые константы
import { TILE_SIZE, GRAVITY, JUMP_FORCE, PLAYER_SPEED, GAME_WIDTH, GAME_HEIGHT } from './constants.js';

export class Player {
    /**
     * @param {number} x - Начальная X-координата игрока.
     * @param {number} y - Начальная Y-координата игрока.
     */
    constructor(x, y) {
        this.x = x; // Позиция по X
        this.y = y; // Позиция по Y
        this.width = TILE_SIZE; // Ширина спрайта игрока (можно изменить для анимации)
        this.height = TILE_SIZE * 2; // Высота спрайта игрока (Марио обычно 2 плитки в высоту)

        this.vx = 0; // Скорость по X
        this.vy = 0; // Скорость по Y

        this.isJumping = false; // Флаг: игрок в прыжке
        this.isGrounded = false; // Флаг: игрок стоит на земле/платформе

        // Состояния для движения на основе ввода (устанавливаются в input.js)
        this.isMovingLeft = false;
        this.isMovingRight = false;

        // Состояние Марио (маленький, большой, огненный)
        this.isBigMario = false; // Пока всегда маленький
        // Добавьте другие состояния и таймеры для смены состояний (например, неуязвимость после удара)
    }

    /**
     * Обновляет состояние игрока в каждом кадре игры.
     * @param {number} deltaTime - Время, прошедшее с предыдущего кадра (в миллисекундах).
     * @param {object} inputState - Объект, содержащий текущее состояние ввода.
     * @param {Block[]} blocks - Массив всех блоков на уровне (для коллизий).
     * @param {Enemy[]} enemies - Массив всех врагов на уровне (для коллизий).
     */
    update(deltaTime, inputState, blocks, enemies) {
        // Обновляем состояние движения на основе inputState
        this.isMovingLeft = inputState.left;
        this.isMovingRight = inputState.right;
        // inputState.jump и inputState.action обрабатываются напрямую в setupInput,
        // вызывая методы jump() и fire() при первом нажатии

        // Применяем гравитацию к вертикальной скорости
        // (В реальной физике: this.vy += GRAVITY * (deltaTime / 1000);)
        this.vy += GRAVITY;

        // Вычисляем горизонтальную скорость на основе состояния движения
        this.vx = 0;
        if (this.isMovingLeft) {
            this.vx = -PLAYER_SPEED;
        } else if (this.isMovingRight) {
            this.vx = PLAYER_SPEED;
        }

        // --- Логика коллизий ---
        // Это УПРОЩЕННАЯ логика, которая только предотвращает прохождение сквозь блоки.
        // Правильная реализация коллизий требует определения стороны столкновения
        // и соответствующего изменения скорости и позиции.

        // Шаг 1: Предварительное обновление позиции (без учета коллизий)
        const nextX = this.x + this.vx;
        const nextY = this.y + this.vy;

        // Флаг для проверки, находится ли игрок на земле после всех проверок коллизий
        let landedOnBlock = false;

        // Проверяем коллизии с блоками
        blocks.forEach(block => {
            // Если блок не твердый (например, пустой блок), пропускаем проверку коллизии
             if (!block.isSolid) return;

            // Проверка наложения (простая AABB коллизия)
            if (nextX < block.x + block.width &&
                nextX + this.width > block.x &&
                nextY < block.y + block.height &&
                nextY + this.height > block.y) {

                // Есть наложение. Определяем, с какой стороны произошло столкновение.
                // Этот расчет очень приблизительный и требует доработки для точной симуляции.

                const xOverlap = (this.x < block.x + block.width && this.x + this.width > block.x);
                const yOverlap = (this.y < block.y + block.height && this.y + this.height > block.y);

                if (xOverlap && yOverlap) {
                    // Определяем сторону коллизии по предыдущей позиции
                    const prevX = this.x;
                    const prevY = this.y;

                    const movedHorizontally = (nextX !== prevX);
                    const movedVertically = (nextY !== prevY);

                    if (movedHorizontally && !movedVertically) {
                         // Коллизия произошла только по горизонтали
                         if (this.vx > 0) this.x = block.x - this.width; // Уперся в блок справа
                         if (this.vx < 0) this.x = block.x + block.width; // Уперся в блок слева
                         this.vx = 0; // Останавливаем горизонтальное движение
                    } else if (!movedHorizontally && movedVertically) {
                         // Коллизия произошла только по вертикали
                         if (this.vy > 0) { // Падает вниз (на блок)
                             this.y = block.y - this.height;
                             this.vy = 0; // Останавливаем падение
                             this.isJumping = false; // Прыжок завершен
                             landedOnBlock = true; // Помечаем, что приземлились на блок
                         }
                         if (this.vy < 0) { // Прыгает вверх (ударяется головой об блок)
                             this.y = block.y + block.height;
                             this.vy = 0; // Отскакиваем вниз
                             // Если блок умеет реагировать на удар (например, question block)
                             // block.hit(this); // Передаем игрока, чтобы блок знал, кто ударил
                         }
                    } else {
                        // Коллизия по обеим осям или без движения - нужна более сложная логика
                        // Для простоты, если есть наложение, просто отталкиваем
                         const xDiff = (nextX + this.width/2) - (block.x + block.width/2);
                         const yDiff = (nextY + this.height/2) - (block.y + block.height/2);

                         if (Math.abs(xDiff) > Math.abs(yDiff)) { // Коллизия больше по горизонтали
                             if (xDiff > 0) this.x = block.x + block.width;
                             else this.x = block.x - this.width;
                             this.vx = 0;
                         } else { // Коллизия больше по вертикали
                              if (yDiff > 0) { // Падает на блок
                                 this.y = block.y - this.height;
                                 this.vy = 0;
                                 this.isJumping = false;
                                 landedOnBlock = true;
                             } else { // Ударяется снизу
                                 this.y = block.y + block.height;
                                 this.vy = 0;
                                 // block.hit(this);
                             }
                         }
                    }
                }
            }
        });

        // Обновляем флаг isGrounded после проверки всех коллизий с блоками
        this.isGrounded = landedOnBlock;


        // --- Коллизия с врагами ---
        // Игрок vs Враг (добавьте эту логику здесь или в game.js update)
        // enemies.forEach((enemy, index) => {
        //     if (enemy.isAlive) {
        //         // Проверка наложения игрока и врага
        //         if (this.x < enemy.x + enemy.width &&
        //             this.x + this.width > enemy.x &&
        //             this.y < enemy.y + enemy.height &&
        //             this.y + this.height > enemy.y) {
        //
        //             // Определяем, как игрок столкнулся с врагом
        //             const playerBottom = this.y + this.height;
        //             const enemyTop = enemy.y;
        //
        //             if (this.vy > 0 && playerBottom < enemyTop + this.vy * 2) { // Приземлился сверху (VY > 0 означает падение)
        //                 // Раздавить врага
        //                 enemy.squash(); // Вызываем метод раздавливания у врага
        //                 this.vy = JUMP_FORCE / 2; // Отскок от врага
        //                 score += 100; // Добавить очки
        //             } else { // Столкнулся сбоку или снизу
        //                 // Игрок получает урон (теряет размер или жизнь)
        //                 // takeDamage(); // Метод обработки урона у игрока
        //             }
        //         }
        //     }
        // });


        // Окончательное обновление позиции после разрешения коллизий (если логика коллизий корректировала x, y)
        // Если логика коллизий только определяла новую позицию, этот шаг не нужен.
        // Для простой модели выше, x и y уже обновлены внутри цикла коллизий.


        // Проверка границ экрана (чтобы игрок не вышел за пределы)
        // Левая граница
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0; // Останавливаем движение, если уперся в границу
        }
        // Правая граница (нужна логика камеры, если мир шире экрана)
        // Пока просто ограничиваем правой границей canvas
        if (this.x + this.width > GAME_WIDTH) {
            this.x = GAME_WIDTH - this.width;
            this.vx = 0;
        }
        // Верхняя граница
         if (this.y < 0) {
             this.y = 0;
             this.vy = 0;
         }
        // Нижняя граница (смерть или приземление)
        if (this.y + this.height > GAME_HEIGHT) {
            this.y = GAME_HEIGHT - this.height;
            this.vy = 0;
            this.isJumping = false; // Не в прыжке, если на дне
            this.isGrounded = true; // На земле, если на дне

            // Здесь должна быть логика смерти игрока, если он упал в пропасть
            // Например: game.loseLife();
        }
    }

    /**
     * Рисует игрока на canvas.
     * @param {CanvasRenderingContext2D} ctx - Контекст отрисовки canvas.
     */
    draw(ctx) {
        // Отрисовываем игрока как простой прямоугольник
        ctx.fillStyle = 'red'; // Основной цвет
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Отрисовываем "колпак" (для примитивной визуализации)
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x, this.y, this.width, this.height / 4); // Белый прямоугольник сверху
        // Можно добавить усы/глаза и т.д.
    }

    /**
     * Выполняет действие прыжка для игрока.
     */
    jump() {
        // Игрок может прыгнуть только если он в данный момент находится на земле
        if (this.isGrounded) {
            this.vy = JUMP_FORCE; // Задаем вертикальную скорость для прыжка
            this.isJumping = true; // Устанавливаем флаг прыжка
            this.isGrounded = false; // Больше не на земле во время прыжка
            // Добавьте сюда логику для воспроизведения звука прыжка
        }
    }

    // Методы для обработки состояний Марио (увеличение, получение урона и т.д.)
    // growUp() {
    //      this.isBigMario = true;
    //      this.height = TILE_SIZE * 2; // Увеличиваем высоту (с учетом новой коллизии)
    //      // Добавьте анимацию увеличения
    // }

    // takeDamage() {
    //     if (this.isBigMario) {
    //         this.isBigMario = false;
    //         this.height = TILE_SIZE; // Снова становимся маленьким
    //         // Добавьте таймер неуязвимости и анимацию мерцания
    //     } else {
    //         // game.loseLife(); // Теряем жизнь
    //     }
    // }

    // fire() {
    //     if (this.hasFireFlower) {
    //         // Создать и запустить объект Fireball
    //         // fireTimer = ... // Таймер между выстрелами
    //     }
    // }
}

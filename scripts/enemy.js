// scripts/enemy.js

// Импортируем необходимые константы
import { TILE_SIZE, GRAVITY, ENEMY_SPEED, GAME_WIDTH, GAME_HEIGHT, SCORE_GOOMBA } from './constants.js';
import { Block } from './block.js'; // Может понадобиться для коллизий с блоками

/**
 * Класс, представляющий врага (например, Goomba).
 */
export class Goomba {
     /**
     * @param {number} x - Начальная X-координата врага.
     * @param {number} y - Начальная Y-координата врага.
     */
    constructor(x, y) {
        this.x = x; // Позиция X
        this.y = y; // Позиция Y
        this.width = TILE_SIZE; // Ширина (равна размеру плитки)
        this.height = TILE_SIZE; // Высота (равна размеру плитки)

        this.vx = -ENEMY_SPEED; // Скорость по X (изначально движется влево)
        this.vy = 0; // Скорость по Y

        this.isAlive = true; // Состояние: жив или раздавлен/убит
        // Добавьте состояние анимации (ходьба, раздавлен)
    }

    /**
     * Обновляет состояние врага в каждом кадре игры.
     * @param {number} deltaTime - Время, прошедшее с предыдущего кадра (в миллисекундах).
     * @param {Block[]} blocks - Массив всех блоков на уровне (для проверки коллизий с блоками).
     */
    update(deltaTime, blocks) {
        // Если враг не жив, не обновляем его логику движения и коллизий
        if (!this.isAlive) {
            // Возможно, здесь нужна логика анимации смерти или таймер перед удалением из массива enemies
            return;
        }

        // Применяем гравитацию к вертикальной скорости
        // (В реальной физике: this.vy += GRAVITY * (deltaTime / 1000);)
        this.vy += GRAVITY;
        // Ограничиваем максимальную скорость падения, чтобы избежать проблем с коллизиями
        // if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED; // MAX_FALL_SPEED из constants.js

        // Предварительное обновление позиции (без учета коллизий)
        const nextX = this.x + this.vx;
        const nextY = this.y + this.vy;

        // --- Логика коллизий врага с блоками ---
        // Это УПРОЩЕННАЯ логика коллизий только с блоками (земля, стены).
        // Враг должен поворачивать у края платформы или при столкновении со стеной.

        let collidedHorizontally = false; // Флаг горизонтальной коллизии
        let landedOnBlock = false; // Флаг приземления на блок

        blocks.forEach(block => {
             if (!block.isSolid) return; // Проверяем коллизию только с твердыми блоками

            // Проверка наложения (простая AABB коллизия) для *предстоящей* позиции
             if (nextX < block.x + block.width &&
                 nextX + this.width > block.x &&
                 nextY < block.y + block.height &&
                 nextY + this.height > block.y) {

                 // Есть наложение с твердым блоком. Определяем сторону столкновения.
                 // Это примитивный способ определения стороны.

                 const xOverlap = Math.min(nextX + this.width, block.x + block.width) - Math.max(nextX, block.x);
                 const yOverlap = Math.min(nextY + this.height, block.y + block.height) - Math.max(nextY, block.y);

                 if (xOverlap < yOverlap && xOverlap > 0) { // Коллизия больше по горизонтали
                     collidedHorizontally = true;
                     // Корректируем X, чтобы не застрять
                      if (this.vx > 0) this.x = block.x - this.width;
                      else this.x = block.x + block.width;
                     this.vx *= -1; // Меняем направление движения
                 } else if (yOverlap > 0) { // Коллизия больше по вертикали (или только вертикальная)
                      if (this.vy > 0) { // Падает на блок
                         this.y = block.y - this.height; // Ставим врага на блок
                         this.vy = 0; // Останавливаем падение
                         landedOnBlock = true; // Враг стоит на земле
                      }
                      if (this.vy < 0) { // Ударяется о блок снизу (например, если блок вылетел из блока вопроса)
                         this.y = block.y + block.height; // Отскакиваем вниз от блока
                         this.vy = 0;
                      }
                 }
            }
        });

         // Обновляем позицию после проверки коллизий
         if (!collidedHorizontally) { // Обновляем X только если не было горизонтальной коллизии
              this.x += this.vx;
         }
         this.y += this.vy; // Обновляем Y после вертикальной коллизии

        // Проверка на падение с обрыва:
        // Враг должен проверить, есть ли твердый блок прямо под его ногами
        // и чуть впереди по направлению движения. Если нет - повернуть.
        // Эта логика ЗНАЧИТЕЛЬНО сложнее и не включена в этот базовый пример.
        // Текущий враг просто будет ходить туда-сюда или падать с края canvas.


        // Проверка границ экрана (чтобы враг не исчез полностью, опционально)
        // if (this.x + this.width < 0 || this.x > GAME_WIDTH || this.y > GAME_HEIGHT) {
        //      // Враг ушел за пределы экрана или упал в пропасть - можно удалить его из массива enemies в game.js
        // }
    }

     /**
     * Рисует врага на canvas.
     * @param {CanvasRenderingContext2D} ctx - Контекст отрисовки canvas.
     */
    draw(ctx) {
        // Если враг не жив, рисуем его в состоянии смерти или не рисуем вовсе
        if (!this.isAlive) {
            // Пример: нарисовать раздавленного гумбу
            // ctx.fillStyle = 'darkred'; // Темнее цвет для раздавленного
            // ctx.fillRect(this.x, this.y + this.height * 0.75, this.width, this.height * 0.25); // Плоский прямоугольник
            return; // В этом примере просто не рисуем неживого врага
        }

        // Рисуем врага как простой прямоугольник (заглушка для спрайта)
        ctx.fillStyle = 'brown'; // Цвет Goomba
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Можно добавить примитивные глаза или другие детали
        // ctx.fillStyle = 'black';
        // ctx.fillRect(this.x + this.width * 0.2, this.y + this.height * 0.2, this.width * 0.2, this.height * 0.2);
        // ctx.fillRect(this.x + this.width * 0.6, this.y + this.height * 0.2, this.width * 0.2, this.height * 0.2);
    }

    /**
     * Обрабатывает событие "раздавливания" врага (например, прыжком игрока сверху).
     */
    squash() {
        if (this.isAlive) { // Убеждаемся, что враг был жив
            this.isAlive = false; // Устанавливаем состояние как неживой
            console.log("Враг раздавлен!");
            // Добавьте логику:
            // - Анимация раздавливания (например, сплющить спрайт на короткое время)
            // - Звук раздавливания
            // - Добавление очков (вызывается из game.js update после обнаружения коллизии)

            // Враг будет удален из массива enemies в game.js в следующем кадре (фильтрацией)
        }
    }

    // Метод, если враг может быть убит (например, огненным шаром), отличается от раздавливания
    // kill() {
    //     if (this.isAlive) {
    //          this.isAlive = false;
    //          console.log("Враг убит!");
    //          // Добавьте логику анимации смерти (переворачивание и падение вниз)
    //          // game.addScore(...); // Добавить очки
    //     }
    // }
}

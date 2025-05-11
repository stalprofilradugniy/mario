// scripts/enemy.js

// Импортируем необходимые константы
import { TILE_SIZE, GRAVITY, ENEMY_SPEED, GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import { Block } from './block.js'; // Может понадобиться для коллизий с блоками

export class Goomba {
     /**
     * @param {number} x - Начальная X-координата врага.
     * @param {number} y - Начальная Y-координата врага.
     */
    constructor(x, y) {
        this.x = x; // Позиция по X
        this.y = y; // Позиция по Y
        this.width = TILE_SIZE; // Ширина
        this.height = TILE_SIZE; // Высота

        this.vx = -ENEMY_SPEED; // Скорость по X (изначально движется влево)
        this.vy = 0; // Скорость по Y

        this.isAlive = true; // Состояние: жив или раздавлен/убит
        // Добавьте состояние анимации (ходьба, раздавлен)
    }

    /**
     * Обновляет состояние врага в каждом кадре игры.
     * @param {number} deltaTime - Время, прошедшее с предыдущего кадра.
     * @param {Block[]} blocks - Массив всех блоков на уровне (для коллизий).
     * // Врагам не обязательно нужен доступ к игроку, коллизия игрок-враг обычно обрабатывается игроком или в game.js
     */
    update(deltaTime, blocks) {
        // Если враг не жив, не обновляем его логику движения
        if (!this.isAlive) {
            // Возможно, здесь нужна логика анимации смерти или таймер перед удалением
            return;
        }

        // Применяем гравитацию
        // (В реальной физике: this.vy += GRAVITY * (deltaTime / 1000);)
        this.vy += GRAVITY;

        // Предварительное обновление позиции (без учета коллизий)
        const nextX = this.x + this.vx;
        const nextY = this.y + this.vy;

        // --- Логика коллизий врага с блоками ---
        // Это УПРОЩЕННАЯ логика. В SMB враг поворачивает у обрыва или стены.
        // Здесь он просто отскакивает при наложении на твердый блок.

        let hitBlock = false;
        blocks.forEach(block => {
             if (!block.isSolid) return;

            // Проверка наложения (AABB)
             if (nextX < block.x + block.width &&
                 nextX + this.width > block.x &&
                 nextY < block.y + block.height &&
                 nextY + this.height > block.y) {

                 // Есть наложение. Враг должен остановиться или повернуть.
                 // Для простоты, если есть наложение, он просто меняет направление
                 // Эта логика не обрабатывает падение с обрывов правильно!
                 // Для этого нужно проверять, есть ли блок ПОД врагом в следующем кадре.
                 const xOverlap = (this.x < block.x + block.width && this.x + this.width > block.x);
                 const yOverlap = (this.y < block.y + block.height && this.y + this.height > block.y);

                 if (xOverlap && yOverlap) {
                      // Это примитивная обработка: если есть любое наложение с блоком, повернуть
                      this.vx *= -1;
                      hitBlock = true; // Помечаем, что была коллизия с блоком
                      // Корректируем позицию, чтобы не застрять
                      if (this.vx > 0) this.x = block.x + block.width;
                      else this.x = block.x - this.width;
                 } else if (yOverlap && this.vy > 0) { // Падает на блок
                     this.y = block.y - this.height;
                     this.vy = 0; // Останавливаем падение
                 }
            }
        });

         // Окончательное обновление позиции после проверки коллизий
         // В более продвинутой логике коллизий, это может быть уже сделано выше
         if (!hitBlock) { // Обновляем X только если не столкнулись с блоком по горизонтали (очень примитивно)
              this.x += this.vx;
         }
         this.y += this.vy; // Обновляем Y после коллизии по Y

        // Проверка границ экрана (чтобы враг не ушел совсем за пределы, опционально)
        // if (this.x + this.width < 0 || this.x > GAME_WIDTH) {
        //      // Возможно, удаляем врага или возвращаем его
        // }
    }

     /**
     * Рисует врага на canvas.
     * @param {CanvasRenderingContext2D} ctx - Контекст отрисовки canvas.
     */
    draw(ctx) {
        // Если враг не жив (например, раздавлен), рисуем его иначе или не рисуем вовсе
        if (!this.isAlive) {
            // Пример: нарисовать раздавленного гумбу (просто более плоский прямоугольник)
            // ctx.fillStyle = 'brown';
            // ctx.fillRect(this.x, this.y + this.height / 2, this.width, this.height / 4);
            return; // В этом примере просто не рисуем
        }

        // Рисуем врага как простой прямоугольник
        ctx.fillStyle = 'brown'; // Цвет Goomba
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Можно добавить примитивные глаза или другие детали
    }

    /**
     * Обрабатывает раздавливание врага игроком.
     */
    squash() {
        this.isAlive = false; // Устанавливаем состояние как неживой
        // Добавьте логику анимации (например, короткое отображение раздавленного спрайта)
        // Добавьте логику добавления очков (это может сделать и game.js)
        // console.log("Goomba squashed!");
    }

    // Метод, если враг может быть убит (например, огненным шаром)
    // kill() {
    //     this.isAlive = false;
    //     // Анимация смерти
    // }
}

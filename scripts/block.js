// scripts/block.js

// Импортируем необходимые константы
import { TILE_SIZE } from './constants.js';
// Импортируем другие классы объектов, если блоки могут их создавать (например, Mushroom)
// import { Mushroom } from './items.js'; // Если есть отдельный файл для предметов

export class Block {
    /**
     * @param {number} x - X-координата блока.
     * @param {number} y - Y-координата блока.
     * @param {string} type - Тип блока ('solid', 'brick', 'question', 'empty', 'pipe-top', etc.).
     * @param {string} [content] - Содержимое блока (для 'question' блоков, например 'coin', 'mushroom').
     */
    constructor(x, y, type = 'solid', content = null) {
        this.x = x; // Позиция по X
        this.y = y; // Позиция по Y
        this.width = TILE_SIZE; // Ширина
        this.height = TILE_SIZE; // Высота
        this.type = type; // Тип блока
        this.content = content; // Содержимое (для блоков со знаком вопроса)

        this.isSolid = true; // По умолчанию блоки твердые

        // Настраиваем свойства в зависимости от типа
        switch (type) {
            case 'solid': // Неразрушимый блок (например, обычный блок в земле)
                this.isSolid = true;
                break;
            case 'brick': // Кирпичный блок (может ломаться)
                this.isSolid = true;
                break;
            case 'question': // Блок со знаком вопроса
                this.isSolid = true; // Твердый, пока не ударили
                this.content = content || 'coin'; // Содержимое по умолчанию - монета
                this.hits = 0; // Количество ударов снизу
                break;
            case 'empty': // Пустой блок (например, после удара по блоку вопроса)
                this.isSolid = false; // Не твердый
                break;
            case 'pipe-top': // Верхняя часть трубы
            case 'pipe-bottom': // Нижняя часть трубы
                 this.isSolid = true; // Трубы обычно твердые
                 // Можно добавить логику перехода на другой уровень для верхней части
                 break;
            // Добавьте другие типы
        }
    }

     /**
     * Рисует блок на canvas.
     * @param {CanvasRenderingContext2D} ctx - Контекст отрисовки canvas.
     */
    draw(ctx) {
        // Выбираем цвет или спрайт в зависимости от типа блока
        let color = 'sienna'; // По умолчанию кирпичный/твердый
        let displayContent = false; // Рисовать ли содержимое (например, знак вопроса)

        switch (this.type) {
            case 'solid':
                color = 'gray'; // Серый для земли/твердых блоков
                break;
            case 'brick':
                color = 'sienna'; // Коричневый для кирпичей
                break;
            case 'question':
                color = 'gold'; // Золотой для блока вопроса
                displayContent = true; // Рисуем содержимое (вопрос)
                break;
            case 'empty':
                 color = 'darkgray'; // Темно-серый для пустых блоков
                 this.isSolid = false; // Убедимся, что пустой не твердый
                 break;
            case 'pipe-top':
            case 'pipe-bottom':
                 color = 'green'; // Зеленый для труб
                 break;
        }

        // Рисуем блок как прямоугольник
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Опционально: Рисуем содержимое (например, знак вопроса)
        if (displayContent) {
            ctx.fillStyle = 'black'; // Цвет знака вопроса
            ctx.font = `${TILE_SIZE * 0.8}px sans-serif`; // Размер шрифта
            ctx.textAlign = 'center'; // Выравнивание по центру
            ctx.textBaseline = 'middle'; // Выравнивание по середине по вертикали
            ctx.fillText('?', this.x + this.width / 2, this.y + this.height / 2);
        }
        // Для пустых блоков (after hit) можно нарисовать пустой квадрат или что-то подобное
    }

    /**
     * Обрабатывает удар по блоку снизу (обычно игроком).
     * @param {Player} player - Объект игрока, ударивший блок.
     * @returns {object|null} Объект, созданный блоком (например, монета, гриб), или null.
     */
    hit(player) {
        let spawnedItem = null; // Переменная для возврата созданного предмета

        if (this.type === 'question') {
            if (this.hits === 0) { // Реагируем только при первом ударе
                // console.log(`Block hit! Content: ${this.content}`);
                this.hits++; // Увеличиваем счетчик ударов
                this.type = 'empty'; // Меняем тип блока на пустой

                // Логика появления содержимого
                if (this.content === 'coin') {
                    // Увеличить счет игрока (нужен доступ к игровому состоянию)
                    // Пример: game.addScore(200); // Через функцию в game.js
                    // Или напрямую, если score глобальный (не рекомендуется в больших проектах)
                     // score += 200;
                    // console.log("Coin spawned (visually implied)"); // Отрисовку монеты нужно добавить
                } else if (this.content === 'mushroom') {
                    // Создать экземпляр Mushroom над блоком
                    // spawnedItem = new Mushroom(this.x, this.y - TILE_SIZE);
                    // console.log("Mushroom spawned (placeholder)");
                }
                // Другие типы содержимого (цветок, звезда и т.д.)

                // После удара блок вопроса становится не твердым (или только верхняя часть)
                this.isSolid = false; // Для простоты весь блок становится не твердым
            }
        } else if (this.type === 'brick') {
            // Логика для кирпичных блоков
            if (player && player.isBigMario) { // Если игрок "Большой Марио"
                // Ломаем блок!
                // console.log("Brick broken!");
                this.isSolid = false; // Блок становится не твердым
                this.type = 'empty'; // Меняем тип на пустой (или удаляем блок из списка)
                // Добавьте анимацию разрушения
            } else {
                // Если Марио маленький, он просто ударяется головой - блок трясется
                // console.log("Brick shaken!");
                // Добавьте простую анимацию тряски
            }
        }
        // Твердые блоки ('solid') обычно не делают ничего при ударе

        // Возвращаем созданный предмет (если есть)
        return spawnedItem;
    }
}

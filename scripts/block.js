// scripts/block.js

// Импортируем необходимые константы
import { TILE_SIZE, SCORE_COIN } from './constants.js';
// Импортируем другие классы объектов, если блоки могут их создавать (например, Mushroom)
// import { Mushroom } from './items.js';

/**
 * Класс, представляющий блок в игровом мире (земля, кирпич, знак вопроса и т.д.).
 */
export class Block {
    /**
     * @param {number} x - X-координата верхнего левого угла блока.
     * @param {number} y - Y-координата верхнего левого угла блока.
     * @param {string} type - Тип блока ('solid', 'brick', 'question', 'empty', 'pipe-top', 'pipe-bottom').
     * @param {string} [content] - Содержимое блока (для 'question' блоков, например 'coin', 'mushroom').
     */
    constructor(x, y, type = 'solid', content = null) {
        this.x = x; // Позиция X
        this.y = y; // Позиция Y
        this.width = TILE_SIZE; // Ширина блока (равна размеру плитки)
        this.height = TILE_SIZE; // Высота блока (равна размеру плитки)
        this.type = type; // Тип блока
        this.content = content; // Содержимое (используется для блоков со знаком вопроса)

        this.isSolid = true; // Является ли блок твердым (нельзя пройти сквозь него)

        // Настраиваем свойства в зависимости от типа блока
        switch (type) {
            case 'solid': // Неразрушимый твердый блок (например, блоки земли, стены)
                this.isSolid = true;
                break;
            case 'brick': // Кирпичный блок (может ломаться Большим Марио)
                this.isSolid = true;
                // Может иметь содержимое, которое выпадает при ударе снизу маленьким Марио
                // this.content = content || null;
                break;
            case 'question': // Блок со знаком вопроса
                this.isSolid = true; // Твердый, пока не ударен
                this.content = content || 'coin'; // Содержимое по умолчанию - монета
                this.hits = 0; // Количество ударов снизу (для блоков вопроса)
                break;
            case 'empty': // Пустой блок (после удара по блоку вопроса)
                this.isSolid = false; // Не твердый, можно пройти сквозь него
                break;
             case 'pipe-top': // Верхняя часть трубы
             case 'pipe-bottom': // Нижняя часть трубы
                  this.isSolid = true; // Трубы обычно твердые
                  // Можно добавить логику для входа в трубу (WARP ZONE)
                  break;
            // Добавьте другие типы блоков (например, блоки монеток, лестницы)
            default: // Неизвестный тип блока - считаем твердым по умолчанию
                this.isSolid = true;
                break;
        }
    }

     /**
     * Рисует блок на canvas.
     * @param {CanvasRenderingContext2D} ctx - Контекст отрисовки canvas.
     */
    draw(ctx) {
        // Выбираем цвет для рисования в зависимости от типа блока
        let color = 'gray'; // Цвет по умолчанию (например, для solid)
        let displayContent = false; // Флаг, указывающий, нужно ли рисовать содержимое (например, знак вопроса)

        switch (this.type) {
            case 'solid':
                color = '#8B4513'; // Земля/коричневый
                break;
            case 'brick':
                color = '#CD5C5C'; // Кирпичный/красный
                break;
            case 'question':
                color = '#FFD700'; // Золотой для блока вопроса
                displayContent = true; // Нужно нарисовать знак вопроса
                break;
            case 'empty':
                 color = '#A9A9A9'; // Темно-серый для пустого блока
                 break;
            case 'pipe-top':
            case 'pipe-bottom':
                 color = '#32CD32'; // Ярко-зеленый для труб
                 break;
            default:
                color = 'gray'; // Неизвестный тип
                break;
        }

        // Рисуем блок как простой прямоугольник
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Опционально: Рисуем содержимое блока (например, знак вопроса для question блока)
        if (displayContent) {
            // Для простоты рисуем текст. В реальной игре - спрайт знака вопроса.
            ctx.fillStyle = 'black'; // Цвет текста
            ctx.font = `${TILE_SIZE * 0.7}px Arial`; // Размер шрифта (чуть меньше плитки)
            ctx.textAlign = 'center'; // Выравнивание текста по центру блока по горизонтали
            ctx.textBaseline = 'middle'; // Выравнивание текста по середине блока по вертикали
            ctx.fillText('?', this.x + this.width / 2, this.y + this.height / 2);
        }
        // Для разбитых кирпичей или ударенных блоков вопроса, можно нарисовать их "разбитое" состояние
    }

    /**
     * Обрабатывает удар по этому блоку снизу (обычно игроком).
     * @param {Player} player - Объект игрока, который ударил этот блок.
     * @param {Game} game - Ссылка на объект игры для доступа к игровому состоянию (например, счету, созданию предметов).
     * @returns {object|null} Объект, созданный блоком (например, монета, гриб), или null.
     */
    hit(player, game) {
        let spawnedItem = null; // Предмет, который может появиться из блока

        if (this.type === 'question') {
            if (this.hits === 0) { // Реагируем только при первом ударе по блоку вопроса
                console.log(`Блок "?" ударен! Содержимое: ${this.content}`);
                this.hits++; // Увеличиваем счетчик ударов
                this.type = 'empty'; // Меняем тип блока на "пустой"
                this.isSolid = false; // Пустой блок не является твердым (можно пройти сквозь него)

                // Логика появления содержимого блока
                switch (this.content) {
                    case 'coin':
                        game.addScore(SCORE_COIN); // Добавляем очки за монету
                        // Здесь нужно создать визуальный эффект вылетающей монеты
                        console.log("Монета получена!");
                        break;
                    case 'mushroom':
                        // Создать экземпляр Mushroom над блоком и добавить его в массив items игры
                        // spawnedItem = new Mushroom(this.x, this.y - TILE_SIZE);
                        console.log("Появился гриб!");
                        break;
                    // Добавьте другие типы содержимого (Fire Flower, Starman и т.д.)
                }
            }
            // Если блок вопроса уже был ударен (this.hits > 0), он просто "трясется" без появления нового содержимого
            // (Анимация тряски не реализована в этом базовом примере)

        } else if (this.type === 'brick') {
            // Логика для кирпичных блоков
            if (player && player.isBigMario) { // Если игрок "Большой Марио"
                console.log("Кирпич разбит!");
                this.isSolid = false; // Блок становится не твердым
                this.type = 'empty'; // Или можно пометить его как "разрушенный" и удалить из списка блоков в game.js
                // Добавьте анимацию разрушения кирпича
                // game.addScore(50); // Можно добавить очки за разрушение
            } else {
                // Если игрок "Маленький Марио", кирпич просто трясется
                console.log("Кирпич трясется.");
                // Добавьте анимацию тряски кирпича
            }
        }
        // Твердые блоки ('solid', 'pipe-top', 'pipe-bottom') обычно не реагируют на удар снизу

        // Возвращаем созданный предмет (если блок его создал)
        return spawnedItem;
    }

    // Метод для удаления блока (если он разрушен, например)
    // remove() {
    //     // Логика удаления этого блока из массива blocks в game.js
    // }
}

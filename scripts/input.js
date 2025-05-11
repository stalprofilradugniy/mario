// scripts/input.js

// Объект для отслеживания текущего состояния ввода
// Флаги устанавливаются в true, когда соответствующая кнопка/клавиша нажата
let inputState = {
    left: false,      // Нажата кнопка/клавиша "Влево"
    right: false,     // Нажата кнопка/клавиша "Вправо"
    jump: false,      // Нажата кнопка/клавиша "Прыжок"
    action: false     // Нажата кнопка/клавиша "Действие" (например, Fireball)
};

// Вспомогательные флаги для обработки нажатия (срабатывает один раз при нажатии)
let jumpButtonDown = false;
let actionButtonDown = false;

/**
 * Настраивает обработчики событий ввода для клавиатуры и touch-управления.
 * @param {Player} player - Ссылка на объект игрока. Необходима для вызова методов игрока (прыжок, огонь)
 *                          при активации соответствующего ввода.
 */
export function setupInput(player) {
    // --- Обработка ввода с клавиатуры (для десктопов) ---
    document.addEventListener('keydown', (e) => {
        // Если объект игрока не создан или игра не активна, игнорируем ввод
        if (!player /* || !game.is_active */) return;

        switch (e.key) {
            case 'ArrowLeft':
            case 'a': // Добавляем WASD как альтернативу стрелкам
                inputState.left = true;
                break;
            case 'ArrowRight':
            case 'd':
                inputState.right = true;
                break;
            case ' ': // Клавиша Пробел
            case 'ArrowUp':
            case 'w':
                // Вызываем метод прыжка только при первом нажатии кнопки
                if (!jumpButtonDown) {
                     player.jump(); // Предполагается, что у класса Player есть метод jump()
                     jumpButtonDown = true; // Устанавливаем флаг, чтобы игнорировать последующие нажатия до отпускания
                }
                break;
            case 'x': // Пример: клавиша 'x' для действия (например, Fireball)
            case 'f':
                // Вызываем метод действия только при первом нажатии кнопки
                if (!actionButtonDown) {
                     // player.fire(); // Предполагается, что у класса Player есть метод fire()
                     actionButtonDown = true; // Устанавливаем флаг
                }
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
         if (!player /* || !game.is_active */) return;

         switch (e.key) {
            case 'ArrowLeft':
            case 'a':
                inputState.left = false;
                break;
            case 'ArrowRight':
            case 'd':
                inputState.right = false;
                break;
            case ' ':
            case 'ArrowUp':
            case 'w':
                jumpButtonDown = false; // Сбрасываем флаг при отпускании кнопки прыжка
                break;
             case 'x':
             case 'f':
                 actionButtonDown = false; // Сбрасываем флаг кнопки действия
                 break;
         }
    });

    // --- Обработка touch-ввода (для смартфонов и планшетов) ---
    const touchLeft = document.getElementById('touch-left');
    const touchRight = document.getElementById('touch-right');
    const touchJump = document.getElementById('touch-jump');
    // const touchAction = document.getElementById('touch-action'); // Если есть кнопка действия

    const touchControls = document.getElementById('touch-controls'); // Контейнер для кнопок управления

    // Проверяем, является ли устройство touch-совместимым
    // ('ontouchstart' in window - старый, но быстрый способ)
    // (navigator.maxTouchPoints > 0 - более современный способ)
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0) {
         touchControls.style.display = 'flex'; // Показываем touch-управление, если оно было скрыто в CSS
         // Если вы полностью скрыли блок в CSS через display: none, то display = 'flex'
         // Если вы использовали visibility: hidden, то visibility = 'visible'

         // Добавляем обработчики событий для каждой touch-кнопки
         // touchstart: палец коснулся экрана
         // touchend: палец оторвался от экрана
         // touchcancel: касание было прервано (например, слишком далеко ушло)

         touchLeft.addEventListener('touchstart', (e) => {
             e.preventDefault(); // Предотвращаем стандартное поведение браузера (прокрутка, масштабирование)
             if (player /* && game.is_active */) inputState.left = true;
         });
         touchLeft.addEventListener('touchend', (e) => {
             e.preventDefault();
             if (player /* && game.is_active */) inputState.left = false;
         });
         touchLeft.addEventListener('touchcancel', (e) => { // Важно также обрабатывать отмену касания
             e.preventDefault();
             if (player /* && game.is_active */) inputState.left = false;
         });


         touchRight.addEventListener('touchstart', (e) => {
             e.preventDefault();
             if (player /* && game.is_active */) inputState.right = true;
         });
         touchRight.addEventListener('touchend', (e) => {
             e.preventDefault();
             if (player /* && game.is_active */) inputState.right = false;
         });
         touchRight.addEventListener('touchcancel', (e) => {
             e.preventDefault();
             if (player /* && game.is_active */) inputState.right = false;
         });

         touchJump.addEventListener('touchstart', (e) => {
             e.preventDefault();
             // Вызываем прыжок только при первом касании (срабатывает один раз)
             if (player /* && game.is_active */ && !jumpButtonDown) {
                 player.jump();
                 jumpButtonDown = true; // Устанавливаем флаг, чтобы игнорировать удержание
             }
         });
         touchJump.addEventListener('touchend', (e) => {
             e.preventDefault();
             jumpButtonDown = false; // Сбрасываем флаг при отпускании кнопки
         });
         touchJump.addEventListener('touchcancel', (e) => {
              e.preventDefault();
              jumpButtonDown = false;
         });

         // Обработка кнопки действия (если есть)
         // if (touchAction) {
         //     touchAction.addEventListener('touchstart', (e) => {
         //         e.preventDefault();
         //         if (player && !actionButtonDown) {
         //              // player.fire();
         //              actionButtonDown = true;
         //         }
         //     });
         //     touchAction.addEventListener('touchend', (e) => {
         //          e.preventDefault();
         //          actionButtonDown = false;
         //     });
         //      touchAction.addEventListener('touchcancel', (e) => {
         //           e.preventDefault();
         //           actionButtonDown = false;
         //      });
         // }

         // Важно: Если вы используете несколько touch-кнопок, может понадобиться
         // более сложная логика обработки touchmove и отслеживания individual touches (e.touches)
         // для корректной симуляции одновременного нажатия нескольких кнопок.
         // Текущая простая реализация хорошо работает для одиночных касаний или простых комбинаций.

    } else {
        // Если touch-устройство не обнаружено, скрываем touch-управление
        touchControls.style.display = 'none';
        // if (touchAction) touchAction.style.display = 'none';
    }
}

/**
 * Возвращает текущее состояние ввода.
 * Этот объект inputState используется в функции update() game.js
 * для определения действий игрока.
 * @returns {object} Объект с булевыми флагами для каждой кнопки/действия.
 */
export function getInputState() {
    return inputState;
}

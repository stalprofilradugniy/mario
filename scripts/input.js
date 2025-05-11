// scripts/input.js

// Объект для отслеживания состояния ввода (нажаты ли кнопки)
let inputState = {
    left: false,
    right: false,
    jump: false,
    // Добавьте другие кнопки, если они есть (например, fire)
    action: false // Пример для кнопки действия (огонь?)
};

// Флаг для предотвращения многократных прыжков при удержании кнопки
let jumpPressed = false;
let actionPressed = false; // Флаг для кнопки действия

/**
 * Настраивает обработчики событий ввода для клавиатуры и touch-управления.
 * @param {Player} player - Ссылка на объект игрока, чтобы вызывать его методы (например, jump).
 */
export function setupInput(player) {
    // Обработка ввода с клавиатуры (для десктопного тестирования)
    document.addEventListener('keydown', (e) => {
        // Убеждаемся, что игрок существует, прежде чем обрабатывать ввод
        if (!player) return;

        switch (e.key) {
            case 'ArrowLeft':
            case 'a': // Добавляем WASD управление
                inputState.left = true;
                break;
            case 'ArrowRight':
            case 'd':
                inputState.right = true;
                break;
            case ' ': // Пробел
            case 'ArrowUp':
            case 'w':
                // Триггерим прыжок только при первом нажатии кнопки
                if (!jumpPressed) {
                     player.jump(); // Вызываем метод прыжка у объекта игрока
                     jumpPressed = true; // Устанавливаем флаг, что кнопка прыжка нажата
                }
                break;
            case 'x': // Пример кнопки действия (например, огонь)
                if (!actionPressed) {
                     // player.fire(); // Вызываем метод действия у игрока (если он существует)
                     actionPressed = true;
                }
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
         if (!player) return;

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
                jumpPressed = false; // Сбрасываем флаг при отпускании кнопки прыжка
                break;
            case 'x':
                actionPressed = false; // Сбрасываем флаг кнопки действия
                break;
         }
    });

    // Обработка touch-ввода для мобильных устройств
    const touchLeft = document.getElementById('touch-left');
    const touchRight = document.getElementById('touch-right');
    const touchJump = document.getElementById('touch-jump');
    const touchControls = document.getElementById('touch-controls'); // Контейнер кнопок

    // Проверяем, поддерживает ли устройство touch-ввод
    // (Более надежные проверки, чем просто 'ontouchstart' in window)
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0) {
         touchControls.style.display = 'flex'; // Показываем touch-управление (если оно было скрыто в CSS)

         // Обработчики событий для touch-кнопок
         // touchstart: палец коснулся кнопки
         // touchend: палец оторвался от кнопки
         // touchcancel: касание было прервано (например, свайпом)

         touchLeft.addEventListener('touchstart', (e) => { e.preventDefault(); if (player) inputState.left = true; });
         touchLeft.addEventListener('touchend', (e) => { e.preventDefault(); if (player) inputState.left = false; });
         touchLeft.addEventListener('touchcancel', (e) => { e.preventDefault(); if (player) inputState.left = false; });

         touchRight.addEventListener('touchstart', (e) => { e.preventDefault(); if (player) inputState.right = true; });
         touchRight.addEventListener('touchend', (e) => { e.preventDefault(); if (player) inputState.right = false; });
         touchRight.addEventListener('touchcancel', (e) => { e.preventDefault(); if (player) inputState.right = false; });

         touchJump.addEventListener('touchstart', (e) => { e.preventDefault(); if (player && !jumpPressed) { player.jump(); jumpPressed = true; } });
         touchJump.addEventListener('touchend', (e) => { e.preventDefault(); jumpPressed = false; });
         touchJump.addEventListener('touchcancel', (e) => { e.preventDefault(); jumpPressed = false; });

         // Добавьте обработчики для кнопки действия, если есть
         // const touchAction = document.getElementById('touch-action');
         // if (touchAction) {
         //      touchAction.addEventListener('touchstart', (e) => { e.preventDefault(); if (player && !actionPressed) { player.fire(); actionPressed = true; } });
         //      touchAction.addEventListener('touchend', (e) => { e.preventDefault(); actionPressed = false; });
         //      touchAction.addEventListener('touchcancel', (e) => { e.preventDefault(); actionPressed = false; });
         // }


    } else {
        // Если touch-устройство не обнаружено, скрываем touch-управление
        touchControls.style.display = 'none';
    }
}

/**
 * Возвращает текущее состояние ввода.
 * @returns {object} Объект с булевыми флагами для каждой кнопки.
 */
export function getInputState() {
    return inputState;
}

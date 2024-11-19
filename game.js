const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Размеры арены
canvas.width = 1024;
canvas.height = 512;

const gravity = 0.5;

// Фоновые музыка
const musics = [
    'music1.mp3',
    'music2.mp3'
];

const music = new Audio(musics[Math.floor(Math.random() * musics.length)]);
music.volume = 0.6;

// Фоновые изображения
const backgrounds = [
    'background1.webp',
    'background2.webp',
    'background3.webp',
];
const background = new Image();
background.src = backgrounds[Math.floor(Math.random() * backgrounds.length)];

const attack1 = new Audio('attack.wav');
const attack2 = new Audio('attack.wav');
const punch1 = new Audio('punch.wav');
const punch2 = new Audio('punch.wav');

attack1.volume = 0.8;
attack2.volume = 0.8;



Math.floor(Math.random() * backgrounds.length)

class Fighter {
    constructor(x, y, sprite, controls, isAI = false) {
        this.x = x;
        this.y = y;
        this.width = 128;
        this.height = 128;
        this.sprite = sprite;
        this.image = new Image();
        this.image.src = sprite;
        this.frame = 0;
        this.framesPerAnimation = 3;
        this.frameWidth = 341;
        this.frameHeight = 512;
        this.frameCounter = 0;
        this.frameSpeed = 8;
        this.speed = 5;
        this.jumpStrength = 10;
        this.velocity = { x: 0, y: 0 };
        this.health = isAI ? 200 : 100;
        this.controls = controls;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.state = 'idle';
        this.direction = 1;
        this.isAI = isAI;
        this.roundWins = 0; // Количество побед в раундах
    }

    draw() {
        ctx.save();

        if (this.direction === -1) {
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.image,
                this.frame * this.frameWidth,
                this.getAnimationRow(),
                this.frameWidth,
                this.frameHeight,
                -this.x - this.width,
                this.y,
                this.width,
                this.height
            );
        } else {
            ctx.drawImage(
                this.image,
                this.frame * this.frameWidth,
                this.getAnimationRow(),
                this.frameWidth,
                this.frameHeight,
                this.x,
                this.y,
                this.width,
                this.height
            );
        }

        ctx.restore();

        this.frameCounter++;
        if (this.frameCounter >= this.frameSpeed) {
            this.frameCounter = 0;
            this.frame++;
            if (this.frame >= this.framesPerAnimation) {
                this.frame = 0;
                if (this.state === 'attack') this.state = 'idle';
            }
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
    }

    getAnimationRow() {
        switch (this.state) {
            case 'move': return 0;
            case 'attack': return 512;
            case 'jump': return 0;
            default: return 0;
        }
    }

    move(opponent) {
        if (this.isAI) {
            this.AIMovement(opponent);
        }

        if (this.state !== 'attack') {
            if (this.velocity.y < 0 || this.velocity.y > 0) {
                this.state = 'jump';
            } else if (this.controls.left || this.controls.right) {
                this.state = 'move';
            } else {
                this.state = 'idle';
            }
        }

        if (!this.isAI) {
            // Горизонтальное движение
            if (this.controls.left) this.velocity.x = -this.speed;
            else if (this.controls.right) this.velocity.x = this.speed;
            else this.velocity.x = 0;

            // Прыжок
            if (this.controls.jump && this.y + this.height >= canvas.height) {
                this.velocity.y = -this.jumpStrength;
            }
        }

        this.velocity.y += gravity;
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
            this.velocity.y = 0;
        }

        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        this.direction = this.x < opponent.x ? 1 : -1;
    }

    AIMovement(opponent) {
        const distance = opponent.x - this.x;

        if (distance > 100) {
            this.velocity.x = this.speed;
        } else if (distance < -100) {
            this.velocity.x = -this.speed;
        } else {
            this.velocity.x = 0;
        }

        if (Math.random() < 0.01 && this.y + this.height >= canvas.height) {
            this.velocity.y = -this.jumpStrength;
        }

        if (Math.random() < 0.02 && this.attackCooldown === 0) {
            this.attack(opponent);
        }
    }

    attack(opponent) {
        if (this.attackCooldown === 0 && this.state !== 'attack') {
            this.state = 'attack';
            this.frame = 0;
            this.attackCooldown = 25;
            if (opponent.isAI) {
                attack1.play();
            } else {
                attack2.play();
            }

            if (
                this.x + this.width > opponent.x &&
                this.x < opponent.x + opponent.width &&
                this.y + this.height > opponent.y &&
                this.y < opponent.y + opponent.height
            ) {
                if (opponent.isAI) {
                    punch1.play();
                } else {
                    punch2.play();
                }
                let damage = 10
                if (opponent.isAI && round > 1 && opponent.roundWins === 0) {
                    damage = 5;
                }
                if (opponent.isAI && round > 2) {
                    damage = 7;
                }
                opponent.health -= damage;
            }
        }
    }
}

const player1 = new Fighter(100, 448, 'player1-sprite.webp', {
    left: false,
    right: false,
    jump: false,
    attack: false,
});
const player2 = new Fighter(860, 448, 'player1-sprite.webp', {}, true);

let round = 1;
let isRoundIntro = true;

function showRoundIntro() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Раунд ${round}`, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText('В бой!', canvas.width / 2, canvas.height / 2 + 20);

    setTimeout(() => {
        isRoundIntro = false;
        player1.x = 100;
        player1.y = 448;
        player2.x = 860;
        player2.y = 448;
        player1.health = 100;
        player2.health = 100;
        music.play();
        update();
    }, 2000);
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isRoundIntro) {
        showRoundIntro();
        return;
    }

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    player1.move(player2);
    player1.draw();

    player2.move(player1);
    player2.draw();

    if (player1.controls.attack) {
        player1.attack(player2);
    }

    ctx.fillStyle = 'green';
    ctx.fillRect(20, 20, player1.health * 2, 20);
    ctx.fillRect(canvas.width - 220, 20, player2.health * 2, 20);

    if (player1.health <= 0 || player2.health <= 0) {
        music.pause();
        music.currentTime = 0;
        const winner = player1.health <= 0 ? player2 : player1;
        winner.roundWins++;

        if (winner.roundWins === 2) {
            ctx.fillStyle = 'white';
            ctx.font = '40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                player1.roundWins === 2 ? 'Игрок 1 победил!' : 'Игрок 2 победил!',
                canvas.width / 2,
                canvas.height / 2
            );
            return;
        }

        round++;
        isRoundIntro = true;
    }

    requestAnimationFrame(update);
}

function handleInput(event, isKeyDown) {
    const keyMap = {
        'a': () => player1.controls.left = isKeyDown,
        'd': () => player1.controls.right = isKeyDown,
        'w': () => player1.controls.jump = isKeyDown,
        ' ': () => player1.controls.attack = isKeyDown,
    };

    if (keyMap[event.key]) {
        keyMap[event.key]();
        event.preventDefault(); // Блокируем прокрутку страницы клавишей "Пробел"
    }
}

window.addEventListener('keydown', (event) => handleInput(event, true));
window.addEventListener('keyup', (event) => handleInput(event, false));

update();

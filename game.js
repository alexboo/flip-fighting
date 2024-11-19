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
const kick1 = new Audio('kick.mp3');
const kick2 = new Audio('kick.mp3');
const punch1 = new Audio('punch.wav');
const punch2 = new Audio('punch.wav');

attack1.volume = 0.8;
attack2.volume = 0.8;



Math.floor(Math.random() * backgrounds.length)

class Fighter {
    constructor(x, y, sprite, controls, isAI = false) {
        this.x = x;
        this.y = y;
        this.width = 200;
        this.height = 200;
        this.sprite = sprite;
        this.image = new Image();
        this.image.src = sprite;
        this.frame = 0;
        this.framesPerAnimation = 4;
        this.frameWidth = 470;
        this.frameHeight = 574;
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
                if (this.state === 'attack' || this.state === 'attack2') {
                    this.state = 'idle';
                    kick1.pause();
                    kick1.currentTime = 0;
                    kick2.pause();
                    kick2.currentTime = 0;
                }
            }
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
    }

    getAnimationRow() {
        switch (this.state) {
            case 'move': return 574;
            case 'attack': return 574 * 2;
            case 'attack2': return 574 * 3;
            case 'jump': return 574;
            case 'hit': return 574 * 4;
            case 'knockout': return 574 * 5;
            default: return 0;
        }
    }

    move(opponent) {
        if (this.isAI) {
            this.AIMovement(opponent);
        }

        if (this.state !== 'attack' && this.state !== 'attack2' && this.state !== 'hit' && this.state !== 'knockout') {
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

        if (Math.random() < 0.02 && this.attackCooldown === 0) {
            this.attack2(opponent);
        }
    }

    attack(opponent) {
        if (this.attackCooldown === 0 && (this.state !== 'attack2' || this.state !== 'attack')) {
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
                opponent.state = 'hit';
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
                if (opponent.health <= 0) {
                    opponent.state = 'knockout';
                }
            }
        }
    }

    attack2(opponent) {
        if (this.attackCooldown === 0 && (this.state !== 'attack2' || this.state !== 'attack')) {
            this.state = 'attack2';
            this.frame = 0;
            this.attackCooldown = 25;
            if (opponent.isAI) {
                kick1.pause();
                kick1.currentTime = 0;
                kick1.play();
            } else {
                kick2.pause();
                kick2.currentTime = 0;
                kick2.play();
            }

            if (
                this.x + this.width > opponent.x &&
                this.x < opponent.x + opponent.width &&
                this.y + this.height > opponent.y &&
                this.y < opponent.y + opponent.height
            ) {
                opponent.state = 'hit';
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
                if (opponent.health <= 0) {
                    opponent.state = 'knockout';
                }
            }
        }
    }
}

const player1 = new Fighter(100, 448, 'player-sprite1.png', {
    left: false,
    right: false,
    jump: false,
    attack: false,
    attack2: false,
});
const player2 = new Fighter(860, 448, 'player-sprite1.png', {}, false);

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

    if (isRoundIntro) {
        if (round > 1) {
            setTimeout(() => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                showRoundIntro();
            }, 3000);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            showRoundIntro();
        }

        return;
    }

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    player1.move(player2);
    if (player1.health <= 0) {
        player1.state = 'knockout';
    }
    player1.draw();

    player2.move(player1);
    if (player2.health <= 0) {
        player2.state = 'knockout';
    }
    player2.draw();

    if (player1.controls.attack) {
        player1.attack(player2);
    }

    if (player1.controls.attack2) {
        player1.attack2(player2);
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
        'v': () => player1.controls.attack2 = isKeyDown,
    };

    if (keyMap[event.key]) {
        keyMap[event.key]();
        event.preventDefault(); // Блокируем прокрутку страницы клавишей "Пробел"
    }
}

window.addEventListener('keydown', (event) => handleInput(event, true));
window.addEventListener('keyup', (event) => handleInput(event, false));

update();

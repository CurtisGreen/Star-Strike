export class Game {
    game;

    // Game objects
    ship;
    invaders;
    explosions;
    lifeImage;

    // Data
    userId = 0;
    score = 0;
    health = 3;
    offset = 0;

    constructor(userId) {
        this.game = new Phaser.Game(648, 600, Phaser.CANVAS, 'player ' + userId, {
            preload: this.preload,
            create: this.create,
            update: this.update,
            render: this.render,
        });
        this.userId = userId;
    }

    preload() {
        this.game.load.image('universe', 'assets/universe.png');
        this.game.load.image('bullet', 'assets/bullets.png');
        this.game.load.image('ship', 'assets/ship2.png');
        this.game.load.image('invader', 'assets/invader.png');
        this.game.load.spritesheet('explode', 'assets/explode.png', 128, 128);
        this.game.load.image('ammo', 'assets/ammo.png');
        this.game.load.image('live_image', 'assets/i_live.png');

        this.game.load.audio('destroyed', 'assets/explosion.mp3');
        this.game.load.audio('blaster', 'assets/blaster.mp3');
        this.game.load.audio('ship_damage', 'assets/space_ship_destroyed.mp3');
        this.game.load.audio('boden', 'assets/time_attack.mp3');
    }

    create() {
        // Connect to client
        socket.on('onconnected', (msg) => {
            console.log('onconnected: user id = ' + msg.id);
            this.userId = msg.id;
            socket.emit('initialize', { id: userId });
        });

        // Position update
        socket.on('update', (msg) => {
            if (msg.id != this.userId) {
                this.ship.setPosition(msg.x, msg.y, msg.rotation);
                if (msg.fire) {
                    this.ship.fireBullet();
                }

                // Update invador positions
                for (const i in msg.invArray) {
                    if (invaders.children[i]) {
                        this.invaders.children[i].x = msg.invArray[i].x;
                        this.invaders.children[i].y = msg.invArray[i].y;
                    }
                }
            }
        });

        // Delete invaders that have been destroyed by p2
        socket.on('double', (msg) => {
            if (msg.check && msg.id != this.userId && this.score < 20) {
                if (!this.invaders.children[msg.index]) {
                    console.log('implemented offset');
                    this.offset = 1;
                }
                this.invaders.children[msg.index - offset].kill();
                this.score = msg.score;
            }
        });

        // Show animation on invader kill
        socket.on('bulletExplosion', (msg) => {
            if (msg.id != this.userId && msg.shipCollideInvader) {
                this.explodeInvader(msg.index);
            }
        });

        // Updates p2's health
        socket.on('health', (msg) => {
            if (msg.id != this.userId) {
                this.health = msg.health;
                this.lifeImage.getFirstAlive().kill();

                if (msg.shipCollideInvader) {
                    this.explodeInvader(msg.index);
                }
            }
        });
    }

    update() {}

    render() {}

    explodeInvader(index) {
        if (this.invaders.children[index]) {
            const explosion = this.explosions.getFirstExists(false);
            explosion.reset(
                this.invaders.children[index].x,
                this.invaders.children[index].y
            );
            explosion.play('explode', 30, false, true);
            this.invaders.children[index].kill();
        }
    }
}

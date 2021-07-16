import { Ship } from './ship';

export class Game {
    game;
    p1 = true;

    // Game objects
    ship;
    invaders;
    explosions;
    lifeImage;
    ammoImage;
    cursors;

    // HUD
    scoreText;
    healthText;
    ammoText;

    // Data
    userId = 0;
    score = 0;
    health = 3;
    offset = 0;
    ammo = 10;

    constructor(p1, userId) {
        this.game = new Phaser.Game(648, 600, Phaser.CANVAS, 'player ' + userId, {
            preload: this.preload,
            create: this.create,
            update: this.update,
            render: this.render,
        });
        this.userId = userId;
        this.p1 = p1;
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

            if (!this.p1) {
                socket.emit('initialize', { id: userId });
            }
        });

        // Verify init
        // TODO: what is this for
        socket.on('initialize', (msg) => {
            if (msg.id != this.userId) {
                if (this.invaders.children[0]) {
                    this.invaders.children[0].kill();
                }
                this.score--;
            }
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

        // Delete invaders that have been destroyed
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

        // Update health
        socket.on('health', (msg) => {
            if (msg.id != this.userId) {
                this.health = msg.health;
                this.lifeImage.getFirstAlive().kill();

                if (msg.shipCollideInvader) {
                    this.explodeInvader(msg.index);
                }
            }
        });

        // Update ammo
        socket.on('ammo', (msg) => {
            if (msg.check && msg.id != this.userId) {
                this.ammo = msg.ammo;
                const curAmmo = this.ammoImage.getFirstAlive();
                if (curAmmo) {
                    curAmmo.kill();
                }

                if (this.ammo <= 0) {
                    this.ammoImage.callAll('revive');
                }
            }
        });

        // Update dead/alive
        socket.on('defeat', (msg) => {
            if (msg.id != this.userId) {
                this.ship.kill();
                this.startRound(true);
            } else {
                this.startRound(false);
            }
        });

        // Copy stars
        socket.on('invaders', (msg) => {
            if (msg.id != this.userId && this.score < 20) {
                this.createStars(msg);
            }
        });

        // Create environment
        this.game.renderer.clearBeforeRender = false;
        this.game.renderer.roundPixels = true;
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        // Reduce P2's FPS so the game doesn't seize up
        if (this.userId != 1) {
            this.game.desiredFPS = 1;
        }

        // BG image
        this.game.add.tileSprite(-100, -100, 900, 700, 'universe');

        // Player ship
        this.ship = new Ship(this.game);

        // Input
        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);

        // Invaders
        this.invaders = this.game.add.group();
        this.invaders.enableBody = true;
        this.invaders.physicsBodyType = Phaser.Physics.ARCADE;

        // HUD
        this.scoreText = this.game.add.text(0, 0, 'Score:', {
            font: '20px Coiny',
            fill: ' #7FBF7F',
        });
        this.healthText = this.game.add.text(0, 570, 'Lives', {
            font: '15px Coiny',
            fill: ' #00cc00',
        });
        this.ammoText = this.game.add.text(585, 570, 'Ammo', {
            font: '15px Coiny',
            fill: ' #cc0000',
        });

        // Explosion
        this.explosions = this.game.add.group();
        this.explosions.createMultiple(30, 'explode');
        this.explosions.forEach((invader) => {
            invader.anchor.x = 0.5;
            invader.anchor.y = 0.5;
            invader.animations.add('explode');
        });

        // Ammo display
        this.ammoImage = this.game.add.group();
        for (let i = 0; i < this.ammo; i++) {
            const allAmmo = this.ammoImage.create(
                605,
                this.game.world.height - 120 + 10 * i,
                'ammo'
            );
            allAmmo.anchor.setTo(0.5, 0.5);
            allAmmo.angle = 0;
        }

        // Lives display
        this.lifeImage = this.game.add.group();
        for (let i = 0; i < this.health; i++) {
            const lives = this.lifeImage.create(
                20,
                this.game.world.height - 50 + 10 * i,
                'live_image'
            );
            lives.anchor.setTo(0.5, 0.5);
            lives.angle = 0;
        }
    }

    update() {
        // Screen wrap
        this.ship.screenWrap(this.game.width, this.game.height);

        // Update score text
        this.scoreText.text = 'Invaders:' + this.score;
    }

    render() {}

    createStars(msg) {
        const invader = this.invaders.create(msg.x, msg.y, 'invader');
        invader.anchor.setTo(0.5, 0.5);
        this.score = msg.score;
        const tween = game2.add
            .tween(invader)
            .to(
                { x: msg.vx, y: msg.vy },
                2000,
                Phaser.Easing.Linear.None,
                true,
                0,
                1000,
                true
            );
        tween.onLoop.add(() => this.invaders.y == 10);
    }

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

    // Reset health, ammo, etc.
    startRound(revive) {
        // Wait 3s before starting
        setTimeout(() => {
            this.health = 3;
            this.ammo = 10;
            this.score = 0;
            this.invaders.callAll('kill');
            this.lifeImage.callAll('revive');
            this.ammoImage.callAll('revive');

            if (revive) {
                this.ship.revive();
            }
        }, 3000);
    }
}

import { Invaders } from './invaders';
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

    // Audio
    blaster;
    destroyed;
    ship_damage;
    music;

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
    ammoTime;
    pause = false;

    // Best of 3 wins
    winCondition = {
        round: 0,
        wins: 0,
        losses: 0,
        defeats: [false, false, false],
        victories: [false, false, false],
    };

    stats = { shotsFired: 0, shotsHit: 0 };

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
        this.startAudio();

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

            if (this.p1) {
                const { x, y } = ship.getPosition();
                this.invaders.createInvader(x, y);
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
            if (msg.check && msg.id != this.userId && this.score < 20 && !this.pause) {
                // Create 2 more for P1
                if (this.p1) {
                    const { x, y } = ship.getPosition();
                    this.invaders.createInvader(x, y);
                    this.invaders.createInvader(x, y);
                }
                // Remove destroyed from P2 screen
                else {
                    if (!this.invaders.children[msg.index]) {
                        console.log('implemented offset');
                        this.offset = 1;
                    }
                    this.invaders.children[msg.index - offset].kill();
                    this.score = msg.score;
                }
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
            if (this.p1) {
                if (
                    msg.id != this.userId &&
                    this.winCondition.wins < 1 &&
                    this.winCondition.round < 5
                ) {
                    this.resetGame(true);
                }
                // TODO: Add ready screen before start
                else if (msg.id != userId && winCondition.wins >= 1) {
                    console.log('Won listening defeat');
                    this.statText.text =
                        'Invaders destroyed: ' +
                        stats.shotsHit +
                        '\nHit percentage: ' +
                        Math.round((this.stats.shotsHit / this.stats.shotsFired) * 100) +
                        '%';
                    this.statText.visible = true;
                    this.winCondition.wins = 2;
                    this.winText.visible = true;
                    this.scoreText.visible = false;
                    $('#reset').show();
                }
            } else {
                if (msg.id != this.userId) {
                    this.ship.kill();
                }

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
        if (!this.p1) {
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
        this.invaders = new Invaders(this.game, this.userId);

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

        // Victory/defeat
        this.statText = this.game.add.text(
            this.game.world.centerX - 100,
            this.game.world.centerY + 100,
            'stats:',
            { font: '20px Coiny', fill: ' #7FBF7F' }
        );
        this.statText.visible = false;
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
        this.shipText = this.game.add.text(
            90,
            20,
            'You killed 10 invaders! You now have Unlimited ammo!',
            { font: '20px Coiny', fill: ' #7FBF7F' }
        );
        this.shipText.visible = false;
        this.roundText = this.game.add.text(
            this.game.world.centerX - 200,
            this.game.world.centerY,
            'test',
            { font: '40px Coiny', fill: '#329932' }
        );
        this.roundText.visible = false;
        this.winText = this.game.add.text(
            this.game.world.centerX - 100,
            this.game.world.centerY,
            'You Win!',
            { font: '40px Coiny', fill: '#329932' }
        );
        this.winText.visible = false;
        this.loseText = this.game.add.text(
            this.game.world.centerX - 100,
            this.game.world.centerY,
            'You Lose!',
            { font: '40px Coiny', fill: '#E50000' }
        );

        loseText.visible = false;

        // Explosion
        this.explosions = this.game.add.group();
        this.explosions.createMultiple(30, 'explode');
        this.explosions.forEach((explosion) => {
            explosion.anchor.x = 0.5;
            explosion.anchor.y = 0.5;
            explosion.animations.add('explode');
        }, this);

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

        // Reload
        if (this.ammo <= 0 && this.game.time.now > this.ammoTime) {
            this.ammoTime = this.game.time.now + 5000;
            this.ammo = 10;
            this.ammoImage.callAll('revive');
        }

        // Update score text
        this.scoreText.text = 'Invaders:' + this.score;

        if (this.p1) {
            this.updateP2();
            this.updatePhysics();
        }
    }

    render() {}

    updatePhysics() {
        this.game.physics.arcade.overlap(
            this.ship.bullets,
            this.invaders.invaders,
            this.bulletCollisionHandler,
            null,
            this
        );

        if (!this.loseText.visible) {
            this.game.physics.arcade.overlap(
                this.ship.ship,
                this.invaders.invaders,
                this.playerCollisionHandler,
                null,
                this
            );
        }
    }

    updateP2() {
        const { x, y, rotation } = this.ship.getPosition();

        socket.emit('update', {
            id: this.userId,
            x,
            y,
            rotation,
            fire: this.game.input.keyboard.isDown(Phaser.keyboard.Z),
            invArray: this.invaders.getPosArr(),
        });
    }

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

    startAudio() {
        // Sounds
        this.blaster = game.add.audio('blaster');
        this.destroyed = game.add.audio('destroyed');
        this.ship_damage = game.add.audio('ship_damage');
        this.music = game.add.audio('boden');

        // Background music
        this.music.play('', 0, 1, true);
    }

    // Destroys invader & bullets on intersection
    bulletCollisionHandler(bullet, invader) {
        const explosion = explosions.getFirstExists(false);
        explosion.reset(invader.body.x, invader.body.y);
        explosion.play('explode', 30, false, true);
        const index = Array.prototype.indexOf.call(invader.parent.children, invader);
        this.score--;
        this.unlimitedAmmo++;
        bullet.kill();
        invader.kill();
        this.destroyed.play(); // Sound for explosion.

        // Tell p2 that an invader has been destroyed
        if (!pause) {
            socket.emit('double', {
                check: true,
                id: this.userId,
                index: index,
                score: score,
                shipCollideInvader: true,
            });
        }

        // Animate explosion when bullet hits invador
        socket.emit('bulletExplosion', {
            check: true,
            id: userId,
            index: index,
            shipCollideInvader: true,
        });

        if (!this.pause) {
            this.stats.shotsHit++;
        }

        console.log(
            'Invaders destroyed: ' +
                stats.shotsHit +
                ' Hit percentage: ' +
                (stats.shotsHit / stats.shotsFired) * 100 +
                '%'
        );
        if (stats.shotsHit == 10) {
            shipText.visible = true;
        }
        if (stats.shotsHit == 15) {
            shipText.visible = false;
        }
    }

    // Player loses health or dies when player & invaders intersect
    playerCollisionHandler(ship, invader) {
        // Make sure player can't die in between rounds
        if (pause) {
            return;
        }

        const explosion = this.explosions.getFirstExists(false);
        explosion.reset(invader.body.x, invader.body.y);
        explosion.play('explode', 30, false, true); // Player was damaged by an invader
        const index = Array.prototype.indexOf.call(invader.parent.children, invader);
        invader.kill();
        ship.health -= 1; // Decrease health & delete health image
        liveImage.getFirstAlive().kill();
        ship_damage.play();

        // Update p2 health for enemy player
        socket.emit('health', {
            id: this.userId,
            health: ship.health,
            index,
            shipCollideInvader: true,
        });

        this.score--;
        if (this.winCondition.losses == 1 && this.player.health == 0) {
            this.winCondition.losses++;
        }

        // Player lost all their health
        if (this.winCondition.losses <= 1 && ship.health <= 0) {
            ship.ship.kill();
            this.resetGame(false);
        } else if (this.winCondition.losses == 2 && ship.health <= 0) {
            if (this.stats.shotsFired == 0) {
                this.stats.shotsFire = 1;
            }
            this.statText.text =
                'Invaders destroyed: ' +
                this.stats.shotsHit +
                '\nHit percentage: ' +
                Math.round((this.stats.shotsHit / this.stats.shotsFired) * 100) +
                '%';
            this.statText.visible = true;
            this.loseText.visible = true;
            this.scoreText.visible = false;
            this.healthText.visible = false;

            // Tell server you died
            socket.emit('defeat', {
                id: this.userId,
                dead: true,
                wins: this.winCondition.wins,
                losses: this.winCondition.losses,
            });

            $('#reset').show();
        }
    }
}

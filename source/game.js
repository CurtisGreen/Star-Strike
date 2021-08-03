import { Invaders } from './invaders.js';
import { Ship } from './ship.js';

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
    blasterAudio;
    destroyedAudio;
    shipDamageAudio;
    music;

    // HUD
    scoreText;
    healthText;
    ammoText;
    unlimitedAmmoText;
    roundText;
    loseText;

    // Data
    userId = 0;
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
        this.game = new Phaser.Game(648, 600, Phaser.CANVAS, 'player_' + userId, {
            preload: this.preload,
            create: this.create.bind(this),
            update: this.update.bind(this),
            render: this.render,
        });
        this.userId = userId;
        this.p1 = p1;
    }

    preload() {
        console.log('Preload');
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
        console.log('Create');
        this.startAudio();

        // Simplify conditional
        const check = (msg) => msg.id != this.userId;

        // Connect to client
        socket.on('onconnected', (msg) => {
            console.log('onconnected: user id =', msg.id);
            this.userId = msg.id;

            if (this.p1) {
                socket.emit('initialize', { id: this.userId });
            }
        });

        // Create first invader on each side
        socket.on('initialize', (msg) => {
            if (this.p1 && check(msg)) {
                console.log('initialize');
                const { x, y } = this.ship.getPosition();
                this.invaders.createInvader(x, y);
            }
        });

        // Delete invaders that have been destroyed
        socket.on('double', (msg) => {
            if (check(msg) && this.invaders.getCount() < 20 && !this.pause) {
                console.log('double');

                // Create 2 more for P1
                if (this.p1) {
                    console.log('Creating 2 new invaders for p1');
                    const { x, y } = this.ship.getPosition();
                    this.invaders.createInvader(x, y);
                    this.invaders.createInvader(x, y);
                }
                // Remove destroyed from P2 screen
                else {
                    console.log('Killing', msg.index, 'for p2');
                    this.invaders.kill(msg.index);
                }
            }
        });

        // P2 updates
        if (!this.p1) {
            // Health
            socket.on('health', (msg) => {
                if (check(msg)) {
                    console.log('P2 health');
                    this.health = msg.health;
                    this.lifeImage.getFirstAlive()?.kill();

                    if (msg.shipCollideInvader) {
                        this.explodeInvader(msg.index);
                    }
                }
            });

            // Ammo
            socket.on('ammo', (msg) => {
                if (check(msg)) {
                    console.log('P2 ammo');
                    this.ship.setAmmo(msg.ammo);
                    this.ammoImage.getFirstAlive()?.kill();

                    if (msg.ammo <= 0) {
                        this.ammoImage.callAll('revive');
                    }
                }
            });

            // Ship
            socket.on('update', (msg) => {
                if (check(msg)) {
                    console.log('P2 update');
                    this.ship.setPosition(msg.x, msg.y, msg.rotation);
                    if (msg.fire) {
                        this.ship.fireBullet();
                    }

                    this.invaders.update(msg.invArray);
                }
            });

            // Invaders
            socket.on('invaders', (msg) => {
                if (check(msg) && this.invaders.getCount() < 20) {
                    console.log('P2 invaders');
                    // this.invaders.createInvader(msg.x, msg.y); // TODO accurately place them
                }
            });

            // Bullet kill
            socket.on('bulletExplosion', (msg) => {
                if (check(msg) && msg.shipCollideInvader) {
                    console.log('P2 bulletExplosion');
                    this.explodeInvader(msg.index);
                }
            });
        }

        // Update dead/alive
        socket.on('defeat', (msg) => {
            if (check(msg)) {
                console.log('defeat');

                if (this.p1) {
                    if (this.winCondition.wins < 1 && this.winCondition.round < 5) {
                        this.resetGame(true);
                    }
                    // TODO: Add ready screen before start
                    else if (this.winCondition.wins >= 1) {
                        console.log('Won listening defeat');
                        this.statText.text =
                            'Invaders destroyed: ' +
                            this.stats.shotsHit +
                            '\nHit percentage: ' +
                            Math.round(
                                (this.stats.shotsHit / this.stats.shotsFired) * 100
                            ) +
                            '%';
                        this.statText.visible = true;
                        this.winCondition.wins = 2;
                        this.winText.visible = true;
                        this.scoreText.visible = false;
                        $('#reset').show();
                    }
                } else {
                    this.ship.kill();
                    this.startRound(true);
                }
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
        this.ship = new Ship(this.game, this.p1);

        // Input
        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.game.input.keyboard.addKeyCapture([Phaser.Keyboard.Z]);

        // Invaders
        this.invaders = new Invaders(this.game, this.userId, this.p1);

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
        this.unlimitedAmmoText = this.game.add.text(
            90,
            20,
            'You killed 10 invaders! You now have Unlimited ammo!',
            { font: '20px Coiny', fill: ' #7FBF7F' }
        );
        this.unlimitedAmmoText.visible = false;
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

        this.loseText.visible = false;

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
        for (let i = 0; i < 10; i++) {
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
        for (let i = 0; i < 3; i++) {
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
        if (this.ship.getAmmo() <= 0 && this.game.time.now > this.ammoTime) {
            console.log('Reload');
            this.ammoTime = this.game.time.now + 5000;
            this.ship.setAmmo(10);
            this.ammoImage.callAll('revive');
        }

        // Update score text
        this.scoreText.text = 'Invaders:' + this.invaders.getCount();

        if (this.p1) {
            this.ship.update(this.cursors);
            this.updateP2();
            this.checkCollisions();
        }
    }

    render() {}

    checkCollisions() {
        this.game.physics.arcade.overlap(
            this.ship.bullets,
            this.invaders.invaders,
            this.bulletCollisionHandler,
            null,
            this
        );

        this.game.physics.arcade.overlap(
            this.ship.ship,
            this.invaders.invaders,
            this.playerCollisionHandler,
            null,
            this
        );
    }

    updateP2() {
        const { x, y, rotation } = this.ship.getPosition();

        socket.emit('update', {
            id: this.userId,
            x,
            y,
            rotation,
            fire: this.game.input.keyboard.isDown(Phaser.Keyboard.Z),
            invArray: this.invaders.getPosArr(),
        });
    }

    // createStars(msg) {
    //     const invader = this.invaders.create(msg.x, msg.y, 'invader');
    //     invader.anchor.setTo(0.5, 0.5);
    //     this.score = msg.score;
    //     const tween = game2.add
    //         .tween(invader)
    //         .to(
    //             { x: msg.vx, y: msg.vy },
    //             2000,
    //             Phaser.Easing.Linear.None,
    //             true,
    //             0,
    //             1000,
    //             true
    //         );
    //     tween.onLoop.add(() => this.invaders.y == 10);
    // }

    explodeInvader(index) {
        const invader = this.invaders.get(index);
        if (invader) {
            const explosion = this.explosions.getFirstExists(false);
            explosion.reset(invader.x, invader.y);
            explosion.play('explode', 30, false, true);
            invader.kill();
        }
    }

    // Reset health, ammo, etc.
    startRound(revive) {
        // Wait 3s before starting
        setTimeout(() => {
            this.ship.reset();
            this.invaders.killAll();
            this.lifeImage.callAll('revive');
            this.ammoImage.callAll('revive');

            if (revive) {
                this.ship.revive();
            }
        }, 3000);
    }

    startAudio() {
        // Sounds
        this.blasterAudio = this.game.add.audio('blaster');
        this.destroyedAudio = this.game.add.audio('destroyed');
        this.shipDamageAudio = this.game.add.audio('ship_damage');
        this.music = this.game.add.audio('boden');

        // Background music
        this.music.play('', 0, 1, true);
    }

    // Destroys invader & bullets on intersection
    bulletCollisionHandler(bullet, invader) {
        // Explosion animation
        const explosion = this.explosions.getFirstExists(false);
        explosion?.reset(invader.body.x, invader.body.y);
        explosion?.play('explode', 30, false, true);

        // Sound for explosion
        this.destroyedAudio.play();

        // Update stats
        this.unlimitedAmmo++; // TODO: doesn't do anything
        if (!this.pause) {
            this.stats.shotsHit++;
        }

        // Clean up
        bullet.kill();
        invader.kill();

        // Get invader index
        const index = Array.prototype.indexOf.call(invader.parent.children, invader);

        // Tell p2 that an invader has been destroyed
        if (!this.pause) {
            socket.emit('double', {
                check: true,
                id: this.userId,
                index,
                score: this.invaders.getCount(),
                shipCollideInvader: true,
            });
        }

        // Animate explosion when bullet hits invador
        socket.emit('bulletExplosion', {
            check: true,
            id: this.userId,
            index,
            shipCollideInvader: true,
        });

        console.log(
            'Invaders destroyed: ' +
                this.stats.shotsHit +
                ' Hit percentage: ' +
                (this.stats.shotsHit / this.stats.shotsFired) * 100 +
                '%'
        );

        // Show unlimited ammo unlock
        if (this.stats.shotsHit == 10) {
            this.unlimitedAmmoText.visible = true;
        }
        if (this.stats.shotsHit == 15) {
            this.unlimitedAmmoText.visible = false;
        }
    }

    // Player loses health or dies when player & invaders intersect
    playerCollisionHandler(ship, invader) {
        // console.log('playerCollisionHandler', ship.x, ship.y, 'vs', invader.x, invader.y);
        // console.log(this.ship.getPosition());
        // Make sure player can't die in between rounds
        if (this.pause) {
            return;
        }

        // Explosion animation
        const explosion = this.explosions.getFirstExists(false);
        explosion?.reset(invader.body.x, invader.body.y);
        explosion?.play('explode', 30, false, true);

        // Ship damage
        this.shipDamageAudio.play();
        const health = this.ship.reduceHealth();

        // Clean up
        invader.kill();

        // Get invader index
        const index = Array.prototype.indexOf.call(invader.parent.children, invader);

        // Update p2 health for enemy player
        socket.emit('health', {
            id: this.userId,
            health: health,
            index,
            shipCollideInvader: true,
        });

        // Update stats
        const life = this.lifeImage?.getFirstAlive();
        if (this.winCondition.losses == 1 && health == 0) {
            this.winCondition.losses++;
        }

        // Player lost all their health, next round
        if (this.winCondition.losses <= 1 && health <= 0) {
            ship.kill();
            this.resetGame(false);
        }
        // Bo3 over, announce stats + winner
        else if (this.winCondition.losses == 2 && health <= 0) {
            if (this.stats.shotsFired == 0) {
                this.stats.shotsFired = 1;
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

    resetGame(isWon) {
        console.log('resetGame', this.winCondition.wins, this.winCondition.losses);
        this.pause = true;

        // Update stats
        this.winCondition.victories[this.winCondition.round] = isWon;
        this.winCondition.defeats[this.winCondition.round] = !isWon;
        this.winCondition.round++;

        // This player won the round
        let innerRoundText = '';
        if (isWon) {
            this.winCondition.wins++;
            innerRoundText = 'You win round ';
        }
        // This player lost the round
        else {
            // Display text and update stats
            this.winCondition.losses++;
            innerRoundText = 'Player 2 wins round ';

            // Tell server you died
            socket.emit('defeat', {
                id: this.userId,
                dead: true,
                wins: this.winCondition.wins,
                losses: this.winCondition.losses,
            });
        }

        // Display text
        this.roundText.text =
            innerRoundText +
            this.winCondition.round +
            '!\n            ' +
            this.winCondition.wins +
            '-' +
            this.winCondition.losses;
        this.roundText.x = this.game.world.centerX - 190;
        this.roundText.visible = true;

        // Wait 3 seconds before starting next round
        setTimeout(() => {
            this.roundText.visible = false;
            this.ship.revive();

            this.lifeImage.callAll('revive');
            this.ammoImage.callAll('revive');

            const { x, y } = this.ship.getPosition();
            this.invaders.reset(x, y);
            this.pause = false;
            console.log('finished');
        }, 3000);
    }
}

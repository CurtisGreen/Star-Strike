//TODO: Fix ship selection
//TODO: Stop powerup after rounds
//TODO: Change file names
//TODO: Powerup visuals
//TODO: Add sound effect when getting powerup

// Called afterwards to ensure game is fully loaded
function startGame() {
    var game = new Phaser.Game(648, 600, Phaser.CANVAS, 'player_1', {
        preload: preload,
        create: create,
        update: update,
        render: render,
    });

    /*----variables----*/
    var userId = 1;
    var player;
    var cursors;
    var connected = false;
    var bullet;
    var bullets;
    var bulletTime = 0;
    var ammo = 10;
    var ammoImage;
    var liveImage;
    var stateText;
    var ammoTime = 0;
    var stats;
    var explosions;
    var score = 0;
    var scoreText;
    var winText;
    var healthText;
    var defeat;
    var shipCollideInvader = false;
    var roundInnerText = 'test';
    var shipText;
    var winCondition;
    var invaders;
    var unlimitedAmmo = 0;
    var pause = false;

    function preload() {
        // All image files are in 'assets' folder
        game.load.image('universe', 'assets/universe.png');
        game.load.image('bullet', 'assets/bullets.png');
        game.load.image('ship', 'assets/ship2.png');
        game.load.image('invader', 'assets/invader.png');
        game.load.spritesheet('explode', 'assets/explode.png', 128, 128);
        game.load.image('ammo', 'assets/ammo.png');
        game.load.image('live_image', 'assets/i_live.png');

        game.load.audio('destroyed', 'assets/explosion.mp3');
        game.load.audio('blaster', 'assets/blaster.mp3');
        game.load.audio('ship_damage', 'assets/space_ship_destroyed.mp3');
        game.load.audio('boden', 'assets/time_attack.mp3');
    }

    // Creates player1, the one the client controls
    function create() {
        // Sounds
        blaster = game.add.audio('blaster');
        destroyed = game.add.audio('destroyed');
        ship_damage = game.add.audio('ship_damage');
        music = game.add.audio('boden');

        music.play('', 0, 1, true); // Background music

        // Get user's unique id
        socket.on('onconnected', function (msg) {
            console.log('onconnected: user id = ' + msg.id);
            userId = msg.id;
        });

        // P2 destroyed an invader
        socket.on('double', function (msg) {
            if (msg.check && msg.id != userId && score < 20 && !pause) {
                createInvaders();
                createInvaders();
            }
        });

        // Setup bo3 recording
        winCondition = {
            round: 0,
            wins: 0,
            losses: 0,
            defeats: [false, false, false],
            victories: [false, false, false],
        };

        // P2 lost the round
        socket.on('defeat', function (msg) {
            if (msg.id != userId && winCondition.wins < 1 && winCondition.round < 5) {
                resetGame(true);
                // TODO: Add ready screen before start
            } else if (msg.id != userId && winCondition.wins >= 1) {
                console.log('Won listening defeat');
                statText.text =
                    'Invaders destroyed: ' +
                    stats.shotsHit +
                    '\nHit percentage: ' +
                    Math.round((stats.shotsHit / stats.shotsFired) * 100) +
                    '%';
                statText.visible = true;
                winCondition.wins = 2;
                winText.visible = true;
                scoreText.visible = false;
                $('#reset').show();
            }
        });

        // Populate map
        socket.on('initialize', function (msg) {
            if (msg.id != userId) {
                invaders.children[0].kill();
                score--;
                createInvaders();
            } else {
                createInvaders();
            }
            console.log('heard initialize ' + msg.id + ' ' + userId);
        });

        // This will run in Canvas mode, so let's gain a little speed and display
        game.renderer.clearBeforeRender = false;
        game.renderer.roundPixels = true;

        // We need arcade physics
        game.physics.startSystem(Phaser.Physics.ARCADE);

        // A spacey background
        game.add.tileSprite(-100, -100, 900, 700, 'universe');

        // Our ships bullets
        bullets = game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;

        // All 10 of them
        bullets.createMultiple(10, 'bullet');
        bullets.setAll('anchor.x', 0.5);
        bullets.setAll('anchor.y', 0.5);

        // Our player ship
        player = game.add.sprite(game.world.centerX, game.world.centerY + 200, 'ship');
        player.anchor.set(0.5);
        player.health = 3;

        // and its physics settings
        game.physics.enable(player, Phaser.Physics.ARCADE);

        player.body.drag.set(500);
        player.body.maxVelocity.set(1000);

        // Game input
        cursors = game.input.keyboard.createCursorKeys();
        game.input.keyboard.addKeyCapture([Phaser.Keyboard.Z]);

        invaders = game.add.group();
        invaders.enableBody = true;
        invaders.physicsBodyType = Phaser.Physics.ARCADE;

        // Victory/defeat text
        statText = game.add.text(
            game.world.centerX - 100,
            game.world.centerY + 100,
            'stats:',
            { font: '20px Coiny', fill: ' #7FBF7F' }
        );
        statText.visible = false;
        scoreText = game.add.text(0, 0, 'Score:', {
            font: '20px Coiny',
            fill: ' #7FBF7F',
        });
        healthText = game.add.text(0, 570, 'Lives', {
            font: '15px Coiny',
            fill: ' #00cc00',
        });
        ammoText = game.add.text(585, 570, 'Ammo', {
            font: '15px Coiny',
            fill: ' #cc0000',
        });
        shipText = game.add.text(
            90,
            20,
            'You killed 10 invaders! You now have Unlimited ammo!',
            { font: '20px Coiny', fill: ' #7FBF7F' }
        );
        shipText.visible = false;

        roundText = game.add.text(
            game.world.centerX - 200,
            game.world.centerY,
            roundInnerText,
            { font: '40px Coiny', fill: '#329932' }
        );
        roundText.visible = false;
        winText = game.add.text(
            game.world.centerX - 100,
            game.world.centerY,
            'You Win!',
            { font: '40px Coiny', fill: '#329932' }
        );
        winText.visible = false;
        loseText = game.add.text(
            game.world.centerX - 100,
            game.world.centerY,
            'You Lose!',
            { font: '40px Coiny', fill: '#E50000' }
        );

        loseText.visible = false;

        // Explosion
        explosions = game.add.group();
        explosions.createMultiple(30, 'explode');
        explosions.forEach(setupInvader, this);

        // Ammo
        ammoImage = game.add.group();
        for (var i = 0; i < 10; i++) {
            var allammo = ammoImage.create(605, game.world.height - 120 + 10 * i, 'ammo');
            allammo.anchor.setTo(0.5, 0.5);
            allammo.angle = 0;
        }

        // Lives
        liveImage = game.add.group();
        for (var i = 0; i < 3; i++) {
            var lives = liveImage.create(
                20,
                game.world.height - 50 + 10 * i,
                'live_image'
            );
            lives.anchor.setTo(0.5, 0.5);
            lives.angle = 0;
        }

        // Post-game stats
        stats = { shotsFired: 0, shotsHit: 0 };
    }

    // Update the user's location on the server
    function updateP2() {
        var i;
        var invadeArray = [];
        for (i in invaders.children) {
            invadeArray[i] = {
                x: invaders.children[i].x,
                y: invaders.children[i].y,
            };
        }
        socket.emit('update', {
            id: userId,
            x: player.x,
            y: player.y,
            rotation: player.rotation,
            fire: game.input.keyboard.isDown(Phaser.Keyboard.Z),
            invArray: invadeArray,
        });
    }

    // Called 60 times per second to update the state of the game for the user
    function update() {
        game.physics.arcade.overlap(
            bullets,
            invaders,
            bulletCollisionHandler,
            null,
            this
        );

        if (!loseText.visible) {
            game.physics.arcade.overlap(
                player,
                invaders,
                playerCollisionHandler,
                null,
                this
            );
        }

        if (cursors.up.isDown) {
            game.physics.arcade.accelerationFromRotation(
                player.rotation,
                200,
                player.body.acceleration
            );
        } else {
            player.body.acceleration.set(0);
        }

        if (cursors.left.isDown) {
            player.body.angularVelocity = -300;
        } else if (cursors.right.isDown) {
            player.body.angularVelocity = 300;
        } else {
            player.body.angularVelocity = 0;
        }

        if (game.input.keyboard.isDown(Phaser.Keyboard.Z)) {
            fireBullet();
        }

        // Send data of your position to the server
        updateP2();

        // Let the player move from one side of the screen to the next
        screenWrap(player);

        //bullets.forEachExists(screenWrap, this);

        scoreText.text = 'Invaders:' + score;

        // Show defeat text
        if (score >= 20 && winCondition.wins < 2 && winCondition.losses < 1 && !pause) {
            console.log(
                'Lost the round, losses = ' +
                    winCondition.losses +
                    ' rounds = ' +
                    winCondition.round
            );
            pause = true;
            resetGame(false);
        } else if (score >= 20 && winCondition.losses == 1 && !pause) {
            pause = true;
            loseGame();
        }
    }

    function loseGame() {
        console.log(
            'Lost the game, wins = ' +
                winCondition.round +
                ' losses ' +
                winCondition.losses
        );
        if (stats.shotsFired == 0) {
            stats.shotsFire = 1;
        }

        // Tell server you lost
        socket.emit('defeat', {
            id: userId,
            dead: false,
            wins: winCondition.wins,
            losses: winCondition.losses,
        });
        winCondition.losses++;
        statText.text =
            'Invaders destroyed: ' +
            stats.shotsHit +
            '\nHit percentage: ' +
            Math.round((stats.shotsHit / stats.shotsFired) * 100) +
            '%';
        statText.visible = true;
        loseText.visible = true;
        scoreText.visible = false;
        healthText.visible = false;
        shipText.visible = false;
        $('#reset').show();
    }

    //Create explosion animation
    function setupInvader(invader) {
        invader.anchor.x = 0.5;
        invader.anchor.y = 0.5;
        invader.animations.add('explode');
    }

    // Shoots lasers in targeted direction
    function fireBullet() {
        // Limit shots per second
        if (game.time.now > bulletTime) {
            bullet = bullets.getFirstExists(false);

            // Shoot 10 times then set timeout on shooting
            if (bullet && ammo > 0) {
                bullet.reset(player.body.x + 16, player.body.y + 16);
                bullet.lifespan = 1500;
                bullet.rotation = player.rotation;
                game.physics.arcade.velocityFromRotation(
                    player.rotation,
                    400,
                    bullet.body.velocity
                );
                bulletTime = game.time.now + 200;

                if (unlimitedAmmo > 10) {
                    ammo = 10;
                } else {
                    ammoImage.getFirstAlive().kill();
                    ammo--;
                }

                blaster.play(); // Shooting sound
                stats.shotsFired++;

                // Update ammo on p2's screen
                socket.emit('ammo', {
                    check: true,
                    id: userId,
                    ammo: ammo,
                });
            } else if (ammo <= 0 && game.time.now > ammoTime) {
                // Enough time has passed to reload
                //console.log('ammo = ' + ammo + ' ammoTime = ' + ammoTime + 'game time = ' + game2.time.now);
                ammoTime = game.time.now + 5000;
                ammo = 10;
                ammoImage.callAll('revive');
            }
        }
    }

    // Let the user fly off the screen back to the other side
    function screenWrap(player) {
        if (player.x < 0) {
            player.x = game.width;
        } else if (player.x > game.width) {
            player.x = 0;
        }

        if (player.y < 0) {
            player.y = game.height;
        } else if (player.y > game.height) {
            player.y = 0;
        }
    }

    function render() {}

    // Creates invaders that move randomly
    function createInvaders() {
        if (score < 20 && winCondition.losses < 2 && winCondition.wins < 2) {
            var intersect = false;

            while (!intersect) {
                // This loop verifies the invader will not spawn too close to the user
                // Randomize invader position
                this.x = game.world.randomX;
                this.y = game.world.randomY;

                if (
                    (this.x > player.x + 20 || this.x < player.x - 20) &&
                    (this.y > player.y + 20 || this.y < player.y - 20)
                ) {
                    intersect = true;
                }
            }

            // Create invader
            var invader = invaders.create(this.x, this.y, 'invader');
            invader.anchor.setTo(0.5, 0.5);
            score++;
            var tween = game.add.tween(invader);

            this.game.time.events.loop(
                750,
                function () {
                    // Randomize invader movement
                    this.minSpeed = -100;
                    this.maxSpeed = 100;
                    this.signx = 1;
                    this.signy = 1;
                    if (Math.random() < 0.5) {
                        this.signx = -1;
                    }
                    if (Math.random() < 0.5) {
                        this.signy = -1;
                    }

                    // Create new position to move to
                    this.vx =
                        this.signx *
                            (Math.random() * (this.maxSpeed - this.minSpeed + 1) -
                                this.minSpeed) +
                        this.x;
                    this.vy =
                        this.signy *
                            (Math.random() * (this.maxSpeed - this.minSpeed + 1) -
                                this.minSpeed) +
                        this.y;

                    // Don't move if it moves outside the screen
                    if (
                        this.vx > game.width + 50 ||
                        this.vx < -50 ||
                        this.vy > game.height + 50 ||
                        this.vy < -50
                    ) {
                        this.vx = invader.x;
                        this.vy = invader.y;
                    }
                    this.game.add
                        .tween(invader)
                        .to(
                            { x: this.vx, y: this.vy },
                            1750,
                            Phaser.Easing.Quadratic.InOut,
                            true,
                            0,
                            1000,
                            true
                        );
                },
                this
            );

            // Send new invader info to server
            socket.emit('invaders', {
                id: userId,
                x: this.x,
                y: this.y,
                vx: this.vx,
                vy: this.vy,
                score: score,
            });
        }
    }

    function descend() {
        invaders.y == 10;
    }

    // Destroys invader & bullets on intersection
    function bulletCollisionHandler(bullet, invader) {
        var explosion = explosions.getFirstExists(false);
        explosion.reset(invader.body.x, invader.body.y);
        explosion.play('explode', 30, false, true);
        var index = Array.prototype.indexOf.call(invader.parent.children, invader);
        score--;
        unlimitedAmmo++;
        bullet.kill();
        invader.kill();
        destroyed.play(); // Sound for explosion.

        if (!pause) {
            // Tell p2 that an invader has been destroyed
            socket.emit('double', {
                check: true,
                id: userId,
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

        if (!pause) {
            stats.shotsHit++;
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
    function playerCollisionHandler(player, invader) {
        // Make sure player can't die in between rounds
        if (!pause) {
            var explosion = explosions.getFirstExists(false);
            explosion.reset(invader.body.x, invader.body.y);
            explosion.play('explode', 30, false, true); // Player was damaged by an invader
            var index = Array.prototype.indexOf.call(invader.parent.children, invader);
            invader.kill();
            player.health -= 1; // Decrease health & delete health image
            liveImage.getFirstAlive().kill();
            ship_damage.play();

            // Update p2 health for enemy player
            socket.emit('health', {
                id: userId,
                health: player.health,
                index: index,
                shipCollideInvader: true,
            });

            score--;
            if (winCondition.losses == 1 && player.health == 0) {
                winCondition.losses++;
            }

            // Player lost all their health
            if (winCondition.losses <= 1 && player.health <= 0) {
                player.kill();
                resetGame(false);
            } else if (winCondition.losses == 2 && player.health <= 0) {
                if (stats.shotsFired == 0) {
                    stats.shotsFire = 1;
                }
                statText.text =
                    'Invaders destroyed: ' +
                    stats.shotsHit +
                    '\nHit percentage: ' +
                    Math.round((stats.shotsHit / stats.shotsFired) * 100) +
                    '%';
                statText.visible = true;
                loseText.visible = true;
                scoreText.visible = false;
                healthText.visible = false;

                // Tell server you died
                socket.emit('defeat', {
                    id: userId,
                    dead: true,
                    wins: winCondition.wins,
                    losses: winCondition.losses,
                });

                $('#reset').show();
            }
        }
    }

    function resetGame(isWon) {
        console.log('resetting game ' + winCondition.wins + ' ' + winCondition.losses);
        pause = true;

        // This player won the round
        if (isWon) {
            // Display text and update stats
            winCondition.victories[winCondition.round] = true;
            winCondition.round++;
            winCondition.wins++;
            roundInnerText =
                'You win round ' +
                winCondition.round +
                '!\n            ' +
                winCondition.wins +
                '-' +
                winCondition.losses;
            roundText.text = roundInnerText;
            roundText.x = game.world.centerX - 190;
            roundText.visible = true;

            // Wait 3 seconds before starting next round
            setTimeout(function () {
                roundText.visible = false;
                player.health = 3; // Reset health, ammo, images and invaders
                ammo = 10;

                invaders.callAll('kill');
                liveImage.callAll('revive');
                ammoImage.callAll('revive');
                createInvaders();
            }, 3000);
        }
        // This player lost the round
        else {
            // Display text and update stats
            winCondition.defeats[winCondition.round] = true;
            winCondition.round++;
            winCondition.losses++;
            roundInnerText =
                'Player 2 wins round ' +
                winCondition.round +
                '!\n                ' +
                winCondition.wins +
                '-' +
                winCondition.losses;
            roundText.text = roundInnerText;
            roundText.x = game.world.centerX - 200;
            roundText.visible = true;

            // Tell server you died
            socket.emit('defeat', {
                id: userId,
                dead: true,
                wins: winCondition.wins,
                losses: winCondition.losses,
            });

            // Wait 3 seconds before starting next round
            setTimeout(function () {
                roundText.visible = false;
                ammo = 10;
                player.revive();
                player.health = 3; // Reset health, ammo, images and invaders
                invaders.callAll('kill');
                liveImage.callAll('revive');
                ammoImage.callAll('revive');
                createInvaders();
                console.log('has been reset');
            }, 3000);
        }
        console.log('finished');
        score = 0;
        pause = false;
    }

    // Reset variables for next time
    function shutdown() {
        console.log('Shutdown');

        winCondition.rounds = 0;
        winCondition.wins = 0;
        winCondition.losses = 0; // Reset rounds
        stats.shotsFired = 0;
        stats.shotsHit = 0; // Reset stats
        connected = false;
        bulletTime = 0;
        ammo = 10;
        stateText.visible = false;
        ammoTime = 0;
        score = 0;
        winText.visible = false;
        defeat = false;
        shipCollideInvader = false;
        roundInnerText = 'test';
        shipText.visible = false;
        invaders.callAll('kill');
        unlimitedAmmo = 0;
        pause = false;
    }
}

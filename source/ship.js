export class Ship {
    ship;
    bullets;
    // bullet;
    game;
    bulletTime = 0;
    health = 3;
    unlimitedAmmo = false;

    constructor(game, p1) {
        this.game = game;
        this.p1 = p1;

        // Bullets
        this.bullets = this.game.add.group();
        this.bullets.enableBody = true;
        this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
        this.bullets.createMultiple(40, 'bullet');
        this.bullets.setAll('anchor.x', 0.5);
        this.bullets.setAll('anchor.y', 0.5);

        // Ship
        this.ship = game.add.sprite(game.world.centerX, game.world.centerY + 200, 'ship');
        this.ship.anchor.set(0.5);
        this.game.physics.enable(this.ship, Phaser.Physics.ARCADE);
        this.ship.body.drag.set(500);
        this.ship.body.maxVelocity.set(1000);
    }

    fireBullet() {
        if (this.game.time.now > this.bulletTime) {
            const bullet = this.bullets.getFirstExists(false);

            if (bullet) {
                bullet.reset(this.ship.body.x + 16, this.ship.body.y + 16);
                bullet.lifespan = 1500;
                bullet.rotation = this.ship.rotation;
                this.game.physics.arcade.velocityFromRotation(
                    this.ship.rotation,
                    400,
                    bullet.body.velocity
                );
                this.bulletTime = this.game.time.now + 200; // Limit how many lasers will be fired per second

                return true;
            }
        }
    }

    update(cursors) {
        if (cursors.up.isDown) {
            this.game.physics.arcade.accelerationFromRotation(
                this.ship.rotation,
                200,
                this.ship.body.acceleration
            );
        } else {
            this.ship.body.acceleration.set(0);
        }

        if (cursors.left.isDown) {
            this.ship.body.angularVelocity = -300;
        } else if (cursors.right.isDown) {
            this.ship.body.angularVelocity = 300;
        } else {
            this.ship.body.angularVelocity = 0;
        }

        if (this.game.input.keyboard.isDown(Phaser.Keyboard.Z)) {
            this.fireBullet();
        }
    }

    setPosition(x, y, rotation) {
        this.ship.x = x;
        this.ship.y = y;
        this.ship.rotation = rotation;
    }

    getPosition() {
        return { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation };
    }

    reduceHealth() {
        this.health -= 1;
        return this.health;
    }

    setHealth(health) {
        this.health = health;
    }

    setAmmo(ammo) {
        this.ammo = ammo;
    }

    getAmmo() {
        return this.ammo;
    }

    // Player can move from one side to the other
    screenWrap(width, height) {
        if (this.ship.x < 0) {
            this.ship.x = width;
        } else if (this.ship.x > width) {
            this.ship.x = 0;
        }

        if (this.ship.y < 0) {
            this.ship.y = height;
        } else if (this.ship.y > height) {
            this.ship.y = 0;
        }
    }

    kill() {
        this.ship.kill();
    }

    reset() {
        this.ship.health = 3;
        this.ship.ammo = 10;
    }

    revive() {
        this.reset();
        this.ship.revive();
    }
}

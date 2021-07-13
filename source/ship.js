export class Ship {
    bullets;
    bullet;
    game;
    bulletTime = 0;

    constructor(game) {
        this.game = game;
    }

    fireBullet() {
        if (this.game.time.now > bulletTime) {
            bullet = bullets.getFirstExists(false);

            if (bullet) {
                bullet.reset(player.body.x + 16, player.body.y + 16);
                bullet.lifespan = 1500;
                bullet.rotation = player.rotation;
                this.game.physics.arcade.velocityFromRotation(
                    player.rotation,
                    400,
                    bullet.body.velocity
                );
                this.bulletTime = this.game.time.now + 200; // Limit how many lasers will be fired per second
            }
        }
    }

    setPosition(x, y, rotation) {
        this.ship.x = x;
        this.ship.y = y;
        this.ship.rotation = rotation;
    }
}

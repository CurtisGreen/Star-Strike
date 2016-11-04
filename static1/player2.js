
var game2 = new Phaser.game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload2, create: createP2, update: updateP2, render: render2 });
//TODO: create second game2 window

/*----variables----*/
var player2;
var cursors2;

var bullet2;
var bullets2;
var bulletTime2 = 0;

var stars2;
var score2 = 0;
var scoreText2;
var winText2;

function preload2() {
    //all image files are in 'assets' folder
    game2.load.image('universe', 'assets/universe.png');
    game2.load.image('bullet', 'assets/bullets.png');
    game2.load.image('ship', 'assets/ship.png');
    game2.load.image('star', 'assets/star.png');

}


function createP2() {     

    //  This will run in Canvas mode, so let's gain a little speed and display
    game2.renderer.clearBeforeRender = false;
    game2.renderer.roundPixels = true;

    //  We need arcade physics
    game2.physics.startSystem(Phaser.Physics.ARCADE);

    //  A spacey background
    game2.add.tileSprite(-1000,-100,900,700,'universe');

    //  Our ships bullets2
    bullets2 = game2.add.group();
    bullets2.enableBody = true;
    bullets2.physicsBodyType = Phaser.Physics.ARCADE;

    //  All 40 of them
    bullets2.createMultiple(40, 'bullet2');
    bullets2.setAll('anchor.x', 0.5);
    bullets2.setAll('anchor.y', 0.5);

    //  Our player2 ship
    player2 = game2.add.sprite(game2.world.centerX, game2.world.centerY + 200, 'ship');
    player2.anchor.set(0.5);

    //  and its physics settings
    game2.physics.enable(player2, Phaser.Physics.ARCADE);

    player2.body.drag.set(500);
    player2.body.maxVelocity.set(1000);

    //  game2 input
    cursors2 = game2.input.keyboard.createCursorKeys();
    game2.input.keyboard.addKeyCapture([ Phaser.Keyboard.Z ]);

    stars2 = game2.add.group();
    stars2.enableBody = true;
    stars2.physicsBodyType = Phaser.Physics.ARCADE;

    createstars2();
    
    scoreText2 = game2.add.text(0,550,'score2:',{font: '32px Arial',fill: '#fff'});
    winText2 = game2.add.text(game2.world.centerX-50, game2.world.centerY, 'You Win!', {font: '32px Arial',fill: '#fff'});
    winText2.visible = false;  

}

function updateP2() { 
    game2.physics.arcade.overlap(bullets2,stars2,collisionHandler,null,this);

    if (cursors2.up.isDown)
    {
        game2.physics.arcade.accelerationFromRotation(player2.rotation, 200, player2.body.acceleration);
    }
    else
    {
        player2.body.acceleration.set(0);
    }

    if (cursors2.left.isDown)
    {
        player2.body.angularVelocity = -300;
    }
    else if (cursors2.right.isDown)
    {
        player2.body.angularVelocity = 300;
    }
    else
    {
        player2.body.angularVelocity = 0;
    }

    if (game2.input.keyboard.isDown(Phaser.Keyboard.Z))
    {
        firebullet2();
    }

    screenWrap(player2);

    bullets2.forEachExists(screenWrapP2, this);

     scoreText2.text = 'score2:' + score2;

    if(score2 == 3000) {     //TODO: instead of points have it display number stars2
        winText2.visible = true;
        scoreText2.visible = false;
    }

}

function firebullet2 () {    //TODO: same as above, make another function that does this except for using server commands to update screen 2

    if (game2.time.now > bulletTime2)
    {
        bullet2 = bullets2.getFirstExists(false);

        if (bullet2)
        {
            bullet2.reset(player2.body.x + 16, player2.body.y + 16);
            bullet2.lifespan = 2000;
            bullet2.rotation = player2.rotation;
            game2.physics.arcade.velocityFromRotation(player2.rotation, 400, bullet2.body.velocity);
            bulletTime2 = game2.time.now + 50;
        }
    }

}

function screenWrapP2 (player2) {  

    if (player2.x < 0)
    {
        player2.x = game2.width;
    }
    else if (player2.x > game2.width)
    {
        player2.x = 0;
    }

    if (player2.y < 0)
    {
        player2.y = game2.height;
    }
    else if (player2.y > game2.height)
    {
        player2.y = 0;
    }

}

//TODO: screen wrap for player2 2

function render2() {
}

function createstars2(){     //TODO: make stars2 move randomly, starting with 1
    for (var y = 0; y < 4; y++){
        for (var x = 0; x < 10; x++){
            var star = stars2.create(x*48, y*50, 'star');
            star.anchor.setTo (0.5,0.5);
        }
    }

    stars2.x = 100;
    stars2.y = 50;

    var tween = game2.add.tween(stars2).to({x:200},2000,Phaser.Easing.Linear.None,true,0,1000,true);

    tween.onLoop.add(descend,this);
}

function descend(){
    stars2.y ==10;
}

function collisionHandlerP2(bullet2, star){    //TODO: make destroying stars2 increase powerup count, also make score2 display # of stars2
    bullet2.kill();
    star.kill();

    score2 += 100;
}

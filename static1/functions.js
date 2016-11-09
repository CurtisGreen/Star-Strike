

function startGame(){   //Called afterwards to ensure game is fully loaded

var game = new Phaser.Game(648,600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });


/*----variables----*/
var userId = 1;
var player;
var cursors;

var bullet;
var bullets;
var bulletTime = 0;

var stars;
var score = 0;
var scoreText;
var winText;

var count = 0;

function preload() {
    //all image files are in 'assets' folder
    game.load.image('universe', 'assets/universe.png');
    game.load.image('bullet', 'assets/bullets.png');
    game.load.image('ship', 'assets/ship.png');
    game.load.image('star', 'assets/star.png');

}


function create() { //creates player1, the one the client controls

    socket.on('onconnected', function(msg){ //get user's unique id
        console.log('user id = '+ msg.id);
        userId = msg.id;
    });

	socket.on('double', function(msg){
		console.log('msgid = '+msg.id + ' ' + userId + ' p1 doubled' + score);
		if (msg.check && msg.id != userId && score < 10){
			createStars();
			createStars();
		}
	});
	
    //  This will run in Canvas mode, so let's gain a little speed and display
    game.renderer.clearBeforeRender = false;
    game.renderer.roundPixels = true;

    //  We need arcade physics
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //  A spacey background
    game.add.tileSprite(-100,-100,900,700,'universe');

    //  Our ships bullets
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;

    //  All 40 of them
    bullets.createMultiple(40, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 0.5);

    //  Our player ship
    player = game.add.sprite(game.world.centerX, game.world.centerY + 200, 'ship');
    player.anchor.set(0.5);

    //  and its physics settings
    game.physics.enable(player, Phaser.Physics.ARCADE);

    player.body.drag.set(500);
    player.body.maxVelocity.set(1000);

    //  Game input
    cursors = game.input.keyboard.createCursorKeys();
    game.input.keyboard.addKeyCapture([ Phaser.Keyboard.Z ]);

    stars = game.add.group();
    stars.enableBody = true;
    stars.physicsBodyType = Phaser.Physics.ARCADE;

    createStars();
    
    scoreText = game.add.text(0,550,'Score:',{font: '32px Arial',fill: '#fff'});
    winText = game.add.text(game.world.centerX-50, game.world.centerY, 'You Win!', {font: '32px Arial',fill: '#fff'});
    winText.visible = false; 
	loseText = game.add.text(game.world.centerX-50, game.world.centerY, 'Second Place!', {font: '32px Arial',fill: '#fff'});
    loseText.visible = false;

}

function updateP2(){    //update the user's location on the server

	socket.emit('update', {
	  id: userId,
	  x: player.x,
	  y: player.y,
	  rotation: player.rotation,
	  fire: game.input.keyboard.isDown(Phaser.Keyboard.Z),
	});
	

}

function update() { //Called 60 times per second to update the state of the game for the user
    game.physics.arcade.overlap(bullets,stars,collisionHandler,null,this);

    if (cursors.up.isDown)
    {
        game.physics.arcade.accelerationFromRotation(player.rotation, 200, player.body.acceleration);
        updateP2(); //send data to server
    }
    else
    {
        player.body.acceleration.set(0);
    }

    if (cursors.left.isDown)
    {
        player.body.angularVelocity = -300;
        updateP2();
    }
    else if (cursors.right.isDown)
    {
        player.body.angularVelocity = 300;
        updateP2();
    }
    else
    {
        player.body.angularVelocity = 0;
    }

    if (game.input.keyboard.isDown(Phaser.Keyboard.Z))
    {
        fireBullet();
        updateP2();
    }

    screenWrap(player);	//Let the player move from one side of the screen to the next

    bullets.forEachExists(screenWrap, this);

    scoreText.text = 'Stars:' + score;

    if(score >= 10) {     //TODO: Show victory/defeat to second player
        loseText.visible = true;
        scoreText.visible = false;
    }

}

function fireBullet () {    //shoots lasers in targeted direction

    if (game.time.now > bulletTime)
    {
        bullet = bullets.getFirstExists(false);

        if (bullet)
        {
            bullet.reset(player.body.x + 16, player.body.y + 16);
            bullet.lifespan = 2000;
            bullet.rotation = player.rotation;
            game.physics.arcade.velocityFromRotation(player.rotation, 400, bullet.body.velocity);
            bulletTime = game.time.now + 50;
        }
    }

}

function screenWrap (player) {  //let the user fly off the screen back to the other side

    if (player.x < 0)
    {
        player.x = game.width;
    }
    else if (player.x > game.width)
    {
        player.x = 0;
    }

    if (player.y < 0)
    {
        player.y = game.height;
    }
    else if (player.y > game.height)
    {
        player.y = 0;
    }

}


function render() {
}

function createStars(){     //TODO: make stars move randomly, starting with 1

	var star = stars.create(Math.random()*48, Math.random()*50, 'star');
	star.anchor.setTo (Math.random(),Math.random());
	score++;

    stars.x = 100;
    stars.y = 50;

    var tween = game.add.tween(stars).to({x:200},2000,Phaser.Easing.Linear.None,true,0,1000,true);

    tween.onLoop.add(descend,this);
}

function descend(){
    stars.y ==10;
}

function collisionHandler(bullet, star){    //TODO: make destroying stars increase powerup count, also make score display # of stars
    bullet.kill();
    star.kill();
	console.log('collision happened');
	//TODO: increase # of stars for p2
	socket.emit('double', {
		check: true,
		id: userId,
	});
    score--;
}
}

startGame();

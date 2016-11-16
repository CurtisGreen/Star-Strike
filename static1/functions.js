

function startGame(){   //Called afterwards to ensure game is fully loaded

var game = new Phaser.Game(648,600, Phaser.CANVAS, 'player_1', { preload: preload, create: create, update: update, render: render });


/*----variables----*/
var userId = 1;
var player;
var cursors;

var bullet;
var bullets;
var bulletTime = 0;
var ammo = 7;
var ammoImage;
var liveImage;
var stateText;
var ammoTime = 0;

var stats;

var explosion;

var invaders;
var score = 0;
var scoreText;
var winText;
var healthText;
var defeat = false;
var victory = false;
var shipCollideInvader = false;
 //var countDeaths = 0;

var count = 0;

function preload() {    //all image files are in 'assets' folder

    game.load.image('universe', 'assets/universe.png');
    game.load.image('bullet', 'assets/bullets.png');
    game.load.image('ship', 'assets/ship.png');
    game.load.image('invader', 'assets/invader.png');
    game.load.spritesheet('explode', 'assets/explode.png', 128, 128);
    game.load.image('ammo', 'assets/ammo.png');
     game.load.image('live_image', 'assets/i_live.png');

}


function create() { //creates player1, the one the client controls

    socket.on('onconnected', function(msg){ //get user's unique id
        console.log('onconnected: user id = '+ msg.id);
        userId = msg.id;
    });

	socket.on('double', function(msg){
		if (msg.check && msg.id != userId && score < 20){
			createInvaders();
			createInvaders();
		}
	});
	
	socket.on('defeat', function(msg){
		if (msg.id != userId && !defeat){
			winText.visible = true;
			scoreText.visible = false;
			victory = true;
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
    bullets.createMultiple(7, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 0.5);

    //  Our player ship
    player = game.add.sprite(game.world.centerX, game.world.centerY + 200, 'ship');
    player.anchor.set(0.5);
    player.health = 3;

    //  and its physics settings
    game.physics.enable(player, Phaser.Physics.ARCADE);

    player.body.drag.set(500);
    player.body.maxVelocity.set(1000);

    //  Game input
    cursors = game.input.keyboard.createCursorKeys();
    game.input.keyboard.addKeyCapture([ Phaser.Keyboard.Z ]);

    invaders = game.add.group();
    invaders.enableBody = true;
    invaders.physicsBodyType = Phaser.Physics.ARCADE;

    createInvaders();
    
    //  Victory/defeat text
    scoreText = game.add.text(0,0,'Score:',{font: '20px Coiny',fill: ' #cc0000'});
    healthText = game.add.text(0,570,'Lives',{font: '15px Coiny',fill: ' #00cc00'});
    ammoText = game.add.text(585,570,'Ammo',{font: '15px Coiny',fill: ' #cc0000'});
    winText = game.add.text(game.world.centerX, game.world.centerY, 'You Win!', {font: '32px Arial',fill: '#fff'});
    winText.visible = false; 
	loseText = game.add.text(game.world.centerX, game.world.centerY, 'Second Place!', {font: '32px Arial',fill: '#fff'});
    loseText.visible = false;

     //  explosion
    explosions = game.add.group();
    explosions.createMultiple(30, 'explode');
    explosions.forEach(setupInvader, this);


    // ammo
    ammoImage = game.add.group();
    for (var i = 0; i < 7; i++) {
        var allammo = ammoImage.create(605, game.world.height - 90 + (10 * i), 'ammo');
        allammo.anchor.setTo(0.5, 0.5);
        allammo.angle = 0;

    }

    //lives
    liveImage = game.add.group();
    for (var i = 0; i < 3; i++) {
        var lives = liveImage.create(20, game.world.height - 50 + (10 * i), 'live_image');
        lives.anchor.setTo(0.5, 0.5);
        lives.angle = 0;
    }

    //  Post-game stats
    stats = {shotsFired: 0, shotsHit: 0};

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

function setupInvader (invader) {
    invader.anchor.x = 0.5;
    invader.anchor.y = 0.5;
    invader.animations.add('explode');

}

function update() { //Called 60 times per second to update the state of the game for the user
    game.physics.arcade.overlap(bullets,invaders,bulletCollisionHandler,null,this);
	game.physics.arcade.overlap(player,invaders,playerCollisionHandler,null,this);

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
        updateP2(); //TODO: update player shooting only when not reloading
    }



    screenWrap(player);	//Let the player move from one side of the screen to the next

    bullets.forEachExists(screenWrap, this);

    scoreText.text = 'Invaders:' + score;
   

    if(score >= 20 && !victory) {   //Show defeat text

        loseText.visible = true;
        scoreText.visible = false;
        healthText.visible = false;
		
		socket.emit('defeat', {   //Tell server you lost
			id: userId,
			dead: false,
		});
    }

}

function fireBullet () {    //shoots lasers in targeted direction

    if (game.time.now > bulletTime && !defeat)  //Limit shots per second
    {
        bullet = bullets.getFirstExists(false);

        if (bullet && ammo > 0) //Shoot 7 times then set timeout on shooting
        {
            bullet.reset(player.body.x + 16, player.body.y + 16);
            bullet.lifespan = 1500;
            bullet.rotation = player.rotation;
            game.physics.arcade.velocityFromRotation(player.rotation, 400, bullet.body.velocity);
            bulletTime = game.time.now + 200; 
			ammo--;

            ammoImage.getFirstAlive().kill();
        
            stats.shotsFired++;

            socket.emit('ammo', {   //Update ammo on p2's screen
                check: true,
                id: userId,
                ammo: ammo,
            });

        }
		else if (ammo <= 0 && game.time.now > ammoTime){  //Enough time has passed to reload
			//console.log('ammo = ' + ammo + ' ammoTime = ' + ammoTime + 'game time = ' + game2.time.now);
			ammoTime = game2.time.now + 5000;
			ammo = 7;
            ammoImage.callAll('revive');

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

function createInvaders(){     //Creates invaders that move randomly

    var intersect = false;

    while (!intersect){     //This loop verifies the invader will not spawn too close to the user
        //Randomize invader position
        this.x = game2.world.randomX;        
        this.y = game2.world.randomY;

        if ( ((this.x > player.x + 20) || (this.x < player.x - 20)) && ((this.y > player.y + 20) || (this.y < player.y - 20)) ){
            intersect = true;
        }
    }

    //Randomize invader movement
	this.minSpeed = -75;        
	this.maxSpeed = 75;        
	this.vx = Math.random()*(this.maxSpeed - this.minSpeed+1)-this.minSpeed;        
	this.vy = Math.random()*(this.maxSpeed - this.minSpeed+1)-this.minSpeed;  
	
    //Create invader from properties above
	var invader = invaders.create(this.x, this.y, 'invader');
	invader.anchor.setTo (.5,.5);
	score++;
    var tween = game2.add.tween(invader).to({x:(this.vx),y: (this.vy) },2000,Phaser.Easing.Linear.None,true,0,1000,true);

    tween.onLoop.add(descend,this);
	
	socket.emit('invaders', { //Send new invader info to server
	  id: userId,
	  x: this.x,
	  y: this.y,
	  vx: this.vx,
	  vy: this.vy,
	  score: score, 
	});
}

function descend(){
    invaders.y ==10;
}

function bulletCollisionHandler(bullet, invader){   //Destroys invader & bullets on intersection
    //TODO: make destroying invaders increase powerup count

    bullet.kill();
    invader.kill();

    var explosion = explosions.getFirstExists(false);
    explosion.reset(invader.body.x, invader.body.y);
    explosion.play('explode', 30, false, true);

	var index = Array.prototype.indexOf.call(invader.parent.children, invader);
	socket.emit('double', {    //Tell p2 that an invader has been destroyed
		check: true,
		id: userId,
		index: index,
		score: score,
	});
    score--;
    stats.shotsHit++;
    console.log('Invaders destroyed: ' + stats.shotsHit + ' Hit percentage: ' + stats.shotsHit/stats.shotsFired*100 + '%');
}
function playerCollisionHandler(player, invader){  //Player loses health or dies when player & invaders intersect

   if( invader.kill()){  
    var explosion = explosions.getFirstExists(false);
    explosion.reset(invader.body.x, invader.body.y);
    explosion.play('explode', 30, false, true);  //Player was damaged by an invader
    player.health -= 1;
    shipCollideInvader = true;
    liveImage.getFirstAlive().kill();

    socket.emit('health', {
        check: true,
        id: userId,
        health: player.health,
        shipCollideInvader: shipCollideInvader

    });

   }
    score--;
	if (!victory && player.health <= 0 ){  //Player lost all their health
        player.kill();
        defeat = true;
        loseText.visible = true;
        scoreText.visible = false;
        healthText.visible = false;

        socket.emit('defeat', { //Tell server you died
            id: userId,
            dead: true,
        });
	}
}
}

startGame();

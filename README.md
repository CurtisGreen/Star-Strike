# Star Strike
Multiplayer Browser Game

### Setup and Run
```
npm install 
node server 
```

Then go to : HostName:12134

![Main menu](https://i.imgur.com/tLFJxff.png)
![Game](https://user-images.githubusercontent.com/9402065/124525904-9d76be00-ddc6-11eb-8aca-48ebf81565ca.png)

### TODO
* Give port as command line argument
* Have a screen showing "waiting for player 2" or at least a message
* Running out of ammo the first time doesn't stop you from shooting
  * It stops you for all following reloads
* Lower default volume
* Have a button to go back to the main menu or quit from the game
* Sometimes invaders = -1 for unkown reasons
* Lot of code is duplicated to create screens 1 & 2, try to merge
	* Also setup of variables can be improved

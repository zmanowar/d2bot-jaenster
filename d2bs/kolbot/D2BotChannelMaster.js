/**
*	@Author 		Adhd
*  	@LastUpdate 	12/17/13 14:38 Alaskan Time
*	@Filename		D2BotChannelMaster.dbj
*  
*/

var StarterConfig = { 

	//This is the CHANNEL MASTER. It starts all profiles below.
	ChannelMasterProfile : "master", // Master of the channel. starts other profiles
	whisper: true, // Whisper the game name and pass to the user
	currentGames: false, // Give the info of all Characters for that trigger word
	gameMessage: "Please make the following game, and a rusher will join you: ", // Message to say when a trigger word is found. the game name and password will be added after this phrase.
	unavailableMessage: "I am sorry, None of those rushers are available at the moment.", // Message to say when no characters are available for that trigger word
	
	
	// ChannelConfig can override these options for individual profiles.
	JoinChannel : "Op mr.crush", // Default channel. Can be an array of channels - ["channel 1", "channel 2"]
	FirstJoinMessage : "", // Default join message. Can be an array of messages	
	
	//Global script settings
	JoinGameDelay : 9, // Seconds to wait before joining a new game
	ChatActionsDelay : 2, // Seconds to wait in lobby before entering a channel
	SwitchKeyDelay : 5, // Seconds to wait before switching a used/banned key or after realm down
	CrashDelay : 5, // Seconds to wait after a d2 window crash
	RealmDownDelay : 3, // Minutes to wait after getting Realm Down message
	UnableToConnectDelay : 5, // Minutes to wait after Unable To Connect message
	CDKeyInUseDelay : 5, // Minutes to wait before connecting again if CD-Key is in use.
	ConnectingTimeout : 20, // Seconds to wait before cancelling the 'Connecting...' screen
	PleaseWaitTimeout : 10, // Seconds to wait before cancelling the 'Please Wait...' screen
	WaitInLineTimeout : 60, // Seconds to wait before cancelling the 'Waiting in Line...' screen
	GameDoesNotExistTimeout : 30 // Seconds to wait before cancelling the 'Game does not exist.' screen
	

};

var ChannelConfig = {

	/*	Format is as follows:
	 *
	 *	"Trigger word": {
	 *
	 *		"Profile 1 to start": {
	 *			joinChannel: "", //Can be an array - ["op chan", "op chan2"],
	 *			FirstJoinMessage: "", Can be an array
	 *         	otherProfiles: ["Barb", "Pally"] //Must be an array
	 *   	},
	 *		"Profile 2 to start": {
	 *			joinChannel: "",
	 *			FirstJoinMessage: "",
	 *         	otherProfiles: ["helper Barb"]
	 *   	}
	 *	};
	 */

	 
};

// No touchy!
include("json2.js");
include("OOG.js");
include("automule.js");
include("gambling.js");
include("torchsystem.js");
include("common/misc.js");

if (!FileTools.exists("data/" + me.profile + ".json")) {
	DataFile.create();
}
if (!FileTools.exists("/rushers")) {
	var dir = dopen("/");
	dir.create("rushers");
}

var gameInfo, gameStart, inGame, chatActionsDone, pingQuit, date, handle, useChat, 
firstLogin, connectFail, joinInfo, CharInfo, GameStuff, currentRusher,
gameCount = DataFile.getStats().runs + 1,
myConfig = getConfig(),
lastGameStatus = "ready",
oldIndex = 0,
lines = "",
leader = "",
loginFail = 0,
isUp = "no",
chanInfo = {
	joinChannel : "",
	firstMsg : ""
},
RushData = {
	create: function (rusher) {
		var obj, string;

		obj = {
			status: "closed",
			gameName: "",
			gamePass: ""
		};

		string = JSON.stringify(obj);
		FileTools.writeText('rushers/' + rusher + ".json", string);
	},

	read: function (rusher) {
		var obj, string;

		string = FileTools.readText('rushers/' + rusher + ".json");
		obj = JSON.parse(string);

		return obj;
	},

	write: function (obj, rusher) {
		var string;

		string = JSON.stringify(obj);

		FileTools.writeText('rushers/' + rusher + ".json", string);
	}
};

function getConfig() {

	for (var i in ChannelConfig) {	
		if (typeof ChannelConfig[i] == "object") {
		
			for (var profile in ChannelConfig[i]) {
				if (profile == me.profile) {
					print("ÿc9Using a custom Sorc profile");
					return ChannelConfig[i][profile];
				}
				
				if (typeof ChannelConfig[i][profile].otherProfiles == "object") {
					for (var y = 0; y < ChannelConfig[i][profile].otherProfiles.length; y += 1) {
						if (ChannelConfig[i][profile].otherProfiles[y] === me.profile) {
							print("ÿc7Using a custom Helper profile");
							return profile;
						}
					}
				}
			}
		}
	}

	if (me.profile === StarterConfig.ChannelMasterProfile) {
		print("ÿc8Utilizing the 'Master' profile");
	} else {
		print("ÿc1No custom profile found!");
	}
	return false;
}

function sayMsg(string) {
	if (!useChat) {
		return;
	}

	say(string);
}

function getTime() {

	if (date) {
		var h = date.getHours(),
		m = date.getMinutes(),
		s = date.getSeconds(),
		dateString = "[" + (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s) + "]";

		return dateString;
	} else {

		return false;
	}
}

function ReceiveCopyData(mode, msg) {
	var obj;

	switch (msg) {
	case "Handle":
		handle = mode;

		break;
	}

	switch (mode) {
	case 1: // JoinInfo

		joinInfo = JSON.parse(msg);

		break;
	case 2: // Game info
		print("Received Game Info");

		gameInfo = JSON.parse(msg);

		break;
	case 3: // Game request
		// Don't let others join mule/torch/key/gold drop game
		if (AutoMule.inGame || Gambling.inGame || TorchSystem.inGame) {
			break;
		}

		if (gameInfo) {
			obj = JSON.parse(msg);

			if (me.gameReady) {
				D2Bot.joinMe(obj.profile, me.gamename.toLowerCase(), "", me.gamepassword.toLowerCase(), isUp);
			} else {
				D2Bot.joinMe(obj.profile, gameInfo.gameName.toLowerCase(), gameCount, gameInfo.gamePass.toLowerCase(), isUp);
			}
		}

		break;
	case 4: // Heartbeat ping
		if (msg === "pingreq") {
			sendCopyData(null, me.windowtitle, 4, "pingrep");
		}

		break;
	case 5: //request FROM master to send info about me/game
		if (msg === "request") {
			print("Received request for info from the master");
			sendCopyData(null, StarterConfig.ChannelMasterProfile, 6, JSON.stringify({
					charName : me.charname,
					gameName : me.gamename,
					diff : me.diff,
					timeIn : getTime()
				}));
		}
		break;
	case 6: //Read info from rusher
		print("Received Info from Rusher");
		CharInfo = JSON.parse(msg);

		break;
	case 0xf124: // Cached info retrieval
		if (msg !== "null") {
			gameInfo.crashInfo = JSON.parse(msg);
		}

		break;
	}
}

function locationTimeout(time, location) {
	var endtime = getTickCount() + time;
	while (getLocation() === location && endtime > getTickCount()) {
		delay(500);
	}

	return (getLocation() !== location);
}

function updateCount() {
	D2Bot.updateCount();
	delay(1000);
	ControlAction.click(6, 264, 366, 272, 35);

	try {
		login(me.profile);
	} catch (e) {}

	delay(1000);
	ControlAction.click(6, 33, 572, 128, 35);
}

function ScriptMsgEvent(msg) {
	switch (msg) {
	case "mule":
		AutoMule.check = true;

		break;
	case "muleTorch":
		AutoMule.torchCheck = true;

		break;
	case "torch":
		TorchSystem.check = true;

		break;
	case "getMuleMode":
		if (AutoMule.torchCheck) {
			scriptBroadcast("1");
		} else if (AutoMule.check) {
			scriptBroadcast("0");
		}

		break;
	case "pingquit":
		pingQuit = true;

		break;
	}
}

function timer(tick) {
	if (!tick) {
		return "";
	}

	var min,
	sec;

	min = Math.floor((getTickCount() - tick) / 60000).toString();

	if (min <= 9) {
		min = "0" + min;
	}

	sec = (Math.floor((getTickCount() - tick) / 1000) % 60).toString();

	if (sec <= 9) {
		sec = "0" + sec;
	}

	return " (" + min + ":" + sec + ")";
}

function main() {

	debugLog(me.profile);
	addEventListener('copydata', ReceiveCopyData);
	addEventListener('scriptmsg', ScriptMsgEvent);
	while (!handle) {
		delay(100);
	}

	DataFile.updateStats("handle", handle);
	delay(500);
	D2Bot.init();
	load("tools/heartbeat.js");
	while (!gameInfo) {
		D2Bot.requestGameInfo();
		delay(500);
	}

	if (gameInfo.error) {
		delay(200);

		if (gameInfo.crashInfo) {
			D2Bot.printToConsole("Crash Info: Script: " + gameInfo.crashInfo.currScript + " Area: " + gameInfo.crashInfo.area, 10);
		}

		ControlAction.timeoutDelay("Crash Delay", StarterConfig.CrashDelay * 1e3);
		D2Bot.updateRuns();
	}
	while (true) {
		while (me.ingame) {
			if (me.gameReady) {
				isUp = "yes";

				if (!inGame) {
					date = new Date();
					gameStart = getTickCount();

					print("Updating Status");

					lastGameStatus = "stop";
					inGame = true;

					DataFile.updateStats("runs", gameCount);
					DataFile.updateStats("ingameTick");
				}

				D2Bot.updateStatus("Game: " + me.gamename + timer(gameStart));
			}

			delay(1000);
		}

		isUp = "no";

		locationAction(getLocation());
		delay(1000);
	}
}

function locationAction(location) {
	var i,
	control,
	string,
	text;

	MainSwitch : switch (location) {
	case 0:
		break;
	case 1: // Lobby
		D2Bot.updateStatus("Lobby");

		loginFail = 0;

		ControlAction.click(6, 27, 480, 120, 20);

		break;
	case 2: // Waiting In Line
		D2Bot.updateStatus("Waiting...");
		locationTimeout(StarterConfig.WaitInLineTimeout * 1e3, location);
		ControlAction.click(6, 433, 433, 96, 32);

		break;
	case 3: // Lobby Chat
		D2Bot.updateStatus("Lobby Chat");

		if (lastGameStatus === "stop" || lastGameStatus === "pending") {
			D2Bot.stop();
		}

		if (!chatActionsDone) {
			chatActionsDone = true;

			if (myConfig && myConfig.hasOwnProperty("JoinChannel")) {
				chanInfo.joinChannel = myConfig.JoinChannel;
			} else {
				chanInfo.joinChannel = StarterConfig.JoinChannel;
			}

			if (myConfig && myConfig.hasOwnProperty("FirstJoinMessage")) {
				chanInfo.firstMsg = myConfig.FirstJoinMessage;
			} else {
				chanInfo.firstMsg = StarterConfig.FirstJoinMessage;
			}

			if (chanInfo.joinChannel) {
				if (typeof chanInfo.joinChannel === "string") {
					chanInfo.joinChannel = [chanInfo.joinChannel];
				}

				if (typeof chanInfo.firstMsg === "string") {
					chanInfo.firstMsg = [chanInfo.firstMsg];
				}
				
				for (i = 0; i < chanInfo.joinChannel.length; i += 1) {
					ControlAction.timeoutDelay("Chat delay", StarterConfig.ChatActionsDelay * 1e3);

					if (ControlAction.joinChannel(chanInfo.joinChannel[i])) {
						useChat = true;
					} else {
						print("?c1Unable to join channel, disabling chat messages.");

						useChat = false;
					}

					if (chanInfo.firstMsg[i] !== "") {
						sayMsg(chanInfo.firstMsg[i]);
						delay(500);
					}
				}
			}
		}

		// Adhd Channel Master
		if (StarterConfig.ChannelMasterProfile === me.profile) {
			var i, x, myProfiles, words, getCurrent, foundOne, RusherDiff, helper, y, profile, wordsArray, whisper, msg,											
			loopstart = getTickCount();

			D2Bot.updateStatus("Waiting for Trigger");

			MainLoop : while (true) {

				if (oldIndex >= 100000) {
					D2Bot.restart(true);
				}

				lines = ControlAction.getText(4, 28, 410, 354, 298);
				foundOne = false;
				
				if (getLocation() === 17) {
					break;
				}
				
				if (lines) {
					for (; oldIndex < lines.length; oldIndex++) {
						words = lines[oldIndex].toLowerCase().replace(/<|>|ÿc4|/g, "");
						wordsArray = words.split(" ");
						
						for (i in ChannelConfig) {
						
							if (ChannelConfig.hasOwnProperty(i)) {
								i = i.toLowerCase();

								if (words.match(i)) {
								
									if (words.match(/champion|slayer|matriarch|sir|dame|lord|lady|baroness|baron|count|countess|duke|duchess|king|queen/g)) {
										whisper = wordsArray[1];
									} else {
										whisper = wordsArray[0];
									}

									myProfiles = ChannelConfig[i];

									for (x in myProfiles) {
										if (myProfiles.hasOwnProperty(x)) {

											if (!FileTools.exists('rushers/' + x + ".json")) {
												RushData.create(x);
											}

											if (!sendCopyData(null, x, 4, "pingrep")) {
												currentRusher = RushData.read(x);
												currentRusher.status = "closed";
												RushData.write(currentRusher, x);
											}
											
											currentRusher = RushData.read(x); 

											if (currentRusher.status === "closed") {

												foundOne = true;
												gameCount += 1;
												D2Bot.updateRuns();
												DataFile.updateStats("runs", gameCount);

												currentRusher.status = "open"; 
												currentRusher.gameName = gameInfo.gameName + gameCount;
												currentRusher.gamePass = gameInfo.gamePass;
												RushData.write(currentRusher, x);
												
												msg = " " + gameInfo.gameName + gameCount + (gameInfo.gamePass === "" ? "" : " // " + gameInfo.gamePass + " ");
												
												if (StarterConfig.whisper) {
													say("/whisper " + whisper + " " + StarterConfig.gameMessage + msg);
												} else {
													say("/me " + StarterConfig.gameMessage + msg);
												}
												
												D2Bot.start(x);
												oldIndex++;
												break;
											}
										}
									}

									if (!foundOne) {
										say(StarterConfig.unavailableMessage);
										
										if (StarterConfig.currentGames) {
											for (x in myProfiles) {
												if (myProfiles.hasOwnProperty(x)) {
													sendCopyData(null, x, 5, "request");
													delay(500);
													
													if (CharInfo) {	
														if (CharInfo.charName !== undefined) {

															switch (CharInfo.diff) {
															case 0:
																RusherDiff = "Normal";
																break;
															case 1:
																RusherDiff = "Nightmare";
																break;
															case 2:
																RusherDiff = "Hell";
																break;
															default:
																RusherDiff = "Normal";
																break;
															}

															say("/me | Rusher:  " + CharInfo.charName + " | Current Game:  " + CharInfo.gameName + "| Game Difficulty:  " + RusherDiff + " | Joined game at:  " + CharInfo.timeIn);
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}

				if (getTickCount() - loopstart > 180000) {

					ControlAction.click(6, 652, 469, 120, 20); // Click Join
					delay(3000);
					ControlAction.click(6, 433, 433, 96, 32); // Click Cancel

					loopstart = getTickCount();
				}
				delay(200);
			}
		}
		//END Adhd Channel Master

		if (!ControlAction.click(6, 652, 469, 120, 20)) { // Join
			break;
		}

		if (!locationTimeout(5000, location)) { // in case join button gets bugged
			if (!ControlAction.click(6, 533, 469, 120, 20)) { // Create
				break;
			}

			if (!ControlAction.click(6, 652, 469, 120, 20)) { // Join
				break;
			}
		}

		break;
	case 4: // Create Game
		break;
	case 5: // Join Game
		if (!FileTools.exists('rushers/' + me.profile + ".json")) {
			GameStuff = RushData.read(myConfig); //For helpers, it returns their leaders profile
		} else {
			GameStuff = RushData.read(me.profile);
		}
		
		delay(500);

		if (GameStuff && GameStuff.gameName !== "") {

			ControlAction.setText(1, 606, 148, 155, 20, GameStuff.gamePass);
			ControlAction.setText(1, 432, 148, 155, 20, GameStuff.gameName);

			if (lastGameStatus === "pending" || (gameInfo.error === "@error" && DataFile.getStats().gameName === GameStuff.gameName)) {
				if (gameInfo.error === "@error") {
					gameInfo.error = "";
				}

				lastGameStatus = "ready";
			}

			D2Bot.updateRuns();

			print("ÿc2joining game " + GameStuff.gameName);

			delay(StarterConfig.JoinGameDelay * 1000);

			me.blockMouse = true;

			DataFile.updateStats("gameName", GameStuff.gameName);
			ControlAction.click(6, 594, 433, 172, 32);

			me.blockMouse = false;

			lastGameStatus = "pending";

			locationTimeout(15000, location);

		}
		break;
	case 6: // Ladder
		break;
	case 7: // Channel List
		break;
	case 8: // Main Menu
	case 9: // Login
	case 12: // Character Select
	case 18: // D2 Splash
		// Single Player screen fix
		if (getLocation() === 12 && !getControl(4, 626, 100, 151, 44)) {
			ControlAction.click(6, 33, 572, 128, 35);

			break;
		}

		if (firstLogin && getLocation() === 9) { // multiple realm botting fix in case of R/D or disconnect
			ControlAction.click(6, 33, 572, 128, 35);
		}

		if (!firstLogin) {
			firstLogin = true;
		}

		D2Bot.updateStatus("Logging In");

		if (myConfig && myConfig.hasOwnProperty("otherProfiles")) {
			for (var y = 0; y < myConfig.otherProfiles.length; y += 1) {
			
				if (sendCopyData(null, myConfig.otherProfiles[y], 4, "pingrep")) {
					print("ÿc4Helper stuck in game, stopping..");
					D2Bot.stop(myConfig.otherProfiles[y]);
				}

				D2Bot.start(myConfig.otherProfiles[y]);
				print("ÿc3starting " + myConfig.otherProfiles[y]);
				delay(500);
			}
		}

		try {
			login(me.profile);
		} catch (e) {
			print(e + " " + getLocation());
		}

		break;
	case 10: // Login Error
		string = "";
		text = ControlAction.getText(4, 199, 377, 402, 140);

		if (text) {
			for (i = 0; i < text.length; i += 1) {
				string += text[i];

				if (i !== text.length - 1) {
					string += " ";
				}
			}

			switch (string) {
			case getLocaleString(5207):
				D2Bot.updateStatus("Invalid Password");
				D2Bot.printToConsole("Invalid Password");

				break;
			case getLocaleString(5208):
				loginFail += 1;

				if (loginFail < 2) {
					ControlAction.timeoutDelay("Login retry", 3000);
					ControlAction.click(6, 335, 412, 128, 35);

					break MainSwitch;
				}

				D2Bot.updateStatus("Invalid Account");
				D2Bot.printToConsole("Invalid Account");

				break;
			case getLocaleString(5199):
				D2Bot.updateStatus("Disabled CDKey");
				D2Bot.printToConsole("Disabled CDKey: " + gameInfo.mpq, 6);
				D2Bot.CDKeyDisabled();

				if (gameInfo.switchKeys) {
					ControlAction.timeoutDelay("Key switch delay", StarterConfig.SwitchKeyDelay * 1000);
					D2Bot.restart(true);
				} else {
					D2Bot.stop();
				}

				break;
			case getLocaleString(5347):
				D2Bot.updateStatus("Disconnected");
				D2Bot.printToConsole("Disconnected");
				ControlAction.click(6, 335, 412, 128, 35);

				break MainSwitch;
			default:
				D2Bot.updateStatus("Login Error");
				D2Bot.printToConsole("Login Error - " + string);

				break;
			}
		}

		ControlAction.click(6, 335, 412, 128, 35);
		while (true) {
			delay(1000);
		}

		break;
	case 11: // Unable To Connect
		D2Bot.updateStatus("Unable To Connect");

		if (connectFail) {
			ControlAction.timeoutDelay("Unable to Connect", StarterConfig.UnableToConnectDelay * 6e4);

			connectFail = false;
		}

		if (!ControlAction.click(6, 335, 450, 128, 35)) {
			break;
		}

		connectFail = true;

		break;
	case 13: // Realm Down - Character Select screen
		D2Bot.updateStatus("Realm Down");
		delay(1000);

		if (!ControlAction.click(6, 33, 572, 128, 35)) {
			break;
		}

		updateCount();
		ControlAction.timeoutDelay("Realm Down", StarterConfig.RealmDownDelay * 6e4);
		D2Bot.CDKeyRD();

		if (gameInfo.switchKeys && !gameInfo.rdBlocker) {
			D2Bot.printToConsole("Realm Down - Changing CD-Key");
			ControlAction.timeoutDelay("Key switch delay", StarterConfig.SwitchKeyDelay * 1000);
			D2Bot.restart(true);
		} else {
			D2Bot.printToConsole("Realm Down - Restart");
			D2Bot.restart();
		}

		break;
	case 14: // Character Select / Main Menu - Disconnected
		D2Bot.updateStatus("Disconnected");
		delay(500);
		ControlAction.click(6, 351, 337, 96, 32);

		break;
	case 16: // Character Select - Please Wait popup
		if (!locationTimeout(StarterConfig.PleaseWaitTimeout * 1e3, location)) {
			ControlAction.click(6, 351, 337, 96, 32);
		}

		break;
	case 17: // Lobby - Lost Connection - just click okay, since we're toast anyway
		delay(1000);
		ControlAction.click(6, 351, 337, 96, 32);
		chatActionsDone = false;
		oldIndex = 0;

		break;
	case 19: // Login - Cdkey In Use
		D2Bot.printToConsole(gameInfo.mpq + " is in use by " + ControlAction.getText(4, 158, 310, 485, 40), 6);
		D2Bot.CDKeyInUse();

		if (gameInfo.switchKeys) {
			ControlAction.timeoutDelay("Key switch delay", StarterConfig.SwitchKeyDelay * 1000);
			D2Bot.restart(true);
		} else {
			ControlAction.click(6, 335, 450, 128, 35);
			ControlAction.timeoutDelay("CD-Key in use", StarterConfig.CDKeyInUseDelay * 6e4);
		}

		break;
	case 20: // Single Player - Select Difficulty
		break;
	case 21: // Main Menu - Connecting
		if (!locationTimeout(StarterConfig.ConnectingTimeout * 1e3, location)) {
			ControlAction.click(6, 330, 416, 128, 35);
		}

		break;
	case 22: // Login - Invalid Cdkey (classic or xpac)
		text = ControlAction.getText(4, 162, 270, 477, 50);
		string = "";

		if (text) {
			for (i = 0; i < text.length; i += 1) {
				string += text[i];

				if (i !== text.length - 1) {
					string += " ";
				}
			}
		}

		switch (string) {
		case getLocaleString(10914):
			D2Bot.printToConsole(gameInfo.mpq + " LoD key in use by " + ControlAction.getText(4, 158, 310, 485, 40), 6);
			D2Bot.CDKeyInUse();

			if (gameInfo.switchKeys) {
				ControlAction.timeoutDelay("Key switch delay", StarterConfig.SwitchKeyDelay * 1000);
				D2Bot.restart(true);
			} else {
				ControlAction.click(6, 335, 450, 128, 35);
				ControlAction.timeoutDelay("LoD key in use", StarterConfig.CDKeyInUseDelay * 6e4);
			}

			break;
		default:
			if (gameInfo.switchKeys) {
				D2Bot.printToConsole("Invalid CD-Key");
				ControlAction.timeoutDelay("Key switch delay", StarterConfig.SwitchKeyDelay * 1000);
				D2Bot.restart(true);
			} else {
				ControlAction.click(6, 335, 450, 128, 35);
				ControlAction.timeoutDelay("Invalid CD-Key", StarterConfig.CDKeyInUseDelay * 6e4);
			}

			break;
		}

		break;
	case 23: // Character Select - Connecting
	case 42: // Empty character screen
		if (!locationTimeout(StarterConfig.ConnectingTimeout * 1e3, location)) {
			ControlAction.click(6, 33, 572, 128, 35);
		}

		if (gameInfo.rdBlocker) {
			D2Bot.restart();
		}

		break;
	case 24: // Server Down - not much to do but wait..
		break;
	case 25: // Lobby - Please Wait
		if (!locationTimeout(StarterConfig.PleaseWaitTimeout * 1e3, location)) {
			ControlAction.click(6, 351, 337, 96, 32);
		}

		break;
	case 26: // Lobby - Game Name Exists
		break;
	case 27: // Gateway Select
		ControlAction.click(6, 436, 538, 96, 32);

		break;
	case 28: // Lobby - Game Does Not Exist
		lastGameStatus = "stop";
		break;
	case 38: // Game is full
		break;
	default:
		if (location !== undefined) {
			D2Bot.printToConsole("Unhandled location " + location);
			takeScreenshot();
			delay(500);
			D2Bot.restart();
		}

		break;
	}
}
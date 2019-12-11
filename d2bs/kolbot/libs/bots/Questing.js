/**
 *    @filename    Questing.js
 *    @author      kolton
 *    @desc        Do quests, only most popular ones for now
 */

(function (module, require) {

	const Precast = require('Precast');
	const NPC = require('NPC');
	const GameData = require('GameData');
	const Config = require('Config');
	const Attack = require('Attack');
	const Pickit = require('Pickit');
	const Pather = require('Pather');
	const Town = require('Town');
	const Quests = require('QuestEvents');

	const Questing = {

		checkQuest: function (id, state) {
			sendPacket(1, 0x40);
			delay(500);

			return me.getQuest(id, state);
		},

		getItem: function(questItem, container) {
			if (me.getItem(questItem)) {
				return true; // Already has item
			}

			let chest = getUnit(sdk.unittype.Objects, container);
			if (!chest) {
				return false; // Unit does not exist/not nearby.
			} 

			Misc.openChest(chest);

			let itemOnGround = getUnit(sdk.unittype.Item, questItem); 
			let tries = 0;
			while (!itemOnGround && tries < 5) { // Wait for quest item to drop
				itemOnGround = getUnit(sdk.unittype.Item, questItem);
				tries++;
				delay(100);
			}

			Pickit.pickItems(); // TODO: Automagically add the quest items to pickit
			return me.getItem(questItem);
		},

		transmuteItems: function(endItem, ...components) {
			if (me.getItem(endItem)) return true;
			if (!me.inTown) Town();
			if (!getUIFlag(sdk.uiflags.Cube) && !Town.openStash() || !me.emptyCube()) return false;

			for (let itemId of components) {
				let item = me.getItems(itemId);
				if (!item || Storage.Cube.MoveTo(item)) return false;
			}
			me.openCube();
			transmute();
			let item = me.getItem(endItem);
			if (!item) return false;
			if (!Storage.Inventory.MoveTo(item)) {
				item.drop();
				delay(100 + me.ping);
				Pickit.pickItems();
			}

			if (me.itemoncursor) {
				// Something went wrong with cubing.
				randomItem = me.getItems()[0];
				randomItem.drop();
				delay(100 + me.ping);
				Pickit.pickItems();
			}

			return me.getItem(endItem);
		},

		DenOfEvil: function () {
			Quests.on(sdk.quests.DenOfEvil, (state) => {
				if (state[0]) { // Quest is done.
					return true;
				} else if (state[1]) { // Need to talk to Akara
					var tries = 0;
					while (!me.inTown && tries < 3) {
						Pather.journeyTo(sdk.areas.RogueEncampment, true);
						tries++;
					}
					me.talkTo(NPC.Akara);
				} else {
					return require("./Den", "bots/")(Config, Attack, Pickit, Pather, Town);
				}
			});
			Quests.emit(sdk.quests.DenOfEvil, Quests.states[sdk.quests.DenOfEvil]);
		},

		SistersBurialGrounds: function () {
			return require("./Raven", "bots/quests")(Config, Attack, Pickit, Pather, Town);
		},

		TheSearchForCain: function () {
			require("./Cain")(Config, Attack, Pickit, Pather, Town);
		},

		ForgottenTower: function () {
			require("./Countess")(Config, Attack, Pickit, Pather, Town);
		},
/*
		ToolsOfTheTrade: function () {
			
		},
*/
		SistersToTheSlaughter: function () {
			require("./Andariel")(Config, Attack, Pickit, Pather, Town);
		},

		AbleToGotoActII: function () {
			require("./AbleToGotoAct")(Config, Pather, Town).actII();
		},

		SpokeToJerhyn: function () {
			
		},

		RadamentsLair: function () {
			require("./Radament", "bots/quests")(Config, Attack, Pickit, Pather, Town);
		},

		TheHoradricStaff: function () {
			require('./Staff', "bots/quests")(Config, Attack, Pickit, Pather, Town, this.getItem, this.transmuteItems);
		},
/*
		TheTaintedSun: function () {
			
		},

		TheArcaneSanctuary: fu	nction () {
			
		},
*/
		TheSummoner: function () {
			require("./Summoner")(Config, Attack, Pickit, Pather, Town);
		},

		TheSevenTombs: function () {
			require("./Duriel")(Config, Attack, Pickit, Pather, Town);
		},

		AbleToGotoActIII: function () {
			if (this.checkQuest(sdk.quests.TheSevenTombs, sdk.quests.states.Finished)) {
				!Pather.accessToAct(3) && this.goToAct(3);
			} else {
				this.TheSevenTombs();
			}
		},
/*
		SpokeToHratli: function () {
			
		},

		TheGoldenBird: function () {
			
		},

		BladeOfTheOldReligion: function () {
			
		},
*/
		KhalimsWill: function () {
			require("./Khalims")(Config, Attack, Pickit, Pather, Town, this.getItem, this.transmuteItems);
		},
/*
		LamEsensTome: function () {
			
		},
*/
		TheBlackenedTemple: function () {
			require("./Travincal")(Config, Attack, Pickit, Pather, Town);
		},

		TheGuardian: function () {
			require("./Mephisto")(Config, Attack, Pickit, Pather, Town);
		},

		AbleToGotoActIV: function () {
			require("./AbleToGotoAct")(Config, Attack, Pickit, Pather, Town).actIV();
		},
/*
		SpokeToTyrael: function () {
			
		},
*/
		TheFallenAngel: function () {
			require("./Izual")(Config, Attack, Pickit, Pather, Town);
		},
/*
		HellsForge: function () {
			
		},
*/
		TerrorsEnd: function () {
			require("./Diablo")(Config, Attack, Pickit, Pather, Town);
		},

		AbleToGotoActV: function () {
			require("./AbleToGotoAct")(Config, Attack, Pickit, Pather, Town).actV();
		},
/*
		SiegeOnHarrogath: function () {

		},

		RescueonMountArreat: function () {
			
		},

		PrisonOfIce: function () {
			
		},

		BetrayalOfHaggorath: function () {
			
		},

		RiteOfPassage: function () {
			
		},
*/
		EveOfDestruction: function () {
			require("./Baal")(Config, Attack, Pickit, Pather, Town);
		},

		SecretCowLevel: function () {
			require("./Cows")(Config, Attack, Pickit, Pather, Town);
		},

/*
		this.clearDen = function () {
			print("starting den");

			var akara;

			if (!Town.goToTown(1) || !Pather.moveToExit([2, 8], true)) {
				throw new Error();
			}

			Precast();
			Attack.clearLevel();
			Town.goToTown();
			Town.move(NPC.Akara);

			akara = getUnit(1, NPC.Akara);

			akara.openMenu();
			me.cancel();

			return true;
		};

		this.killRadament = function () {
			if (!Pather.accessToAct(2)) {
				return false;
			}

			print("starting radament");

			var book, atma;

			if (!Town.goToTown() || !Pather.useWaypoint(48, true)) {
				throw new Error();
			}

			Precast();

			if (!Pather.moveToExit(49, true) || !Pather.moveToPreset(me.area, 2, 355)) {
				throw new Error();
			}

			Attack.kill(229); // Radament

			book = getUnit(4, 552);

			if (book) {
				Pickit.pickItem(book);
				delay(300);
				clickItem(1, book);
			}

			Town.goToTown();
			Town.move(NPC.Atma);

			atma = getUnit(1, NPC.Atma);

			atma.openMenu();
			me.cancel();

			return true;
		};

		this.killIzual = function () {
			if (!Pather.accessToAct(4)) {
				return false;
			}

			print("starting izual");

			var tyrael;

			if (!Town.goToTown() || !Pather.useWaypoint(106, true)) {
				throw new Error();
			}

			Precast();

			if (!Pather.moveToPreset(105, 1, 256)) {
				return false;
			}

			Attack.kill(256); // Izual
			Town.goToTown();
			Town.move(NPC.Tyrael);

			tyrael = getUnit(1, NPC.Tyrael);

			tyrael.openMenu();
			me.cancel();

			if (getUnit(2, 566)) {
				Pather.useUnit(2, 566, 109);
			}

			return true;
		};

		this.lamEssen = function () {
			if (!Pather.accessToAct(3)) {
				return false;
			}

			print("starting lam essen");

			var stand, book, alkor;

			if (!Town.goToTown() || !Pather.useWaypoint(80, true)) {
				throw new Error();
			}

			Precast();

			if (!Pather.moveToExit(94, true) || !Pather.moveToPreset(me.area, 2, 193)) {
				throw new Error();
			}

			stand = getUnit(2, 193);

			Misc.openChest(stand);
			delay(300);

			book = getUnit(4, 548);

			Pickit.pickItem(book);
			Town.goToTown();
			Town.move(NPC.Alkor);

			alkor = getUnit(1, NPC.Alkor);

			alkor.openMenu();
			me.cancel();

			return true;
		};

		this.killShenk = function () {
			if (!Pather.accessToAct(5)) {
				return false;
			}

			if (this.checkQuest(35, 1)) {
				return true;
			}

			print("starting shenk");

			if (!Town.goToTown() || !Pather.useWaypoint(111, true)) {
				throw new Error();
			}

			Precast();
			Pather.moveTo(3883, 5113);
			Attack.kill(getLocaleString(22435)); // Shenk the Overseer
			Town.goToTown();

			return true;
		};

		this.freeAnya = function () {
			if (!Pather.accessToAct(5)) {
				return false;
			}

			if (this.checkQuest(37, 1)) {
				return true;
			}

			print("starting anya");

			var anya, malah, scroll;

			if (!Town.goToTown() || !Pather.useWaypoint(113, true)) {
				throw new Error();
			}

			Precast();

			if (!Pather.moveToExit(114, true) || !Pather.moveToPreset(me.area, 2, 460)) {
				throw new Error();
			}

			delay(1000);

			anya = getUnit(2, 558);

			Pather.moveToUnit(anya);
			//anya.interact();
			sendPacket(1, 0x13, 4, 0x2, 4, anya.gid);
			delay(300);
			me.cancel();
			Town.goToTown();
			Town.move(NPC.Malah);

			malah = getUnit(1, NPC.Malah);

			malah.openMenu();
			me.cancel();
			Town.move("portalspot");
			Pather.usePortal(114, me.name);
			anya.interact();
			delay(300);
			me.cancel();
			Town.goToTown();
			Town.move(NPC.Malah);
			malah.openMenu();
			me.cancel();
			delay(500);

			scroll = me.getItem(646);

			if (scroll) {
				clickItem(1, scroll);
			}

			return true;
		};*/

		/*for (i = 0; i < quests.length; i += 1) {
			me.inTown && Town();

			for (j = 0; j < 3; j += 1) {
				if (!this.checkQuest(quests[i][0], 0)) {
					try {
						if (this[quests[i][1]]()) {
							break;
						}
					} catch (e) {

					}
				} else {
					break;
				}
			}

			if (j === 3) {
				D2Bot.printToConsole("Quest " + quests[i][1] + " failed.");
			}
		}

		D2Bot.printToConsole("All quests done. Stopping profile.");
		D2Bot.stop();

		return true;*/

		doQuest: function (q, retry = 0) {
			let quest = GameData.Quests[q];
			if (!quest) {
				print("ÿc1Quest "+q+" not found");
				return false;
			}

			let debugName = quest.name+" ("+quest.index+")";

			if (!Questing.hasOwnProperty(quest.name)) {
				print("ÿc8Quest "+debugName+" not handled yet");
				return false;
			}

			if (!Questing.checkQuest(quest.index, 0)) {
				var r = 0, success = false;
				do {
					try {
						print("Trying to do quest "+debugName+" - attempt #"+(r+1));
						success = Questing[quest.name]();
					} catch (e) {
						print(e.message);
						print(e.stack);
					}
					r++;
				} while (r <= retry && !success);
				if (!success || !Questing.checkQuest(quest.index, 0)) {
					print("ÿc1Unable to complete quest "+debugName);
					return false;
				}
				return true;
			}
			else {
				print("ÿc2Quest "+debugName+" already done");
				return true;
			}
		}
	};

	module.exports = Questing;
})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require );

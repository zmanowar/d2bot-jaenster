/**
 * @author janitor
 * @description Cain quest, with scroll of inifuss and stones handling.
 */
(function (module,require) {
	const Khalims = function (Config, Attack, Pickit, Pather, Town, getItem, transmuteItems) {
		const Promise = require('Promise'),
			TownPrecast = require('TownPrecast'),
			Precast = require('Precast'),
			Rx = require('Observable'),
			Quests = require('QuestEvents'),
			NPC = require('NPC');

        const flailId = sdk.items.KhalimsFlail;
        const brainId = sdk.items.KhalimsBrain;
        const eyeId = sdk.items.KhalimsEye;
        const heartId = sdk.items.KhalimsHeart;
        const willId = 174; // TODO: Add to SDK
        let clearPath = false;

        this.getEye = function() {
            Pather.journeyTo(sdk.areas.SpiderCavern); // TODO: These journeyTos may not be needed.
            Pather.moveToPreset(sdk.areas.SpiderCavern, 2, 407, 0, 0, clearPath);
            getItem(eyeId, 407);// TODO: Define this chest
            return me.getItem(eyeId);
        };

        this.getBrain = function() {
            Pather.journeyTo(sdk.areas.FlayerJungle); // TODO: These journeyTos may not be needed.
            Pather.moveToExit(sdk.areas.FlayerDungeonLvl1, true, clearPath);
            Pather.journeyTo(sdk.areas.FlayerDungeonLvl3) // Theres a way to do this all with moveToExit.
            Pather.moveToPreset(me.area, 2, 406); // TODO: Define this chest
            getItem(brainId, 406);// TODO: Define this chest
            return me.getItem(brainId);
        }

        this.getHeart = function() {
            Pather.journeyTo(sdk.areas.A3SewersLvl2, clearPath);
            Pather.moveToPreset(me.area, 2, 405, 0, 0, false);
            getItem(heartId, 405);// TODO: Define this chest
            return me.getItem(brainId);
        }

        this.getFlail = function() {
            Pather.journeyTo(sdk.areas.Travincal, clearPath);
            Pather.moveTo(me.x + 76, me.y - 67);// TODO: Figure out a better way to do this.
            Attack.clear(30);
            Pickit.pickItems(); // TODO: Add flail/eye/brain/heart to pickit keep.
            return me.getItem(flailId);
        }

		Quests.on(sdk.quests.KhalimsWill, (state) => {
            if (state[0]) {
                print("Khalims Quest Done");
            } else {
                if (!me.getItem(willId)) {
                    let eye = me.getItem(eyeId) || this.getEye();
                    let brain = me.getItem(brainId) || this.getBrain();
                    let heart = me.getItem(heartId) || this.getHeart();
                    let flail = me.getItem(flailId) || this.geatFlail();
                    Town();
                    let will = transmuteItems(174, eye, brain, heart, flail); // TODO: Set sdk for will
                    if (!will) return false;
                    if (will.location !== sdk.storage.Inventory) {
                        Storage.Inventory.MoveTo(will);
                    }
                    let currentWeapon = getItems().filter( (item) => item.bodylocation == sdk.body.RightArm)[0];
                    will.equip();
                    if (me.area !== sdk.areas.Travincal) {
                        Pather.journeyTo(sdk.areas.Travincal, clearPath);
                    }

                    Pather.moveToPreset(me.area, 2, 404, 0, 0, false);
                    let orb = getUnit(sdk.unittype.Objects, 404); // TODO: Add Compelling Orb to sdk
                    if (orb) {
                        while(me.getItem(will)) {
                            Pather.moveToUnit(orb, 0, 0, false);
                            me.cast(0, 0, orb); // TODO: Check this still works
                            orb.interact();
                            delay(me.ping);
                        }
                        Town();
                        currentWeapon.equip();
                    }
                }
            }
        });
	}


	module.exports = Khalims;
})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require );




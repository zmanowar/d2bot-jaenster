/**
 * @author zmanowar
 * @description Staff.
 */
(function (module,require) {
	const Staff = function (Config, Attack, Pickit, Pather, Town, getItem, transmuteItems) {
		const Promise = require('Promise'),
			TownPrecast = require('TownPrecast'),
			Precast = require('Precast'),
			Rx = require('Observable'),
			Graph = require('Graph'),
            Quests = require('QuestEvents');

        let clearPath = false;
        let questDone = false;

        this.getShaft = function () {
            Pather.journeyTo(sdk.areas.FarOasis);
            Pather.moveToExit(
                [
                    sdk.areas.MaggotLairLvl1,
                    sdk.areas.MaggotLairLvl2, 
                    sdk.areas.MaggotLairLvl3
                ],
                true,
                clearPath // TODO: Unsure how we set it to clearPath.
            );
            if (getItem(sdk.items.StaffofKings, 356)) { // TODO: I don't know what these mean. But they should be added to sdk
                let staff = me.getItem(sdk.items.StaffofKings);
                Town();
                Storage.Stash.MoveTo(staff);
                return staff;
            }
            return false;
        };

        this.getAmulet = function() {
            Pather.journeyTo(sdk.areas.LostCity);
            Pather.moveToExit(
                [
                sdk.areas.ValleyOfSnakes,
                sdk.areas.ClawViperTempleLvl1,
                sdk.areas.ClawViperTempleLvl2
                ],
                true,
                clearPath
            );
            Attack.clear(20); // TODO: Dynamically set clear range. (unsure if even needed)
            if (getItem(sdk.items.ViperAmulet, 149)) { // TODO: I don't know what these mean. But they should be added to sdk
                let amulet = me.getItem(sdk.items.ViperAmulet);
                Town();
                Storage.Stash.MoveTo(amulet);
                return amulet;
            }
            return false;
        }

        this.getCube = function() {
            Pather.journeyTo(sdk.areas.HallsOfDeadLvl2);
            Pather.moveToExit(sdk.areas.HallsOfDeadLvl3, true, clearPath);
            Pather.moveToPreset(me.area, sdk.unittype.Objects, sdk.units.HoradricCubeChest, 0, 0, clearPath);
            Attack.clear(20); // TODO: Dynamically set clear range.
            if (getItem(sdk.items.cube, sdk.units.HoradricCubeChest)) {
                let cube = me.getItem(sdk.items.cube);
                Town();
                Storage.Stash.MoveTo(cube);
                return cube;
            }
            return false;
        }

		Quests.on(sdk.quests.TheHoradricStaff, (state) => {
			if (state[0]) { // quest done
                print("Staff has been made.");
                questDone = true;
            } else if (state[1]) { // TODO: Find the states of this quest.
                // Combine in Cube
                
            } else if (state[2]) {  // TODO: Find the states of this quest.
                // Talk to Cain
            } else {
                const amulet = this.getAmulet();
                const shaft = this.getShaft();
                this.getCube();
                transmuteItems(sdk.items.HoradricStaff, amulet, shaft);
            }
        });

        Quests.emit(sdk.quests.TheHoradricStaff, Quests.states[sdk.quests.TheHoradricStaff]);
		while (!questDone) {
			delay(50);
		}
		return true;
	}

	module.exports = Staff;
})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require );

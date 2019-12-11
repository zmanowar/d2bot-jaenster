/**
 * @author zmanowar
 * @description Bloodraven.
 */
(function (module,require) {
	const Raven = function (Config, Attack, Pickit, Pather, Town) {
		const Promise = require('Promise'),
			TownPrecast = require('TownPrecast'),
			Precast = require('Precast'),
			Rx = require('Observable'),
			Graph = require('Graph'),
            Quests = require('QuestEvents');

        let killedRaven = false;
		let questDone = false;
		let clearPath = false;
    
		function killRaven() {
			Pather.journeyTo(sdk.areas.BurialGrounds, clearPath);
			Pather.moveToExit(sdk.areas.BurialGrounds, true, clearPath);
			try {
				Pather.moveToPreset(me.area, sdk.unittype.NPC, 805, 0, 0, clearPath);
				Attack.clear(15, 0, getLocaleString(sdk.locale.monsters.BloodRaven));
			} catch(error) {	
				return false;
			}
			return true;
		}

		Quests.on(sdk.quests.SistersBurialGrounds, (state) => {
			print(state);
			print('RAVEN!!!!!');
			if (state[0]) {
				print("Quest's done");
			}
			killRaven();
		});

		Quests.emit(sdk.quests.SistersBurialGrounds, Quests.states[sdk.quests.SistersBurialGrounds]);
	}

	module.exports = Raven;
})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require );

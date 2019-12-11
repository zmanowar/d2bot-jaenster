/**
*	@filename	Mausoleum.js
*	@author		kolton, updated by zmanowar
*	@desc		clear Mausoleum
*/

(function (module,require) {
	const Mausoleum = function (Config, Attack, Pickit, Pather, Town) {
		Pather.journeyTo(sdk.areas.BurialGrounds, clearPath);
		if (Config.Mausoleum.killRaven) this.killRaven();
		this.clearMausoleum();
		if (Config.Mausoleum.clearCrypt) this.clearCrypt();
	};
	const Promise = require('Promise'),
			Attack = require('Attack'),
			Pickit = require('Pickit'),
			Pather = require('Pather'),
			Town = require('Town'),
			TownPrecast = require('TownPrecast'),
			Precast = require('Precast'),
			Rx = require('Observable'),
			Graph = require('Graph'),
			Quests = require('QuestEvents')
			clearPath = false; // TODO: Set this dynamically

	Mausoleum.observeQuest = () => {
		let observable = Rx.Observable.create(observer => {
			Quests.on(sdk.quests.SistersBurialGrounds, (state) => {
				observer.next(state);
				if (state[0]) {
					observer.complete();
				} else if (!state[0] && state[1]) {
					observer.complete();
				}
			});

			Quests.emit(sdk.quests.SistersBurialGrounds, Quests.states[sdk.quests.SistersBurialGrounds]);

			return () => {
				Quests.off(sdk.quests.DenOfEvil);
			};
		});
		
		return observable;
	};

	Mausoleum.killRaven = () => {
		Pather.moveToExit(sdk.areas.BurialGrounds, true, clearPath);
		try {
			Pather.moveToPreset(me.area, sdk.unittype.NPC, 805, 0, 0, clearPath);
			Attack.clear(15, 0, getLocaleString(sdk.locale.monsters.BloodRaven));
		} catch(error) {
			return false; // Blood raven does not exist (she mos' likely ded).
		}
		return true;
	};

	Mausoleum.clearMausoleum = () => {
		if (!Pather.moveToExit(sdk.areas.Mausoleum, true, clearPath)) {
			throw new Error('Failed to move to Mausoleum');
		}
		Attack.clearLevel();
	};

	Mausoleum.clearCrypt = () => {
		if (
			!(Pather.moveToExit(sdk.areas.BurialGrounds, true) &&
				Pather.moveToPreset(sdk.areas.BurialGrounds, sdk.unittype.Stairs, 6) &&
				Pather.moveToExit(sdk.areas.Crypt, true))
		) {
			throw new Error('Failed to move to Crypt');
		}
		Attack.clearLevel();
	}

	Mausoleum.talkToAkara = () => {
		if (!Town.goToTown(1)) {
			Pather.journeyTo(sdk.areas.RogueEncampment, true);
		}
		me.talkTo(NPC.Akara);
	};

	module.exports = Mausoleum;
})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require );
/**
 * @author ryancrunchi
 * @description Den of evil.
 */
(function (module,require) {
	const Den = function (Config, Attack, Pickit, Pather, Town) {
		const Promise = require('Promise'),
			TownPrecast = require('TownPrecast'),
			Precast = require('Precast'),
			Rx = require('Observable'),
			Graph = require('Graph'),
			Quests = require('QuestEvents');

		var denCleared = false;
		var questDone = false;

		while (!denCleared && ! questDone) {
			Pather.journeyTo(sdk.areas.DenOfEvil, true);
			print('den');
			let graph = new Graph();
			Graph.nearestNeighbourSearch(graph, (room) => {
				Pather.moveTo(room.walkableX, room.walkableY, 3, true);
				// 0xF = skip normal, 0x7 = champions/bosses, 0 = all
				Attack.clear(room.xsize, 0);
				Pather.moveTo(room.walkableX, room.walkableY, 3, true);
			});
		}
		return true;
	}

	module.exports = Den;
})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require );

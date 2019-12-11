/**
 * @author zmanowar
 * @description Checks and moves character to new act.
 */
(function (module,require) {
	const AbleToGoToAct = function (Pather, Town) {
		const Quests = require('QuestEvents');
		
		const goToAct = function(act) {
			npcMap = {
				[NPC.Warriv]: sdk.areas.LutGholein,
				[NPC.Meshif]: sdk.areas.KurastDocktown,
				[NPC.Tyrael]: sdk.areas.Harrogathm
			};
			/**
			 * There's probably a cleaner way to do this whole
			 * act thing with GameData.
			 * TODO: Check that out.
			 *  */ 
	
			npcId = Object.keys(npcMap)[act];
			location = npcMap[npcId];
	
			me.talkTo(npcId);
			npc = getUnit(sdk.unittype.NPC, npcId);
			while(!npc) {
				Town.move(npc);
				Packet.flash(me.gid);
				npc = getUnit(sdk.unittype.NPC, npcId);
			}
			for (let i = 0; i < 5; i++) {
				sendPacket(1, 56, 4, 0, 4, npc.gid, 4, location);
				delay(250 + me.ping);
				if (me.act === act) break;
			}
			return me.act === act;
		};
        
        this.actII = function() {
			if (this.checkQuest(sdk.quests.SistersToTheSlaughter, sdk.quests.states.Finished)) {
				if (!Pather.accessToAct(3)) {
					return this.nextAct(2);
				}
			}
		}
		
		this.actIII = function() {
			if (this.checkQuest(sdk.quests.TheSevenTombs, sdk.quests.states.Finished)) {
				if (!Pather.accessToAct(3)) {
					return this.nextAct(3);
				}
			}
		}

		this.actIV = function() {
			if(this.checkQuest(sdk.quests.TheGuardian, sdk.quests.states.Finished)) {
				if (!Pather.accessToAct(4)) {
					return this.nextAct(4);
				}
			}
		}

		this.actV = function() {
			if(this.checkQuest(sdk.quests.TerrorsEnd, sdk.quests.states.Finished)) {
				if (!Pather.accessToAct(5)) {
					return this.nextAct(5);
				}
			}
		}
	}

	module.exports = Den;
})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require );

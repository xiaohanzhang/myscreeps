import { each, map, filter, values, find } from 'lodash/core'
import sum from 'lodash/sum'
import get from 'lodash/get'

import { transferAt, harvestAt, withdrawAt, buildAt } from './utils'

if (!Memory.rooms) {
  Memory.rooms = {};
}

const logCpu = () => {
  const used = Game.cpu.getUsed();
  if (used > 7) {
    console.log(Game.cpu.tickLimit, Game.cpu.bucket, used);
  }
};

each(Game.spawns, (spawn) => {
  const room = spawn.room;
  const roomCache = Memory.rooms[room.name];
  if (room && (!roomCache || !roomCache.spawn)) {
    console.log(`init room: ${room.name}`);
    Memory.rooms[room.name] = {
      sources: map(room.find(FIND_SOURCES), source => ({
        id: source.id,
        harvesters: [],
      })),
      spawn: spawn.id,
      builders: [],
    };
  }
  Memory.rooms[room.name].needFill = [];
  if (spawn.energyCapacity > spawn.energy) {
    Memory.rooms[room.name].needFill.push(spawn.id);
  }
});

each(Game.structures, (structure) => {
  const roomCache = get(Memory.rooms, get(structure, 'room.name'));
  if (roomCache) {
    if (
      structure.structureType === STRUCTURE_EXTENSION && 
      structure.energyCapacity > structure.energy
    ) {
      roomCache.needFill.push(structure.id);
    }
  }
});

const increaseCreep = (spawn, body, names) => {
  if (spawn.canCreateCreep(body) === 0) {
    const name = spawn.createCreep(body);
    if (typeof(name) === 'string') {
      names.push(name);
    }
  }
}

each(Memory.rooms, (room, roomName) => {
  const spawn = Game.getObjectById(room.spawn);
  let enoughHarvesters = true;
  if (!spawn) {
    delete Memory.rooms[room.name];
    return;
  }
  each(room.sources, (_source) => {
    const { id, harvesters } = _source;
    const source = Game.getObjectById(id);
    if (harvesters.length < 3) {
      enoughHarvesters = false;
      increaseCreep(spawn, [ 
        WORK, WORK, WORK, CARRY, CARRY, CARRY,
        MOVE, MOVE,
      ], harvesters);
    }

    _source.harvesters = filter(harvesters, (name) => {
      const creep = Game.creeps[name];
      if (!creep) {
        return false;
      }
      if (creep.spawning) {
        return true;
      }
      if (creep.carryCapacity - sum(values(creep.carry)) < 20) {
        const needFillId = get(room, 'needFill.0');
        transferAt(creep, needFillId 
          ? Game.getObjectById(needFillId) 
          : Game.rooms[roomName].controller);
      } else {
        harvestAt(creep, source);
      }
      return !!creep;
    });
  });

  if (!room.builders) {
    room.builders = [];
  }
  if (room.builders.length < 4 && enoughHarvesters) {
    increaseCreep(spawn, [ 
      WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, 
    ], room.builders);
  }

  room.builders = filter(room.builders, (name) => {
    const creep = Game.creeps[name];
    if (!creep) {
      return false;
    }
    if (creep.spawning) {
      return true;
    }
    if (sum(values(creep.carry)) < 10) {
      if (enoughHarvesters) {
        withdrawAt(creep, spawn);
      }
    } else {
      const constructionSite = find(Game.constructionSites);
      if (constructionSite) {
        buildAt(creep, constructionSite);
      } else {
        transferAt(creep, Game.rooms[roomName].controller);
      }
    }
    return true;
  });
  logCpu();
});

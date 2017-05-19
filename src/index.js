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
        carriers: [],
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

  if (!Memory.cc) {
    Memory.cc = spawn.createCreep([
      WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, 
    ]);
  }
  const cc = Game.creeps[Memory.cc];
  if (cc) {
    const controller = Game.rooms[roomName].controller;
    if (cc.upgradeController(controller) === ERR_NOT_IN_RANGE) {
      cc.moveTo(controller);
    }
  }

  each(room.sources, (_source) => {
    if (!_source.carriers) {
      _source.carriers = [];
    }
    const { id, harvesters, carriers } = _source;
    const source = Game.getObjectById(id);
    if (harvesters.length < 2) {
      enoughHarvesters = false;
      increaseCreep(spawn, [ 
        WORK, WORK, WORK, WORK, CARRY, CARRY,
        MOVE, 
      ], harvesters);
    }

    if (harvesters.length > 1 && carriers.length < 3) {
      increaseCreep(spawn, [ 
        //CARRY, CARRY, 
        CARRY, CARRY, CARRY,
        //MOVE, MOVE, 
        MOVE, MOVE, MOVE, 
      ], _source.carriers);
    }

    const fulls = [];
    _source.harvesters = filter(harvesters, (name) => {
      const creep = Game.creeps[name];
      if (!creep) {
        return false;
      }
      if (creep.spawning) {
        return true;
      }
      if (creep.carryCapacity - sum(values(creep.carry)) < 10) {
        fulls.push(creep);
      }
      harvestAt(creep, source);
      return true;
    });

    _source.carriers = filter(carriers, (name) => {
      const creep = Game.creeps[name];
      if (creep.carryCapacity > sum(values(creep.carry))) {
        if (fulls.length > 0) {
          if (creep.pos.isNearTo(fulls[0])) {
            creep.moveTo(fulls[0]);
          } else {
            fulls[0].transfer(creep);
          }
        } else {
          creep.moveTo(source);
        }
      } else {
        const needFillId = get(room, 'needFill.0');
        const nf = Game.getObjectById(needFillId);
        if (nf) {
          transferAt(creep, nf);
        } else if (creep.pos.isNearTo(cc)) {
          creep.drop(RESOURCE_ENERGY);
        } else {
          creep.moveTo(cc);
        }
      }
    });
  });

    /*
  if (!room.builders) {
    room.builders = [];
  }
  const constructionSite = find(Game.constructionSites);
  if (room.builders.length < 4 && enoughHarvesters && constructionSite) {
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
    if (constructionSite) {
      buildAt(creep, constructionSite);
    } else {
      const needFillId = get(room, 'needFill.0');
      const nf = Game.getObjectById(needFillId);
      transferAt(creep, nf);
    }
    return true;
  });
  */
  logCpu();
});

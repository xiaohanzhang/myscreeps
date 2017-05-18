const doAt = (creep, target, callback) => {
  if (creep.pos.isNearTo(target)) {
    callback(creep, target);
  } else {
    creep.moveTo(target);
  }
};

export const transferAt = (creep, target, resourceType = RESOURCE_ENERGY) => {
  doAt(creep, target, () => {
    creep.transfer(target, resourceType);
  });
};

export const harvestAt = (creep, target) => {
  doAt(creep, target, () => {
    creep.harvest(target);
  });
};

export const withdrawAt = (creep, target, resourceType = RESOURCE_ENERGY) => {
  doAt(creep, target, () => {
    creep.withdraw(target, resourceType);
  });
};

export const buildAt = (creep, target) => {
  doAt(creep, target, () => {
    creep.build(target);
  });
};

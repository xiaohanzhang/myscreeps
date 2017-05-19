
Game.structures
Game.spawns
Game.rooms
Game.creeps
Game.constructionSites

/*
 * Game, Memory => State
 *
 */


class Role {

}


class Task {
  /*
   * config: {
   *   builders: {},
   *   carriers: {},
   *   ...
   * }
   */
  constructor(config) {
    const objs = this.objs = {};
    each(config, (v, k) => {
      objs[k] = v;
    });
  }

  execute() {

  }
}

class HarvestTask extends Task {
  foo() {

  }
}

each(State.tasks, (task) => {
  task.execute();
});

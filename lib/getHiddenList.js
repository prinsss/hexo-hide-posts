'use strict';

const chalk = require('chalk');

/**
 * Print a list of posts marked as hidden.
 */
function getHiddenList() {
  const config = this.config.hide_posts;

  this.load().then(() => {
    [].concat(
      this.locals.get('hidden_posts').toArray(),
      this.locals.get('pages').find({ [config.filter]: true }).toArray()
    ).forEach(post => {
      console.log('');
      // Print properties
      ['source', 'slug', 'title', 'date', 'updated'].forEach(prop => {
        console.log(`${chalk.green(prop)}: ${post[prop]}`);
      });
    });
  });
}

module.exports = getHiddenList;

'use strict';

var _ = require('lodash')
  , Abstract = require('../abstract')
  , ConnectionManager = require('./connection-manager')
  , Query = require('./query')
  , QueryGenerator = require('../mssql/query-generator')
  , DataTypes = require('../../data-types').mssql;

var MssqlNativeDialect = function(sequelize) {
  this.sequelize = sequelize;
  this.connectionManager = new ConnectionManager(this, sequelize);
  this.connectionManager.initPools();
  this.QueryGenerator = _.extend({}, QueryGenerator, {
    options: sequelize.options,
    _dialect: this,
    sequelize: sequelize
  });
};

MssqlNativeDialect.prototype.supports = _.merge(_.cloneDeep(Abstract.prototype.supports), {
  'DEFAULT': true,
  'DEFAULT VALUES': true,
  'LIMIT ON UPDATE': true,
  'ORDER NULLS': false,
  lock: false,
  transactions: false,
  migrations: false,
  upserts: false,
  returnValues: {
    output: true
  },
  schemas: true,
  autoIncrement: {
    identityInsert: true,
    defaultValue: false,
    update: false
  },
  constraints: {
    restrict: false
  },
  index: {
    collate: false,
    length: false,
    parser: false,
    type: true,
    using: false,
  },
  NUMERIC: true,
  tmpTableTrigger: true
});

MssqlNativeDialect.prototype.defaultVersion = '12.0.2000'; // SQL Server 2014 Express
MssqlNativeDialect.prototype.Query = Query;
MssqlNativeDialect.prototype.name = 'mssql-native';
MssqlNativeDialect.prototype.TICK_CHAR = '"';
MssqlNativeDialect.prototype.TICK_CHAR_LEFT = '[';
MssqlNativeDialect.prototype.TICK_CHAR_RIGHT = ']';
MssqlNativeDialect.prototype.DataTypes = DataTypes;

module.exports = MssqlNativeDialect;

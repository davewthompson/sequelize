'use strict';

const AbstractConnectionManager = require('../abstract/connection-manager');
const ResourceLock = require('../mssql/resource-lock');
const Promise = require('../../promise');
const Utils = require('../../utils');
const debug = Utils.getLogger().debugContext('connection:mssql-native');
const sequelizeErrors = require('../../errors');
const parserStore = require('../parserStore')('mssql-native');
const _ = require('lodash');

class ConnectionManager extends AbstractConnectionManager {
  constructor(dialect, sequelize) {
    super(dialect, sequelize);

    this.sequelize = sequelize;
    try {
      this.lib = require(sequelize.config.dialectModulePath || 'msnodesqlv8');
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        throw new Error('Please install msnodesqlv8 package manually');
      }
      throw err;
    }
  }

  // Expose this as a method so that the parsing may be updated when the user has added additional, custom types
  $refreshTypeParser(dataType) {
    parserStore.refresh(dataType);
  }

  $clearTypeParser() {
    parserStore.clear();
  }

  $getConnectionString() {
    var dialectConfig = this.config.dialectOptions;
    return `Driver={SQL Server Native Client 11.0};Server=${this.config.host}\\${dialectConfig.instance};Database=${this.config.database};Trusted_Connection=${dialectConfig.trustedConnection ? 'Yes' : 'No'}`;
  }


  connect(config) {
    return new Promise((resolve, reject) => {
      const connectionConfig = {
        connectionString: this.$getConnectionString()
      };

      this.lib.open(connectionConfig.connectionString, (err, conn) => {
        if (!err) {
          const connectionLock = new ResourceLock(conn);
          conn.lib = this.lib;
          resolve(connectionLock);
        }

        if (!err.code) {
          reject(new sequelizeErrors.ConnectionError(err));
          return;
        }

        switch (err.code) {
          case 'ESOCKET':
            if (_.includes(err.message, 'connect EHOSTUNREACH')) {
              reject(new sequelizeErrors.HostNotReachableError(err));
            } else if (_.includes(err.message, 'connect ECONNREFUSED')) {
              reject(new sequelizeErrors.ConnectionRefusedError(err));
            } else {
              reject(new sequelizeErrors.ConnectionError(err));
            }
            break;
          case 'ECONNREFUSED':
            reject(new sequelizeErrors.ConnectionRefusedError(err));
            break;
          case 'ER_ACCESS_DENIED_ERROR':
            reject(new sequelizeErrors.AccessDeniedError(err));
            break;
          case 'ENOTFOUND':
            reject(new sequelizeErrors.HostNotFoundError(err));
            break;
          case 'EHOSTUNREACH':
            reject(new sequelizeErrors.HostNotReachableError(err));
            break;
          case 'EINVAL':
            reject(new sequelizeErrors.InvalidConnectionError(err));
            break;
          default:
            reject(new sequelizeErrors.ConnectionError(err));
            break;
        }
      });

      // if (config.pool.handleDisconnects) {
      //   connection.on('error', err => {
      //     switch (err.code) {
      //       case 'ESOCKET':
      //       case 'ECONNRESET':
      //         this.pool.destroy(connectionLock);
      //     }
      //   });
      // }

    });
  }

  disconnect(connectionLock) {
    const connection = connectionLock.unwrap();

    // Dont disconnect a connection that is already disconnected
    if (!!connection.closed) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      connection.close(() => {
        debug(`connection closed`);
        resolve();
      });
    });
  }

  validate(connectionLock) {
    const connection = connectionLock.unwrap();

    return connection && connection.loggedIn;
  }
}

module.exports = ConnectionManager;
module.exports.ConnectionManager = ConnectionManager;
module.exports.default = ConnectionManager;

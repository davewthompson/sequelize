/* jshint -W030 */
var chai = require('chai')
  , expect = chai.expect
  , Sequelize = require(__dirname + '/../../../../index')

var dialect = process.env.DIALECT || 'mysql';

if (dialect.match(/^mssql-native/)) {
  describe('[MSSQL-NATIVE Specific] Check connection', function () {
    it('should connect', function (done) {

      var options = {
        //connectionString: 'Server=DWT-W10-YOGA900\\SQLEXPRESS;Database=NODE_TEST;Trusted_Connection=True',
        dialectOptions: {
          instance: 'SQLEXPRESS',
          trustedConnection: true
        }

      };

      var testString = "mssql-native://DWT-W10-YOGA900/NODE_TEST";

      var instance = new Sequelize(testString, options);
      var User = instance.define('User', {
        username: Sequelize.STRING,
        birthday: Sequelize.DATE
      });

      User.sync().then(() => {
        var entity = User.build({
          username: 'dwt',
          birthday: new Date(1983, 10, 10)
        });

        entity.save().then(function (dwt) {
          console.log(dwt.values);

          User.find({
            username: 'dwt'
          }).then(results => {
            console.log(results);
            User.destroy({
              truncate: true
            }).then(() => {
              done();
            });
          });
        }).catch(err => {
          console.log('Error!', err);
          done();
        })
      });
    });
  });
}

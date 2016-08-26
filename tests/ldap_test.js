var ldap = require('ldapjs');


var client = ldap.createClient({
  url: 'ldap://act.ldap.csiro.au/ou=People,DC=nexus,DC=csiro,DC=au'
});

var opts = {
  filter: '(objectclass=person)',
  scope: 'sub',
  attributes: ['givenName']
};

client.bind('username', 'password', function (err) {
  client.search('ou=People,DC=nexus,DC=csiro,DC=au', opts, function (err, search) {
    search.on('searchEntry', function (entry) {
      var user = entry.object;
      console.log(user.objectGUID);
    });
  });
});
#  ng-api-resource

The ng-api-resource library is a high level abstraction on REST API resources.

## Installation
In order to install the library, you just need to run:

```
bower install ng-api-resource
```

## Usage

Let's pretend we have a REST API with a **/users** endpoint and that each user has the following structure:

```js
// User data type.
{
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  email: String
}
```

Let's create a file with the User resource class.

```js
function UserFactory(APIResource, APIResourceManager) {
  class User extends APIResource {
    static URL = '/api/users';
    static scheme = {
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
      email: String
    };
    static manager = new APIResourceManager(User);
  }

  return User;
}

UserFactory.$inject = [
  'APIResource',
  'APIResourceManager'
];

angular
  .module('myApp')
  .factory('User', UserFactory);
```

Now let's use it in our UserProfileCtrl:

```js
class UserProfileCtrl {
  static $inject = ['$scope', 'User'];

  constructor($scope, User) {
    User.manager.getAll().then(users => $scope.users = users);
  }
}

angular
  .module('myApp')
  .factory('UserProfileCtrl', UserProfileCtrl);
```

The #getAll() method of the APIResourceManager will return a list of APIResource
instances. Since we extended the APIResource to create our User class, the
User.manager.getAll() method will return a list of User instances.

Given any of these instances, the resource can be updated by just modifying it
and calling its #save() method.

```js
User.manager.get({ id: 1 }).then(user => {
  user.firstName = 'John';
  user.lastName = 'Doe';

  // Send the request to the API to update the resource.
  user.save();
});
```

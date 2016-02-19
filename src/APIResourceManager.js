(function(ng) {
  'use strict';

  function APIResourceManagerFactory($q, $resource) {
    class APIResourceManager {
      resource = null;

      constructor(resource) {
        this.resource = resource;
        this.resource.objects = [];
        this.resource.Model = this.getModel();
      }

      getModel() {
        return $resource(
          this.resource.URL,
          {},
          {
            query: {
              isArray: false,
              method: 'GET'
            }
          }
        );
      }

      create(data) {
        const Resource = this.resource;
        const instance = new Resource(data);

        return instance.$save().$promise;
      }

      /**
       * Get the item matching the given params.
       *
       * @param   {Object}      params    Filtering data object.
       * @return  {APIResource} The requested resource
       */
      get(params) {
        const Resource = this.resource;
        const items = this.resource.objects;
        const deferred = $q.defer();
        let found = false;

        // Try to find the requested item in the already retrieved items.
        for (let i = 0, l = items.length; i < l; i++) {
          found = true;

          // Compare the provided param values against the item values.
          for (key in params) {
            if (items[i][key] !== params[key]) {
              found = false;
            }
          }

          if (found) {
            deferred.resolve(items[i]);
            break;
          }
        }

        // If the requested item hasn't been requested yet, fetch it from the API.
        if (!found) {
          Resource.Model.get(
            params,
            data => deferred.resolve(new Resource(data)),
            err => deferred.reject(err)
          );
        }

        return deferred.promise;
      }

      /**
       * Add the given item to the list if it does not exists already.
       */
      add(item) {
        const pk = this.resource.primaryKey;
        const alreadyExists = this.resource.objects.some(data => data[pk] === item[pk]);

        if (!(item instanceof this.resource)) {
          item = new Resource(item);
        }

        if (!alreadyExists) {
          this.resource.objects.push(item);
        }
      }

      getAll(params) {
        const Resource = this.resource;
        const deferred = $q.defer();

        let response = Resource.Model.query(
          params,
          () => {
            let items = response.data.map(data => new Resource(data));

            items.totalCount = response.count;
            deferred.resolve(items);
          },
          err => deferred.reject(err)
        );

        return deferred.promise;
      }
    }
    return APIResourceManager;
  }

  APIResourceManagerFactory.$inject = [
    '$q',
    '$resource'
  ];

  ng.module('cg.api')
    .factory('APIResourceManager', APIResourceManagerFactory);
})(angular);


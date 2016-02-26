'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (ng) {
  'use strict';

  ng.module('cg.api', ['ngResource']);
})(angular);

(function (ng) {
  'use strict';

  function APIResourceManagerFactory($q, $resource) {
    var APIResourceManager = function () {
      function APIResourceManager(resource) {
        _classCallCheck(this, APIResourceManager);

        this.resource = null;

        this.resource = resource;
        this.resource.objects = [];
        this.resource.Model = this.getModel();
      }

      _createClass(APIResourceManager, [{
        key: 'getModel',
        value: function getModel() {
          return $resource(this.resource.URL, {}, {
            query: {
              isArray: false,
              method: 'GET'
            }
          });
        }
      }, {
        key: 'create',
        value: function create(data) {
          var Resource = this.resource;
          var instance = new Resource(data);

          return instance.$save().$promise;
        }

        /**
         * Get the item matching the given params.
         *
         * @param   {Object}      params    Filtering data object.
         * @return  {APIResource} The requested resource
         */

      }, {
        key: 'get',
        value: function get(params) {
          var Resource = this.resource;
          var items = this.resource.objects;
          var deferred = $q.defer();
          var found = false;

          // Try to find the requested item in the already retrieved items.
          for (var i = 0, l = items.length; i < l; i++) {
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
            Resource.Model.get(params, function (data) {
              return deferred.resolve(new Resource(data));
            }, function (err) {
              return deferred.reject(err);
            });
          }

          return deferred.promise;
        }

        /**
         * Add the given item to the list if it does not exists already.
         */

      }, {
        key: 'add',
        value: function add(item) {
          var pk = this.resource.primaryKey;
          var alreadyExists = this.resource.objects.some(function (data) {
            return data[pk] === item[pk];
          });

          if (!(item instanceof this.resource)) {
            item = new Resource(item);
          }

          if (!alreadyExists) {
            this.resource.objects.push(item);
          }
        }
      }, {
        key: 'getAll',
        value: function getAll(params) {
          var Resource = this.resource;
          var deferred = $q.defer();

          var response = Resource.Model.query(params, function () {
            var items = response.data.map(function (data) {
              return new Resource(data);
            });

            items.totalCount = response.count;
            deferred.resolve(items);
          }, function (err) {
            return deferred.reject(err);
          });

          return deferred.promise;
        }
      }]);

      return APIResourceManager;
    }();

    return APIResourceManager;
  }

  APIResourceManagerFactory.$inject = ['$q', '$resource'];

  ng.module('cg.api').factory('APIResourceManager', APIResourceManagerFactory);
})(angular);

(function (ng) {
  'use strict';

  function APIResourceFactory(APIResourceManager) {
    var APIResource = function () {

      /**
       * Initialize the instance with the provided initial data.
       * @constructor
       */

      function APIResource(data) {
        _classCallCheck(this, APIResource);

        var Resource = this.constructor;

        this._copySchemaData(data, this);
        this.init();
      }

      /**
       * Initialized method.
       */

      _createClass(APIResource, [{
        key: 'init',
        value: function init() {
          // To be implement in the subclass.
        }
      }, {
        key: '_copySchemaData',

        /**
         * Copy the properties defined in the schema from the source object to the
         * destination object.
         *
         * @param   {Object}  source  The object containing the property values.
         * @param   {Object}  dest    The object to which the properties will be
         *                            copied.
         * @return  {Object}  The updated destination object.
         */
        value: function _copySchemaData(source, dest) {
          var Resource = this.constructor;
          var TypeClass = undefined;
          var value = undefined;

          // Make sure that both, the source and the destination, are objects.
          if ((typeof source === 'undefined' ? 'undefined' : _typeof(source)) !== 'object' || (typeof dest === 'undefined' ? 'undefined' : _typeof(dest)) !== 'object') {
            throw new TypeError('Both, data source and destination, must be objects');
          }

          for (var property in Resource.schema) {
            value = source[property];
            TypeClass = Resource.schema[property];

            // Cast the value to the type defined in the schema.
            if (value === null || value === undefined) {
              value = null;
            } else if (((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' || TypeClass === Date) && !(value instanceof TypeClass)) {
              value = new TypeClass(value);
            } else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) !== 'object') {
              value = TypeClass(value);
            }

            dest[property] = value;
          }

          return dest;
        }

        /**
         * Update this instance data in the API.
         *
         * @return {Promise}  The saving promise.
         */

      }, {
        key: 'save',
        value: function save() {
          var ResourceModel = this.constructor.Model;
          var data = this._copySchemaData(this, {});
          var instance = new ResourceModel(data);

          return instance.$save();
        }

        /**
         * Send a delete request to the API.
         *
         * @return {Promise}  The deletion promise.
         */

      }, {
        key: 'delete',
        value: function _delete() {
          var ResourceModel = this.Model;
          var instance = new ResourceModel();
          var pk = this.constructor.primaryKey;

          instance[pk] = this[pk];

          return instance.$delete();
        }
      }]);

      return APIResource;
    }();

    APIResource.URL = '';
    APIResource.Model = null;
    APIResource.schema = {};
    APIResource.primaryKey = 'id';
    APIResource.manager = new APIResourceManager(APIResource);

    return APIResource;
  }

  APIResourceFactory.$inject = ['APIResourceManager'];

  ng.module('cg.api').factory('APIResource', APIResourceFactory);
})(angular);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS5qcyIsIkFQSVJlc291cmNlTWFuYWdlci5qcyIsIkFQSVJlc291cmNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsQ0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLGVBREE7O0FBR0EsS0FBQSxNQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsWUFBQSxDQUFBLEVBSEE7Q0FBQSxDQUFBLENBSUEsT0FKQTs7QUNBQSxDQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsZUFEQTs7QUFHQSxXQUFBLHlCQUFBLENBQUEsRUFBQSxFQUFBLFNBQUEsRUFBQTtRQUNBO0FBR0EsZUFIQSxrQkFHQSxDQUFBLFFBQUEsRUFBQTs4QkFIQSxvQkFHQTs7YUFGQSxXQUFBLEtBRUE7O0FBQ0EsYUFBQSxRQUFBLEdBQUEsUUFBQSxDQURBO0FBRUEsYUFBQSxRQUFBLENBQUEsT0FBQSxHQUFBLEVBQUEsQ0FGQTtBQUdBLGFBQUEsUUFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLFFBQUEsRUFBQSxDQUhBO09BQUE7O21CQUhBOzttQ0FTQTtBQUNBLGlCQUFBLFVBQ0EsS0FBQSxRQUFBLENBQUEsR0FBQSxFQUNBLEVBRkEsRUFHQTtBQUNBLG1CQUFBO0FBQ0EsdUJBQUEsS0FBQTtBQUNBLHNCQUFBLEtBQUE7YUFGQTtXQUpBLENBQUEsQ0FEQTs7OzsrQkFhQSxNQUFBO0FBQ0EsY0FBQSxXQUFBLEtBQUEsUUFBQSxDQURBO0FBRUEsY0FBQSxXQUFBLElBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQSxDQUZBOztBQUlBLGlCQUFBLFNBQUEsS0FBQSxHQUFBLFFBQUEsQ0FKQTs7Ozs7Ozs7Ozs7OzRCQWFBLFFBQUE7QUFDQSxjQUFBLFdBQUEsS0FBQSxRQUFBLENBREE7QUFFQSxjQUFBLFFBQUEsS0FBQSxRQUFBLENBQUEsT0FBQSxDQUZBO0FBR0EsY0FBQSxXQUFBLEdBQUEsS0FBQSxFQUFBLENBSEE7QUFJQSxjQUFBLFFBQUEsS0FBQTs7O0FBSkEsZUFPQSxJQUFB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QSxTQUFBLEdBSkE7QUFDQSxnQkFJQSxhQUFBLEtBTEE7QUFDQSxnQkFLQSxVQUFBLElBQUEsa0JBQUEsQ0FBQSxXQUFBLEVBTkE7O0FBa0dBLFdBQUEsV0FBQSxDQWxHQTtHQUFBOztBQXFHQSxxQkFBQSxPQUFBLEdBQUEsQ0FDQSxvQkFEQSxDQUFBLENBeEdBOztBQTRHQSxLQUFBLE1BQUEsQ0FBQSxRQUFBLEVBQ0EsT0FEQSxDQUNBLGFBREEsRUFDQSxrQkFEQSxFQTVHQTtDQUFBLENBQUEsQ0E4R0EsT0E5R0EiLCJmaWxlIjoibmctYXBpLXJlc291cmNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKG5nKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBuZy5tb2R1bGUoJ2NnLmFwaScsIFsnbmdSZXNvdXJjZSddKTtcbn0pKGFuZ3VsYXIpO1xuIiwiKGZ1bmN0aW9uKG5nKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBmdW5jdGlvbiBBUElSZXNvdXJjZU1hbmFnZXJGYWN0b3J5KCRxLCAkcmVzb3VyY2UpIHtcbiAgICBjbGFzcyBBUElSZXNvdXJjZU1hbmFnZXIge1xuICAgICAgcmVzb3VyY2UgPSBudWxsO1xuXG4gICAgICBjb25zdHJ1Y3RvcihyZXNvdXJjZSkge1xuICAgICAgICB0aGlzLnJlc291cmNlID0gcmVzb3VyY2U7XG4gICAgICAgIHRoaXMucmVzb3VyY2Uub2JqZWN0cyA9IFtdO1xuICAgICAgICB0aGlzLnJlc291cmNlLk1vZGVsID0gdGhpcy5nZXRNb2RlbCgpO1xuICAgICAgfVxuXG4gICAgICBnZXRNb2RlbCgpIHtcbiAgICAgICAgcmV0dXJuICRyZXNvdXJjZShcbiAgICAgICAgICB0aGlzLnJlc291cmNlLlVSTCxcbiAgICAgICAgICB7fSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBxdWVyeToge1xuICAgICAgICAgICAgICBpc0FycmF5OiBmYWxzZSxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgY3JlYXRlKGRhdGEpIHtcbiAgICAgICAgY29uc3QgUmVzb3VyY2UgPSB0aGlzLnJlc291cmNlO1xuICAgICAgICBjb25zdCBpbnN0YW5jZSA9IG5ldyBSZXNvdXJjZShkYXRhKTtcblxuICAgICAgICByZXR1cm4gaW5zdGFuY2UuJHNhdmUoKS4kcHJvbWlzZTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBHZXQgdGhlIGl0ZW0gbWF0Y2hpbmcgdGhlIGdpdmVuIHBhcmFtcy5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0gICB7T2JqZWN0fSAgICAgIHBhcmFtcyAgICBGaWx0ZXJpbmcgZGF0YSBvYmplY3QuXG4gICAgICAgKiBAcmV0dXJuICB7QVBJUmVzb3VyY2V9IFRoZSByZXF1ZXN0ZWQgcmVzb3VyY2VcbiAgICAgICAqL1xuICAgICAgZ2V0KHBhcmFtcykge1xuICAgICAgICBjb25zdCBSZXNvdXJjZSA9IHRoaXMucmVzb3VyY2U7XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5yZXNvdXJjZS5vYmplY3RzO1xuICAgICAgICBjb25zdCBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIFRyeSB0byBmaW5kIHRoZSByZXF1ZXN0ZWQgaXRlbSBpbiB0aGUgYWxyZWFkeSByZXRyaWV2ZWQgaXRlbXMuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBsID0gaXRlbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgZm91bmQgPSB0cnVlO1xuXG4gICAgICAgICAgLy8gQ29tcGFyZSB0aGUgcHJvdmlkZWQgcGFyYW0gdmFsdWVzIGFnYWluc3QgdGhlIGl0ZW0gdmFsdWVzLlxuICAgICAgICAgIGZvciAoa2V5IGluIHBhcmFtcykge1xuICAgICAgICAgICAgaWYgKGl0ZW1zW2ldW2tleV0gIT09IHBhcmFtc1trZXldKSB7XG4gICAgICAgICAgICAgIGZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGl0ZW1zW2ldKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSByZXF1ZXN0ZWQgaXRlbSBoYXNuJ3QgYmVlbiByZXF1ZXN0ZWQgeWV0LCBmZXRjaCBpdCBmcm9tIHRoZSBBUEkuXG4gICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICBSZXNvdXJjZS5Nb2RlbC5nZXQoXG4gICAgICAgICAgICBwYXJhbXMsXG4gICAgICAgICAgICBkYXRhID0+IGRlZmVycmVkLnJlc29sdmUobmV3IFJlc291cmNlKGRhdGEpKSxcbiAgICAgICAgICAgIGVyciA9PiBkZWZlcnJlZC5yZWplY3QoZXJyKVxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBBZGQgdGhlIGdpdmVuIGl0ZW0gdG8gdGhlIGxpc3QgaWYgaXQgZG9lcyBub3QgZXhpc3RzIGFscmVhZHkuXG4gICAgICAgKi9cbiAgICAgIGFkZChpdGVtKSB7XG4gICAgICAgIGNvbnN0IHBrID0gdGhpcy5yZXNvdXJjZS5wcmltYXJ5S2V5O1xuICAgICAgICBjb25zdCBhbHJlYWR5RXhpc3RzID0gdGhpcy5yZXNvdXJjZS5vYmplY3RzLnNvbWUoZGF0YSA9PiBkYXRhW3BrXSA9PT0gaXRlbVtwa10pO1xuXG4gICAgICAgIGlmICghKGl0ZW0gaW5zdGFuY2VvZiB0aGlzLnJlc291cmNlKSkge1xuICAgICAgICAgIGl0ZW0gPSBuZXcgUmVzb3VyY2UoaXRlbSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWFscmVhZHlFeGlzdHMpIHtcbiAgICAgICAgICB0aGlzLnJlc291cmNlLm9iamVjdHMucHVzaChpdGVtKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBnZXRBbGwocGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IFJlc291cmNlID0gdGhpcy5yZXNvdXJjZTtcbiAgICAgICAgY29uc3QgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgIGxldCByZXNwb25zZSA9IFJlc291cmNlLk1vZGVsLnF1ZXJ5KFxuICAgICAgICAgIHBhcmFtcyxcbiAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbXMgPSByZXNwb25zZS5kYXRhLm1hcChkYXRhID0+IG5ldyBSZXNvdXJjZShkYXRhKSk7XG5cbiAgICAgICAgICAgIGl0ZW1zLnRvdGFsQ291bnQgPSByZXNwb25zZS5jb3VudDtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoaXRlbXMpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZXJyID0+IGRlZmVycmVkLnJlamVjdChlcnIpXG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBBUElSZXNvdXJjZU1hbmFnZXI7XG4gIH1cblxuICBBUElSZXNvdXJjZU1hbmFnZXJGYWN0b3J5LiRpbmplY3QgPSBbXG4gICAgJyRxJyxcbiAgICAnJHJlc291cmNlJ1xuICBdO1xuXG4gIG5nLm1vZHVsZSgnY2cuYXBpJylcbiAgICAuZmFjdG9yeSgnQVBJUmVzb3VyY2VNYW5hZ2VyJywgQVBJUmVzb3VyY2VNYW5hZ2VyRmFjdG9yeSk7XG59KShhbmd1bGFyKTtcblxuIiwiKGZ1bmN0aW9uKG5nKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBmdW5jdGlvbiBBUElSZXNvdXJjZUZhY3RvcnkoQVBJUmVzb3VyY2VNYW5hZ2VyKSB7XG4gICAgY2xhc3MgQVBJUmVzb3VyY2Uge1xuICAgICAgc3RhdGljIFVSTCA9ICcnO1xuICAgICAgc3RhdGljIE1vZGVsID0gbnVsbDtcbiAgICAgIHN0YXRpYyBzY2hlbWEgPSB7fTtcbiAgICAgIHN0YXRpYyBwcmltYXJ5S2V5ID0gJ2lkJztcbiAgICAgIHN0YXRpYyBtYW5hZ2VyID0gbmV3IEFQSVJlc291cmNlTWFuYWdlcihBUElSZXNvdXJjZSk7XG5cbiAgICAgIC8qKlxuICAgICAgICogSW5pdGlhbGl6ZSB0aGUgaW5zdGFuY2Ugd2l0aCB0aGUgcHJvdmlkZWQgaW5pdGlhbCBkYXRhLlxuICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgKi9cbiAgICAgIGNvbnN0cnVjdG9yKGRhdGEpIHtcbiAgICAgICAgY29uc3QgUmVzb3VyY2UgPSB0aGlzLmNvbnN0cnVjdG9yO1xuXG4gICAgICAgIHRoaXMuX2NvcHlTY2hlbWFEYXRhKGRhdGEsIHRoaXMpO1xuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBJbml0aWFsaXplZCBtZXRob2QuXG4gICAgICAgKi9cbiAgICAgIGluaXQoKSB7XG4gICAgICAgIC8vIFRvIGJlIGltcGxlbWVudCBpbiB0aGUgc3ViY2xhc3MuXG4gICAgICB9O1xuXG4gICAgICAvKipcbiAgICAgICAqIENvcHkgdGhlIHByb3BlcnRpZXMgZGVmaW5lZCBpbiB0aGUgc2NoZW1hIGZyb20gdGhlIHNvdXJjZSBvYmplY3QgdG8gdGhlXG4gICAgICAgKiBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtICAge09iamVjdH0gIHNvdXJjZSAgVGhlIG9iamVjdCBjb250YWluaW5nIHRoZSBwcm9wZXJ0eSB2YWx1ZXMuXG4gICAgICAgKiBAcGFyYW0gICB7T2JqZWN0fSAgZGVzdCAgICBUaGUgb2JqZWN0IHRvIHdoaWNoIHRoZSBwcm9wZXJ0aWVzIHdpbGwgYmVcbiAgICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvcGllZC5cbiAgICAgICAqIEByZXR1cm4gIHtPYmplY3R9ICBUaGUgdXBkYXRlZCBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAgICAgKi9cbiAgICAgIF9jb3B5U2NoZW1hRGF0YShzb3VyY2UsIGRlc3QpIHtcbiAgICAgICAgY29uc3QgUmVzb3VyY2UgPSB0aGlzLmNvbnN0cnVjdG9yO1xuICAgICAgICBsZXQgVHlwZUNsYXNzO1xuICAgICAgICBsZXQgdmFsdWU7XG5cbiAgICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgYm90aCwgdGhlIHNvdXJjZSBhbmQgdGhlIGRlc3RpbmF0aW9uLCBhcmUgb2JqZWN0cy5cbiAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2UgIT09ICdvYmplY3QnIHx8IHR5cGVvZiBkZXN0ICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAnQm90aCwgZGF0YSBzb3VyY2UgYW5kIGRlc3RpbmF0aW9uLCBtdXN0IGJlIG9iamVjdHMnXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IHByb3BlcnR5IGluIFJlc291cmNlLnNjaGVtYSkge1xuICAgICAgICAgIHZhbHVlID0gc291cmNlW3Byb3BlcnR5XTtcbiAgICAgICAgICBUeXBlQ2xhc3MgPSBSZXNvdXJjZS5zY2hlbWFbcHJvcGVydHldO1xuXG4gICAgICAgICAgLy8gQ2FzdCB0aGUgdmFsdWUgdG8gdGhlIHR5cGUgZGVmaW5lZCBpbiB0aGUgc2NoZW1hLlxuICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG51bGw7XG4gICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnIHx8IFR5cGVDbGFzcyA9PT0gRGF0ZSlcbiAgICAgICAgICAgICYmICEodmFsdWUgaW5zdGFuY2VvZiBUeXBlQ2xhc3MpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG5ldyBUeXBlQ2xhc3ModmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdmFsdWUgPSBUeXBlQ2xhc3ModmFsdWUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGRlc3RbcHJvcGVydHldID0gdmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBVcGRhdGUgdGhpcyBpbnN0YW5jZSBkYXRhIGluIHRoZSBBUEkuXG4gICAgICAgKlxuICAgICAgICogQHJldHVybiB7UHJvbWlzZX0gIFRoZSBzYXZpbmcgcHJvbWlzZS5cbiAgICAgICAqL1xuICAgICAgc2F2ZSgpIHtcbiAgICAgICAgY29uc3QgUmVzb3VyY2VNb2RlbCA9IHRoaXMuY29uc3RydWN0b3IuTW9kZWw7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLl9jb3B5U2NoZW1hRGF0YSh0aGlzLCB7fSk7XG4gICAgICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IFJlc291cmNlTW9kZWwoZGF0YSk7XG5cbiAgICAgICAgcmV0dXJuIGluc3RhbmNlLiRzYXZlKCk7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogU2VuZCBhIGRlbGV0ZSByZXF1ZXN0IHRvIHRoZSBBUEkuXG4gICAgICAgKlxuICAgICAgICogQHJldHVybiB7UHJvbWlzZX0gIFRoZSBkZWxldGlvbiBwcm9taXNlLlxuICAgICAgICovXG4gICAgICBkZWxldGUoKSB7XG4gICAgICAgIGNvbnN0IFJlc291cmNlTW9kZWwgPSB0aGlzLk1vZGVsO1xuICAgICAgICBjb25zdCBpbnN0YW5jZSA9IG5ldyBSZXNvdXJjZU1vZGVsKCk7XG4gICAgICAgIGNvbnN0IHBrID0gdGhpcy5jb25zdHJ1Y3Rvci5wcmltYXJ5S2V5O1xuXG4gICAgICAgIGluc3RhbmNlW3BrXSA9IHRoaXNbcGtdO1xuXG4gICAgICAgIHJldHVybiBpbnN0YW5jZS4kZGVsZXRlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEFQSVJlc291cmNlO1xuICB9XG5cbiAgQVBJUmVzb3VyY2VGYWN0b3J5LiRpbmplY3QgPSBbXG4gICAgJ0FQSVJlc291cmNlTWFuYWdlcidcbiAgXTtcblxuICBuZy5tb2R1bGUoJ2NnLmFwaScpXG4gICAgLmZhY3RvcnkoJ0FQSVJlc291cmNlJywgQVBJUmVzb3VyY2VGYWN0b3J5KTtcbn0pKGFuZ3VsYXIpO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

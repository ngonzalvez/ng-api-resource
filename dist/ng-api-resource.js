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
          return $resource(this.resource.URL, this.resource.URLParams, {
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

          return instance.$save();
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
    APIResource.URLParams = {};
    APIResource.Model = null;
    APIResource.schema = {};
    APIResource.primaryKey = 'id';
    APIResource.manager = new APIResourceManager(APIResource);

    return APIResource;
  }

  APIResourceFactory.$inject = ['APIResourceManager'];

  ng.module('cg.api').factory('APIResource', APIResourceFactory);
})(angular);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS5qcyIsIkFQSVJlc291cmNlTWFuYWdlci5qcyIsIkFQSVJlc291cmNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsQ0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLGVBREE7O0FBR0EsS0FBQSxNQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsWUFBQSxDQUFBLEVBSEE7Q0FBQSxDQUFBLENBSUEsT0FKQTs7QUNBQSxDQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsZUFEQTs7QUFHQSxXQUFBLHlCQUFBLENBQUEsRUFBQSxFQUFBLFNBQUEsRUFBQTtRQUNBO0FBR0EsZUFIQSxrQkFHQSxDQUFBLFFBQUEsRUFBQTs4QkFIQSxvQkFHQTs7YUFGQSxXQUFBLEtBRUE7O0FBQ0EsYUFBQSxRQUFBLEdBQUEsUUFBQSxDQURBO0FBRUEsYUFBQSxRQUFBLENBQUEsT0FBQSxHQUFBLEVBQUEsQ0FGQTtBQUdBLGFBQUEsUUFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLFFBQUEsRUFBQSxDQUhBO09BQUE7O21CQUhBOzttQ0FTQTtBQUNBLGlCQUFBLFVBQ0EsS0FBQSxRQUFBLENBQUEsR0FBQSxFQUNBLEtBQUEsUUFBQSxDQUFBLFNBQUEsRUFDQTtBQUNBLG1CQUFBO0FBQ0EsdUJBQUEsS0FBQTtBQUNBLHNCQUFBLEtBQUE7YUFGQTtXQUpBLENBQUEsQ0FEQTs7OzsrQkFhQSxNQUFBO0FBQ0EsY0FBQSxXQUFBLEtBQUEsUUFBQSxDQURBO0FBRUEsY0FBQSxXQUFBLElBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQSxDQUZBOztBQUlBLGlCQUFBLFNBQUEsS0FBQSxFQUFBLENBSkE7Ozs7Ozs7Ozs7Ozs0QkFhQSxRQUFBO0FBQ0EsY0FBQSxXQUFBLEtBQUEsUUFBQSxDQURBO0FBRUEsY0FBQSxRQUFBLEtBQUEsUUFBQSxDQUFBLE9BQUEsQ0FGQTtBQUdBLGNBQUEsV0FBQSxHQUFBLEtBQUEsRUFBQSxDQUhBO0FBSUEsY0FBQSxRQUFBLEtBQUE7OztBQUpB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O0FBQ0EsZ0JBR0EsUUFBQSxLQUpBO0FBQ0EsZ0JBSUEsU0FBQSxHQUxBO0FBQ0EsZ0JBS0EsYUFBQSxLQU5BO0FBQ0EsZ0JBTUEsVUFBQSxJQUFBLGtCQUFBLENBQUEsV0FBQSxFQVBBOztBQW1HQSxXQUFBLFdBQUEsQ0FuR0E7R0FBQTs7QUFzR0EscUJBQUEsT0FBQSxHQUFBLENBQ0Esb0JBREEsQ0FBQSxDQXpHQTs7QUE2R0EsS0FBQSxNQUFBLENBQUEsUUFBQSxFQUNBLE9BREEsQ0FDQSxhQURBLEVBQ0Esa0JBREEsRUE3R0E7Q0FBQSxDQUFBLENBK0dBLE9BL0dBIiwiZmlsZSI6Im5nLWFwaS1yZXNvdXJjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbihuZykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgbmcubW9kdWxlKCdjZy5hcGknLCBbJ25nUmVzb3VyY2UnXSk7XG59KShhbmd1bGFyKTtcbiIsIihmdW5jdGlvbihuZykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgZnVuY3Rpb24gQVBJUmVzb3VyY2VNYW5hZ2VyRmFjdG9yeSgkcSwgJHJlc291cmNlKSB7XG4gICAgY2xhc3MgQVBJUmVzb3VyY2VNYW5hZ2VyIHtcbiAgICAgIHJlc291cmNlID0gbnVsbDtcblxuICAgICAgY29uc3RydWN0b3IocmVzb3VyY2UpIHtcbiAgICAgICAgdGhpcy5yZXNvdXJjZSA9IHJlc291cmNlO1xuICAgICAgICB0aGlzLnJlc291cmNlLm9iamVjdHMgPSBbXTtcbiAgICAgICAgdGhpcy5yZXNvdXJjZS5Nb2RlbCA9IHRoaXMuZ2V0TW9kZWwoKTtcbiAgICAgIH1cblxuICAgICAgZ2V0TW9kZWwoKSB7XG4gICAgICAgIHJldHVybiAkcmVzb3VyY2UoXG4gICAgICAgICAgdGhpcy5yZXNvdXJjZS5VUkwsXG4gICAgICAgICAgdGhpcy5yZXNvdXJjZS5VUkxQYXJhbXMsXG4gICAgICAgICAge1xuICAgICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgICAgaXNBcnJheTogZmFsc2UsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNyZWF0ZShkYXRhKSB7XG4gICAgICAgIGNvbnN0IFJlc291cmNlID0gdGhpcy5yZXNvdXJjZTtcbiAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgUmVzb3VyY2UoZGF0YSk7XG5cbiAgICAgICAgcmV0dXJuIGluc3RhbmNlLiRzYXZlKCk7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0IHRoZSBpdGVtIG1hdGNoaW5nIHRoZSBnaXZlbiBwYXJhbXMuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtICAge09iamVjdH0gICAgICBwYXJhbXMgICAgRmlsdGVyaW5nIGRhdGEgb2JqZWN0LlxuICAgICAgICogQHJldHVybiAge0FQSVJlc291cmNlfSBUaGUgcmVxdWVzdGVkIHJlc291cmNlXG4gICAgICAgKi9cbiAgICAgIGdldChwYXJhbXMpIHtcbiAgICAgICAgY29uc3QgUmVzb3VyY2UgPSB0aGlzLnJlc291cmNlO1xuICAgICAgICBjb25zdCBpdGVtcyA9IHRoaXMucmVzb3VyY2Uub2JqZWN0cztcbiAgICAgICAgY29uc3QgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcblxuICAgICAgICAvLyBUcnkgdG8gZmluZCB0aGUgcmVxdWVzdGVkIGl0ZW0gaW4gdGhlIGFscmVhZHkgcmV0cmlldmVkIGl0ZW1zLlxuICAgICAgICBmb3IgKGxldCBpID0gMCwgbCA9IGl0ZW1zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcblxuICAgICAgICAgIC8vIENvbXBhcmUgdGhlIHByb3ZpZGVkIHBhcmFtIHZhbHVlcyBhZ2FpbnN0IHRoZSBpdGVtIHZhbHVlcy5cbiAgICAgICAgICBmb3IgKGtleSBpbiBwYXJhbXMpIHtcbiAgICAgICAgICAgIGlmIChpdGVtc1tpXVtrZXldICE9PSBwYXJhbXNba2V5XSkge1xuICAgICAgICAgICAgICBmb3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShpdGVtc1tpXSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgcmVxdWVzdGVkIGl0ZW0gaGFzbid0IGJlZW4gcmVxdWVzdGVkIHlldCwgZmV0Y2ggaXQgZnJvbSB0aGUgQVBJLlxuICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgUmVzb3VyY2UuTW9kZWwuZ2V0KFxuICAgICAgICAgICAgcGFyYW1zLFxuICAgICAgICAgICAgZGF0YSA9PiBkZWZlcnJlZC5yZXNvbHZlKG5ldyBSZXNvdXJjZShkYXRhKSksXG4gICAgICAgICAgICBlcnIgPT4gZGVmZXJyZWQucmVqZWN0KGVycilcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogQWRkIHRoZSBnaXZlbiBpdGVtIHRvIHRoZSBsaXN0IGlmIGl0IGRvZXMgbm90IGV4aXN0cyBhbHJlYWR5LlxuICAgICAgICovXG4gICAgICBhZGQoaXRlbSkge1xuICAgICAgICBjb25zdCBwayA9IHRoaXMucmVzb3VyY2UucHJpbWFyeUtleTtcbiAgICAgICAgY29uc3QgYWxyZWFkeUV4aXN0cyA9IHRoaXMucmVzb3VyY2Uub2JqZWN0cy5zb21lKGRhdGEgPT4gZGF0YVtwa10gPT09IGl0ZW1bcGtdKTtcblxuICAgICAgICBpZiAoIShpdGVtIGluc3RhbmNlb2YgdGhpcy5yZXNvdXJjZSkpIHtcbiAgICAgICAgICBpdGVtID0gbmV3IFJlc291cmNlKGl0ZW0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFhbHJlYWR5RXhpc3RzKSB7XG4gICAgICAgICAgdGhpcy5yZXNvdXJjZS5vYmplY3RzLnB1c2goaXRlbSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZ2V0QWxsKHBhcmFtcykge1xuICAgICAgICBjb25zdCBSZXNvdXJjZSA9IHRoaXMucmVzb3VyY2U7XG4gICAgICAgIGNvbnN0IGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICBsZXQgcmVzcG9uc2UgPSBSZXNvdXJjZS5Nb2RlbC5xdWVyeShcbiAgICAgICAgICBwYXJhbXMsXG4gICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1zID0gcmVzcG9uc2UuZGF0YS5tYXAoZGF0YSA9PiBuZXcgUmVzb3VyY2UoZGF0YSkpO1xuXG4gICAgICAgICAgICBpdGVtcy50b3RhbENvdW50ID0gcmVzcG9uc2UuY291bnQ7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGl0ZW1zKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGVyciA9PiBkZWZlcnJlZC5yZWplY3QoZXJyKVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gQVBJUmVzb3VyY2VNYW5hZ2VyO1xuICB9XG5cbiAgQVBJUmVzb3VyY2VNYW5hZ2VyRmFjdG9yeS4kaW5qZWN0ID0gW1xuICAgICckcScsXG4gICAgJyRyZXNvdXJjZSdcbiAgXTtcblxuICBuZy5tb2R1bGUoJ2NnLmFwaScpXG4gICAgLmZhY3RvcnkoJ0FQSVJlc291cmNlTWFuYWdlcicsIEFQSVJlc291cmNlTWFuYWdlckZhY3RvcnkpO1xufSkoYW5ndWxhcik7XG5cbiIsIihmdW5jdGlvbihuZykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgZnVuY3Rpb24gQVBJUmVzb3VyY2VGYWN0b3J5KEFQSVJlc291cmNlTWFuYWdlcikge1xuICAgIGNsYXNzIEFQSVJlc291cmNlIHtcbiAgICAgIHN0YXRpYyBVUkwgPSAnJztcbiAgICAgIHN0YXRpYyBVUkxQYXJhbXMgPSB7fTtcbiAgICAgIHN0YXRpYyBNb2RlbCA9IG51bGw7XG4gICAgICBzdGF0aWMgc2NoZW1hID0ge307XG4gICAgICBzdGF0aWMgcHJpbWFyeUtleSA9ICdpZCc7XG4gICAgICBzdGF0aWMgbWFuYWdlciA9IG5ldyBBUElSZXNvdXJjZU1hbmFnZXIoQVBJUmVzb3VyY2UpO1xuXG4gICAgICAvKipcbiAgICAgICAqIEluaXRpYWxpemUgdGhlIGluc3RhbmNlIHdpdGggdGhlIHByb3ZpZGVkIGluaXRpYWwgZGF0YS5cbiAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICovXG4gICAgICBjb25zdHJ1Y3RvcihkYXRhKSB7XG4gICAgICAgIGNvbnN0IFJlc291cmNlID0gdGhpcy5jb25zdHJ1Y3RvcjtcblxuICAgICAgICB0aGlzLl9jb3B5U2NoZW1hRGF0YShkYXRhLCB0aGlzKTtcbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogSW5pdGlhbGl6ZWQgbWV0aG9kLlxuICAgICAgICovXG4gICAgICBpbml0KCkge1xuICAgICAgICAvLyBUbyBiZSBpbXBsZW1lbnQgaW4gdGhlIHN1YmNsYXNzLlxuICAgICAgfTtcblxuICAgICAgLyoqXG4gICAgICAgKiBDb3B5IHRoZSBwcm9wZXJ0aWVzIGRlZmluZWQgaW4gdGhlIHNjaGVtYSBmcm9tIHRoZSBzb3VyY2Ugb2JqZWN0IHRvIHRoZVxuICAgICAgICogZGVzdGluYXRpb24gb2JqZWN0LlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSAgIHtPYmplY3R9ICBzb3VyY2UgIFRoZSBvYmplY3QgY29udGFpbmluZyB0aGUgcHJvcGVydHkgdmFsdWVzLlxuICAgICAgICogQHBhcmFtICAge09iamVjdH0gIGRlc3QgICAgVGhlIG9iamVjdCB0byB3aGljaCB0aGUgcHJvcGVydGllcyB3aWxsIGJlXG4gICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3BpZWQuXG4gICAgICAgKiBAcmV0dXJuICB7T2JqZWN0fSAgVGhlIHVwZGF0ZWQgZGVzdGluYXRpb24gb2JqZWN0LlxuICAgICAgICovXG4gICAgICBfY29weVNjaGVtYURhdGEoc291cmNlLCBkZXN0KSB7XG4gICAgICAgIGNvbnN0IFJlc291cmNlID0gdGhpcy5jb25zdHJ1Y3RvcjtcbiAgICAgICAgbGV0IFR5cGVDbGFzcztcbiAgICAgICAgbGV0IHZhbHVlO1xuXG4gICAgICAgIC8vIE1ha2Ugc3VyZSB0aGF0IGJvdGgsIHRoZSBzb3VyY2UgYW5kIHRoZSBkZXN0aW5hdGlvbiwgYXJlIG9iamVjdHMuXG4gICAgICAgIGlmICh0eXBlb2Ygc291cmNlICE9PSAnb2JqZWN0JyB8fCB0eXBlb2YgZGVzdCAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgJ0JvdGgsIGRhdGEgc291cmNlIGFuZCBkZXN0aW5hdGlvbiwgbXVzdCBiZSBvYmplY3RzJ1xuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBwcm9wZXJ0eSBpbiBSZXNvdXJjZS5zY2hlbWEpIHtcbiAgICAgICAgICB2YWx1ZSA9IHNvdXJjZVtwcm9wZXJ0eV07XG4gICAgICAgICAgVHlwZUNsYXNzID0gUmVzb3VyY2Uuc2NoZW1hW3Byb3BlcnR5XTtcblxuICAgICAgICAgIC8vIENhc3QgdGhlIHZhbHVlIHRvIHRoZSB0eXBlIGRlZmluZWQgaW4gdGhlIHNjaGVtYS5cbiAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyB8fCBUeXBlQ2xhc3MgPT09IERhdGUpXG4gICAgICAgICAgICAmJiAhKHZhbHVlIGluc3RhbmNlb2YgVHlwZUNsYXNzKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdmFsdWUgPSBuZXcgVHlwZUNsYXNzKHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHZhbHVlID0gVHlwZUNsYXNzKHZhbHVlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBkZXN0W3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogVXBkYXRlIHRoaXMgaW5zdGFuY2UgZGF0YSBpbiB0aGUgQVBJLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9ICBUaGUgc2F2aW5nIHByb21pc2UuXG4gICAgICAgKi9cbiAgICAgIHNhdmUoKSB7XG4gICAgICAgIGNvbnN0IFJlc291cmNlTW9kZWwgPSB0aGlzLmNvbnN0cnVjdG9yLk1vZGVsO1xuICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5fY29weVNjaGVtYURhdGEodGhpcywge30pO1xuICAgICAgICBjb25zdCBpbnN0YW5jZSA9IG5ldyBSZXNvdXJjZU1vZGVsKGRhdGEpO1xuXG4gICAgICAgIHJldHVybiBpbnN0YW5jZS4kc2F2ZSgpO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIFNlbmQgYSBkZWxldGUgcmVxdWVzdCB0byB0aGUgQVBJLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9ICBUaGUgZGVsZXRpb24gcHJvbWlzZS5cbiAgICAgICAqL1xuICAgICAgZGVsZXRlKCkge1xuICAgICAgICBjb25zdCBSZXNvdXJjZU1vZGVsID0gdGhpcy5Nb2RlbDtcbiAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgUmVzb3VyY2VNb2RlbCgpO1xuICAgICAgICBjb25zdCBwayA9IHRoaXMuY29uc3RydWN0b3IucHJpbWFyeUtleTtcblxuICAgICAgICBpbnN0YW5jZVtwa10gPSB0aGlzW3BrXTtcblxuICAgICAgICByZXR1cm4gaW5zdGFuY2UuJGRlbGV0ZSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBBUElSZXNvdXJjZTtcbiAgfVxuXG4gIEFQSVJlc291cmNlRmFjdG9yeS4kaW5qZWN0ID0gW1xuICAgICdBUElSZXNvdXJjZU1hbmFnZXInXG4gIF07XG5cbiAgbmcubW9kdWxlKCdjZy5hcGknKVxuICAgIC5mYWN0b3J5KCdBUElSZXNvdXJjZScsIEFQSVJlc291cmNlRmFjdG9yeSk7XG59KShhbmd1bGFyKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

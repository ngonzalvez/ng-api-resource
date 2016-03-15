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
          var methods = {
            query: {
              isArray: false,
              method: 'GET'
            }
          };

          for (var name in this.resource.methods) {
            methods[name] = this.resource.methods[name];
          }

          return $resource(this.resource.URL, this.resource.URLParams, methods);
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
        value: function save(data) {
          var ResourceModel = this.constructor.Model;
          var resourceData = data || this._copySchemaData(this, {});
          var instance = new ResourceModel(resourceData);

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
    APIResource.methods = {};
    APIResource.schema = {};
    APIResource.primaryKey = 'id';
    APIResource.manager = new APIResourceManager(APIResource);

    return APIResource;
  }

  APIResourceFactory.$inject = ['APIResourceManager'];

  ng.module('cg.api').factory('APIResource', APIResourceFactory);
})(angular);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS5qcyIsIkFQSVJlc291cmNlTWFuYWdlci5qcyIsIkFQSVJlc291cmNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsQ0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLGVBREE7O0FBR0EsS0FBQSxNQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsWUFBQSxDQUFBLEVBSEE7Q0FBQSxDQUFBLENBSUEsT0FKQTs7QUNBQSxDQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsZUFEQTs7QUFHQSxXQUFBLHlCQUFBLENBQUEsRUFBQSxFQUFBLFNBQUEsRUFBQTtRQUNBO0FBR0EsZUFIQSxrQkFHQSxDQUFBLFFBQUEsRUFBQTs4QkFIQSxvQkFHQTs7YUFGQSxXQUFBLEtBRUE7O0FBQ0EsYUFBQSxRQUFBLEdBQUEsUUFBQSxDQURBO0FBRUEsYUFBQSxRQUFBLENBQUEsT0FBQSxHQUFBLEVBQUEsQ0FGQTtBQUdBLGFBQUEsUUFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLFFBQUEsRUFBQSxDQUhBO09BQUE7O21CQUhBOzttQ0FTQTtBQUNBLGNBQUEsVUFBQTtBQUNBLG1CQUFBO0FBQ0EsdUJBQUEsS0FBQTtBQUNBLHNCQUFBLEtBQUE7YUFGQTtXQURBLENBREE7O0FBUUEsZUFBQSxJQUFBLElBQUEsSUFBQSxLQUFBLFFBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxvQkFBQSxJQUFBLElBQUEsS0FBQSxRQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxDQURBO1dBQUE7O0FBSUEsaUJBQUEsVUFBQSxLQUFBLFFBQUEsQ0FBQSxHQUFBLEVBQUEsS0FBQSxRQUFBLENBQUEsU0FBQSxFQUFBLE9BQUEsQ0FBQSxDQVpBOzs7OytCQWVBLE1BQUE7QUFDQSxjQUFBLFdBQUEsS0FBQSxRQUFBLENBREE7QUFFQSxjQUFBLFdBQUEsSUFBQSxRQUFBLENBQUEsSUFBQSxDQUFBLENBRkE7O0FBSUEsaUJBQUEsU0FBQSxLQUFBLEVBQUEsQ0FKQTs7Ozs7Ozs7Ozs7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QUEsV0FBQSxDQUFBLFVBQUEsQ0FIQTs7QUFLQSxtQkFBQSxFQUFBLElBQUEsS0FBQSxFQUFBLENBQUEsQ0FMQTs7QUFPQSxpQkFBQSxTQUFBLE9BQUEsRUFBQSxDQVBBOzs7O2FBeEZBO1FBREE7O0FBQ0EsZ0JBQ0EsTUFBQSxHQUZBO0FBQ0EsZ0JBRUEsWUFBQSxHQUhBO0FBQ0EsZ0JBR0EsUUFBQSxLQUpBO0FBQ0EsZ0JBSUEsVUFBQSxHQUxBO0FBQ0EsZ0JBS0EsU0FBQSxHQU5BO0FBQ0EsZ0JBTUEsYUFBQSxLQVBBO0FBQ0EsZ0JBT0EsVUFBQSxJQUFBLGtCQUFBLENBQUEsV0FBQSxFQVJBOztBQW9HQSxXQUFBLFdBQUEsQ0FwR0E7R0FBQTs7QUF1R0EscUJBQUEsT0FBQSxHQUFBLENBQ0Esb0JBREEsQ0FBQSxDQTFHQTs7QUE4R0EsS0FBQSxNQUFBLENBQUEsUUFBQSxFQUNBLE9BREEsQ0FDQSxhQURBLEVBQ0Esa0JBREEsRUE5R0E7Q0FBQSxDQUFBLENBZ0hBLE9BaEhBIiwiZmlsZSI6Im5nLWFwaS1yZXNvdXJjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbihuZykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgbmcubW9kdWxlKCdjZy5hcGknLCBbJ25nUmVzb3VyY2UnXSk7XG59KShhbmd1bGFyKTtcbiIsIihmdW5jdGlvbihuZykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgZnVuY3Rpb24gQVBJUmVzb3VyY2VNYW5hZ2VyRmFjdG9yeSgkcSwgJHJlc291cmNlKSB7XG4gICAgY2xhc3MgQVBJUmVzb3VyY2VNYW5hZ2VyIHtcbiAgICAgIHJlc291cmNlID0gbnVsbDtcblxuICAgICAgY29uc3RydWN0b3IocmVzb3VyY2UpIHtcbiAgICAgICAgdGhpcy5yZXNvdXJjZSA9IHJlc291cmNlO1xuICAgICAgICB0aGlzLnJlc291cmNlLm9iamVjdHMgPSBbXTtcbiAgICAgICAgdGhpcy5yZXNvdXJjZS5Nb2RlbCA9IHRoaXMuZ2V0TW9kZWwoKTtcbiAgICAgIH1cblxuICAgICAgZ2V0TW9kZWwoKSB7XG4gICAgICAgIGNvbnN0IG1ldGhvZHMgPSB7XG4gICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgIGlzQXJyYXk6IGZhbHNlLFxuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJ1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBmb3IgKGxldCBuYW1lIGluIHRoaXMucmVzb3VyY2UubWV0aG9kcykge1xuICAgICAgICAgIG1ldGhvZHNbbmFtZV0gPSB0aGlzLnJlc291cmNlLm1ldGhvZHNbbmFtZV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gJHJlc291cmNlKHRoaXMucmVzb3VyY2UuVVJMLCB0aGlzLnJlc291cmNlLlVSTFBhcmFtcywgbWV0aG9kcyk7XG4gICAgICB9XG5cbiAgICAgIGNyZWF0ZShkYXRhKSB7XG4gICAgICAgIGNvbnN0IFJlc291cmNlID0gdGhpcy5yZXNvdXJjZTtcbiAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgUmVzb3VyY2UoZGF0YSk7XG5cbiAgICAgICAgcmV0dXJuIGluc3RhbmNlLiRzYXZlKCk7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0IHRoZSBpdGVtIG1hdGNoaW5nIHRoZSBnaXZlbiBwYXJhbXMuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtICAge09iamVjdH0gICAgICBwYXJhbXMgICAgRmlsdGVyaW5nIGRhdGEgb2JqZWN0LlxuICAgICAgICogQHJldHVybiAge0FQSVJlc291cmNlfSBUaGUgcmVxdWVzdGVkIHJlc291cmNlXG4gICAgICAgKi9cbiAgICAgIGdldChwYXJhbXMpIHtcbiAgICAgICAgY29uc3QgUmVzb3VyY2UgPSB0aGlzLnJlc291cmNlO1xuICAgICAgICBjb25zdCBpdGVtcyA9IHRoaXMucmVzb3VyY2Uub2JqZWN0cztcbiAgICAgICAgY29uc3QgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcblxuICAgICAgICAvLyBUcnkgdG8gZmluZCB0aGUgcmVxdWVzdGVkIGl0ZW0gaW4gdGhlIGFscmVhZHkgcmV0cmlldmVkIGl0ZW1zLlxuICAgICAgICBmb3IgKGxldCBpID0gMCwgbCA9IGl0ZW1zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcblxuICAgICAgICAgIC8vIENvbXBhcmUgdGhlIHByb3ZpZGVkIHBhcmFtIHZhbHVlcyBhZ2FpbnN0IHRoZSBpdGVtIHZhbHVlcy5cbiAgICAgICAgICBmb3IgKGtleSBpbiBwYXJhbXMpIHtcbiAgICAgICAgICAgIGlmIChpdGVtc1tpXVtrZXldICE9PSBwYXJhbXNba2V5XSkge1xuICAgICAgICAgICAgICBmb3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShpdGVtc1tpXSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgcmVxdWVzdGVkIGl0ZW0gaGFzbid0IGJlZW4gcmVxdWVzdGVkIHlldCwgZmV0Y2ggaXQgZnJvbSB0aGUgQVBJLlxuICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgUmVzb3VyY2UuTW9kZWwuZ2V0KFxuICAgICAgICAgICAgcGFyYW1zLFxuICAgICAgICAgICAgZGF0YSA9PiBkZWZlcnJlZC5yZXNvbHZlKG5ldyBSZXNvdXJjZShkYXRhKSksXG4gICAgICAgICAgICBlcnIgPT4gZGVmZXJyZWQucmVqZWN0KGVycilcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogQWRkIHRoZSBnaXZlbiBpdGVtIHRvIHRoZSBsaXN0IGlmIGl0IGRvZXMgbm90IGV4aXN0cyBhbHJlYWR5LlxuICAgICAgICovXG4gICAgICBhZGQoaXRlbSkge1xuICAgICAgICBjb25zdCBwayA9IHRoaXMucmVzb3VyY2UucHJpbWFyeUtleTtcbiAgICAgICAgY29uc3QgYWxyZWFkeUV4aXN0cyA9IHRoaXMucmVzb3VyY2Uub2JqZWN0cy5zb21lKGRhdGEgPT4gZGF0YVtwa10gPT09IGl0ZW1bcGtdKTtcblxuICAgICAgICBpZiAoIShpdGVtIGluc3RhbmNlb2YgdGhpcy5yZXNvdXJjZSkpIHtcbiAgICAgICAgICBpdGVtID0gbmV3IFJlc291cmNlKGl0ZW0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFhbHJlYWR5RXhpc3RzKSB7XG4gICAgICAgICAgdGhpcy5yZXNvdXJjZS5vYmplY3RzLnB1c2goaXRlbSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZ2V0QWxsKHBhcmFtcykge1xuICAgICAgICBjb25zdCBSZXNvdXJjZSA9IHRoaXMucmVzb3VyY2U7XG4gICAgICAgIGNvbnN0IGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICBsZXQgcmVzcG9uc2UgPSBSZXNvdXJjZS5Nb2RlbC5xdWVyeShcbiAgICAgICAgICBwYXJhbXMsXG4gICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1zID0gcmVzcG9uc2UuZGF0YS5tYXAoZGF0YSA9PiBuZXcgUmVzb3VyY2UoZGF0YSkpO1xuXG4gICAgICAgICAgICBpdGVtcy50b3RhbENvdW50ID0gcmVzcG9uc2UuY291bnQ7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGl0ZW1zKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGVyciA9PiBkZWZlcnJlZC5yZWplY3QoZXJyKVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gQVBJUmVzb3VyY2VNYW5hZ2VyO1xuICB9XG5cbiAgQVBJUmVzb3VyY2VNYW5hZ2VyRmFjdG9yeS4kaW5qZWN0ID0gW1xuICAgICckcScsXG4gICAgJyRyZXNvdXJjZSdcbiAgXTtcblxuICBuZy5tb2R1bGUoJ2NnLmFwaScpXG4gICAgLmZhY3RvcnkoJ0FQSVJlc291cmNlTWFuYWdlcicsIEFQSVJlc291cmNlTWFuYWdlckZhY3RvcnkpO1xufSkoYW5ndWxhcik7XG5cbiIsIihmdW5jdGlvbihuZykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgZnVuY3Rpb24gQVBJUmVzb3VyY2VGYWN0b3J5KEFQSVJlc291cmNlTWFuYWdlcikge1xuICAgIGNsYXNzIEFQSVJlc291cmNlIHtcbiAgICAgIHN0YXRpYyBVUkwgPSAnJztcbiAgICAgIHN0YXRpYyBVUkxQYXJhbXMgPSB7fTtcbiAgICAgIHN0YXRpYyBNb2RlbCA9IG51bGw7XG4gICAgICBzdGF0aWMgbWV0aG9kcyA9IHt9O1xuICAgICAgc3RhdGljIHNjaGVtYSA9IHt9O1xuICAgICAgc3RhdGljIHByaW1hcnlLZXkgPSAnaWQnO1xuICAgICAgc3RhdGljIG1hbmFnZXIgPSBuZXcgQVBJUmVzb3VyY2VNYW5hZ2VyKEFQSVJlc291cmNlKTtcblxuICAgICAgLyoqXG4gICAgICAgKiBJbml0aWFsaXplIHRoZSBpbnN0YW5jZSB3aXRoIHRoZSBwcm92aWRlZCBpbml0aWFsIGRhdGEuXG4gICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAqL1xuICAgICAgY29uc3RydWN0b3IoZGF0YSkge1xuICAgICAgICBjb25zdCBSZXNvdXJjZSA9IHRoaXMuY29uc3RydWN0b3I7XG5cbiAgICAgICAgdGhpcy5fY29weVNjaGVtYURhdGEoZGF0YSwgdGhpcyk7XG4gICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIEluaXRpYWxpemVkIG1ldGhvZC5cbiAgICAgICAqL1xuICAgICAgaW5pdCgpIHtcbiAgICAgICAgLy8gVG8gYmUgaW1wbGVtZW50IGluIHRoZSBzdWJjbGFzcy5cbiAgICAgIH07XG5cbiAgICAgIC8qKlxuICAgICAgICogQ29weSB0aGUgcHJvcGVydGllcyBkZWZpbmVkIGluIHRoZSBzY2hlbWEgZnJvbSB0aGUgc291cmNlIG9iamVjdCB0byB0aGVcbiAgICAgICAqIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0gICB7T2JqZWN0fSAgc291cmNlICBUaGUgb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHByb3BlcnR5IHZhbHVlcy5cbiAgICAgICAqIEBwYXJhbSAgIHtPYmplY3R9ICBkZXN0ICAgIFRoZSBvYmplY3QgdG8gd2hpY2ggdGhlIHByb3BlcnRpZXMgd2lsbCBiZVxuICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgY29waWVkLlxuICAgICAgICogQHJldHVybiAge09iamVjdH0gIFRoZSB1cGRhdGVkIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAgICAgICAqL1xuICAgICAgX2NvcHlTY2hlbWFEYXRhKHNvdXJjZSwgZGVzdCkge1xuICAgICAgICBjb25zdCBSZXNvdXJjZSA9IHRoaXMuY29uc3RydWN0b3I7XG4gICAgICAgIGxldCBUeXBlQ2xhc3M7XG4gICAgICAgIGxldCB2YWx1ZTtcblxuICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCBib3RoLCB0aGUgc291cmNlIGFuZCB0aGUgZGVzdGluYXRpb24sIGFyZSBvYmplY3RzLlxuICAgICAgICBpZiAodHlwZW9mIHNvdXJjZSAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIGRlc3QgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICdCb3RoLCBkYXRhIHNvdXJjZSBhbmQgZGVzdGluYXRpb24sIG11c3QgYmUgb2JqZWN0cydcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgcHJvcGVydHkgaW4gUmVzb3VyY2Uuc2NoZW1hKSB7XG4gICAgICAgICAgdmFsdWUgPSBzb3VyY2VbcHJvcGVydHldO1xuICAgICAgICAgIFR5cGVDbGFzcyA9IFJlc291cmNlLnNjaGVtYVtwcm9wZXJ0eV07XG5cbiAgICAgICAgICAvLyBDYXN0IHRoZSB2YWx1ZSB0byB0aGUgdHlwZSBkZWZpbmVkIGluIHRoZSBzY2hlbWEuXG4gICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgfHwgVHlwZUNsYXNzID09PSBEYXRlKVxuICAgICAgICAgICAgJiYgISh2YWx1ZSBpbnN0YW5jZW9mIFR5cGVDbGFzcylcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHZhbHVlID0gbmV3IFR5cGVDbGFzcyh2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IFR5cGVDbGFzcyh2YWx1ZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZGVzdFtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIFVwZGF0ZSB0aGlzIGluc3RhbmNlIGRhdGEgaW4gdGhlIEFQSS5cbiAgICAgICAqXG4gICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSAgVGhlIHNhdmluZyBwcm9taXNlLlxuICAgICAgICovXG4gICAgICBzYXZlKGRhdGEpIHtcbiAgICAgICAgY29uc3QgUmVzb3VyY2VNb2RlbCA9IHRoaXMuY29uc3RydWN0b3IuTW9kZWw7XG4gICAgICAgIGNvbnN0IHJlc291cmNlRGF0YSA9IGRhdGEgfHwgdGhpcy5fY29weVNjaGVtYURhdGEodGhpcywge30pO1xuICAgICAgICBjb25zdCBpbnN0YW5jZSA9IG5ldyBSZXNvdXJjZU1vZGVsKHJlc291cmNlRGF0YSk7XG5cbiAgICAgICAgcmV0dXJuIGluc3RhbmNlLiRzYXZlKCk7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogU2VuZCBhIGRlbGV0ZSByZXF1ZXN0IHRvIHRoZSBBUEkuXG4gICAgICAgKlxuICAgICAgICogQHJldHVybiB7UHJvbWlzZX0gIFRoZSBkZWxldGlvbiBwcm9taXNlLlxuICAgICAgICovXG4gICAgICBkZWxldGUoKSB7XG4gICAgICAgIGNvbnN0IFJlc291cmNlTW9kZWwgPSB0aGlzLk1vZGVsO1xuICAgICAgICBjb25zdCBpbnN0YW5jZSA9IG5ldyBSZXNvdXJjZU1vZGVsKCk7XG4gICAgICAgIGNvbnN0IHBrID0gdGhpcy5jb25zdHJ1Y3Rvci5wcmltYXJ5S2V5O1xuXG4gICAgICAgIGluc3RhbmNlW3BrXSA9IHRoaXNbcGtdO1xuXG4gICAgICAgIHJldHVybiBpbnN0YW5jZS4kZGVsZXRlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEFQSVJlc291cmNlO1xuICB9XG5cbiAgQVBJUmVzb3VyY2VGYWN0b3J5LiRpbmplY3QgPSBbXG4gICAgJ0FQSVJlc291cmNlTWFuYWdlcidcbiAgXTtcblxuICBuZy5tb2R1bGUoJ2NnLmFwaScpXG4gICAgLmZhY3RvcnkoJ0FQSVJlc291cmNlJywgQVBJUmVzb3VyY2VGYWN0b3J5KTtcbn0pKGFuZ3VsYXIpO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

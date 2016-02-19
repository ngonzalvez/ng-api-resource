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

          return instance.$save().$promise;
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

          return instance.$delete().$promise;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS5qcyIsIkFQSVJlc291cmNlTWFuYWdlci5qcyIsIkFQSVJlc291cmNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsQ0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLGVBREE7O0FBR0EsS0FBQSxNQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsWUFBQSxDQUFBLEVBSEE7Q0FBQSxDQUFBLENBSUEsT0FKQTs7QUNBQSxDQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsZUFEQTs7QUFHQSxXQUFBLHlCQUFBLENBQUEsRUFBQSxFQUFBLFNBQUEsRUFBQTtRQUNBO0FBR0EsZUFIQSxrQkFHQSxDQUFBLFFBQUEsRUFBQTs4QkFIQSxvQkFHQTs7YUFGQSxXQUFBLEtBRUE7O0FBQ0EsYUFBQSxRQUFBLEdBQUEsUUFBQSxDQURBO0FBRUEsYUFBQSxRQUFBLENBQUEsT0FBQSxHQUFBLEVBQUEsQ0FGQTtBQUdBLGFBQUEsUUFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLFFBQUEsRUFBQSxDQUhBO09BQUE7O21CQUhBOzttQ0FTQTtBQUNBLGlCQUFBLFVBQ0EsS0FBQSxRQUFBLENBQUEsR0FBQSxFQUNBLEVBRkEsRUFHQTtBQUNBLG1CQUFBO0FBQ0EsdUJBQUEsS0FBQTtBQUNBLHNCQUFBLEtBQUE7YUFGQTtXQUpBLENBQUEsQ0FEQTs7OzsrQkFhQSxNQUFBO0FBQ0EsY0FBQSxXQUFBLEtBQUEsUUFBQSxDQURBO0FBRUEsY0FBQSxXQUFBLElBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQSxDQUZBOztBQUlBLGlCQUFBLFNBQUEsS0FBQSxHQUFBLFFBQUEsQ0FKQTs7Ozs7Ozs7Ozs7OzRCQWFBLFFBQUE7QUFDQSxjQUFBLFdBQUEsS0FBQSxRQUFBLENBREE7QUFFQSxjQUFBLFFBQUEsS0FBQSxRQUFBLENBQUEsT0FBQSxDQUZBO0FBR0EsY0FBQSxXQUFBLEdBQUEsS0FBQSxFQUFBLENBSEE7QUFJQSxjQUFBLFFBQUEsS0FBQTs7O0FBSkEsZUFPQSxJQUFB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O0FBQ0EsZ0JBR0EsU0FBQSxHQUpBO0FBQ0EsZ0JBSUEsYUFBQSxLQUxBO0FBQ0EsZ0JBS0EsVUFBQSxJQUFBLGtCQUFBLENBQUEsV0FBQSxFQU5BOztBQWtHQSxXQUFBLFdBQUEsQ0FsR0E7R0FBQTs7QUFxR0EscUJBQUEsT0FBQSxHQUFBLENBQ0Esb0JBREEsQ0FBQSxDQXhHQTs7QUE0R0EsS0FBQSxNQUFBLENBQUEsUUFBQSxFQUNBLE9BREEsQ0FDQSxhQURBLEVBQ0Esa0JBREEsRUE1R0E7Q0FBQSxDQUFBLENBOEdBLE9BOUdBIiwiZmlsZSI6Im5nLWFwaS1yZXNvdXJjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbihuZykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgbmcubW9kdWxlKCdjZy5hcGknLCBbJ25nUmVzb3VyY2UnXSk7XG59KShhbmd1bGFyKTtcbiIsIihmdW5jdGlvbihuZykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgZnVuY3Rpb24gQVBJUmVzb3VyY2VNYW5hZ2VyRmFjdG9yeSgkcSwgJHJlc291cmNlKSB7XG4gICAgY2xhc3MgQVBJUmVzb3VyY2VNYW5hZ2VyIHtcbiAgICAgIHJlc291cmNlID0gbnVsbDtcblxuICAgICAgY29uc3RydWN0b3IocmVzb3VyY2UpIHtcbiAgICAgICAgdGhpcy5yZXNvdXJjZSA9IHJlc291cmNlO1xuICAgICAgICB0aGlzLnJlc291cmNlLm9iamVjdHMgPSBbXTtcbiAgICAgICAgdGhpcy5yZXNvdXJjZS5Nb2RlbCA9IHRoaXMuZ2V0TW9kZWwoKTtcbiAgICAgIH1cblxuICAgICAgZ2V0TW9kZWwoKSB7XG4gICAgICAgIHJldHVybiAkcmVzb3VyY2UoXG4gICAgICAgICAgdGhpcy5yZXNvdXJjZS5VUkwsXG4gICAgICAgICAge30sXG4gICAgICAgICAge1xuICAgICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgICAgaXNBcnJheTogZmFsc2UsXG4gICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNyZWF0ZShkYXRhKSB7XG4gICAgICAgIGNvbnN0IFJlc291cmNlID0gdGhpcy5yZXNvdXJjZTtcbiAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgUmVzb3VyY2UoZGF0YSk7XG5cbiAgICAgICAgcmV0dXJuIGluc3RhbmNlLiRzYXZlKCkuJHByb21pc2U7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0IHRoZSBpdGVtIG1hdGNoaW5nIHRoZSBnaXZlbiBwYXJhbXMuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtICAge09iamVjdH0gICAgICBwYXJhbXMgICAgRmlsdGVyaW5nIGRhdGEgb2JqZWN0LlxuICAgICAgICogQHJldHVybiAge0FQSVJlc291cmNlfSBUaGUgcmVxdWVzdGVkIHJlc291cmNlXG4gICAgICAgKi9cbiAgICAgIGdldChwYXJhbXMpIHtcbiAgICAgICAgY29uc3QgUmVzb3VyY2UgPSB0aGlzLnJlc291cmNlO1xuICAgICAgICBjb25zdCBpdGVtcyA9IHRoaXMucmVzb3VyY2Uub2JqZWN0cztcbiAgICAgICAgY29uc3QgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcblxuICAgICAgICAvLyBUcnkgdG8gZmluZCB0aGUgcmVxdWVzdGVkIGl0ZW0gaW4gdGhlIGFscmVhZHkgcmV0cmlldmVkIGl0ZW1zLlxuICAgICAgICBmb3IgKGxldCBpID0gMCwgbCA9IGl0ZW1zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcblxuICAgICAgICAgIC8vIENvbXBhcmUgdGhlIHByb3ZpZGVkIHBhcmFtIHZhbHVlcyBhZ2FpbnN0IHRoZSBpdGVtIHZhbHVlcy5cbiAgICAgICAgICBmb3IgKGtleSBpbiBwYXJhbXMpIHtcbiAgICAgICAgICAgIGlmIChpdGVtc1tpXVtrZXldICE9PSBwYXJhbXNba2V5XSkge1xuICAgICAgICAgICAgICBmb3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShpdGVtc1tpXSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgcmVxdWVzdGVkIGl0ZW0gaGFzbid0IGJlZW4gcmVxdWVzdGVkIHlldCwgZmV0Y2ggaXQgZnJvbSB0aGUgQVBJLlxuICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgUmVzb3VyY2UuTW9kZWwuZ2V0KFxuICAgICAgICAgICAgcGFyYW1zLFxuICAgICAgICAgICAgZGF0YSA9PiBkZWZlcnJlZC5yZXNvbHZlKG5ldyBSZXNvdXJjZShkYXRhKSksXG4gICAgICAgICAgICBlcnIgPT4gZGVmZXJyZWQucmVqZWN0KGVycilcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogQWRkIHRoZSBnaXZlbiBpdGVtIHRvIHRoZSBsaXN0IGlmIGl0IGRvZXMgbm90IGV4aXN0cyBhbHJlYWR5LlxuICAgICAgICovXG4gICAgICBhZGQoaXRlbSkge1xuICAgICAgICBjb25zdCBwayA9IHRoaXMucmVzb3VyY2UucHJpbWFyeUtleTtcbiAgICAgICAgY29uc3QgYWxyZWFkeUV4aXN0cyA9IHRoaXMucmVzb3VyY2Uub2JqZWN0cy5zb21lKGRhdGEgPT4gZGF0YVtwa10gPT09IGl0ZW1bcGtdKTtcblxuICAgICAgICBpZiAoIShpdGVtIGluc3RhbmNlb2YgdGhpcy5yZXNvdXJjZSkpIHtcbiAgICAgICAgICBpdGVtID0gbmV3IFJlc291cmNlKGl0ZW0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFhbHJlYWR5RXhpc3RzKSB7XG4gICAgICAgICAgdGhpcy5yZXNvdXJjZS5vYmplY3RzLnB1c2goaXRlbSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZ2V0QWxsKHBhcmFtcykge1xuICAgICAgICBjb25zdCBSZXNvdXJjZSA9IHRoaXMucmVzb3VyY2U7XG4gICAgICAgIGNvbnN0IGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICBsZXQgcmVzcG9uc2UgPSBSZXNvdXJjZS5Nb2RlbC5xdWVyeShcbiAgICAgICAgICBwYXJhbXMsXG4gICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1zID0gcmVzcG9uc2UuZGF0YS5tYXAoZGF0YSA9PiBuZXcgUmVzb3VyY2UoZGF0YSkpO1xuXG4gICAgICAgICAgICBpdGVtcy50b3RhbENvdW50ID0gcmVzcG9uc2UuY291bnQ7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGl0ZW1zKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGVyciA9PiBkZWZlcnJlZC5yZWplY3QoZXJyKVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gQVBJUmVzb3VyY2VNYW5hZ2VyO1xuICB9XG5cbiAgQVBJUmVzb3VyY2VNYW5hZ2VyRmFjdG9yeS4kaW5qZWN0ID0gW1xuICAgICckcScsXG4gICAgJyRyZXNvdXJjZSdcbiAgXTtcblxuICBuZy5tb2R1bGUoJ2NnLmFwaScpXG4gICAgLmZhY3RvcnkoJ0FQSVJlc291cmNlTWFuYWdlcicsIEFQSVJlc291cmNlTWFuYWdlckZhY3RvcnkpO1xufSkoYW5ndWxhcik7XG5cbiIsIihmdW5jdGlvbihuZykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgZnVuY3Rpb24gQVBJUmVzb3VyY2VGYWN0b3J5KEFQSVJlc291cmNlTWFuYWdlcikge1xuICAgIGNsYXNzIEFQSVJlc291cmNlIHtcbiAgICAgIHN0YXRpYyBVUkwgPSAnJztcbiAgICAgIHN0YXRpYyBNb2RlbCA9IG51bGw7XG4gICAgICBzdGF0aWMgc2NoZW1hID0ge307XG4gICAgICBzdGF0aWMgcHJpbWFyeUtleSA9ICdpZCc7XG4gICAgICBzdGF0aWMgbWFuYWdlciA9IG5ldyBBUElSZXNvdXJjZU1hbmFnZXIoQVBJUmVzb3VyY2UpO1xuXG4gICAgICAvKipcbiAgICAgICAqIEluaXRpYWxpemUgdGhlIGluc3RhbmNlIHdpdGggdGhlIHByb3ZpZGVkIGluaXRpYWwgZGF0YS5cbiAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICovXG4gICAgICBjb25zdHJ1Y3RvcihkYXRhKSB7XG4gICAgICAgIGNvbnN0IFJlc291cmNlID0gdGhpcy5jb25zdHJ1Y3RvcjtcblxuICAgICAgICB0aGlzLl9jb3B5U2NoZW1hRGF0YShkYXRhLCB0aGlzKTtcbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogSW5pdGlhbGl6ZWQgbWV0aG9kLlxuICAgICAgICovXG4gICAgICBpbml0KCkge1xuICAgICAgICAvLyBUbyBiZSBpbXBsZW1lbnQgaW4gdGhlIHN1YmNsYXNzLlxuICAgICAgfTtcblxuICAgICAgLyoqXG4gICAgICAgKiBDb3B5IHRoZSBwcm9wZXJ0aWVzIGRlZmluZWQgaW4gdGhlIHNjaGVtYSBmcm9tIHRoZSBzb3VyY2Ugb2JqZWN0IHRvIHRoZVxuICAgICAgICogZGVzdGluYXRpb24gb2JqZWN0LlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSAgIHtPYmplY3R9ICBzb3VyY2UgIFRoZSBvYmplY3QgY29udGFpbmluZyB0aGUgcHJvcGVydHkgdmFsdWVzLlxuICAgICAgICogQHBhcmFtICAge09iamVjdH0gIGRlc3QgICAgVGhlIG9iamVjdCB0byB3aGljaCB0aGUgcHJvcGVydGllcyB3aWxsIGJlXG4gICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3BpZWQuXG4gICAgICAgKiBAcmV0dXJuICB7T2JqZWN0fSAgVGhlIHVwZGF0ZWQgZGVzdGluYXRpb24gb2JqZWN0LlxuICAgICAgICovXG4gICAgICBfY29weVNjaGVtYURhdGEoc291cmNlLCBkZXN0KSB7XG4gICAgICAgIGNvbnN0IFJlc291cmNlID0gdGhpcy5jb25zdHJ1Y3RvcjtcbiAgICAgICAgbGV0IFR5cGVDbGFzcztcbiAgICAgICAgbGV0IHZhbHVlO1xuXG4gICAgICAgIC8vIE1ha2Ugc3VyZSB0aGF0IGJvdGgsIHRoZSBzb3VyY2UgYW5kIHRoZSBkZXN0aW5hdGlvbiwgYXJlIG9iamVjdHMuXG4gICAgICAgIGlmICh0eXBlb2Ygc291cmNlICE9PSAnb2JqZWN0JyB8fCB0eXBlb2YgZGVzdCAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgJ0JvdGgsIGRhdGEgc291cmNlIGFuZCBkZXN0aW5hdGlvbiwgbXVzdCBiZSBvYmplY3RzJ1xuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBwcm9wZXJ0eSBpbiBSZXNvdXJjZS5zY2hlbWEpIHtcbiAgICAgICAgICB2YWx1ZSA9IHNvdXJjZVtwcm9wZXJ0eV07XG4gICAgICAgICAgVHlwZUNsYXNzID0gUmVzb3VyY2Uuc2NoZW1hW3Byb3BlcnR5XTtcblxuICAgICAgICAgIC8vIENhc3QgdGhlIHZhbHVlIHRvIHRoZSB0eXBlIGRlZmluZWQgaW4gdGhlIHNjaGVtYS5cbiAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyB8fCBUeXBlQ2xhc3MgPT09IERhdGUpXG4gICAgICAgICAgICAmJiAhKHZhbHVlIGluc3RhbmNlb2YgVHlwZUNsYXNzKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdmFsdWUgPSBuZXcgVHlwZUNsYXNzKHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHZhbHVlID0gVHlwZUNsYXNzKHZhbHVlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBkZXN0W3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogVXBkYXRlIHRoaXMgaW5zdGFuY2UgZGF0YSBpbiB0aGUgQVBJLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9ICBUaGUgc2F2aW5nIHByb21pc2UuXG4gICAgICAgKi9cbiAgICAgIHNhdmUoKSB7XG4gICAgICAgIGNvbnN0IFJlc291cmNlTW9kZWwgPSB0aGlzLmNvbnN0cnVjdG9yLk1vZGVsO1xuICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5fY29weVNjaGVtYURhdGEodGhpcywge30pO1xuICAgICAgICBjb25zdCBpbnN0YW5jZSA9IG5ldyBSZXNvdXJjZU1vZGVsKGRhdGEpO1xuXG4gICAgICAgIHJldHVybiBpbnN0YW5jZS4kc2F2ZSgpLiRwcm9taXNlO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIFNlbmQgYSBkZWxldGUgcmVxdWVzdCB0byB0aGUgQVBJLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9ICBUaGUgZGVsZXRpb24gcHJvbWlzZS5cbiAgICAgICAqL1xuICAgICAgZGVsZXRlKCkge1xuICAgICAgICBjb25zdCBSZXNvdXJjZU1vZGVsID0gdGhpcy5Nb2RlbDtcbiAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgUmVzb3VyY2VNb2RlbCgpO1xuICAgICAgICBjb25zdCBwayA9IHRoaXMuY29uc3RydWN0b3IucHJpbWFyeUtleTtcblxuICAgICAgICBpbnN0YW5jZVtwa10gPSB0aGlzW3BrXTtcblxuICAgICAgICByZXR1cm4gaW5zdGFuY2UuJGRlbGV0ZSgpLiRwcm9taXNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBBUElSZXNvdXJjZTtcbiAgfVxuXG4gIEFQSVJlc291cmNlRmFjdG9yeS4kaW5qZWN0ID0gW1xuICAgICdBUElSZXNvdXJjZU1hbmFnZXInXG4gIF07XG5cbiAgbmcubW9kdWxlKCdjZy5hcGknKVxuICAgIC5mYWN0b3J5KCdBUElSZXNvdXJjZScsIEFQSVJlc291cmNlRmFjdG9yeSk7XG59KShhbmd1bGFyKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

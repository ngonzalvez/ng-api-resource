(function(ng) {
  'use strict';

  function APIResourceFactory(APIResourceManager) {
    class APIResource {
      static URL = '';
      static URLParams = {};
      static Model = null;
      static methods = {};
      static schema = {};
      static primaryKey = 'id';
      static manager = new APIResourceManager(APIResource);

      /**
       * Initialize the instance with the provided initial data.
       * @constructor
       */
      constructor(data) {
        const Resource = this.constructor;

        this._copySchemaData(data, this);
        this.init();
      }

      /**
       * Initialized method.
       */
      init() {
        // To be implement in the subclass.
      };

      /**
       * Copy the properties defined in the schema from the source object to the
       * destination object.
       *
       * @param   {Object}  source  The object containing the property values.
       * @param   {Object}  dest    The object to which the properties will be
       *                            copied.
       * @return  {Object}  The updated destination object.
       */
      _copySchemaData(source, dest) {
        const Resource = this.constructor;
        let TypeClass;
        let value;

        // Make sure that both, the source and the destination, are objects.
        if (typeof source !== 'object' || typeof dest !== 'object') {
          throw new TypeError(
            'Both, data source and destination, must be objects'
          );
        }

        for (let property in Resource.schema) {
          value = source[property];
          TypeClass = Resource.schema[property];

          // Cast the value to the type defined in the schema.
          if (value === null || value === undefined) {
            value = null;
          } else if (
            (typeof value === 'object' || TypeClass === Date)
            && !(value instanceof TypeClass)
          ) {
            value = new TypeClass(value);
          } else if (typeof value !== 'object') {
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
      save(data) {
        const ResourceModel = this.constructor.Model;
        const resourceData = data || this._copySchemaData(this, {});
        const instance = new ResourceModel(resourceData);

        return instance.$save();
      }

      /**
       * Send a delete request to the API.
       *
       * @return {Promise}  The deletion promise.
       */
      delete() {
        const ResourceModel = this.Model;
        const instance = new ResourceModel();
        const pk = this.constructor.primaryKey;

        instance[pk] = this[pk];

        return instance.$delete();
      }
    }

    return APIResource;
  }

  APIResourceFactory.$inject = [
    'APIResourceManager'
  ];

  ng.module('cg.api')
    .factory('APIResource', APIResourceFactory);
})(angular);

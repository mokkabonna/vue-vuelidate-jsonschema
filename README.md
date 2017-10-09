# vue-vuelidate-jsonschema [![Build Status](https://travis-ci.org/mokkabonna/vue-vuelidate-jsonschema.svg?branch=master)](https://travis-ci.org/mokkabonna/vue-vuelidate-jsonschema) [![Coverage Status](https://coveralls.io/repos/github/mokkabonna/vue-vuelidate-jsonschema/badge.svg?branch=master)](https://coveralls.io/github/mokkabonna/vue-vuelidate-jsonschema?branch=master)

> Create vuelidate validation rules based on json schema

Use the json schemas you already have for validating your api input to generate validation rules for vuelidate. And use default values to generate the data attributes.

The goal is that if your vuelidate validation is valid then you will also pass validation against the json schema. So you can with confidence serialize your model to json and the server will accept it if it validates against the same schema.

```bash
npm install vue-vuelidate-jsonschema --save
```

## Install plugin globally

NOTE: if using this plugin as a global mixin, make sure to use it **before** you register Vuelidate.

If no schema property is present neither this plugin nor vuelidate will be instantiated. Unless you have a validations object/function on your vm.

```js
import Vue from 'vue'
import VueVuelidateJsonschema from 'vue-vuelidate-jsonschema'
import Vuelidate from 'vuelidate'

Vue.use(VueVuelidateJsonschema)
Vue.use(Vuelidate)
```

## Local mixin

You can use the local mixin like this:

```js
import VueVuelidateJsonschema from 'vue-vuelidate-jsonschema'

export default {
  mixins: [VueVuelidateJsonschema.mixin]
}
```

## Example
```js
export default {
  schema: {
    type: 'object'
    properties: {
      name: {
        type: 'string',
        pattern: '^\\w+\s\\w+$',
        default: 'Jack'
      },
      username: {
        type: 'string',
        minLength: 5
      },
      age: {
        type: 'integer',
        default: 20,
        minimum: 18,
        maximum: 30
      }
    }
  }
}
```

Is functionally equal to:

```js
import {minLength, required} from 'vuelidate/lib/validators'
import {pattern} from 'vue-vuelidate-jsonschema'

export default {
  data() {
    return {
      name: 'Jack',
      username: '',
      age: 20
    }
  },
  validations: {
    name: {
      pattern: pattern('^\\w+\s\\w+$')
    },
    username: {
      required,
      minLength: minLength(5)
    },
    age: {
      between: between(18, 30)
    }
  }
}
```


## Supported json schema validation rules

- type => schemaType, if array of types then schemaTypes
- required => schemaRequired
- minLength => schemaMinLength
- maxLength => schemaMaxLength
- minItems => schemaMinItems
- maxItems => schemaMaxItems
- minimum => schemaMinimum
- maximum => schemaMaximum
- pattern => schemaPattern
- enum => schemaOneOf
- const => schemaEqual
- items => schemaItems, if items is a schema of type object, the $each property is also used
- uniqueItems => schemaUnique

The plan is to support all rules. PR's are welcome. When matching validation rules are present in vuelidate, those are used. For other validations this library have quite a few of its own.

### Property schema exposure

The schema for the property and any params are passed to all the validators and available like this:


```js
// $v.name.$params.schemaMinLength
{
  type: 'schemaMinLength',
  min: 3,
  schema: {
    type: 'string',
    minLength: 3,
    maxLength: 30,
    title: 'Name',
    description: 'The name of the student.'
    default: 'John'
    ...
  }
}
```

### items and $each validation

All versions of the items property is supported.

#### Single schema and non object

```js
{
  type: 'array',
  items: {
    type: 'number',
    minimum: 3
  }
}
```

If the numbers in the array are not minimum 3 or any non numbers are in the array then the array is invalid.

#### multiple schemas

```js
{
  type: 'array',
  items: [{
    type: 'number',
    minimum: 3
  }, {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 3
      }
    },
    required: ['name']
  }]
}
```

If the items in the array are not either a number with minimum value of 3 or an object with name and minLength of 3 then the array is invalid.

We can't expose any errors on the object itself if present, due to vuelidates limitation with the use of the $each keyword that requires all objects to be the same. Se next section.

#### single schema and type object

```js
{
  type: 'array',
  items: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 3
      }
    },
    required: ['name']
  }
}
```

Now we can utilize vuelidates **$each** property so that you can get proper error messages for properties on the objects in the array.


### Required property in json schema context

The required property on in json schema only means that the property should be present. Meaning any value that matches the type or types. So adding the property to the required array does not apply the required validator in vuelidate. It adds a custom validator that only checks if the value is not undefined. A type validator is added that kicks in if the value is not undefined.

### uniqueItems

Using uniqueItems in a json schema context means that the values are equal in terms of similarity. So an array with two similar objects violates the uniqueItems rule even though they are unique in terms of javascript object identity.

## Between validator

If both the minimum and maximum properties are present a between validator is used.

## Override or extend validation

You can override, extend or delete the validation rules on your vue vm like this:

```js
export default {
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 5,
        maxLength: 30
      }
    }
  },
  validations: {
    name: {
      minLength: minLength(2), //overrides minLength 5
      email, // adds email validator
      maxLength: undefined // removes maxlength validator
    }
  }
}
```

Keep in mind that for instance json schema minLength validator adds both minLength and required validator. So you need to remove both if that is what you want.

This merging of validation options works by adding a custom merge strategy for vue options that merges them correctly.

This works also if your validations property is a function.

## Multiple schemas

You can define multiple schemas that all adds their validation rules. Simply define **schema** as an array.

```js
export default {
  schema: [{
    type: 'object',
    properties: {
      prop1: {
        type: 'string'
      },
      conflict: {
        type: 'string',
        minLength: 3,
        maxLength: 5
      }
    }
  }, {
    type: 'object',
    properties: {
      prop2: {
        type: 'string'
      },
      conflict: {
        type: 'string',
        maxLength: 10
      }
    }
  }]
}
```

This will add data/validation for prop1, prop2 and conflict. The later definition of **conflict** will be merged into the other definition.

In the above example, the conflict property will still have the minLength validator. But also a maxLength validator of 10.


## Custom mount point

By default the schemas are added to the root data/validation structure. To attach them deeper down in the structure you can define a mount point:

```js
export default {
  schema: [{
    mountPoint: 'deep.nested.structure',
    schema: {
      type: 'object',
      properties: {
        prop1: {
          type: 'string'
        }
      }
    }
  }, {
    mountPoint: 'other.deep.stucture',
    schema: {
      type: 'object',
      properties: {
        prop2: {
          type: 'string'
        }
      }
    }
  }]
}
```

This exposes prop1 at **vm.deep.nested.structure.prop1** and prop2 at **vm.other.deep.stucture.prop2**


## Loading async schemas

Promises and functions are supported, just define your schema like this:

```js
export default {
  schema: [
    function loadSchemaOnCreate() {
      // function must return a promise
      return fetchSchema('http://example.com/schema-3.json')
    },
    //load schemas on module require
    fetchSchema('http://example.com/schema-1.json'), // will get root mount point
    fetchSchema('http://example.com/schema-2.json').then(function(schema) {
      //return a schema config object
      return {
        mountPoint: 'form2', //mounts to form2 property
        schema: schema
      }
    })
  ]
}
```

Where fetchSchema returns a promise that resolves to a schema or a schema config object.


### Loading related schemas

If one of your schemas contain a $ref property you can then resolve those manually in the promise or use [json-schema-ref-parser](https://github.com/BigstickCarpet/json-schema-ref-parser) to dereference your schema for you.


## vuelidate error extractor

I recommend to use [vuelidate-error-extractor](https://github.com/dobromir-hristov/vuelidate-error-extractor) to display error messages. This takes the pain out of the manual labor of writing validation messages for each property and rule.

## Roadmap

- [ ] support all json schema validation properties
- [x] support loading of remote schemas
- [x] support $ref inside schemas (will not support, but added docs for resolving refs with third party module)
- [ ] export own validators
- [ ] more tests for really complex schemas
- [x] document and test mounting procedure (multiple schemas in one vm)
- [ ] possibly support and test circular $refs
- [ ] better validation params for array items validation (when not object)
- [ ] document exactly what validators are used for any json schema validation property
- [x] pass title, description etc to the validator as params (possibly whole property schema)


PRs are welcome.


## Contributing

Create tests for new functionality and follow the eslint rules.

## License

MIT © [Martin Hansen](http://martinhansen.com)

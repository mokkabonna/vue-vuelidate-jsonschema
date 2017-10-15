# vue-vuelidate-jsonschema [![Build Status](https://travis-ci.org/mokkabonna/vue-vuelidate-jsonschema.svg?branch=master)](https://travis-ci.org/mokkabonna/vue-vuelidate-jsonschema) [![Coverage Status](https://coveralls.io/repos/github/mokkabonna/vue-vuelidate-jsonschema/badge.svg?branch=master)](https://coveralls.io/github/mokkabonna/vue-vuelidate-jsonschema?branch=master)

> Create vuelidate validation rules based on json schema

Use the json schemas you already have for validating your api input to generate validation rules for vuelidate. And use default values to generate the data attributes. And title, description for your user interface.

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
    type: 'object',
    properties: {
      name: {
        type: 'string',
        pattern: '^\\w+\\s\\w+$'
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
    },
    required: ['username']
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
      schema: {
        name: undefined,
        username: '',
        age: 20
      }
    }
  },
  validations: {
    schema: {
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
}
```

## Default data values

If the property have a default value, that is **always** used. If it does not and the property is not required the value is set to `undefined`. If the property is required then the value is set to string: `''`, boolean: `false`, object: `{}`, array: `[]`, null: `null`, and for both number and integer: `0`

### If allOf, oneOf, anyOf or not present

If you have the following schema
```js
{
  type: 'object',
  properties: {
    prop1: {
      type: 'string',
      default: 'priority'
    }
  },
  allOf: [{
    type: 'object',
    properties: {
      prop1: {
        type: 'string',
        default: 'does not override default value in main schema'
      }
    }
  }, {
    type: 'object',
    properties: {
      added: {
        type: 'string',
        default: 'added'
      },
      nodefault: {
        type: 'string'
      }
    }
  }]
}
```

We can with confidence also create data properties for **added** and **nodefault**. allOf acts in a way as a extension of the base schema.

However for the **not, oneOf, anyOf** validators we don't consider the default values, we always scaffold with undefined as the value. We don't want any default values in one of these schemas to be filled in. They are also only scaffolded one level deep. If we didn't do this you would have to use `Vue.set` when adding new properties. Now we create them up front.

## Supported json schema validation rules

All validators are supported. Validators are attached with the prefix schema. So required => schemaRequired

Some notes:
- allOf this does not add a validator, but it generates validators for all the provided schemas in allOf and merges them using the **and** validator. The individual validators are still added as schemaMinLength etc. But if more schemaMinLength for a property they are combined.
- items, if items is a single schema, the $each property is used, if not then a custom schemaItems validator is used
- type => schemaType, if array of types then schemaTypes

The library is well tested. Test cases from draft v6 are used: https://github.com/json-schema-org/JSON-Schema-Test-Suite/tree/master/tests/draft6

### Validation of the json schema itself

This library does little to no validation of the schema itself. So if you have a property of type integer and define a minLength property (an unsupported validator for integer), that validator is actually added. There are loads of tools that do validation for you and this should be ideally be done at creation time of the schema rather than at runtime, adding overhead.

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

This can be used to generate validation messages.

### patternProperties and additionalProperties

You can't have patternProperties on a schema mounted to root. And additionalProperties must be `undefined` or `true`. This is because you will likely run into problems since the vue instance have many extra properties. In these cases, use a mount point.

### Items and $each validation

All versions of the items property is supported.

#### Single schema

```js
{
  type: 'array',
  items: {
    type: 'number',
    minimum: 3
  }
}
```

We use vuelidate $each option. This works when items is any type.

#### Multiple schemas

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

If the first item in the array are not a number with minimum value of 3 and item 2 is not an object with name and minLength of 3 then the array is invalid.

We can't expose any errors on the object itself if present, due to vuelidates limitation with the use of the $each keyword that requires all objects to be the same.

### Required property in json schema context

The required property in json schema only means that the property should be present. Meaning any value that matches the type or types. So adding the property to the required array does not apply the required validator in vuelidate. It adds a custom validator that only checks if the value is not undefined. A type validator is added that kicks in if the value is not undefined.

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
    schema: {
      name: {
        schemaMinLength: minLength(2), //overrides minLength 5
        email, // adds email validator
        schemaMaxLength: undefined // removes maxlength validator
      }
    }
  }
}
```

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

By default the schemas are added to the **schema** property/validation structure. To attach them deeper down in the structure you can define a mount point:

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
    mountPoint: 'other.deep.structure',
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

This exposes prop1 at **vm.deep.nested.structure.prop1** and prop2 at **vm.other.deep.structure.prop2**

You **can** mount a schema to root by defining `mountPoint: '.'`. This is however not supported with async schemas, since we can't add reactive properties to the vue instance after init. Also sibling validators like additionalProperties or patternProperties makes little sense when added to the root as the root is full of additional vue properties.


## Loading async schemas

Promises and functions are supported, just define your schema like this:

```js
export default {
  schema: [
    function loadSchemaOnCreate() {
      // functions must return a promise or a schema synchronously
      return fetchSchema('http://example.com/schema-3.json')
    },
    // load schemas on module require, default mount point
    fetchSchema('http://example.com/schema-1.json'),
    {
      //this will throw on init, since we have async and root mount point
      mountPoint: '.',
      schema: fetchSchema('http://example.com/schema-2.json')
    }
  ]
}
```

Functions are called on the beforeCreate hook. If the schema config has any promises or any function return a promise, then the property **$schema** on the vm is a promise that will be resolved when all schemas have loaded. Then **$schema** will be replaced by the actual array of schemas.

You need to use a `v-if` in your view to prevent the view from failing if you try to access data or validation properties that aren't created synchronously:

```html
<form v-if="$schema && !$schema.then">
  <input v-model.trim="name" @input="$v.name.$touch()">
</form>
```

### Loading related schemas

If one of your schemas contain a $ref property you can then resolve those manually in the promise or use [json-schema-ref-parser](https://github.com/BigstickCarpet/json-schema-ref-parser) to dereference your schema for you.

## Extract data

The mixin adds a method getSchemaData that you can call to get all the data that a schema originally helped scaffold.

```js
vm.getSchemaData(vm.$schema[0])
```

This will include any property that is undefined, but you will get rid of them when you do `JSON.stringify()`. For schema at a mountpoint, you will get only the structure from that mountpoint. But if you have mounted several schemas on the same mountpoint or below you will get those included. If you call `getSchemaData` with an array of schemas you will always get a fully structured export from the root of your vm. Since you might have different schemas on different mountpoints.

## vuelidate error extractor

I recommend to use [vuelidate-error-extractor](https://github.com/dobromir-hristov/vuelidate-error-extractor) to display error messages. This takes the pain out of the manual labor of writing validation messages for each property and rule.


```js
Vue.use(VuelidateErrorExtractor, {
  messages: {
    schemaRequired: 'The {attribute} field cannot be undefined.',
    schemaMinLength: '{schema.title} must have minimum {min} characters.'
    ...
  }
})
```

## Roadmap

- [x] support all json schema validation properties
- [x] support loading of remote schemas
- [x] support $ref inside schemas (will not support, but added docs for resolving refs with third party module)
- [ ] export own validators
- [x] more tests for really complex schemas
- [x] scaffold data, populate, serialize and test output against mainstream json schema validator (ajv)
- [x] document and test mounting procedure (multiple schemas in one vm)
- [x] possibly support and test circular $refs
- [x] better validation params for array items validation (when not object)
- [x] pass title, description etc to the validator as params (possibly whole property schema)


PRs are welcome.


## Contributing

Create tests for new functionality and follow the eslint rules.

## License

MIT © [Martin Hansen](http://martinhansen.com)

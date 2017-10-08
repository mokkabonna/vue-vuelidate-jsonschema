# vue-vuelidate-jsonschema [![Build Status](https://travis-ci.org/mokkabonna/vue-vuelidate-jsonschema.svg?branch=master)](https://travis-ci.org/mokkabonna/vue-vuelidate-jsonschema) [![Coverage Status](https://coveralls.io/repos/github/mokkabonna/vue-vuelidate-jsonschema/badge.svg?branch=master)](https://coveralls.io/github/mokkabonna/vue-vuelidate-jsonschema?branch=master)

> Create vuelidate validation rules based on json schema

Use the json schemas you already have for validating your api input to generate validation rules for vuelidate. And use default values to generate the data attributes.

The goal is that if your vuelidate validation is valid then you will also pass validation against the json schema. So you can with confidence serialize your model to json and the server will accept it if it validates agains the same schema.

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

Is equal to:

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

- type
- required
- minLength
- maxLength
- minItems
- maxItems
- minimum
- maximum
- pattern
- enum
- const
- items
- uniqueItems

The plan is to support all rules. PR's are welcome.

### items and $each validation

All versions of the items property is supported.

#### single schema and non object

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

Now we can utilize vuelidates $each property so that you can get proper error messages for properties on the objects in the array.


### Required property in json schema context

The required property on in json schema only means that the property should be present. Meaning any value that matches the type or types. So adding the property to the required array does not apply the required validator in vuelidate. It only adds a requiredIf that is checks that the value is not undefined. A type validator is added that kicks in if the value is not undefined.

However when using various other validators the required validator is added. Like for instance with the minLength validator. Adding minLength(1) does not actually validate empty strings as falsy, this is because that would overlap with the required validator. So we add them both.

### uniqueItems

Using uniqueItems in a json schema context means that the values are equal in terms of similarity. So an array with two similar objects violates the uniqueItems rule even though they are unique in terms of javascript object identity.

## Between validator

If both the minimum and maximum properties are present the between validator in vuelidate is used.

## Override or extend validation

You can override or extend the validation rules on your vue vm like this:

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



## Contributing

Create tests for new functionality and follow the eslint rules.

## License

MIT © [Martin Hansen](http://martinhansen.com)

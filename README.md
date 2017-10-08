# vue-vuelidate-jsonschema [![Build Status](https://travis-ci.org/mokkabonna/vue-vuelidate-jsonschema.svg?branch=master)](https://travis-ci.org/mokkabonna/vue-vuelidate-jsonschema) [![Coverage Status](https://coveralls.io/repos/github/mokkabonna/vue-vuelidate-jsonschema/badge.svg?branch=master)](https://coveralls.io/github/mokkabonna/vue-vuelidate-jsonschema?branch=master)

> Create validation rules based on json schema

Use the json schemas you already have for validation your api input to generate validation rules for vuelidate. And use default value to generate the data attributes.

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
import {pattern, mimimum, maximum} from 'vue-vuelidate-jsonschema'

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
- minimum
- maximum
- pattern
- enum
- const

The plan is to support all rules. PR's are welcome.

### Required property in json schema context

The required property on in json schema only means that the property should be present. Meaning any value that matches the type or types. So adding the property to the required array does not apply the required validator in vuelidate. It only adds a requiredIf that is checks that the value is not undefined. A type validator is added that kicks in if the value is not undefined.

However when using various other validators the required validator is added. Like for instance with the minLength validator. Adding minLength(1) does not actually validate empty strings as falsy, this is because that would overlap with the required validator. So we add them both.

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

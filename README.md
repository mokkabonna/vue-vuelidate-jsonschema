# vue-vuelidate-jsonschema

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
      minimum: minimum(18),
      maximum: maximum(30),
    }
  }
}
```

## Supported json schema validation rules

- required
- minLength
- maxLength
- minimum
- maximum
- pattern
- enum
- const

The plan is to support all rules. PR's are welcome.

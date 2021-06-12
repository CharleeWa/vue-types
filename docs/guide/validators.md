---
title: Validators
---

# Using VueTypes Validators

VueTypes is a collection of prop validators. Each validator is basically a factory function returning an object (_validator object_) compatible with [Vue prop validation](https://vuejs.org/v2/guide/components-props.html#Prop-Validation).

Differently from simple Vue prop validation objects, VueTypes prop validator objects provide some additional chainable properties and methods to control things like `required` and default values.

Validators can be imported as named functions from `vue-types`:

```js
import Vue from 'vue'
import { number, oneOf } from 'vue-types'

export default {
  props: {
    id: number().isRequired,
    status: oneOf(['open', 'close']).def('open'),
  },
}
```

Validators can be categorized in two groups:

- Native Validators
- Custom Validators

## Native Validators

Native validators come with:

- a `def(any)` method to assign a default value for the current prop. The passed-in value will be validated against the type configuration in order to prevent invalid values.
- a `isRequired` flag to set the `required: true` property.
- a `validate(function)` method to set a custom validator function (not available in `integer` and `symbol`).

```js
import { number } from 'vue-types'

const numProp = number()
// numProp === { type: Number, default : 0}

const numPropCustom = number().def(10)
// numPropCustom ===  { type: Number, default : 10}

const numPropRequired = number().isRequired
// numPropRequired ===  { type: Number, required : true}

const numPropRequiredCustom = number().def(10).isRequired
// numPropRequiredCustom ===  { type: Number, default: 10, required : true}

const gtTen = (num) => num > 10
const numPropGreaterThanTen = number().validate(gtTen)
// numPropGreaterThanTen ===  { type: Number, validator: (num) => num > 10 }
```

::: tip
You can unset any previously defined default value by passing `undefined` to `.def()`

```js
const type = string().def('hello')
// { type: String, default: 'hello' }

type.def(undefined)
// { type: String }
```

:::

### `any`

Validates any type of value.

### `array`

Validates that a prop is an array primitive.

::: tip
[Vue prop validation](https://vuejs.org/v2/guide/components-props.html#Prop-Validation) requires Array props to provide default value as a factory function. `array().def()` accepts both factory functions and arrays. In the latter case, VueTypes will convert the value to a factory function for you.
:::

::: ts
You can specify the type of array items as type argument:

```ts
// array of strings and numbers
array<string | number>()
```

**Note**: this signature will validate the prop at compile-time only. For
runtime validation use [`arrayOf`](#arrayof)

:::

### `bool`

Validates boolean props.

### `func`

Validates that a prop is a function.

::: ts
You can constrain the function signature passing it as type argument:

```ts
// expects an event handler
type onClick = (event: Event) => void

func<onClick>()
```

:::

### `number`

Validates that a prop is a number.

### `integer`

Validates that a prop is an integer.

### `object`

Validates that a prop is an object.

::: tip
[Vue prop validation](https://vuejs.org/v2/guide/components-props.html#Prop-Validation) requires Object props to provide default value as a factory function. `object().def()` accepts both factory functions and plain objects. In the latter case, VueTypes will convert the value to a factory function for you.
:::

::: ts
You can specify the shape of the object as type argument:

```ts
interface User {
  ID: number
  username: string
}

// restrict the object to the properties of User
object<User>()
```

**Note**: this signature will validate the prop at compile-time only. For
runtime validation use [`shape`](#shape)

:::

### `string`

Validates that a prop is a string.

### `symbol`

Validates that a prop is a Symbol.

## Custom Validators

Custom validators are a special kind of function useful to describe complex validation requirements. By design each custom validator:

- **doesn't have** a `validate` method
- has a `.def()` method to assign a default value on the current prop
- has an `isRequired` flag to set the `required: true` property

```js
const oneOfPropDefault = oneOf([0, 1]).def(1)
// oneOfPropDefault.default === 1

const oneOfPropRequired = oneOf([0, 1]).isRequired
// oneOfPropRequired.required ===  true

const oneOfPropRequiredCustom = oneOf([0, 1]).def(1).isRequired
// oneOfPropRequiredCustom.default ===  1
// oneOfPropRequiredCustom.required === true
```

### `instanceOf`

```js
class User {
  // ...
}

export default {
  props: {
    user: instanceOf(User),
  },
}
```

Validates that a prop is an instance of a JavaScript constructor. This validator uses JavaScript's `instanceof` operator.

### `oneOf`

Validates that a prop is one of the provided values.

```js
export default {
  props: {
    genre: oneOf(['action', 'thriller']),
  },
}
```

::: ts
To constrain the allowed values at compile-time use [const assertions](https://devblogs.microsoft.com/typescript/announcing-typescript-3-4/#const-assertions) on the passed-in array:

```ts
oneOf(['action', 'thriller'] as const)
```

:::

### `oneOfType`

Validates that a prop is an object that could be one of many types. Accepts JavaScript constructors, Vue.js props validation objects and VueTypes validators objects.

```js
export default {
  props: {
    // Either a string, an integer or an instance of the User class
    theProp: oneOfType([String, integer(), instanceOf(User)]),
  },
}
```

### `arrayOf`

Validates that a prop is an array of a certain type. Accepts JavaScript constructors, Vue.js props validation objects and VueTypes validators objects.

```js
export default {
  props: {
    //accepts: ['my', 'string']
    //rejects: ['my', 1]
    theProp: arrayOf(String),

    // accepts an array of objects
    thePropObjects: arrayOf(object()),
  },
}
```

::: tip
Prop Validators are composable. For example, to validate an array that can contain both strings and numbers you can use `arrayOf` and `oneOfType`:

```js
const stringOrNumber = arrayOf(oneOfType([String, Number]))
```

:::

### `objectOf`

Validates that a prop is an object with values of a certain type. Accepts JavaScript constructors, Vue.js props validation objects and VueTypes validators objects.

```js
export default {
  props: {
    //accepts: {name: 'John', surname: 'Doe'}
    //rejects: {name: 'John', age: 30}
    userData: objectOf(String),
  },
}
```

### `shape`

Validates that a prop is an object taking on a particular shape. Accepts JavaScript constructors, Vue.js props validation objects and VueTypes validators objects.

Note that:

- You can set the properties of the shape as `required` but you **cannot** use `.def()`.
- You can use `.def()` to set a default value for the shape itself.
- Like `array` and `object`, you can pass to `.def()` either a factory function returning an object or a plain object.

```js
export default {
  props: {
    // default value = {name: 'John'}
    //accepts: {name: 'John', age: 30, id: 1}
    //rejects: {name: 'John', age: 30} -> missing required `id` key
    //rejects: {name: 'John', age: 'wrong data', id: 1} -> age is not a number
    userData: shape({
      name: String,
      age: integer(),
      id: integer().isRequired,
    }).def(() => ({ name: 'John' })),
  },
}
```

::: ts
You can constrain the shape with a type argument:

```ts
interface User {
  name: string
  age: number
  id: number
}

export default {
  props: {
    userData: shape<User>({
      name: String,
      age: integer(),
      id: integer().isRequired,
    }).def(() => ({ name: 'John' })),
  },
}
```

:::

#### Loose shape matching

By default `.shape` won't validate objects with properties not defined in the shape. To allow partial matching use the `loose` flag:

```js
export default {
  props: {
    //accepts: {name: 'John', id: 1}
    //accepts: {name: 'John', id: 1, age: 30} --> loose matching
    userData: shape({
      name: String,
      id: integer().isRequired,
    }).loose,
  },
}
```

### `custom`

Validates prop values against a custom validation function.

```js
function minLength(value) {
  return typeof value === 'string' && value.length >= 6
}

export default {
  props: {
    theProp: custom(minLength),
  },
}

//accepts: 'string'
//rejects: 'my', 1
```

Note that the passed-in function name will be used as the custom validator name in warnings.

You can pass a validation error message as second argument as well:

```js
function minLength(value) {
  return typeof value === 'string' && value.length >= 6
}

export default {
  props: {
    theProp: custom(minLength, 'theProp is not a string or is too short'),
  },
}
```

## Utilities

VueTypes exposes some useful utility functions that can be used to extend the library functionalities.

### `validateType`

Checks a value against a type definition.

Accepts the following arguments:

- `validator`: A JavaScript constructor or VueTypes validator object
- `value`: The value to check
- `[silent=false]`: Toggle error console logging

If `silent === false` the function will return a boolean. If `silent === true` it will return `true` if the check succeed else it will return an error message.

```js
import { validateType, arrayOf } from 'vue-types'

// VueTypes validator  object
const isArrayOfStrings = arrayOf(String)

validateType(isArrayOfStrings, ['hello', 'world']) // true
validateType(isArrayOfStrings, ['hello', 1]) // false

// Native string constructor
validateType(Number, 10) // true

// returns an error message on failure
validateType(String, 10, false) // 'value "10" should be of type "string"`
```

### `toType` and `toValidableType`

Converts an object compatible with Vue.js [prop validation](https://vuejs.org/v2/guide/components-props.html#Prop-Validation) to a VueTypes validator object.

See [Custom validators from scratch](/advanced/extending-vue-types.html#standalone-custom-validators) for more details.

### `fromType`

Creates a new validator object from a previously defined one.

See [Inheriting from existing validators](/advanced/extending-vue-types.html#inheriting-from-existing-validators) for more details.

### `createTypes`

Returns a namespaced collection of validators.

See [Custom namespaced instance](/advanced/custom-instance.html) for more details.

import {
  toType,
  toValidableType,
  isFunction,
  validateType,
  isArray,
  isVueTypeDef,
  has,
  stubTrue,
} from './utils'
import {
  VueTypesDefaults,
  ExtendProps,
  DefaultType,
  VueTypeDef,
} from '../types/vue-types'
import { typeDefaults } from './sensibles'
import { PropOptions } from 'vue/types/umd'
import {
  any,
  func,
  bool,
  string,
  number,
  array,
  integer,
  symbol,
  object,
} from './validators/native'
import custom from './validators/custom'
import oneOf from './validators/oneof'
import oneOfType from './validators/oneoftype'
import arrayOf from './validators/arrayof'
import instanceOf from './validators/instanceof'
import objectOf from './validators/objectof'
import shape from './validators/shape'

function createTypes(defs: Partial<VueTypesDefaults> = typeDefaults()) {
  // create a local copy
  let defaults = { ...defs }

  class VueTypes {
    static get sensibleDefaults() {
      return defaults
    }

    static set sensibleDefaults(v: boolean | Partial<VueTypesDefaults>) {
      if (v === false) {
        defaults = {}
        return
      }
      if (v === true) {
        defaults = { ...defs }
        return
      }
      defaults = { ...v }
    }

    static get any() {
      return any()
    }
    static get func() {
      return func().def(defaults.func)
    }
    static get bool() {
      return bool().def(defaults.bool)
    }
    static get string() {
      return string().def(defaults.string)
    }
    static get number() {
      return number().def(defaults.number)
    }
    static get array() {
      return array().def(defaults.array)
    }
    static get object() {
      return object().def(defaults.object)
    }
    static get integer() {
      return integer().def(defaults.integer)
    }
    static get symbol() {
      return symbol()
    }

    static readonly custom = custom
    static readonly oneOf = oneOf
    static readonly instanceOf = instanceOf
    static readonly oneOfType = oneOfType
    static readonly arrayOf = arrayOf
    static readonly objectOf = objectOf
    static readonly shape = shape

    static extend<T extends typeof VueTypes>(
      props: ExtendProps<any> | ExtendProps<any>[],
    ): T {
      if (isArray(props)) {
        props.forEach((p) => this.extend(p))
        return this as T
      }

      let { name, validate = false, getter = false, ...opts } = props

      if (has(VueTypes, name)) {
        throw new TypeError(`[VueTypes error]: Type "${name}" already defined`)
      }

      const { type, validator = stubTrue } = opts
      if (isVueTypeDef(type)) {
        // we are using as base type a vue-type object

        // detach the original type
        // we are going to inherit the parent data.
        delete opts.type

        // inherit base types, required flag and default flag if set
        const keys = ['type', 'required', 'default'] as (keyof Omit<
          PropOptions,
          'validator'
        >)[]
        for (let i = 0; i < keys.length; i += 1) {
          const key = keys[i]
          if (type[key] !== undefined) {
            opts[key] = type[key]
          }
        }

        validate = false // we don't allow validate method on this kind of types
        if (isFunction(type.validator)) {
          opts.validator = function (...args) {
            return (
              (type.validator as any).apply(type, args) &&
              validator.apply(this, args)
            )
          }
        }
      }

      let descriptor: any
      if (getter) {
        descriptor = {
          get() {
            const typeOptions = Object.assign({}, opts as PropOptions<T>)
            if (validate) {
              return toValidableType<T>(name, typeOptions)
            }
            return toType<T>(name, typeOptions)
          },
          enumerable: true,
        }
      } else {
        const { validator } = opts
        descriptor = {
          value(...args: T[]) {
            const typeOptions = Object.assign({}, opts as PropOptions<T>)
            let ret: VueTypeDef<T>
            if (validate) {
              ret = toValidableType<T>(name, typeOptions)
            } else {
              ret = toType<T>(name, typeOptions)
            }

            if (validator) {
              ret.validator = validator.bind(ret, ...args)
            }
            return ret
          },
          enumerable: true,
        }
      }

      return Object.defineProperty(this, name, descriptor)
    }

    static utils = {
      validate(value: unknown, type: unknown) {
        return validateType(type, value, true)
      },
      toType<T = any, D = DefaultType<T>>(
        name: string,
        obj: PropOptions<T>,
        validable = false,
      ) {
        return validable
          ? toValidableType<T, D>(name, obj)
          : toType<T, D>(name, obj)
      },
    }
  }

  return VueTypes
}

export default createTypes()

export {
  any,
  func,
  bool,
  string,
  number,
  array,
  integer,
  symbol,
  object,
  custom,
  oneOf,
  oneOfType,
  arrayOf,
  instanceOf,
  objectOf,
  shape,
  createTypes,
  toType,
  toValidableType,
}

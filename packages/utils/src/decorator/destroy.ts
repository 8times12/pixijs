/** Interface for classes that can be destroyed. */
export interface IDestroyable
{
    destroy(): void;
    _destroyed?: boolean;
}

/**
 * Decorator for `destroy` method.
 * @example
 * ```ts
 * class Foo implements IDestroyable
 * {
 *     @destroyer
 *     public destroy(): void
 *     {
 *       // ...
 *     }
 * }
 * ```
 * @template This - type of the class instance
 * @template Args - type of the arguments of a class method
 * @template Return - type of the return value of a class method
 * @param target - `destroy` method
 * @param context - class method decorator context
 * @returns decorated `destroy` method
 */
export function destroyer<This extends IDestroyable, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
)
{
    const methodName = String(context.name);

    if (methodName !== 'destroy')
    {
        throw new Error('Only destroy method can be decorated with @destroyer');
    }

    function decoratedDestroy(this: This): void
    {
        target.apply(this);
        this._destroyed = true;
    }

    return decoratedDestroy;
}

/**
 * Decorator for class methods that should throw an error if the class instance is destroyed.
 * @example
 * ```ts
 * class Foo implements IDestroyable
 * {
 *     @destroyable
 *     public bar(): void
 *     {
 *       // ...
 *     }
 *
 *     @destroyer
 *     public destroy(): void
 *     {
 *       // ...
 *     }
 * }
 * ```
 * @template This - type of the class instance
 * @template Args - type of the arguments of a class method
 * @template Return - type of the return value of a class method
 * @param target - class method
 * @param _ - class method decorator context
 * @returns decorated class method
 */
export function destroyable<This extends IDestroyable, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    _: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
)
{
    function decoratedMethod(this: This, ...args: Args): Return
    {
        if (this._destroyed)
        {
            throw new Error('Object is already destroyed');
        }

        return target.apply(this, args);
    }

    return decoratedMethod;
}

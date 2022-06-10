function processX(base: string, ids: string[][], depth: number, result: string[], tags: string[])
{
    const id = ids[depth];

    for (let i = 0; i < id.length; i++)
    {
        const value = id[i];

        if (depth < ids.length - 1)
        {
            processX(base.replace(result[depth], value), ids, depth + 1, result, tags);
        }
        else
        {
            tags.push(base.replace(result[depth], value));
        }
    }
}

export function createStringVariations(string: string): string[]
{
    const regex = /\{(.*?)\}/g;

    const result = string.match(regex);

    const tags: string[] = [];

    if (result)
    {
        const ids: string[][] = [];

        result.forEach((vars) =>
        {
            // first remove the brackets...
            const split = vars.substring(1, vars.length - 1).split(',');

            ids.push(split);
        });

        processX(string, ids, 0, result, tags);
    }
    else
    {
        tags.push(string);
    }

    return tags;
}

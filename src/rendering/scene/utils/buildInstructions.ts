import { LayerRenderable } from '../../renderers/shared/LayerRenderable';

import type { InstructionSet } from '../../renderers/shared/instructions/InstructionSet';
import type { RenderPipe } from '../../renderers/shared/instructions/RenderPipe';
import type { Renderable } from '../../renderers/shared/Renderable';
import type { RenderPipes } from '../../renderers/types';
import type { Container } from '../Container';
import type { LayerGroup } from '../LayerGroup';

export function buildInstructions(layerGroup: LayerGroup, renderPipes: RenderPipes)
{
    const root = layerGroup.root;
    const instructionSet = layerGroup.instructionSet;

    instructionSet.reset();

    // TODO add some events / runners for build start
    renderPipes.batch.buildStart(instructionSet);
    renderPipes.blendMode.buildStart();
    renderPipes.colorMask.buildStart();

    if (layerGroup.root.view)
    {
        // proxy renderable is needed here as we do not want to inherit the transform / color of the root container
        const proxyRenderable = layerGroup.proxyRenderable ?? initProxyRenderable(layerGroup);

        if (proxyRenderable)
        {
            renderPipes.blendMode.setBlendMode(proxyRenderable, proxyRenderable.layerBlendMode, instructionSet);

            // eslint-disable-next-line max-len
            (renderPipes[proxyRenderable.view.type as keyof RenderPipes] as any).addRenderable(proxyRenderable, instructionSet);
        }
    }

    if (root.sortChildren)
    {
        root.sortChildrenDepth();
    }

    const children = root.children;

    const length = children.length;

    for (let i = 0; i < length; i++)
    {
        collectAllRenderables(children[i], instructionSet, renderPipes);
    }

    // TODO add some events / runners for build end
    renderPipes.batch.buildEnd(instructionSet);
    renderPipes.blendMode.buildEnd(instructionSet);
}

export function collectAllRenderables(
    container: Container,
    instructionSet: InstructionSet,
    rendererPipes: RenderPipes
): void
{
    // if there is 0b01 or 0b10 the return value

    if (container.layerVisibleRenderable < 0b11 || !container.includeInBuild) return;

    if (container.sortChildren)
    {
        container.sortChildrenDepth();
    }

    if (container.isSimple)
    {
        collectAllRenderablesSimple(container, instructionSet, rendererPipes);
    }
    else
    {
        collectAllRenderablesAdvanced(container, instructionSet, rendererPipes);
    }
}

function collectAllRenderablesSimple(
    container: Container,
    instructionSet: InstructionSet,
    renderPipes: RenderPipes
): void
{
    const view = container.view;

    if (view)
    {
        // TODO add blends in
        renderPipes.blendMode.setBlendMode(container as Renderable, container.layerBlendMode, instructionSet);

        container.didViewUpdate = false;

        const rp = renderPipes as unknown as Record<string, RenderPipe>;

        rp[view.type].addRenderable(container, instructionSet);
    }

    if (!container.isLayerRoot)
    {
        const children = container.children;
        const length = children.length;

        for (let i = 0; i < length; i++)
        {
            collectAllRenderables(children[i], instructionSet, renderPipes);
        }
    }
}

function collectAllRenderablesAdvanced(
    container: Container,
    instructionSet: InstructionSet,
    renderPipes: RenderPipes
): void
{
    for (let i = 0; i < container.effects.length; i++)
    {
        const effect = container.effects[i];

        (renderPipes[effect.pipe as keyof RenderPipes] as any).push(effect, container, instructionSet);
    }

    if (container.isLayerRoot)
    {
        renderPipes.layer.addLayerGroup(container.layerGroup, instructionSet);
    }
    else
    {
        const view = container.view;

        if (view)
        {
            // TODO add blends in
            renderPipes.blendMode.setBlendMode(container as Renderable, container.layerBlendMode, instructionSet);

            container.didViewUpdate = false;

            (renderPipes[view.type as keyof RenderPipes] as any).addRenderable(container, instructionSet);
        }

        const children = container.children;

        if (children.length)
        {
            for (let i = 0; i < children.length; i++)
            {
                collectAllRenderables(children[i], instructionSet, renderPipes);
            }
        }
    }

    // loop backwards through effects
    for (let i = container.effects.length - 1; i >= 0; i--)
    {
        const effect = container.effects[i];

        (renderPipes[effect.pipe as keyof RenderPipes] as any).pop(effect, container, instructionSet);
    }
}

function initProxyRenderable(layerGroup: LayerGroup)
{
    const root = layerGroup.root;

    if (root.view)
    {
        layerGroup.proxyRenderable = new LayerRenderable({
            original: root,
            view: root.view,
        });
    }
}
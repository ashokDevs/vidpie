import { types as t } from '@babel/core';
import type { NodePath, PluginObj, PluginPass } from '@babel/core';

import { PICKER_ATTRIBUTE, PICKER_COMPONENT_ATTRIBUTE, SKIP_COMPONENTS } from '../constants.js';
import { formatLocation } from './location.js';

export interface StampPluginOptions {
  root?: string;
}

export const buildWrapper = (
  element: t.JSXElement,
  componentName: string,
  location: string,
): t.JSXElement => {
  const style = t.jsxAttribute(
    t.jsxIdentifier('style'),
    t.jsxExpressionContainer(
      t.objectExpression([t.objectProperty(t.identifier('display'), t.stringLiteral('contents'))]),
    ),
  );

  const attributes = [
    t.jsxAttribute(t.jsxIdentifier(PICKER_ATTRIBUTE), t.stringLiteral(location)),
    t.jsxAttribute(t.jsxIdentifier(PICKER_COMPONENT_ATTRIBUTE), t.stringLiteral(componentName)),
    style,
  ];

  return t.jsxElement(
    t.jsxOpeningElement(t.jsxIdentifier('div'), attributes),
    t.jsxClosingElement(t.jsxIdentifier('div')),
    [element],
    false,
  );
};

const nameOf = (name: t.JSXOpeningElement['name']): string | null => {
  if (t.isJSXIdentifier(name)) return name.name;
  if (!t.isJSXMemberExpression(name)) return null;

  const object = nameOf(name.object);
  return object === null ? null : `${object}.${name.property.name}`;
};

const isHostElement = (name: string): boolean => /^[a-z]/.test(name);

const attributeNamed = (
  element: t.JSXOpeningElement,
  attribute: string,
): t.JSXAttribute | undefined =>
  element.attributes.find(
    (candidate): candidate is t.JSXAttribute =>
      t.isJSXAttribute(candidate) && t.isJSXIdentifier(candidate.name, { name: attribute }),
  );

const isAlreadyWrapped = (parent: t.Node, componentName: string): boolean => {
  if (!t.isJSXElement(parent)) return false;
  if (!t.isJSXIdentifier(parent.openingElement.name, { name: 'div' })) return false;

  const marker = attributeNamed(parent.openingElement, PICKER_COMPONENT_ATTRIBUTE);
  return t.isStringLiteral(marker?.value) && marker.value.value === componentName;
};

const rootOf = (state: PluginPass): string => (state.opts as StampPluginOptions).root ?? state.cwd;

export const stampPlugin = (): PluginObj<PluginPass> => {
  const visitedNodes = new WeakSet();

  return {
    name: 'vidpie-stamp',
    visitor: {
      JSXElement(path: NodePath<t.JSXElement>, state: PluginPass) {
        const element = path.node;
        if (visitedNodes.has(element)) return;

        const componentName = nameOf(element.openingElement.name);
        if (componentName === null) return;
        if (isHostElement(componentName)) return;
        if (SKIP_COMPONENTS.has(componentName)) return;
        if (!element.loc) return;
        if (isAlreadyWrapped(path.parent, componentName)) return;

        const wrapper = buildWrapper(
          element,
          componentName,
          formatLocation(element, { root: rootOf(state), filename: state.filename }),
        );

        wrapper.loc = element.loc;
        wrapper.openingElement.loc = element.loc;

        visitedNodes.add(element);
        visitedNodes.add(wrapper);
        path.replaceWith(wrapper);
      },

      JSXOpeningElement(path: NodePath<t.JSXOpeningElement>, state: PluginPass) {
        const openingElement = path.node;
        const name = nameOf(openingElement.name);
        if (name === null || !isHostElement(name)) return;
        if (!openingElement.loc) return;
        if (attributeNamed(openingElement, PICKER_ATTRIBUTE)) return;

        openingElement.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier(PICKER_ATTRIBUTE),
            t.stringLiteral(
              formatLocation(openingElement, { root: rootOf(state), filename: state.filename }),
            ),
          ),
        );
      },
    },
  };
};

export default stampPlugin;

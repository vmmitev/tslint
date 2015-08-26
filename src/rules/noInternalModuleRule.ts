/*
 * Copyright 2013 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export class Rule extends Lint.Rules.AbstractRule {
    public static FAILURE_STRING = "forbidden internal module";

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithWalker(new NoInternalModuleWalker(sourceFile, this.getOptions()));
    }
}

class NoInternalModuleWalker extends Lint.RuleWalker {
    public visitModuleDeclaration(node: ts.ModuleDeclaration) {
        if (this.isInternalModuleDeclaration(node)) {
            this.addFailure(this.createFailure(node.getStart(), node.getWidth(), Rule.FAILURE_STRING));
        }
        super.visitModuleDeclaration(node);
    }

    private isInternalModuleDeclaration(node: ts.ModuleDeclaration) {
        // an internal module declaration is not a namespace or a nested declaration
        // for external modules, node.name.kind will be a LiteralExpression instead of Identifier
        return node.name.kind === ts.SyntaxKind.Identifier
            && !(this.isNamespaceDeclaration(node) || this.isNestedDeclaration(node));
    }

    // todo: remove this method and replace it with only the flag check when https://github.com/Microsoft/TypeScript/issues/4436 is fixed
    private isNamespaceDeclaration(node: ts.ModuleDeclaration): boolean {
        // the declaration may be nested and not have the namespace flag
        // recurse until the nesting chain breaks or reaches a node flagged as a namespace
        return node != null
            && this.isNestedDeclaration(node)
            && this.isNamespaceDeclaration(<ts.ModuleDeclaration> node.parent)
            || Lint.isNodeFlagSet(node, ts.NodeFlags.Namespace);
    }

    private isNestedDeclaration(node: ts.ModuleDeclaration) {
        // in a declaration expression like 'module a.b.c' - 'a' is the top level module declaration node and 'b' and 'c' are nested
        // therefore we can depend that a node's position will only match with its name's position for nested nodes
        return node.name.pos === node.pos;
    }
}

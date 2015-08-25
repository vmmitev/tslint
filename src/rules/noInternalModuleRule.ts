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

    private isInternalModuleDeclaration(node: ts.ModuleDeclaration): boolean {
        // for external modules, node.name will be a LiteralExpression instead of Identifier
        return node.name.kind === ts.SyntaxKind.Identifier &&
            !(this.isNamespaceDeclaration(node) || this.isNestedDeclaration(node));
    }

    private isNamespaceDeclaration(node: ts.ModuleDeclaration): boolean {
        // the declaration may be nested, so recurse until the nesting chain breaks or reaches a namespace node
        return node != null &&
            this.isNestedDeclaration(node) &&
            this.isNamespaceDeclaration(<ts.ModuleDeclaration> node.parent) ||
            Lint.isNodeFlagSet(node, ts.NodeFlags.Namespace);
    }

    private isNestedDeclaration(node: ts.ModuleDeclaration): boolean {
        // top level declarations begin with "module" or "namespace", nested ones - with their names
        return node.name != null &&
            node.getText().indexOf(node.name.text) === 0;
    }
}

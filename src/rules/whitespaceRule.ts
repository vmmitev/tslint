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

const OPTION_BRANCH = "check-branch";
const OPTION_DECL = "check-decl";
const OPTION_OPERATOR = "check-operator";
const OPTION_MODULE = "check-module";
const OPTION_SEPARATOR = "check-separator";
const OPTION_TYPE = "check-type";
const OPTION_TYPECAST = "check-typecast";

export class Rule extends Lint.Rules.AbstractRule {
    public static FAILURE_STRING = "missing whitespace";

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithWalker(new WhitespaceWalker(sourceFile, this.getOptions()));
    }
}

class WhitespaceWalker extends Lint.SkippableTokenAwareRuleWalker {
    private scanner: ts.Scanner;

    constructor(sourceFile: ts.SourceFile, options: Lint.IOptions) {
        super(sourceFile, options);
        this.scanner = ts.createScanner(ts.ScriptTarget.ES5, false, sourceFile.text);
    }

    public visitSourceFile(node: ts.SourceFile) {
        super.visitSourceFile(node);

        let lastShouldBeFollowedByWhitespace = false;
        this.scanner.setTextPos(0);

        Lint.scanAllTokens(this.scanner, (scanner: ts.Scanner) => {
            const startPos = scanner.getStartPos();
            const tokenKind = scanner.getToken();

            if (tokenKind === ts.SyntaxKind.WhitespaceTrivia || tokenKind === ts.SyntaxKind.NewLineTrivia) {
                lastShouldBeFollowedByWhitespace = false;
            } else if (lastShouldBeFollowedByWhitespace) {
                const failure = this.createFailure(startPos, 1, Rule.FAILURE_STRING);
                this.addFailure(failure);
                lastShouldBeFollowedByWhitespace = false;
            }

            if (this.tokensToSkipStartEndMap[startPos] != null) {
                // tokens to skip are places where the scanner gets confused about what the token is, without the proper context
                // (specifically, regex, identifiers, and templates). So skip those tokens.
                scanner.setTextPos(this.tokensToSkipStartEndMap[startPos]);
                return;
            }

            // check for trailing space after the given tokens
            switch (tokenKind) {
                case ts.SyntaxKind.CatchKeyword:
                case ts.SyntaxKind.ForKeyword:
                case ts.SyntaxKind.IfKeyword:
                case ts.SyntaxKind.SwitchKeyword:
                case ts.SyntaxKind.WhileKeyword:
                case ts.SyntaxKind.WithKeyword:
                    if (this.hasOption(OPTION_BRANCH)) {
                        lastShouldBeFollowedByWhitespace = true;
                    }
                    break;
                case ts.SyntaxKind.CommaToken:
                case ts.SyntaxKind.SemicolonToken:
                    if (this.hasOption(OPTION_SEPARATOR)) {
                        lastShouldBeFollowedByWhitespace = true;
                    }
                    break;
                case ts.SyntaxKind.EqualsToken:
                    if (this.hasOption(OPTION_DECL)) {
                        lastShouldBeFollowedByWhitespace = true;
                    }
                    break;
                case ts.SyntaxKind.ColonToken:
                    if (this.hasOption(OPTION_TYPE)) {
                        lastShouldBeFollowedByWhitespace = true;
                    }
                    break;
                case ts.SyntaxKind.ImportKeyword:
                case ts.SyntaxKind.ExportKeyword:
                case ts.SyntaxKind.FromKeyword:
                    if (this.hasOption(OPTION_MODULE)) {
                        lastShouldBeFollowedByWhitespace = true;
                    }
                    break;
            }
        });
    }

    // check for spaces between the operator symbol (except in the case of comma statements)
    public visitBinaryExpression(node: ts.BinaryExpression) {
        if (this.hasOption(OPTION_OPERATOR) && node.operatorToken.kind !== ts.SyntaxKind.CommaToken) {
            this.checkForTrailingWhitespace(node.left.getEnd());
            this.checkForTrailingWhitespace(node.right.getFullStart());
        }
        super.visitBinaryExpression(node);
    }

    public visitArrowFunction(node: ts.FunctionLikeDeclaration) {
        this.checkEqualsGreaterThanTokenInNode(node);
        super.visitArrowFunction(node);
    }

    public visitConstructorType(node: ts.FunctionOrConstructorTypeNode) {
        this.checkEqualsGreaterThanTokenInNode(node);
        super.visitConstructorType(node);
    }

    public visitFunctionType(node: ts.FunctionOrConstructorTypeNode) {
        this.checkEqualsGreaterThanTokenInNode(node);
        super.visitFunctionType(node);
    }

    // check for spaces between ternary operator symbols
    public visitConditionalExpression(node: ts.ConditionalExpression) {
        if (this.hasOption(OPTION_OPERATOR)) {
            this.checkForTrailingWhitespace(node.condition.getEnd());
            this.checkForTrailingWhitespace(node.whenTrue.getFullStart());
            this.checkForTrailingWhitespace(node.whenTrue.getEnd());
        }
        super.visitConditionalExpression(node);
    }

    public visitVariableDeclaration(node: ts.VariableDeclaration) {
        if (this.hasOption(OPTION_DECL) && node.initializer != null) {
            if (node.type != null) {
                this.checkForTrailingWhitespace(node.type.getEnd());
            } else {
                this.checkForTrailingWhitespace(node.name.getEnd());
            }
        }
        super.visitVariableDeclaration(node);
    }

    public visitImportDeclaration(node: ts.ImportDeclaration) {
        const importClause = node.importClause;
        if (this.hasOption(OPTION_MODULE) && importClause != null) {
            // an import clause can have _both_ named bindings and a name (the latter for the default import)
            // but the named bindings always come last, so we only need to check that for whitespace
            const position = (importClause.namedBindings == null) ? importClause.name.getEnd()
                                                                  : importClause.namedBindings.getEnd();
            this.checkForTrailingWhitespace(position);
        }
        super.visitImportDeclaration(node);
    }

    public visitImportEqualsDeclaration(node: ts.ImportEqualsDeclaration) {
        if (this.hasOption(OPTION_MODULE)) {
            const position = node.name.getEnd();
            this.checkForTrailingWhitespace(position);
        }
        super.visitImportEqualsDeclaration(node);
    }

    public visitExportAssignment(node: ts.ExportAssignment) {
        if (this.hasOption(OPTION_MODULE)) {
            const exportKeyword = node.getChildAt(0);
            const position = exportKeyword.getEnd();
            this.checkForTrailingWhitespace(position);
        }
        super.visitExportAssignment(node);
    }

    public visitTypeAssertionExpression(node: ts.TypeAssertion) {
        if (this.hasOption(OPTION_TYPECAST)) {
            const position = node.expression.getFullStart();
            this.checkForTrailingWhitespace(position);
        }
        super.visitTypeAssertionExpression(node);
    }

    private checkEqualsGreaterThanTokenInNode(node: ts.Node) {
        let arrowChildNumber = -1;
        node.getChildren().forEach((child, i) => {
            if (child.kind === ts.SyntaxKind.EqualsGreaterThanToken) {
                arrowChildNumber = i;
            }
        });

        // condition so we don't crash if the arrow is somehow missing
        if (arrowChildNumber !== -1) {
            const equalsGreaterThanToken = node.getChildAt(arrowChildNumber);
            if (this.hasOption(OPTION_OPERATOR)) {
                let position = equalsGreaterThanToken.getFullStart();
                this.checkForTrailingWhitespace(position);

                position = equalsGreaterThanToken.getEnd();
                this.checkForTrailingWhitespace(position);
            }
        }
    }

    private checkForTrailingWhitespace(position: number) {
        this.scanner.setTextPos(position);
        const nextTokenType = this.scanner.scan();

        if (nextTokenType !== ts.SyntaxKind.WhitespaceTrivia
                && nextTokenType !== ts.SyntaxKind.NewLineTrivia
                && nextTokenType !== ts.SyntaxKind.EndOfFileToken) {
            this.addFailure(this.createFailure(position, 1, Rule.FAILURE_STRING));
        }
    }
}

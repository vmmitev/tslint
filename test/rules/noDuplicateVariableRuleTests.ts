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

describe("<no-duplicate-variable>", () => {
    const NoDuplicateVariableRule = Lint.Test.getRule("no-duplicate-variable");
    const fileName = "rules/no-duplicate-variable.test.ts";
    const failureString = NoDuplicateVariableRule.FAILURE_STRING + "duplicated'";

    it("ensures that variable declarations are unique within a scope", () => {
        const createFailure = Lint.Test.createFailuresOnFile(fileName, failureString);
        const expectedFailures = [
            createFailure([11, 13], [11, 23]),
            createFailure([22, 9], [22, 19]),
            createFailure([26, 5], [26, 15]),
            Lint.Test.createFailure(fileName, [141, 13], [141, 14], NoDuplicateVariableRule.FAILURE_STRING + "z'"),
            Lint.Test.createFailure(fileName, [153, 11], [153, 13], NoDuplicateVariableRule.FAILURE_STRING + "a2'"),
            Lint.Test.createFailure(fileName, [160, 10], [160, 11], NoDuplicateVariableRule.FAILURE_STRING + "x'"),
            Lint.Test.createFailure(fileName, [161, 17], [161, 18], NoDuplicateVariableRule.FAILURE_STRING + "y'")
        ];

        const actualFailures = Lint.Test.applyRuleOnFile(fileName, NoDuplicateVariableRule);
        Lint.Test.assertFailuresEqual(actualFailures, expectedFailures);
    });
});

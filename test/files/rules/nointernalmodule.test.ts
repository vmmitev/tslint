namespace foo {
}

module bar {
}

declare module buzz {
}

declare module "hoge" {
}
declare module 'fuga' {
}

namespace foo.bar {
}
namespace foo.bar.baz {
}
namespace foo {
    namespace bar.baz {
    }
}

namespace foo {
    module bar {
        namespace baz {
        }
    }
}

module foo {
    namespace bar {
        module bar {
        }
    }
}

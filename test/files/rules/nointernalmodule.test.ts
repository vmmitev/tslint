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

namespace foo.bar {
    module baz {
        namespace buzz {
        }
    }
}

module foo.bar {
    namespace baz {
        module buzz {
        }
    }
}

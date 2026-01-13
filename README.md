# bare-link

Native addon linker for Bare.

```
npm i [-g] bare-link
```

## Usage

```js
const link = require('bare-link')

for await (const resource of link('/path/to/module', { hosts: ['darwin-arm64', 'ios-arm64'] })) {
  console.log(resource)
}
```

```console
bare-link --host darwin-arm64 --host ios-arm64
```

## API

#### `for await (const resource of link([base][, options]))`

Options include:

```js
options = {
  hosts: [],
  out: '.',
  preset,
  sign: false,

  // Apple signing options
  identity: 'Apple Development',
  keychain,

  // Windows signing options
  subject,
  subjectName,
  thumbprint
}
```

## CLI

#### `bare-link [flags] [entry]`

Flags include:

```console
  --version|-v            Print the current version
  --host <host>           The host to target
  --out|-o <dir>          The output directory
  --preset <name>         Apply an option preset
  --sign                  Sign the library
  --identity <id>         The macOS signing identity
  --keychain <name>       The macOS signing keychain
  --subject <id>          The Windows signing subject
  --subject-name <name>   The Windows signing subject friendly name
  --thumbprint <sha1>     The Windows signing subject thumbprint
  --help|-h               Show help
```

## License

Apache-2.0

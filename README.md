# bare-link

Native addon linker for Bare. The addons to link are the ones the module graph of an entry point loads on the given hosts, found with <https://github.com/holepunchto/bare-module-traverse>.

```
npm i [-g] bare-link
```

## Usage

```js
const link = require('bare-link')

for await (const resource of link('/path/to/app.js', { hosts: ['darwin-arm64', 'ios-arm64'] })) {
  console.log(resource)
}
```

```console
bare-link --host darwin-arm64 --host ios-arm64 app.js
```

## API

#### `for await (const resource of link(entry[, options]))`

Link the addons that the module graph of the file `entry` loads on any of `hosts`, yielding each resource as it is written. `entry` may also be an array of files, in which case each addon is linked once.

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

#### `bare-link [flags] <entry>`

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

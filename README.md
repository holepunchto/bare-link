# bare-link

Native addon linker for Bare.

```
npm i [-g] bare-link
```

## Usage

```js
const link = require('bare-link')

for await (const resource of link('/path/to/module', { target: ['darwin-arm64', 'ios-arm64'] })) {
  console.log(resource)
}
```

```console
bare-link --target darwin-arm64 --target ios-arm64
```

## API

#### `await link([base][, options])`

Options include:

```js
options = {
  target: [],
  needs: [],
  out: '.',
  preset
}
```

## CLI

#### `bare-link [flags] [entry]`

Flags include:

```console
--target|-t <host>
--needs <lib>
--out|-o <dir>
--preset <name>
--help|-h
```

## License

Apache-2.0

# bare-link

Native addon linker for Bare.

```
npm i [-g] bare-link
```

## Usage

```js
const link = require('bare-link')

await link('/path/to/module', { target: ['darwin-arm64', 'ios-arm64'] })
```

```console
bare-link --target darwin-arm64 --target ios-arm64
```

## API

#### `await link([base][, options])`

Options include:

```js
{
  target: [],
  needs: [],
  out: '.',
  stdio
}
```

## CLI

#### `bare-link [flags] <entry>`

Flags include:

```console
--target|-t <host>
--needs <lib>
--out|-o <dir>
--help|-h
```

## License

Apache-2.0

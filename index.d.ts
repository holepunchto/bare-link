import { TraverseOptions } from 'bare-module-traverse'
import presets = require('./lib/preset')

type Preset = keyof typeof presets

/**
 * The options of linking, along with the options of the traversal of the module graph, such as
 * `builtins`, `imports` and `defer`, as when packing the graph with `bare-pack`.
 */
interface LinkOptions extends TraverseOptions {
  /** The hosts to link for, such as `darwin-arm64`, `ios-arm64` or `android-arm64`. */
  hosts?: string[]
  /** The directory to write the linked resources to. Defaults to the current directory. */
  out?: string
  /** A preset whose options are applied over the given ones. */
  preset?: Preset
  /**
   * Whether to link into the layout for several hosts even when linking for one: an XCFramework for
   * Apple hosts, and a directory per architecture for Linux and Windows hosts. Use it when the
   * layout must not depend on the hosts, such as for a Swift package, which only accepts
   * XCFrameworks.
   */
  alwaysMultiHost?: boolean
  /**
   * Whether to sign the linked libraries. On macOS, unsigned libraries are still signed ad hoc so
   * that they can be loaded.
   */
  sign?: boolean

  /** The macOS signing identity. Defaults to `Apple Development`. */
  identity?: string
  /** The macOS keychain to find the signing identity in. */
  keychain?: string

  /** The friendly name of the Windows signing subject. */
  subjectName?: string
  /** The SHA-1 thumbprint of the Windows signing subject. */
  thumbprint?: string

  /**
   * Read the source of the module at `url`, or `null` if there is none, such as to link the addons
   * of modules that aren't written to disk. Defaults to reading the file.
   */
  readModule?: (url: URL) => Promise<Uint8Array | string | null>
  /** List the files under the prefix `url`. Defaults to listing the directory. */
  listPrefix?: (url: URL) => AsyncIterable<URL>
  /** Resolve the module at `url`. Defaults to its real path, following symbolic links. */
  resolveModule?: (url: URL) => Promise<URL>
}

/**
 * Link the addons that the module graph of the file `entry` loads on any of `hosts`, yielding the
 * path of each resource as it is written. `entry` may also be an array of files, in which case each
 * addon is linked once.
 *
 * For Apple hosts, each addon is linked into a framework, or an XCFramework when the hosts span
 * more than one of macOS, iOS and the iOS simulator or `alwaysMultiHost` is set. For Android hosts,
 * each addon is linked into a directory per ABI. For Linux and Windows hosts, each addon is linked
 * into a directory per architecture when there is more than one host or `alwaysMultiHost` is set.
 */
declare function link(entry: string | string[], opts?: LinkOptions): AsyncGenerator<string>

declare namespace link {
  export { LinkOptions, Preset }
}

export = link

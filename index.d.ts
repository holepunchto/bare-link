import presets = require('./lib/preset')

type Preset = keyof typeof presets

interface LinkOptions {
  /** The hosts to link for, such as `darwin-arm64`, `ios-arm64` or `android-arm64`. */
  hosts?: string[]
  /** The directory to write the linked resources to. Defaults to the current directory. */
  out?: string
  /** A preset whose options are applied over the given ones. */
  preset?: Preset
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
}

/**
 * Link the addons that the module graph of the file `entry` loads on any of `hosts`, yielding the
 * path of each resource as it is written. `entry` may also be an array of files, in which case each
 * addon is linked once.
 *
 * For Apple hosts, each addon is linked into a framework, or an XCFramework when the hosts span
 * more than one of macOS, iOS and the iOS simulator. For Android hosts, each addon is linked into a
 * directory per ABI. For Linux and Windows hosts, each addon is linked into a directory per
 * architecture when there is more than one host.
 */
declare function link(entry: string | string[], opts?: LinkOptions): AsyncGenerator<string>

declare namespace link {
  export { LinkOptions, Preset }
}

export = link

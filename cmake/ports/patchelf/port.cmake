find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)

bare_target(target)

declare_port(
  "https://github.com/NixOS/patchelf/releases/download/0.18.0/patchelf-0.18.0.tar.gz"
  patchelf
  AUTOTOOLS
)

install(
  FILES ${patchelf_PREFIX}/bin/patchelf
  DESTINATION ${PROJECT_SOURCE_DIR}/prebuilds/${target}
)
